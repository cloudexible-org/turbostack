import * as path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { acquireRunLock, stablePorts } from "@repo/e2e-kit";

/**
 * The `apps/www` suite: one project, one server, no backend.
 *
 * The specs assert only on statically-rendered chrome and client-side
 * behaviour (animation state, theme, scrolling), so the Convex URL below is a
 * well-formed placeholder that is never connected to. `apps/app` has its own
 * suite in `apps/e2e-app`.
 *
 * Any number of git worktrees can run this at once — see §1c of
 * `docs/e2e-architecture.md`.
 */

// Two runs in one checkout would share `.next-e2e` and its dev lock; runs in
// different worktrees never meet. See `run-lock.ts`.
acquireRunLock(path.join(__dirname, ".e2e-run.lock"), "e2e-www");

/**
 * From the OS, never fixed, so a run can meet neither `pnpm dev` nor a run in
 * another worktree. Memoised through the environment because Playwright
 * re-evaluates this file in every worker — see `free-port.ts`.
 */
const [WWW_PORT] = stablePorts(["E2E_WWW_PORT"]);
const WWW_URL = `http://127.0.0.1:${WWW_PORT}`;

/**
 * A distDir of the suite's own, so its `next dev` does not contend with a
 * developer's for the lock at `<distDir>/lock`. See `apps/www/next.config.ts`.
 */
const WWW_DIST_DIR = ".next-e2e";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // `open: "never"` — the default ("on-failure") serves the report and blocks
  // the process, which hangs any non-interactive run (CI, agents, `&&` chains).
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "www",
      use: { ...devices["Desktop Chrome"], baseURL: WWW_URL },
    },
  ],
  webServer: {
    // Next as a DIRECT child, not through `pnpm dev`: a wrapper chain leaves
    // the server orphaned holding its port when Playwright stops the wrapper.
    // See `docs/e2e-architecture.md` §3.
    //
    // `NEXT_DIST_DIR` is what lets this coexist with a running `pnpm dev`:
    // Next 16's dev lock lives at `<distDir>/lock`, so two `next dev` processes
    // sharing `.next` refuse to start and a different port does not help.
    // Giving the suite its own distDir gives it its own lock.
    command: `pnpm exec next dev --port ${WWW_PORT}`,
    cwd: "../www",
    url: WWW_URL,
    // Never adopt a server we did not start. The port is ours alone, so this
    // should never trigger; if it did, a lost race is a loud failure.
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: WWW_DIST_DIR,
      // `apps/www`'s env.ts requires a well-formed URL; nothing connects to it.
      // Local dev reads the real one from Doppler, which this never runs under.
      NEXT_PUBLIC_CONVEX_URL:
        process.env.NEXT_PUBLIC_CONVEX_URL ??
        "https://e2e-placeholder.convex.cloud",
    },
    // A cold `.next-e2e` compiles from scratch on the first request.
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
