/**
 * One run of a suite per checkout at a time.
 *
 * Separate git worktrees never contend — each has its own directory, so its own
 * lock, `.next-e2e`, and Convex database under `packages/api/.convex/`. Two runs
 * of the *same* suite in the *same* checkout do contend, and not loudly: they
 * share that database, and each run's global setup wipes and reseeds it while
 * the other's specs are asserting against it. The failures that follow look
 * like flaky tests. This turns them into one message naming the other run.
 *
 * ─── Why the holder is recorded in the environment ──────────────────────────
 *
 * Playwright evaluates `playwright.config.ts` in the runner and again in every
 * worker, and webServer commands are children of the runner too. All of them
 * inherit the runner's environment, so recording the holder's pid there lets
 * every descendant recognise the lock as its own run's instead of mistaking it
 * for a competitor — the same trick `stablePorts` uses to agree on ports.
 *
 * A lock left behind by a killed run is detected by its pid no longer being
 * alive, and taken over.
 */

import * as fs from "node:fs";

const HOLDER_ENV = "E2E_RUN_LOCK_PID";

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: it exists, it just is not ours to signal.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function readHolder(lockFile: string): number | null {
  try {
    const pid = Number(fs.readFileSync(lockFile, "utf-8").trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/**
 * Takes `lockFile` for the lifetime of this process, or throws if another live
 * run of `suite` holds it. Safe to call from every evaluation of the config.
 */
export function acquireRunLock(lockFile: string, suite: string): void {
  const inherited = Number(process.env[HOLDER_ENV]);
  if (inherited && readHolder(lockFile) === inherited) return;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(lockFile, String(process.pid), { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;

      const holder = readHolder(lockFile);
      if (holder === process.pid) return;
      if (holder !== null && isAlive(holder)) {
        throw new Error(
          `Another ${suite} e2e run (pid ${holder}) is already running in this checkout.\n\n` +
            "Runs of the same suite in one checkout share its Convex database and " +
            "Next build directory, and each wipes the other's seed. Wait for it to " +
            "finish, or run the suite from a different git worktree — worktrees " +
            `never collide.\n\nIf pid ${holder} is not a Playwright run, delete ${lockFile}.`,
        );
      }
      // Left behind by a run that was killed. Take it over.
      fs.rmSync(lockFile, { force: true });
      continue;
    }

    process.env[HOLDER_ENV] = String(process.pid);
    process.on("exit", () => {
      if (readHolder(lockFile) === process.pid) {
        fs.rmSync(lockFile, { force: true });
      }
    });
    return;
  }

  throw new Error(`Could not take ${lockFile}: another run keeps claiming it.`);
}
