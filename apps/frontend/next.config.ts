import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle so the production image stays small.
  output: "standalone",
  typedRoutes: true,
};

export default nextConfig;
