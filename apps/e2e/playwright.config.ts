import { defineConfig, devices, type Project } from "@playwright/test";
import { convexEnabled } from "./convex-enabled";
import { stablePorts } from "./free-port";
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

/**
 * The suite runs on ports the OS hands us, never fixed ones, so it can run
 * while `pnpm dev` is up — that serves `apps/app` on 5173, which this used to
 * claim.
 *
 * Memoised through the environment because Playwright re-evaluates this file in
 * every worker process; see `free-port.ts` for why allocating directly here
 * makes every spec fail with `ERR_CONNECTION_REFUSED` at a different port.
 */
const [APP_PORT, WWW_PORT] = stablePorts(["E2E_APP_PORT", "E2E_WWW_PORT"]);
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const WWW_URL = `http://127.0.0.1:${WWW_PORT}`;

/**
 * A distDir of the suite's own, so its `next dev` does not contend with a
 * developer's for the lock at `<distDir>/lock`. See `apps/www/next.config.ts`.
 */
const WWW_DIST_DIR = ".next-e2e";

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
      command: `pnpm exec vite --port ${APP_PORT} --strictPort`,
      cwd: "../app",
      url: APP_URL,
      // Never adopt a server we did not start: a developer's `pnpm dev` carries
      // the VITE_CONVEX_URL from apps/app/.env.local — your *cloud* deployment —
      // so the suite would assert against cloud data while global setup seeded
      // the local backend, and every assertion would measure the wrong
      // database. The port is ours alone, so this should never trigger; with
      // `--strictPort` a lost race is a loud failure rather than a silent
      // attachment to something else.
      reuseExistingServer: false,
      // Overrides whatever apps/app/.env.local says. This is the whole reason
      // running the suite cannot disturb your dev setup, and vice versa.
      env: { VITE_CONVEX_URL },
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      // Next as a direct child too, for the same teardown reason.
      //
      // `NEXT_DIST_DIR` is what lets this coexist with a running `pnpm dev`:
      // Next 16's dev lock lives at `<distDir>/lock`, so two `next dev`
      // processes sharing `.next` refuse to start and a different port does not
      // help. Giving the suite its own distDir gives it its own lock.
      command: `pnpm exec next dev --port ${WWW_PORT}`,
      cwd: "../www",
      url: WWW_URL,
      reuseExistingServer: false,
      env: { NEXT_DIST_DIR: WWW_DIST_DIR },
      // A cold `.next-e2e` compiles from scratch on the first request.
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
