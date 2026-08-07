import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` exists for `apps/www/Dockerfile`, which copies `.next/standalone`.
  // Vercel does not use it — it builds through its own Build Output API — and on
  // Next 16.3 the two are actively incompatible there:
  //
  //   Error: ENOENT: no such file or directory, open '.next/next-server.js.nft.json'
  //
  // Next only runs its file-tracing step when the bundler is not Turbopack
  // (`next/dist/build/index.js`, the `// #region NFT` block), while the standalone
  // writer unconditionally reads `next-server.js.nft.json`
  // (`next/dist/build/utils.js`). A local `next build` still produces the file via
  // the parallel tracing path, so this fails *only* on Vercel — a green local
  // build is not evidence either way. Next's own source anticipates the clash:
  // "in the future output: standalone might not be allowed if an adapter with
  // onBuildComplete is configured", and Vercel supplies exactly such an adapter.
  //
  // Docker builds set no VERCEL var, so they still get standalone output.
  output: process.env.VERCEL ? undefined : "standalone",
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
