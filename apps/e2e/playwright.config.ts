import { defineConfig, devices, type Project } from "@playwright/test";
import { convexEnabled } from "./convex-enabled";
import { ensureLocalDeployment, localBackendUrl } from "./local-backend";

/**
 * Three suites, two apps, up to three servers.
 *
 * `specs/app` drives `apps/app` (Vite) and `specs/www` drives `apps/www`
 * (Next.js), both asserting only on statically-rendered chrome and client-side
 * behaviour. `specs/app-convex` drives `apps/app` against a real, seeded Convex
 * local backend.
 *
 * Each project pins its own `baseURL` rather than inheriting a shared one, so a
 * spec cannot silently assert against the wrong app — the defect recorded as
 * (1) in §2 of `docs/e2e-architecture.md`.
 */

const WITH_CONVEX = convexEnabled();

// Provision the local deployment *before* reading its port, so the address
// below is read rather than guessed. See `local-backend.ts`: with no
// `config.json` the only available answer is 3210, and on a machine already
// running another Convex project that guess silently points the app under test
// at the neighbour's backend.
if (WITH_CONVEX) ensureLocalDeployment();

const CONVEX_URL = WITH_CONVEX ? localBackendUrl() : undefined;

/**
 * What `apps/app` validates at startup. Without Convex it is a well-formed
 * placeholder that is never connected to — the app mounts, renders its chrome,
 * and its `useQuery` simply never resolves.
 */
const VITE_CONVEX_URL = CONVEX_URL ?? "https://ci-e2e-placeholder.convex.cloud";

const APP_URL = "http://127.0.0.1:5173";
const WWW_URL = "http://127.0.0.1:3100";

const projects: Project[] = [
  {
    name: "app",
    testDir: "./specs/app",
    use: { ...devices["Desktop Chrome"], baseURL: APP_URL },
  },
  {
    name: "www",
    testDir: "./specs/www",
    use: { ...devices["Desktop Chrome"], baseURL: WWW_URL },
  },
];

if (WITH_CONVEX) {
  projects.push({
    name: "app-convex",
    testDir: "./specs/app-convex",
    use: { ...devices["Desktop Chrome"], baseURL: APP_URL },
  });
}

export default defineConfig({
  testDir: "./specs",
  // Proves the backend is ours, then reseeds. No-ops when E2E_CONVEX=0.
  globalSetup: "./fixtures/global-setup.ts",
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
  projects,
  webServer: [
    ...(WITH_CONVEX
      ? [
          {
            // Reused if already running, and safe to reuse *because* the URL
            // above identifies this project's deployment specifically. A warm
            // backend is worth keeping — a cold start downloads the binary and
            // provisions the deployment. No teardown: a leftover backend is
            // simply the warm one this project wants next run.
            command: "node apps/e2e/scripts/convex-local.mjs",
            url: `${CONVEX_URL}/version`,
            cwd: "../..",
            reuseExistingServer: true,
            timeout: 180_000,
            stdout: "ignore" as const,
            stderr: "pipe" as const,
          },
        ]
      : []),
    {
      // Run Vite as a DIRECT child. The previous `pnpm --filter app dev` went
      // pnpm → portless → vite, so Playwright killed the wrapper, vite survived
      // reparented to PID 1 still holding 5173, and teardown timed out after
      // every test had already passed. See `docs/e2e-architecture.md` §3.
      command: "pnpm exec vite --port 5173 --strictPort",
      cwd: "../app",
      url: APP_URL,
      // Never adopt a developer's running `pnpm dev`: it carries the
      // VITE_CONVEX_URL from apps/app/.env.local — your *cloud* deployment —
      // so the suite would assert against cloud data while global setup seeded
      // the local backend, and every assertion would measure the wrong
      // database. With `--strictPort`, a busy port fails loudly instead.
      reuseExistingServer: false,
      // Overrides whatever apps/app/.env.local says. This is the whole reason
      // running the suite cannot disturb your dev setup, and vice versa.
      env: { VITE_CONVEX_URL },
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      // Next as a direct child too, for the same teardown reason. Port 3100
      // rather than 3000 so a developer's own `next dev` cannot be adopted.
      //
      // Note Next 16 keeps a per-project dev lockfile: if `pnpm dev` is already
      // running, this dies with "Another next dev server is already running"
      // and a different port does NOT help. Stop your dev server first.
      command: "pnpm exec next dev --port 3100",
      cwd: "../www",
      url: WWW_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
