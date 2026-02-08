/**
 * Migration Script: Fix Orders Without userId
 * 
 * This script finds all orders without userId and attempts to link them
 * to users by matching email addresses.
 * 
 * Usage:
 *   node scripts/migrate-orders-userid.mjs
 * 
 * Or with environment variables:
 *   MONGODB_URI=your_uri node scripts/migrate-orders-userid.mjs
 * 
 * Note: Make sure to set MONGODB_URI in your environment or .env file
 */

import mongoose from "mongoose";
import Order from "../app/models/Order.js";
import User from "../app/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function migrateOrders() {
  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");

    // Find all orders without userId
    console.log("\n📋 Finding orders without userId...");
    const orders = await Order.find({ 
      userId: { $exists: false } 
    }).lean();

    console.log(`Found ${orders.length} orders without userId`);

    if (orders.length === 0) {
      console.log("✅ No orders need migration. Exiting.");
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failedOrders = [];

    console.log("\n🔄 Starting migration...\n");

    for (const order of orders) {
      try {
        // Try to find user by email (from customer.email or legacy customer object)
        const email = order.customer?.email || order.email;
        
        if (!email) {
          console.log(`⚠️  Order ${order._id}: No email found, skipping`);
          failCount++;
          failedOrders.push({
            orderId: order._id,
            reason: "No email found in order"
          });
          continue;
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
          console.log(`⚠️  Order ${order._id}: User not found for email ${email}`);
          failCount++;
          failedOrders.push({
            orderId: order._id,
            email: email,
            reason: "User not found with matching email"
          });
          continue;
        }

        // Update order with userId
        await Order.findByIdAndUpdate(order._id, {
          $set: { userId: user._id }
        });

        console.log(`✅ Order ${order._id}: Linked to user ${user._id} (${user.email || user.phone})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing order ${order._id}:`, error.message);
        failCount++;
        failedOrders.push({
          orderId: order._id,
          reason: `Error: ${error.message}`
        });
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${successCount} orders`);
    console.log(`❌ Failed: ${failCount} orders`);
    console.log("=".repeat(50));

    if (failedOrders.length > 0) {
      console.log("\n⚠️  Failed Orders:");
      failedOrders.forEach((failed, idx) => {
        console.log(`  ${idx + 1}. Order ${failed.orderId}: ${failed.reason}`);
      });
    }

    console.log("\n✅ Migration completed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateOrders();
