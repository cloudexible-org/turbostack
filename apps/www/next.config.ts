import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/api"],
  // `pnpm dev` serves this app through portless at https://www.turbostack.localhost,
  // which Next treats as cross-origin: it blocks /_next dev resources (including the
  // HMR client) from any unlisted host, so the page ships HTML but never hydrates.
  // Dev-only — Next ignores this in production builds.
  allowedDevOrigins: ["*.turbostack.localhost"],
};

export default nextConfig;
