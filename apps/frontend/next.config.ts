import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle so the production image stays small.
  output: "standalone",
  typedRoutes: true,
  // Stop Next from regenerating AGENTS.md / CLAUDE.md on every dev start.
  agentRules: false,
};

export default nextConfig;
