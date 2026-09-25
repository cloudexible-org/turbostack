import type { PlaywrightTestConfig } from "@playwright/test";
import { stablePorts } from "../free-port";
import { WWW_DIR } from "../paths";
import { lockSuite, type SuiteOptions, suiteConfig } from "./base";

export type WwwSuiteContext = {
  /** Where this run serves `apps/www`. */
  baseURL: string;
};

/**
 * A Playwright config that serves `apps/www` for the suite's projects. No
 * backend: the Convex URL is a well-formed placeholder nothing connects to.
 *
 * Any number of git worktrees can run suites built on this at once, and so can
 * `pnpm dev`. See §1c of `docs/e2e-architecture.md`.
 */
export function defineWwwSuite(
  options: SuiteOptions<WwwSuiteContext>,
): PlaywrightTestConfig {
  // Also guards the distDir below, which is keyed on the suite's name.
  lockSuite(options);

  /**
   * From the OS, never fixed, so a run can meet neither `pnpm dev` nor a run in
   * another worktree. Memoised through the environment because Playwright
   * re-evaluates the config in every worker — see `free-port.ts`.
   */
  const [wwwPort] = stablePorts(["E2E_WWW_PORT"]);
  const baseURL = `http://127.0.0.1:${wwwPort}`;

  /**
   * A distDir of the suite's own, so its `next dev` contends neither with a
   * developer's nor with another suite's for the lock at `<distDir>/lock`.
   * See `apps/www/next.config.ts`.
   */
  const distDir = `.next-${options.name}`;

  return suiteConfig(options, {
    baseURL,
    projects: options.projects({ baseURL }),
    webServer: [
      {
        // Next as a DIRECT child, not through `pnpm dev`: a wrapper chain
        // leaves the server orphaned holding its port when Playwright stops the
        // wrapper. See `docs/e2e-architecture.md` §3.
        //
        // `NEXT_DIST_DIR` is what lets this coexist with a running `pnpm dev`:
        // Next 16's dev lock lives at `<distDir>/lock`, so two `next dev`
        // processes sharing `.next` refuse to start and a different port does
        // not help. Giving the suite its own distDir gives it its own lock.
        command: `pnpm exec next dev --port ${wwwPort}`,
        cwd: WWW_DIR,
        url: baseURL,
        // Never adopt a server we did not start. The port is ours alone, so
        // this should never trigger; if it did, a lost race is a loud failure.
        reuseExistingServer: false,
        env: {
          NEXT_DIST_DIR: distDir,
          // `apps/www`'s env.ts requires a well-formed URL; nothing connects to
          // it. Local dev reads the real one from Doppler, which this never
          // runs under.
          NEXT_PUBLIC_CONVEX_URL:
            process.env.NEXT_PUBLIC_CONVEX_URL ??
            "https://e2e-placeholder.convex.cloud",
        },
        // A cold distDir compiles from scratch on the first request.
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
    ],
  });
}
