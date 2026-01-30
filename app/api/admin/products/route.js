export const runtime = "nodejs";

import { connectDB } from "../../../lib/db";
import Product from "../../../models/product";
import { getCloudinary } from "@/app/lib/cloudinary";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";

/* ================= CREATE PRODUCT ================= */
export async function POST(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();

    const formData = await req.formData();

    const title = formData.get("title");
    const price = Number(formData.get("price"));
    const description = formData.get("description");
    const category = formData.get("category");

    /* 🔥 SIZE-WISE STOCK */
    const sizes = [
      { size: "S", stock: Number(formData.get("stock_S") || 0) },
      { size: "M", stock: Number(formData.get("stock_M") || 0) },
      { size: "L", stock: Number(formData.get("stock_L") || 0) },
      { size: "XL", stock: Number(formData.get("stock_XL") || 0) },
    ].filter((s) => s.stock > 0);

    if (!title || !price || !description || !category || sizes.length === 0) {
      return Response.json(
        { error: "Missing required fields or sizes" },
        { status: 400 }
      );
    }

    const existing = await Product.findOne({ title: title.trim() });
    if (existing) {
      return Response.json(
        { error: "Product already exists" },
        { status: 409 }
      );
    }

    /* 🔥 IMAGE UPLOAD TO CLOUDINARY */
    const files = formData.getAll("images");
    if (!files || files.length === 0) {
      return Response.json(
        { error: "At least one image required" },
        { status: 400 }
      );
    }

    // Configure and get Cloudinary instance
    const cloudinary = getCloudinary();

    const uploadedImages = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "soulseam/products",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      uploadedImages.push(uploadResult.secure_url);
    }

    /* 🔥 SAVE PRODUCT */
    const product = await Product.create({
      title: title.trim(),
      price,
      description,
      category,
      images: uploadedImages, // ✅ Cloudinary URLs
      sizes,
      isActive: true, // New products are active by default
    });

    console.log(`[Admin Products] Product created: ${product.title} (ID: ${product._id})`);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[Admin Products] POST error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ================= READ PRODUCTS ================= */
export async function GET(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const product = await Product.findById(id);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`[Admin Products] Fetched ${products.length} products`);
    return NextResponse.json(products);
  } catch (err) {
    console.error("[Admin Products] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE PRODUCT ================= */
export async function PUT(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Build update object with only provided fields
    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.sizes !== undefined) updateData.sizes = body.sizes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    console.log(`[Admin Products] Product updated: ${updated.title} (ID: ${updated._id})`);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Admin Products] PUT error:", err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

/* ================= DELETE PRODUCT ================= */
export async function DELETE(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product id required" },
        { status: 400 }
      );
    }

    const deleted = await Product.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    console.log(`[Admin Products] Product deleted (ID: ${id})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Products] DELETE error:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
