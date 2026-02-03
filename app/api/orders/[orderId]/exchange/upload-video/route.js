import { NextResponse } from "next/server";

/**
 * This endpoint is deprecated.
 * Videos are now uploaded directly from the browser to Cloudinary.
 * The frontend component handles direct uploads using unsigned upload presets.
 */
export async function POST(req, { params }) {
  return NextResponse.json(
    {
      success: false,
      error: "This endpoint is deprecated. Videos should be uploaded directly to Cloudinary from the browser.",
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
