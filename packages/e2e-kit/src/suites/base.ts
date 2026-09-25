import * as path from "node:path";
import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type Project,
} from "@playwright/test";
import { acquireRunLock } from "../run-lock";

/** One `webServer` entry. */
export type WebServer = Exclude<
  NonNullable<PlaywrightTestConfig["webServer"]>,
  readonly unknown[]
>;

/**
 * What every suite built on this harness declares about itself. Everything not
 * listed — the servers, their ports, global setup, the locks — belongs to the
 * harness, so an e2e suite and a marketing suite driving the same app can never
 * boot it differently.
 */
export type SuiteOptions<Context> = {
  /**
   * The suite's own directory; pass `__dirname` from its `playwright.config.ts`.
   * Its run lock lives here, and Playwright already writes the suite's reports
   * and traces here.
   */
  dir: string;
  /**
   * Short, unique per suite (`e2e-app`, `marketing`, …). Names the suite in
   * lock errors and keys anything on disk it must not share with another suite.
   */
  name: string;
  /**
   * The suite's projects. Each inherits `use` from the config — Desktop Chrome
   * and this run's `baseURL` — so most only need a `name` and a `testDir`
   * (relative to the suite's `playwright.config.ts`).
   */
  projects: (context: Context) => Project[];
  /**
   * Anything else — `reporter`, `retries`, `use.video`, a viewport — merged
   * over the defaults below. `use.baseURL` is always this run's server.
   */
  config?: Omit<PlaywrightTestConfig, "projects" | "webServer" | "globalSetup">;
};

/**
 * Takes the suite's own lock. Two runs of one suite in one checkout would share
 * its reports, traces, and any build directory keyed on its name.
 */
export function lockSuite(
  options: Pick<SuiteOptions<never>, "dir" | "name">,
): void {
  acquireRunLock(
    path.join(options.dir, ".e2e-run.lock"),
    `the ${options.name} suite`,
    "Two runs of one suite share its reports, traces and build directory.",
  );
}

/**
 * The config every suite starts from, with the suite's own overrides on top and
 * the harness's servers, setup and `baseURL` on top of those.
 */
export function suiteConfig(
  options: SuiteOptions<never>,
  harness: {
    baseURL: string;
    projects: Project[];
    webServer: WebServer[];
    globalSetup?: string;
  },
): PlaywrightTestConfig {
  const { use, ...overrides } = options.config ?? {};

  return defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    // `open: "never"` — the default ("on-failure") serves the report and blocks
    // the process, which hangs any non-interactive run (CI, agents, `&&` chains).
    reporter: [["html", { open: "never" }], ["list"]],
    ...overrides,
    use: {
      ...devices["Desktop Chrome"],
      trace: "on-first-retry",
      ...use,
      baseURL: harness.baseURL,
    },
    projects: harness.projects,
    globalSetup: harness.globalSetup,
    webServer: harness.webServer,
  });
}
