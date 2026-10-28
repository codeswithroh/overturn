import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: { "/api/appeal": ["./replays/**/*"] },
};

export default nextConfig;
