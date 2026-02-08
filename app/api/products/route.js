import { connectDB } from "../../lib/db";
import Product from "../../models/product";

// ✅ PUBLIC PRODUCTS API (USER SIDE)
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({ createdAt: -1 });

    const formattedProducts = products.map((p) => {
      const totalStock = p.sizes.reduce(
        (sum, s) => sum + (s.stock || 0),
        0
      );

      return {
        _id: p._id,
        name: p.title,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        description: p.description,
        category: p.category,
        images: p.images, // Cloudinary URLs
        sizes: p.sizes,   // [{ size, stock }]
        totalStock,
        createdAt: p.createdAt,
      };
    });

    return Response.json(formattedProducts, { status: 200 });

  } catch (err) {
    console.error("PUBLIC PRODUCTS API ERROR:", err);
    return Response.json([], { status: 500 });
  }
}
