import mongoose from "mongoose";
import Product from "../../models/product.js";

export async function POST(req) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const formData = await req.formData();

    const title = formData.get("title");
    const price = Number(formData.get("price"));
    const description = formData.get("description");
    const stock = Number(formData.get("stock"));
    const category = formData.get("category");
    const images = formData.getAll("images");

    if (!title || !price || !description || !category || images.length === 0) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // prevent duplicate
    const existing = await Product.findOne({ title: title.trim() });
    if (existing) {
      return Response.json({ error: "Product already exists" }, { status: 409 });
    }

    const imageNames = images.map(file => file.name);

    const product = await Product.create({
      title: title.trim(),
      price,
      description,
      stock,
      category,
      images: imageNames
    });

    return Response.json(product, { status: 201 });

  } catch (err) {
    console.error("POST error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find().sort({ createdAt: -1 });
    return Response.json(products);
  } catch (err) {
    console.error("GET error:", err);
    return Response.json([], { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await Product.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return Response.json({ success: false }, { status: 500 });
  }
}
