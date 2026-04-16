import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Slim runtime image when using the bundled Dockerfile */
  output: "standalone",
};

export default nextConfig;
