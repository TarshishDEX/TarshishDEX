import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output so the Docker image can run the minimal server.js.
  output: "standalone",
};

export default nextConfig;
