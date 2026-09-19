import * as path from "node:path";
import { defineConfig, devices, type Project } from "@playwright/test";
import { acquireRunLock, stablePorts } from "@repo/e2e-kit";
import { convexEnabled } from "./convex-enabled";
import { ensureLocalDeployment, localBackendUrl } from "./local-backend";

/**
 * The `apps/app` suite: two projects, up to two servers.
 *
 * `specs/app` asserts only on statically-rendered chrome and client-side
 * behaviour. `specs/app-convex` drives the same app against a real, seeded
 * Convex local backend. `apps/www` has its own suite in `apps/e2e-www`.
 *
 * Any number of git worktrees can run this at once — see §1c of
 * `docs/e2e-architecture.md`.
 */

// Two runs in one checkout share its Convex database and would wipe each
// other's seed; runs in different worktrees never meet. See `run-lock.ts`.
acquireRunLock(path.join(__dirname, ".e2e-run.lock"), "e2e-app");

const WITH_CONVEX = convexEnabled();

/**
 * Every port this run listens on comes from the OS — the app's *and* the Convex
 * backend's — so a run can never meet `pnpm dev` or a run in another worktree.
 *
 * Memoised through the environment because Playwright re-evaluates this file in
 * every worker process; see `free-port.ts` for why allocating directly here
 * makes every spec fail with `ERR_CONNECTION_REFUSED` at a different port. All
 * four come from one call so no two can be handed the same port.
 */
const [APP_PORT, CONVEX_CLOUD_PORT, CONVEX_SITE_PORT] = stablePorts([
  "E2E_APP_PORT",
  "E2E_CONVEX_CLOUD_PORT",
  "E2E_CONVEX_SITE_PORT",
]);
const APP_URL = `http://127.0.0.1:${APP_PORT}`;

// Creates this checkout's local deployment on first use. Its database lives in
// `packages/api/.convex/local/default/`, per worktree; the port it listens on
// is chosen per run, above.
if (WITH_CONVEX) ensureLocalDeployment();

const CONVEX_URL = WITH_CONVEX ? localBackendUrl() : undefined;

/**
 * What `apps/app` validates at startup. Without Convex it is a well-formed
 * placeholder that is never connected to — the app mounts, renders its chrome,
 * and its `useQuery` simply never resolves.
 */
const VITE_CONVEX_URL = CONVEX_URL ?? "https://ci-e2e-placeholder.convex.cloud";

const projects: Project[] = [
  {
    name: "app",
    testDir: "./specs/app",
    use: { ...devices["Desktop Chrome"], baseURL: APP_URL },
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
            // A backend of this run's own, on this run's ports, torn down with
            // it. It used to be reused across runs on the port recorded in
            // `config.json` — which every worktree provisioned while no other
            // backend was up records identically, so a second worktree's run
            // adopted the first one's backend. The database persists between
            // runs; only the process is per-run, and it boots in seconds.
            command: "node apps/e2e-app/scripts/convex-local.mjs",
            url: `${CONVEX_URL}/version`,
            cwd: "../..",
            reuseExistingServer: false,
            env: {
              E2E_CONVEX_CLOUD_PORT: String(CONVEX_CLOUD_PORT),
              E2E_CONVEX_SITE_PORT: String(CONVEX_SITE_PORT),
            },
            // SIGTERM rather than Playwright's default SIGKILL, so the Convex
            // CLI stops its backend cleanly and the `.env.local` watcher in
            // `convex-local.mjs` gets its final say.
            gracefulShutdown: { signal: "SIGTERM" as const, timeout: 10_000 },
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
      command: `pnpm exec vite --port ${APP_PORT} --strictPort`,
      cwd: "../app",
      url: APP_URL,
      // Never adopt a server we did not start: a developer's `pnpm dev` carries
      // the VITE_CONVEX_URL from Doppler — your *cloud* deployment —
      // so the suite would assert against cloud data while global setup seeded
      // the local backend, and every assertion would measure the wrong
      // database. The port is ours alone, so this should never trigger; with
      // `--strictPort` a lost race is a loud failure rather than a silent
      // attachment to something else.
      reuseExistingServer: false,
      // Overrides whatever the environment or apps/app/.env.local says. This is
      // the whole reason running the suite cannot disturb your dev setup.
      env: { VITE_CONVEX_URL },
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
