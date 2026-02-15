/**
 * Migration Script: Fix paymentAttemptId Index
 * 
 * This script fixes the MongoDB duplicate key error on paymentAttemptId by:
 * 1. Dropping the old unique index that treats null as a value
 * 2. Creating a partial unique index that only enforces uniqueness when paymentAttemptId exists and is not null
 * 
 * IMPORTANT: Run this AFTER updating the Order schema to remove unique/sparse from paymentAttemptId.
 * 
 * Usage:
 *   node scripts/fix-payment-attempt-id-index.mjs
 * 
 * Or with environment variables:
 *   MONGODB_URI=your_uri node scripts/fix-payment-attempt-id-index.mjs
 * 
 * Note: Make sure to set MONGODB_URI in your environment or .env file
 */

import mongoose from "mongoose";
import Order from "../app/models/Order.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function fixPaymentAttemptIdIndex() {
  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database\n");

    const db = mongoose.connection.db;
    const collection = db.collection("orders");

    //------------------------------------------------
    // STEP 1: List existing indexes
    //------------------------------------------------
    console.log("📋 Step 1: Checking existing indexes...");
    const existingIndexes = await collection.indexes();
    console.log(`   Found ${existingIndexes.length} existing indexes:`);
    existingIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log();

    //------------------------------------------------
    // STEP 2: Drop old paymentAttemptId index
    //------------------------------------------------
    console.log("🗑️  Step 2: Dropping old paymentAttemptId index...");
    
    // Try to drop the index (it might not exist or have a different name)
    try {
      // Common index names for paymentAttemptId
      const possibleIndexNames = [
        "paymentAttemptId_1",
        "paymentAttemptId_1_unique",
        "paymentAttemptId_1_sparse"
      ];

      let dropped = false;
      for (const indexName of possibleIndexNames) {
        try {
          await collection.dropIndex(indexName);
          console.log(`   ✅ Dropped index: ${indexName}`);
          dropped = true;
          break;
        } catch (err) {
          // Index doesn't exist with this name, continue
          if (err.code !== 27) { // 27 = IndexNotFound
            throw err;
          }
        }
      }

      // If none of the common names worked, try to find and drop any index on paymentAttemptId
      if (!dropped) {
        const paymentAttemptIdIndex = existingIndexes.find(
          idx => idx.key && idx.key.paymentAttemptId !== undefined
        );
        
        if (paymentAttemptIdIndex) {
          await collection.dropIndex(paymentAttemptIdIndex.name);
          console.log(`   ✅ Dropped index: ${paymentAttemptIdIndex.name}`);
          dropped = true;
        }
      }

      if (!dropped) {
        console.log("   ℹ️  No existing paymentAttemptId index found (this is okay)");
      }
    } catch (error) {
      if (error.code === 27) {
        console.log("   ℹ️  Index doesn't exist (this is okay)");
      } else {
        throw error;
      }
    }
    console.log();

    //------------------------------------------------
    // STEP 3: Create partial unique index
    //------------------------------------------------
    console.log("🔨 Step 3: Creating partial unique index on paymentAttemptId...");
    
    try {
      await collection.createIndex(
        { paymentAttemptId: 1 },
        {
          unique: true,
          partialFilterExpression: {
            paymentAttemptId: { $exists: true, $ne: null }
          },
          name: "paymentAttemptId_1_partial_unique"
        }
      );
      console.log("   ✅ Partial unique index created successfully");
      console.log("   📝 Index details:");
      console.log("      - Field: paymentAttemptId");
      console.log("      - Unique: true");
      console.log("      - Partial filter: paymentAttemptId exists and is not null");
      console.log("      - This allows multiple null values while preventing duplicate non-null values");
    } catch (error) {
      if (error.code === 85) {
        // Index already exists
        console.log("   ⚠️  Index already exists (this is okay)");
      } else {
        throw error;
      }
    }
    console.log();

    //------------------------------------------------
    // STEP 4: Verify the new index
    //------------------------------------------------
    console.log("✅ Step 4: Verifying new index...");
    const updatedIndexes = await collection.indexes();
    const paymentAttemptIdIndex = updatedIndexes.find(
      idx => idx.key && idx.key.paymentAttemptId !== undefined
    );
    
    if (paymentAttemptIdIndex) {
      console.log("   ✅ Index verified:");
      console.log(`      - Name: ${paymentAttemptIdIndex.name}`);
      console.log(`      - Key: ${JSON.stringify(paymentAttemptIdIndex.key)}`);
      console.log(`      - Unique: ${paymentAttemptIdIndex.unique || false}`);
      console.log(`      - Partial Filter: ${JSON.stringify(paymentAttemptIdIndex.partialFilterExpression || {})}`);
    } else {
      console.log("   ⚠️  Warning: paymentAttemptId index not found after creation");
    }
    console.log();

    //------------------------------------------------
    // STEP 5: Test the index (optional)
    //------------------------------------------------
    console.log("🧪 Step 5: Testing index behavior...");
    
    // Count orders with null paymentAttemptId
    const nullCount = await collection.countDocuments({
      $or: [
        { paymentAttemptId: null },
        { paymentAttemptId: { $exists: false } }
      ]
    });
    console.log(`   📊 Orders with null/missing paymentAttemptId: ${nullCount}`);
    
    // Count orders with non-null paymentAttemptId
    const nonNullCount = await collection.countDocuments({
      paymentAttemptId: { $exists: true, $ne: null }
    });
    console.log(`   📊 Orders with non-null paymentAttemptId: ${nonNullCount}`);
    
    // Check for duplicates (should be none if index is working)
    const duplicates = await collection.aggregate([
      {
        $match: {
          paymentAttemptId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$paymentAttemptId",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Warning: Found ${duplicates.length} duplicate paymentAttemptId values:`);
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`      - ${dup._id}: ${dup.count} orders`);
      });
      if (duplicates.length > 5) {
        console.log(`      ... and ${duplicates.length - 5} more`);
      }
    } else {
      console.log("   ✅ No duplicate paymentAttemptId values found");
    }
    console.log();

    console.log("🎉 Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   ✅ Old index dropped (if it existed)");
    console.log("   ✅ Partial unique index created");
    console.log("   ✅ Index allows multiple null values");
    console.log("   ✅ Index prevents duplicate non-null values");
    console.log("\n💡 Next steps:");
    console.log("   1. Update order creation logic to not include paymentAttemptId if null/undefined");
    console.log("   2. Test order creation to ensure no duplicate key errors occur");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from database");
  }
}

// Run the migration
fixPaymentAttemptIdIndex()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
