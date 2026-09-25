import { defineWwwSuite } from "@repo/e2e-kit/suites";

/**
 * The `apps/www` suite: one project against one Next dev server, no backend.
 *
 * The specs assert only on statically-rendered chrome and client-side
 * behaviour (animation state, theme, scrolling). The server comes from
 * `@repo/e2e-kit` — see `defineWwwSuite`.
 */
export default defineWwwSuite({
  dir: __dirname,
  name: "e2e-www",
  projects: () => [{ name: "www", testDir: "./specs" }],
});
