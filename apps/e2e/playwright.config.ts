import { defineConfig, devices } from "@playwright/test";

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
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
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
});
