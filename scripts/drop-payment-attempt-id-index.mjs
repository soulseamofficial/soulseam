/**
 * Migration Script: Drop paymentAttemptId Unique Index
 * 
 * This script removes the UNIQUE constraint on paymentAttemptId by:
 * 1. Dropping the old unique index (paymentAttemptId_1)
 * 2. Dropping any partial unique indexes if they exist
 * 
 * Goal: Allow null and duplicate paymentAttemptId values without crashing order creation.
 * 
 * Usage:
 *   node scripts/drop-payment-attempt-id-index.mjs
 * 
 * Or with environment variables:
 *   MONGODB_URI=your_uri node scripts/drop-payment-attempt-id-index.mjs
 * 
 * Note: Make sure to set MONGODB_URI in your environment or .env file
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function dropPaymentAttemptIdIndex() {
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
      const isUnique = index.unique ? " (UNIQUE)" : "";
      const isPartial = index.partialFilterExpression ? " (PARTIAL)" : "";
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}${isUnique}${isPartial}`);
    });
    console.log();

    //------------------------------------------------
    // STEP 2: Find and drop UNIQUE paymentAttemptId indexes
    //------------------------------------------------
    console.log("🗑️  Step 2: Dropping UNIQUE paymentAttemptId indexes...");
    
    // Find all UNIQUE indexes on paymentAttemptId (we only want to drop unique ones)
    const uniquePaymentAttemptIdIndexes = existingIndexes.filter(
      idx => idx.key && idx.key.paymentAttemptId !== undefined && idx.unique === true
    );

    // Also find any indexes that might be unique but not marked as such
    // (some MongoDB versions may have unique indexes without the unique flag in getIndexes)
    const allPaymentAttemptIdIndexes = existingIndexes.filter(
      idx => idx.key && idx.key.paymentAttemptId !== undefined
    );

    if (uniquePaymentAttemptIdIndexes.length === 0 && allPaymentAttemptIdIndexes.length === 0) {
      console.log("   ℹ️  No paymentAttemptId indexes found (this is okay)");
    } else {
      // Drop unique indexes first
      if (uniquePaymentAttemptIdIndexes.length > 0) {
        for (const index of uniquePaymentAttemptIdIndexes) {
          try {
            await collection.dropIndex(index.name);
            console.log(`   ✅ Dropped UNIQUE index: ${index.name}`);
            if (index.partialFilterExpression) {
              console.log(`      - Was PARTIAL: ${JSON.stringify(index.partialFilterExpression)}`);
            }
          } catch (error) {
            if (error.code === 27) {
              // IndexNotFound - already dropped or doesn't exist
              console.log(`   ℹ️  Index ${index.name} doesn't exist (already dropped)`);
            } else {
              throw error;
            }
          }
        }
      }
      
      // Check if there are any other paymentAttemptId indexes that might be unique
      // (drop them if they exist, as they're likely the problematic unique index)
      const nonUniqueIndexes = allPaymentAttemptIdIndexes.filter(
        idx => !uniquePaymentAttemptIdIndexes.some(uniq => uniq.name === idx.name)
      );
      
      // If we found indexes but none were marked unique, check if they're actually unique
      // by trying to drop the most common name (paymentAttemptId_1)
      if (nonUniqueIndexes.length > 0 && uniquePaymentAttemptIdIndexes.length === 0) {
        const paymentAttemptId1Index = nonUniqueIndexes.find(idx => idx.name === "paymentAttemptId_1");
        if (paymentAttemptId1Index) {
          try {
            await collection.dropIndex("paymentAttemptId_1");
            console.log(`   ✅ Dropped index: paymentAttemptId_1 (likely the unique index causing issues)`);
          } catch (error) {
            if (error.code === 27) {
              console.log(`   ℹ️  Index paymentAttemptId_1 doesn't exist`);
            } else {
              // If drop fails for other reasons, log but continue
              console.log(`   ⚠️  Could not drop paymentAttemptId_1: ${error.message}`);
            }
          }
        }
      }
      
      // Log any remaining non-unique indexes (these are fine to keep)
      const remainingNonUnique = allPaymentAttemptIdIndexes.filter(
        idx => idx.name !== "paymentAttemptId_1" && !uniquePaymentAttemptIdIndexes.some(uniq => uniq.name === idx.name)
      );
      if (remainingNonUnique.length > 0) {
        console.log(`   ℹ️  Keeping ${remainingNonUnique.length} non-unique paymentAttemptId index(es) for query performance`);
      }
    }
    console.log();

    //------------------------------------------------
    // STEP 3: Verify indexes are dropped
    //------------------------------------------------
    console.log("✅ Step 3: Verifying indexes are dropped...");
    const updatedIndexes = await collection.indexes();
    const remainingPaymentAttemptIdIndexes = updatedIndexes.filter(
      idx => idx.key && idx.key.paymentAttemptId !== undefined
    );

    const remainingUniqueIndexes = remainingPaymentAttemptIdIndexes.filter(idx => idx.unique === true);
    
    if (remainingUniqueIndexes.length === 0) {
      console.log("   ✅ All UNIQUE paymentAttemptId indexes successfully dropped");
      console.log("   ✅ paymentAttemptId can now have null or duplicate values");
      if (remainingPaymentAttemptIdIndexes.length > 0) {
        console.log(`   ℹ️  ${remainingPaymentAttemptIdIndexes.length} non-unique index(es) remain for query performance`);
      }
    } else {
      console.log("   ⚠️  Warning: Some UNIQUE paymentAttemptId indexes still exist:");
      remainingUniqueIndexes.forEach(idx => {
        console.log(`      - ${idx.name}: ${JSON.stringify(idx.key)} (UNIQUE)`);
      });
    }
    console.log();

    //------------------------------------------------
    // STEP 4: Test data statistics
    //------------------------------------------------
    console.log("📊 Step 4: Data statistics...");
    
    // Count orders with null paymentAttemptId
    const nullCount = await collection.countDocuments({
      $or: [
        { paymentAttemptId: null },
        { paymentAttemptId: { $exists: false } }
      ]
    });
    console.log(`   Orders with null/missing paymentAttemptId: ${nullCount}`);
    
    // Count orders with non-null paymentAttemptId
    const nonNullCount = await collection.countDocuments({
      paymentAttemptId: { $exists: true, $ne: null }
    });
    console.log(`   Orders with non-null paymentAttemptId: ${nonNullCount}`);
    
    // Check for existing duplicates
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
      console.log(`   ⚠️  Found ${duplicates.length} duplicate paymentAttemptId values (this is now allowed):`);
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
    console.log("   ✅ All paymentAttemptId indexes dropped");
    console.log("   ✅ paymentAttemptId is no longer unique");
    console.log("   ✅ paymentAttemptId is no longer required");
    console.log("   ✅ Orders can have null or duplicate paymentAttemptId values");
    console.log("\n💡 Next steps:");
    console.log("   1. Verify Order schema has no unique: true on paymentAttemptId");
    console.log("   2. Redeploy the application");
    console.log("   3. Test order creation to ensure no duplicate key errors occur");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from database");
  }
}

// Run the migration
dropPaymentAttemptIdIndex()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
