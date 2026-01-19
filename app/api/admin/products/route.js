import { connectDB } from "../../../lib/db";
import Product from "../../../models/product";

// CREATE product
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();

    const title = formData.get("title");
    const price = Number(formData.get("price"));
    const description = formData.get("description");
    const category = formData.get("category");

    // 🔥 SIZE-WISE STOCK
    const sizes = [
      { size: "S", stock: Number(formData.get("stock_S") || 0) },
      { size: "M", stock: Number(formData.get("stock_M") || 0) },
      { size: "L", stock: Number(formData.get("stock_L") || 0) },
      { size: "XL", stock: Number(formData.get("stock_XL") || 0) },
    ].filter(s => s.stock > 0); // optional: remove zero stock sizes

    const images = formData.getAll("images");
    const imageNames = images.map(file => file.name);

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

    const product = await Product.create({
      title: title.trim(),
      price,
      description,
      category,
      images: imageNames,
      sizes, // 🔥 NEW FIELD
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

// READ products OR single product
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

// UPDATE product (edit sizes & stock)
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
        sizes: body.sizes, // 🔥 size-wise stock update
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

// DELETE product
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
