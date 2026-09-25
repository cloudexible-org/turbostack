import * as path from "node:path";
import type { PlaywrightTestConfig, Project } from "@playwright/test";
import { convexEnabled } from "../convex/convex-enabled";
import {
  ensureLocalDeployment,
  localBackendUrl,
} from "../convex/local-backend";
import { stablePorts } from "../free-port";
import { APP_DIR, BACKEND_DIR, KIT_DIR, REPO_ROOT } from "../paths";
import { acquireRunLock } from "../run-lock";
import {
  lockSuite,
  type SuiteOptions,
  suiteConfig,
  type WebServer,
} from "./base";

export type AppSuiteContext = {
  /** Where this run serves `apps/app`. */
  baseURL: string;
  /**
   * Whether this run has a seeded local Convex backend. Off when `E2E_CONVEX=0`
   * (CI); register backend-dependent projects only when it is on.
   */
  withConvex: boolean;
};

/**
 * A Playwright config that serves `apps/app` — and, unless `E2E_CONVEX=0`, a
 * seeded local Convex backend — for the suite's projects.
 *
 * Any number of git worktrees can run suites built on this at once, and so can
 * `pnpm dev`. See §1c of `docs/e2e-architecture.md`.
 */
export function defineAppSuite(
  options: SuiteOptions<AppSuiteContext>,
): PlaywrightTestConfig {
  lockSuite(options);

  const withConvex = convexEnabled();

  // Checkout-wide, not per suite: every suite built on this seeds the same
  // database, so an e2e run and a marketing capture would each wipe the other's
  // seed mid-run. Taken before `ensureLocalDeployment` and the backend's boot,
  // both of which write the deployment's `config.json`.
  if (withConvex) {
    acquireRunLock(
      path.join(BACKEND_DIR, ".e2e-run.lock"),
      "the local Convex database",
      "Every suite that uses it — e2e or marketing — wipes and reseeds it, so " +
        "a second run would destroy the first one's seed mid-run.",
    );
  }

  /**
   * Every port this run listens on comes from the OS — the app's *and* the
   * Convex backend's — so a run can never meet `pnpm dev` or a run in another
   * worktree.
   *
   * Memoised through the environment because Playwright re-evaluates the config
   * in every worker process; see `free-port.ts` for why allocating directly
   * makes every spec fail with `ERR_CONNECTION_REFUSED` at a different port.
   * All three come from one call so no two can be handed the same port.
   */
  const [appPort, convexCloudPort, convexSitePort] = stablePorts([
    "E2E_APP_PORT",
    "E2E_CONVEX_CLOUD_PORT",
    "E2E_CONVEX_SITE_PORT",
  ]);
  const baseURL = `http://127.0.0.1:${appPort}`;

  // Creates this checkout's local deployment on first use. Its database lives
  // in `packages/api/.convex/local/default/`, per worktree; the port it listens
  // on is chosen per run, above.
  if (withConvex) ensureLocalDeployment();

  const convexUrl = withConvex ? localBackendUrl() : undefined;

  /**
   * What `apps/app` validates at startup. Without Convex it is a well-formed
   * placeholder that is never connected to — the app mounts, renders its
   * chrome, and its `useQuery` simply never resolves.
   */
  const viteConvexUrl = convexUrl ?? "https://ci-e2e-placeholder.convex.cloud";

  const webServer: WebServer[] = [
    {
      // Run Vite as a DIRECT child. The previous `pnpm --filter app dev` went
      // pnpm → portless → vite, so Playwright killed the wrapper, vite survived
      // reparented to PID 1 still holding 5173, and teardown timed out after
      // every test had already passed. See `docs/e2e-architecture.md` §3.
      command: `pnpm exec vite --port ${appPort} --strictPort`,
      cwd: APP_DIR,
      url: baseURL,
      // Never adopt a server we did not start: a developer's `pnpm dev` carries
      // the VITE_CONVEX_URL from Doppler — your *cloud* deployment — so the
      // suite would assert against cloud data while global setup seeded the
      // local backend, and every assertion would measure the wrong database.
      // The port is ours alone, so this should never trigger; with
      // `--strictPort` a lost race is a loud failure rather than a silent
      // attachment to something else.
      reuseExistingServer: false,
      // Overrides whatever the environment or apps/app/.env.local says. This is
      // the whole reason running a suite cannot disturb your dev setup.
      env: { VITE_CONVEX_URL: viteConvexUrl },
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ];

  if (withConvex) {
    webServer.unshift({
      // A backend of this run's own, on this run's ports, torn down with it. It
      // used to be reused across runs on the port recorded in `config.json` —
      // which every worktree provisioned while no other backend was up records
      // identically, so a second worktree's run adopted the first one's
      // backend. The database persists between runs; only the process is
      // per-run, and it boots in seconds.
      command: `node "${path.join(KIT_DIR, "scripts", "convex-local.mjs")}"`,
      url: `${convexUrl}/version`,
      cwd: REPO_ROOT,
      reuseExistingServer: false,
      env: {
        E2E_CONVEX_CLOUD_PORT: String(convexCloudPort),
        E2E_CONVEX_SITE_PORT: String(convexSitePort),
      },
      // SIGTERM rather than Playwright's default SIGKILL, so the Convex CLI
      // stops its backend cleanly and the `.env.local` watcher in
      // `convex-local.mjs` gets its final say.
      gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    });
  }

  const projects: Project[] = options.projects({ baseURL, withConvex });

  return suiteConfig(options, {
    baseURL,
    projects,
    webServer,
    // Proves the backend is ours, then reseeds. No-ops when E2E_CONVEX=0.
    globalSetup: path.join(__dirname, "..", "convex", "global-setup.ts"),
  });
}
