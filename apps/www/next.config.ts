import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/api"],
};

export default nextConfig;
