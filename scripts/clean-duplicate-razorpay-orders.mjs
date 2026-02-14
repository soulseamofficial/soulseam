/**
 * Migration Script: Clean Duplicate razorpayOrderId in Orders
 * 
 * This script finds all orders with duplicate razorpayOrderId values and
 * keeps only the first (oldest) order for each duplicate, deleting the rest.
 * 
 * IMPORTANT: Run this BEFORE applying the unique index to razorpayOrderId.
 * 
 * Usage:
 *   node scripts/clean-duplicate-razorpay-orders.mjs
 * 
 * Or with environment variables:
 *   MONGODB_URI=your_uri node scripts/clean-duplicate-razorpay-orders.mjs
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

async function cleanDuplicates() {
  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database\n");

    //------------------------------------------------
    // STEP 1: Find orders with null razorpayOrderId
    //------------------------------------------------
    console.log("📋 Step 1: Checking for orders with null razorpayOrderId...");
    const nullOrders = await Order.find({
      $or: [
        { razorpayOrderId: null },
        { razorpayOrderId: { $exists: false } }
      ]
    }).lean();

    console.log(`   Found ${nullOrders.length} orders with null/missing razorpayOrderId`);
    
    if (nullOrders.length > 0) {
      console.log("   ⚠️  WARNING: These orders will need razorpayOrderId before making it required.");
      console.log("   Order IDs with null razorpayOrderId:");
      nullOrders.slice(0, 10).forEach(order => {
        console.log(`      - ${order._id} (Order: ${order.orderNumber || 'N/A'}, Payment: ${order.paymentMethod || 'N/A'})`);
      });
      if (nullOrders.length > 10) {
        console.log(`      ... and ${nullOrders.length - 10} more`);
      }
    }

    //------------------------------------------------
    // STEP 2: Find duplicate razorpayOrderId values
    //------------------------------------------------
    console.log("\n📋 Step 2: Finding duplicate razorpayOrderId values...");
    
    // Use aggregation to find duplicates
    const duplicates = await Order.aggregate([
      {
        $match: {
          razorpayOrderId: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: "$razorpayOrderId",
          count: { $sum: 1 },
          orderIds: { $push: "$_id" },
          orders: { $push: "$$ROOT" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log(`   Found ${duplicates.length} duplicate razorpayOrderId values\n`);

    if (duplicates.length === 0) {
      console.log("✅ No duplicates found. Database is clean!");
      console.log("\n⚠️  NOTE: If you have orders with null razorpayOrderId,");
      console.log("   you'll need to populate them before making the field required.");
      await mongoose.disconnect();
      return;
    }

    //------------------------------------------------
    // STEP 3: Process duplicates
    //------------------------------------------------
    console.log("🔄 Step 3: Processing duplicates...\n");
    
    let totalDuplicates = 0;
    let keptOrders = 0;
    let deletedOrders = 0;
    const deletionLog = [];

    for (const dup of duplicates) {
      const razorpayOrderId = dup._id;
      const orders = dup.orders;
      
      // Sort by createdAt (oldest first) to keep the first order
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA - dateB;
      });

      const orderToKeep = orders[0];
      const ordersToDelete = orders.slice(1);

      console.log(`\n📦 razorpayOrderId: ${razorpayOrderId}`);
      console.log(`   Total duplicates: ${orders.length}`);
      console.log(`   ✅ Keeping: ${orderToKeep._id} (created: ${orderToKeep.createdAt || 'N/A'}, orderNumber: ${orderToKeep.orderNumber || 'N/A'})`);

      // Delete duplicate orders
      for (const order of ordersToDelete) {
        try {
          await Order.findByIdAndDelete(order._id);
          console.log(`   ❌ Deleted: ${order._id} (created: ${order.createdAt || 'N/A'}, orderNumber: ${order.orderNumber || 'N/A'})`);
          
          deletionLog.push({
            razorpayOrderId,
            deletedOrderId: order._id,
            deletedOrderNumber: order.orderNumber,
            keptOrderId: orderToKeep._id,
            keptOrderNumber: orderToKeep.orderNumber,
            deletedAt: new Date()
          });
          
          deletedOrders++;
        } catch (error) {
          console.error(`   ⚠️  Error deleting order ${order._id}:`, error.message);
        }
      }

      keptOrders++;
      totalDuplicates += orders.length;
    }

    //------------------------------------------------
    // STEP 4: Summary
    //------------------------------------------------
    console.log("\n" + "=".repeat(60));
    console.log("📊 Cleanup Summary:");
    console.log("=".repeat(60));
    console.log(`   Duplicate groups found: ${duplicates.length}`);
    console.log(`   Total orders in duplicates: ${totalDuplicates}`);
    console.log(`   Orders kept: ${keptOrders}`);
    console.log(`   Orders deleted: ${deletedOrders}`);
    console.log(`   Orders with null razorpayOrderId: ${nullOrders.length}`);
    console.log("=".repeat(60));

    if (deletionLog.length > 0) {
      console.log("\n📝 Deletion Log (first 20):");
      deletionLog.slice(0, 20).forEach((log, idx) => {
        console.log(`   ${idx + 1}. razorpayOrderId: ${log.razorpayOrderId}`);
        console.log(`      Deleted: ${log.deletedOrderId} (${log.deletedOrderNumber || 'N/A'})`);
        console.log(`      Kept: ${log.keptOrderId} (${log.keptOrderNumber || 'N/A'})`);
      });
      if (deletionLog.length > 20) {
        console.log(`   ... and ${deletionLog.length - 20} more deletions`);
      }
    }

    if (nullOrders.length > 0) {
      console.log("\n⚠️  IMPORTANT: You have orders with null razorpayOrderId.");
      console.log("   Before making razorpayOrderId required, you need to:");
      console.log("   1. Either populate these orders with valid razorpayOrderId values");
      console.log("   2. Or delete them if they're invalid/test orders");
    } else {
      console.log("\n✅ All orders have razorpayOrderId. Safe to make it required!");
    }

    console.log("\n✅ Cleanup completed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run cleanup
cleanDuplicates();
