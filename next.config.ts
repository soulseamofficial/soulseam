import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: eslint config removed - Next.js 16 no longer supports eslint in next.config.ts
  // To disable eslint during builds, use: next build --no-lint
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
