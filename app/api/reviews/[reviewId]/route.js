import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Review from "@/app/models/Review";
import mongoose from "mongoose";

export const runtime = "nodejs";

// DELETE /api/reviews/[reviewId]
export async function DELETE(req, { params }) {
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

    // Await params for Next.js 15+ compatibility
    const { reviewId } = await params;

    // Validate reviewId
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    // Find and delete the review
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[Reviews DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete review", details: error.message },
      { status: 500 }
    );
  }
}
