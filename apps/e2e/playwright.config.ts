import { defineConfig, devices } from "@playwright/test";

/**
 * Two suites, two apps, two servers.
 *
 * `specs/app` drives `apps/app` (Vite) and `specs/www` drives `apps/www`
 * (Next.js). Each project pins its own `baseURL` rather than inheriting a
 * shared one, so a spec cannot silently assert against the wrong app — the
 * defect recorded as (1) in §2 of `docs/e2e-architecture.md`.
 */
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
      name: "app",
      testDir: "./specs/app",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5173" },
    },
    {
      name: "www",
      testDir: "./specs/www",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3100" },
    },
  ],
  webServer: [
    {
      // Run Vite as a DIRECT child. The previous `pnpm --filter app dev` went
      // pnpm → portless → vite, so Playwright killed the wrapper, vite survived
      // reparented to PID 1 still holding 5173, and teardown timed out after
      // every test had already passed. See `docs/e2e-architecture.md` §3.
      command: "pnpm exec vite --port 5173 --strictPort",
      cwd: "../app",
      url: "http://127.0.0.1:5173",
      // Never adopt a developer's running `pnpm dev`: it may carry a different
      // VITE_CONVEX_URL, in which case the suite silently tests another backend
      // and a green run proves nothing. With `--strictPort`, a busy port fails
      // loudly instead.
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      // Next as a direct child too, for the same teardown reason. Port 3100
      // rather than 3000 so a developer's own `next dev` cannot be adopted and
      // cannot collide; Next exits when the port is taken rather than hopping.
      command: "pnpm exec next dev --port 3100",
      cwd: "../www",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      // Next's first dev compile of the landing page is slower than Vite's.
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
