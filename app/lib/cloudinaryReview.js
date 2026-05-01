import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_REVIEW_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_REVIEW_API_KEY,
  api_secret: process.env.CLOUDINARY_REVIEW_API_SECRET,
});

export function getCloudinaryReview() {
  return cloudinary;
}

export default cloudinary;