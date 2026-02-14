import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Review from "@/app/models/Review";
import mongoose from "mongoose";

export const runtime = "nodejs";

// Sanitize text input
function sanitizeText(text) {
  if (!text) return "";
  return text
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 2000); // Enforce max length
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /api/reviews - Submit a review
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    let { productId, name, email, rating, reviewText, images } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Convert productId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    productId = new mongoose.Types.ObjectId(productId);

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!reviewText || sanitizeText(reviewText).length < 20) {
      return NextResponse.json(
        { error: "Review text must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Validate images array
    if (images && (!Array.isArray(images) || images.length > 4)) {
      return NextResponse.json(
        { error: "Maximum 4 images allowed" },
        { status: 400 }
      );
    }

    // Check for duplicate review (same email + productId)
    const existingReview = await Review.findOne({
      productId,
      email: email.toLowerCase().trim(),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // Create review
    const review = await Review.create({
      productId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      rating: parseInt(rating),
      reviewText: sanitizeText(reviewText),
      images: images || [],
      isApproved: true,
    });

    return NextResponse.json(
      {
        success: true,
        review: {
          _id: review._id,
          name: review.name,
          rating: review.rating,
          reviewText: review.reviewText,
          images: review.images,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Reviews POST] Error:", error);

    // Handle duplicate key error (MongoDB unique index violation)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/reviews?productId=ID&page=1&limit=5
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    let productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Convert productId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    productId = new mongoose.Types.ObjectId(productId);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get approved reviews for this product, sorted newest first
    const reviews = await Review.find({
      productId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name rating reviewText images createdAt")
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      productId,
      isApproved: true,
    });

    // Calculate rating summary
    const allReviews = await Review.find({
      productId,
      isApproved: true,
    }).select("rating");

    const totalCount = allReviews.length;
    let sumRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    allReviews.forEach((review) => {
      sumRating += review.rating;
      ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;
    });

    const averageRating = totalCount > 0 ? sumRating / totalCount : 0;

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
      summary: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: totalCount,
        ratingBreakdown,
      },
    });
  } catch (error) {
    console.error("[Reviews GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}
