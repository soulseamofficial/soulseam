export const runtime = "nodejs";

import { connectDB } from "../../../lib/db";
import Product from "../../../models/product";
import { v2 as cloudinary } from "cloudinary";

/* 🔐 Cloudinary config (server-side only) */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= CREATE PRODUCT ================= */
export async function POST(req) {
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
    });

    return Response.json(product, { status: 201 });
  } catch (err) {
    console.error("POST product error:", err);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ================= READ PRODUCTS ================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const product = await Product.findById(id);
      return Response.json(product);
    }

    const products = await Product.find().sort({ createdAt: -1 });
    return Response.json(products);
  } catch (err) {
    console.error("GET product error:", err);
    return Response.json([], { status: 500 });
  }
}

/* ================= UPDATE PRODUCT ================= */
export async function PUT(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        title: body.title,
        price: body.price,
        description: body.description,
        category: body.category,
        sizes: body.sizes,
      },
      { new: true }
    );

    return Response.json(updated);
  } catch (err) {
    console.error("PUT product error:", err);
    return Response.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

/* ================= DELETE PRODUCT ================= */
export async function DELETE(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Product id required" },
        { status: 400 }
      );
    }

    await Product.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE product error:", err);
    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
