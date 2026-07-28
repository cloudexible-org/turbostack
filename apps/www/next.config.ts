import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/api"],
  // `pnpm dev` serves this app through portless at https://www.turbostack.localhost,
  // which Next treats as cross-origin: it blocks /_next dev resources (including the
  // HMR client) from any unlisted host, so the page ships HTML but never hydrates.
  // Dev-only — Next ignores this in production builds.
  allowedDevOrigins: ["*.turbostack.localhost"],
  experimental: {
    // TypeScript 7 dropped the JS Compiler API (`lib/typescript.js`) that Next's
    // built-in type-checking loads, so Next misdetects TS as not installed and
    // fails the build. This flag makes Next shell out to the `tsc` binary instead.
    // Required until Next's default path stops using the JS API.
    useTypeScriptCli: true,
  },
};

export default nextConfig;
