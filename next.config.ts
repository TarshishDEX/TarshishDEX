import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output so the Docker image can run the minimal server.js.
  output: "standalone",

  // Enable gzip/brotli compression for API responses and static assets.
  compress: true,

  // Image optimization — sharp for production, squoosh fallback for dev.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 768, 1024, 1280, 1536],
  },

  // Security: remove the X-Powered-By header.
  poweredByHeader: false,
};

export default nextConfig;
