import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/api"],
  // `pnpm dev` serves this app through portless at https://www.turbostack.localhost,
  // which Next treats as cross-origin: it blocks /_next dev resources (including the
  // HMR client) from any unlisted host, so the page ships HTML but never hydrates.
  // Dev-only — Next ignores this in production builds.
  // `127.0.0.1` is where the Playwright suite serves this app (see
  // apps/e2e/playwright.config.ts). Without it Next blocks every /_next dev
  // chunk from that host, so the page ships HTML and never hydrates — which
  // reads as "every animation is broken" rather than as a blocked request.
  allowedDevOrigins: ["*.turbostack.localhost", "127.0.0.1", "localhost"],
  // NOTE: `experimental.useTypeScriptCli` used to be set here. TypeScript 7 dropped
  // the JS Compiler API that Next's built-in type-checking loaded, so on Next 16.2
  // the flag was required to make Next shell out to the `tsc` binary instead.
  // Next 16.3 flipped that option's default to `true`, so the explicit setting is
  // now redundant. If Next is ever rolled back below 16.3, TypeScript must be rolled
  // back to 6.x as well — or this flag restored — otherwise `next build` fails at
  // the type-check step.
};

export default nextConfig;
