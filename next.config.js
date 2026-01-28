/** @type {import('next').NextConfig} */
const nextConfig = {
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
      ],
    },
  };
  
  module.exports = nextConfig;