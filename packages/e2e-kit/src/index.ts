/**
 * The harness every Playwright suite in this repo is built on — the e2e specs
 * under `e2e/` and anything else that drives the apps, such as a marketing
 * suite that captures screenshots through the same page objects.
 *
 *   @repo/e2e-kit               port and lock primitives (this file)
 *   @repo/e2e-kit/suites        `defineAppSuite` / `defineWwwSuite`: the servers,
 *                               the Convex backend and its seed, as a config
 *   @repo/e2e-kit/page-objects  one class per page, shared by every suite
 *   @repo/e2e-kit/seed          the data global setup writes, to assert against
 *
 * Every run takes its ports from the OS and locks what it would share, so any
 * number of git worktrees can run any suite concurrently. See §1c of
 * `docs/e2e-architecture.md`.
 */

export { freePorts, stablePorts } from "./free-port";
export { acquireRunLock } from "./run-lock";
