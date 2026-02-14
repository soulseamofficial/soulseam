import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Review from "@/app/models/Review";

export const runtime = "nodejs";

// GET /api/admin/reviews?page=1&limit=10
export async function GET(req) {
  try {
    // Validate admin authentication
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get all reviews, sorted newest first, with product name populated
    const reviews = await Review.find({})
      .populate("productId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({});

    // Format reviews for response
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      productName: review.productId?.title || "Unknown Product",
      productId: review.productId?._id || review.productId,
      name: review.name,
      email: review.email,
      rating: review.rating,
      reviewText: review.reviewText,
      images: review.images || [],
      imageCount: review.images?.length || 0,
      isApproved: review.isApproved,
      createdAt: review.createdAt,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("[Admin Reviews GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}
