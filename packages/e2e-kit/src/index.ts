/**
 * What the Playwright suites (`apps/e2e-app`, `apps/e2e-www`) share: how they
 * stay out of each other's way. Every run takes its ports from the OS, and a
 * suite runs at most once per checkout at a time — so any number of git
 * worktrees can run any suite concurrently. See §1c of
 * `docs/e2e-architecture.md`.
 */

export { freePorts, stablePorts } from "./free-port";
export { acquireRunLock } from "./run-lock";
