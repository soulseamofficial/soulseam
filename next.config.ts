import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // NOTE: This repo contains legacy UI files that violate strict hook lint rules.
    // We keep build unblocked while focusing on runtime correctness.
    ignoreDuringBuilds: true,
  },
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
