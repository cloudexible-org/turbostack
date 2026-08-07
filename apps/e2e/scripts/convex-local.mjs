/**
 * Runs this project's **local** Convex backend and keeps it alive, watching for
 * code changes — the backend the e2e suite talks to.
 *
 *   pnpm --filter e2e convex:local
 *
 * Playwright starts this as a `webServer`, so you rarely run it yourself; do it
 * when you want to poke at the seeded data in a browser without running tests.
 *
 * ─── Why a wrapper and not just `npx convex dev` ────────────────────────────
 *
 * Three environment overrides, none of which `convex dev` can be told on the
 * command line:
 *
 *   CONVEX_AGENT_MODE=anonymous  provisions a local deployment with no Convex
 *                                account, so anyone who clones this template
 *                                can run the suite. `--env-file` cannot express
 *                                this: it insists on naming a deployment.
 *   CONVEX_DEPLOYMENT=""         the CLI otherwise resolves this from
 *                                packages/api/.env.local *first* and cannot
 *                                authorize it once the deploy key below is
 *                                cleared, so it fails before ever considering
 *                                a local deployment.
 *   CONVEX_DEPLOY_KEY=""         a deploy key pins the CLI to the cloud
 *                                deployment it was minted for, and every local
 *                                operation fails while it is set.
 *
 * The last two are one fact, not two: the deploy key is what grants access to
 * the cloud deployment named in .env.local, and the logged-in CLI account does
 * not otherwise have it. Clearing the key therefore forces clearing the
 * deployment as well. Verified 2026-08-07 — `npx convex data` lists tables with
 * the key present and reports "You don't have access to the selected project"
 * without it. The management API answers 404 in that state, which looks exactly
 * like a deleted deployment and is not one: it is live, and is the deployment
 * `pnpm dev` runs against.
 *
 * And one thing the CLI does that has to be undone — see the watcher below.
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.join(__dirname, "..", "..", "..", "packages", "api");
const DEV_ENV_FILE = path.join(BACKEND_DIR, ".env.local");

/**
 * Configuring a local deployment rewrites `CONVEX_DEPLOYMENT` in
 * `packages/api/.env.local` to the local one and injects `CONVEX_URL` /
 * `CONVEX_SITE_URL`. That silently repoints an ordinary `pnpm dev` at the
 * disposable e2e backend; the file is gitignored, so nothing flags it, and the
 * failure it causes later — a dev app talking to an empty database — looks
 * entirely unrelated.
 *
 * Observed on 2026-08-07 while building this harness, not assumed: running
 * `convex dev` directly changed the file's checksum.
 *
 * Restoring only on exit would leave it wrong for the whole run, which is
 * exactly when someone might restart `pnpm dev` and pick up the bad value. The
 * CLI writes once, at configure time, so this fires about once per start.
 */
const devEnvBefore = fs.existsSync(DEV_ENV_FILE)
  ? fs.readFileSync(DEV_ENV_FILE, "utf-8")
  : null;

function restoreDevEnv() {
  try {
    if (devEnvBefore === null) {
      if (fs.existsSync(DEV_ENV_FILE)) fs.unlinkSync(DEV_ENV_FILE);
    } else if (fs.readFileSync(DEV_ENV_FILE, "utf-8") !== devEnvBefore) {
      fs.writeFileSync(DEV_ENV_FILE, devEnvBefore);
      console.log(
        "↩︎  restored packages/api/.env.local (convex dev rewrote it)",
      );
    }
  } catch {
    // Best effort — never mask the child's own exit reason.
  }
}

fs.watchFile(DEV_ENV_FILE, { interval: 500 }, restoreDevEnv);

const child = spawn(
  "npx",
  ["convex", "dev", "--typecheck", "disable", "--tail-logs", "disable"],
  {
    cwd: BACKEND_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_AGENT_MODE: "anonymous",
      CONVEX_DEPLOYMENT: "",
      CONVEX_DEPLOY_KEY: "",
    },
  },
);

const stop = () => child.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", () => {
  fs.unwatchFile(DEV_ENV_FILE, restoreDevEnv);
  restoreDevEnv();
});
child.on("exit", (code) => {
  fs.unwatchFile(DEV_ENV_FILE, restoreDevEnv);
  restoreDevEnv();
  process.exit(code ?? 0);
});
