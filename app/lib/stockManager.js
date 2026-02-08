import Product from "@/app/models/product";
import mongoose from "mongoose";

/**
 * Reduces stock for a product size atomically
 * Prevents overselling and automatically deactivates product when out of stock
 * 
 * @param {string|ObjectId} productId - Product ID
 * @param {string} selectedSize - Size to reduce (S, M, L, XL)
 * @param {number} quantity - Quantity to reduce (default: 1)
 * @param {object} session - MongoDB session for transactions (optional)
 * @returns {Promise<{success: boolean, message?: string, product?: object}>}
 */
export async function reduceStock(productId, selectedSize, quantity = 1, session = null) {
  try {
    // Validate inputs
    if (!productId || !selectedSize) {
      return {
        success: false,
        message: "Product ID and size are required",
      };
    }

    // 🔥 CRITICAL: Validate ObjectId BEFORE querying MongoDB
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("reduceStock: Invalid ObjectId format", {
        productId,
        type: typeof productId,
      });
      return {
        success: false,
        message: "Invalid product ID format",
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        message: "Quantity must be greater than 0",
      };
    }

    // Validate size
    const validSizes = ["S", "M", "L", "XL"];
    if (!validSizes.includes(selectedSize.toUpperCase())) {
      return {
        success: false,
        message: `Invalid size: ${selectedSize}. Must be one of: ${validSizes.join(", ")}`,
      };
    }

    const normalizedSize = selectedSize.toUpperCase();
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Atomic update: Reduce stock only if available stock >= quantity
    // This prevents race conditions and overselling
    // Use arrayFilters to ensure we check stock for the SPECIFIC size being updated
    const updateOptions = {
      arrayFilters: [{ 
        "elem.size": normalizedSize,
        "elem.stock": { $gte: quantity } // Ensure THIS specific size has sufficient stock
      }],
    };
    
    // Include session if provided (for transactions)
    if (session) {
      updateOptions.session = session;
    }

    const updateResult = await Product.updateOne(
      {
        _id: productObjectId,
        "sizes.size": normalizedSize, // Document must have this size
      },
      {
        $inc: {
          "sizes.$[elem].stock": -quantity,
          totalStock: -quantity,
        },
      },
      updateOptions
    );

    // Check if update was successful (matched and modified)
    if (updateResult.matchedCount === 0) {
      // Product not found or size not found or insufficient stock
      // Fetch product to provide better error message
      const product = await Product.findById(productObjectId);
      
      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      // Check if size exists
      const sizeEntry = product.sizes.find((s) => s.size === normalizedSize);
      if (!sizeEntry) {
        return {
          success: false,
          message: `Size ${normalizedSize} not available for this product`,
        };
      }

      // Check stock
      if (sizeEntry.stock < quantity) {
        return {
          success: false,
          message: "Selected size is out of stock",
        };
      }

      // Fallback error
      return {
        success: false,
        message: "Selected size is out of stock",
      };
    }

    if (updateResult.modifiedCount === 0) {
      return {
        success: false,
        message: "Stock reduction failed - no changes made",
      };
    }

    // After successful stock reduction, check if totalStock is 0 and deactivate
    const findOptions = session ? { session } : {};
    const updatedProduct = await Product.findById(productObjectId, null, findOptions);
    
    if (updatedProduct && updatedProduct.totalStock <= 0) {
      // Auto-deactivate product when out of stock
      const deactivateOptions = session ? { session } : {};
      await Product.findByIdAndUpdate(
        productObjectId,
        { $set: { isActive: false } },
        deactivateOptions
      );
      
      console.log(`✅ Product ${productObjectId} auto-deactivated (totalStock: 0)`);
    }

    return {
      success: true,
      product: updatedProduct,
    };
  } catch (error) {
    console.error("❌ Stock reduction error:", error);
    return {
      success: false,
      message: error.message || "Failed to reduce stock",
    };
  }
}

/**
 * Reduces stock for multiple items in an order
 * Uses Promise.all for parallel processing
 * 
 * @param {Array<{productId: string, size: string, quantity: number}>} items - Array of items to reduce stock for
 * @param {object} session - MongoDB session for transactions (optional)
 * @returns {Promise<{success: boolean, errors?: Array<string>, results?: Array}>}
 */
export async function reduceStockForOrderItems(items, session = null) {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        success: false,
        errors: ["No items provided"],
      };
    }

    // Process all stock reductions in parallel
    const stockReductionPromises = items.map((item) =>
      reduceStock(item.productId, item.size, item.quantity || 1, session)
    );

    const results = await Promise.all(stockReductionPromises);

    // Check if all reductions were successful
    const failures = results.filter((r) => !r.success);
    
    if (failures.length > 0) {
      const errors = failures.map((f) => f.message || "Stock reduction failed");
      return {
        success: false,
        errors,
        results,
      };
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("❌ Batch stock reduction error:", error);
    return {
      success: false,
      errors: [error.message || "Failed to reduce stock for order items"],
    };
  }
}
