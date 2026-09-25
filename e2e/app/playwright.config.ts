import { defineAppSuite } from "@repo/e2e-kit/suites";

/**
 * The `apps/app` suite: two projects against one Vite server.
 *
 * `specs/app` asserts only on statically-rendered chrome and client-side
 * behaviour. `specs/app-convex` drives the same app against a real, seeded
 * Convex local backend. The servers, the backend and its seed come from
 * `@repo/e2e-kit` — see `defineAppSuite` — so any other suite driving
 * `apps/app` boots it exactly the same way.
 */
export default defineAppSuite({
  dir: __dirname,
  name: "e2e-app",
  projects: ({ withConvex }) => [
    { name: "app", testDir: "./specs/app" },
    ...(withConvex
      ? [{ name: "app-convex", testDir: "./specs/app-convex" }]
      : []),
  ],
});
