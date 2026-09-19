/**
 * Where *this run's* local Convex backend listens, and proof that whatever is
 * answering there is actually ours.
 *
 * ─── The port is chosen per run, not read from `config.json` ────────────────
 *
 * Convex records a `(cloud, site)` port pair in each local deployment's
 * `config.json` when it is provisioned — the first free pair from 3210 up:
 *
 *   {"ports":{"cloud":3210,"site":3211}, "deploymentName":"anonymous-agent", ...}
 *
 * That record is per *directory*, and every git worktree is its own directory.
 * Two worktrees provisioned while no backend was up both record 3210. The
 * harness used to read that port and reuse whatever answered on it, so the
 * second worktree's run adopted the first one's backend — reproduced
 * 2026-09-19, and stopped only by the identity guard below. It gets worse at
 * boot: the CLI treats the recorded port as a *suggestion* and silently moves
 * to the next free one if it is taken, after Playwright has already handed the
 * old one to the app.
 *
 * So `playwright.config.ts` asks the OS for a free pair every run, and
 * `scripts/convex-local.mjs` boots the backend on exactly that pair
 * (`--local-cloud-port`, which fails loudly rather than drifting). Nothing
 * reads the recorded port any more.
 *
 * ─── Why a wrong backend is a data-loss bug, not a flaky test ───────────────
 *
 * Global setup wipes the database to seed it. Pointed at another project's or
 * another worktree's backend, every step succeeds and the run goes green while
 * destroying someone else's data. Per-run ports remove the collision; the
 * identity guard at the bottom of this file stays as the backstop.
 *
 * `CONVEX_URL` remains an escape hatch for a genuinely remapped backend, but it
 * deliberately has **no default**. A default in `.env` is what let the right
 * answer and the wrong one coexist in the project this pattern came from — and
 * `.env` is not even loaded when Playwright evaluates the config or in test
 * workers, so it could never have applied consistently. Export it in your
 * shell if you need it.
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

/** The Convex project root — `convex/` and `.convex/` live here. */
const BACKEND_DIR = path.join(__dirname, "..", "..", "packages", "api");

/** Written by the Convex CLI when it first provisions the local deployment. */
export const LOCAL_CONFIG = path.join(
  BACKEND_DIR,
  ".convex",
  "local",
  "default",
  "config.json",
);

type LocalDeploymentConfig = {
  ports?: { cloud?: number; site?: number };
  adminKey: string;
  deploymentName: string;
};

export function readLocalConfig(): LocalDeploymentConfig | null {
  if (!fs.existsSync(LOCAL_CONFIG)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCAL_CONFIG, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * This run's backend ports, allocated by `playwright.config.ts` through
 * `stablePorts` before anything here runs, and inherited by workers.
 */
export function runPorts(): { cloud: number; site: number } {
  const cloud = Number(process.env.E2E_CONVEX_CLOUD_PORT);
  const site = Number(process.env.E2E_CONVEX_SITE_PORT);
  if (!cloud || !site) {
    throw new Error(
      "E2E_CONVEX_CLOUD_PORT / E2E_CONVEX_SITE_PORT are unset. " +
        "playwright.config.ts allocates them before anything reads them.",
    );
  }
  return { cloud, site };
}

/**
 * Creates this checkout's local deployment if it does not have one yet — the
 * database and the admin key global setup needs. A new worktree starts without
 * one, since `.convex/` is gitignored.
 *
 * The CLI rewrites `packages/api/.env.local` while doing this, so the call is
 * wrapped in `withDevEnvProtected`.
 */
export function ensureLocalDeployment(): void {
  if (readLocalConfig()) return;

  console.log("No local Convex deployment yet — provisioning one…");

  // `convex dev --once` provisions the deployment, records its admin key in
  // config.json, pushes the current functions, and exits. The backend does not
  // survive it — which is fine, because all we need here is the file. It boots
  // on this run's ports so provisioning cannot collide with another worktree's
  // backend either.
  const ports = runPorts();
  //
  // Anonymous, and with `CONVEX_DEPLOYMENT` cleared, on purpose:
  //   - anonymous needs no Convex account, so anyone who clones this template
  //     can run the suite;
  //   - the CLI otherwise resolves `CONVEX_DEPLOYMENT` from
  //     `packages/api/.env.local` first, and cannot authorize it once
  //     `CONVEX_DEPLOY_KEY` is cleared (below), so it fails before ever
  //     considering a local deployment.
  //
  // `CONVEX_DEPLOY_KEY` is cleared because a deploy key pins the CLI to the
  // cloud deployment it was minted for, and every local operation fails while
  // it is set. That clearing is *why* `CONVEX_DEPLOYMENT` has to go too: the
  // key is what grants access to that cloud deployment, and the logged-in CLI
  // account does not otherwise have it. Verified 2026-08-07 — `npx convex data`
  // lists tables with the key present and reports "You don't have access to the
  // selected project" without it. The management API answers 404 there, which
  // reads like a deleted deployment and is not one: the deployment is live and
  // is what `pnpm dev` uses.
  withDevEnvProtected(() => {
    execFileSync(
      "npx",
      [
        "convex",
        "dev",
        "--once",
        "--typecheck",
        "disable",
        // See scripts/convex-local.mjs — a developer's own `convex dev` owns
        // convex/_generated/, and the suite never imports it.
        "--codegen",
        "disable",
        "--local-cloud-port",
        String(ports.cloud),
        "--local-site-port",
        String(ports.site),
      ],
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
  });

  if (!readLocalConfig()) {
    throw new Error(
      `Provisioned a local Convex deployment but ${LOCAL_CONFIG} is still missing.`,
    );
  }
}

/**
 * Runs `fn` and puts `packages/api/.env.local` back if the Convex CLI rewrote
 * it.
 *
 * It does. Configuring a local deployment rewrites `CONVEX_DEPLOYMENT` to the
 * local one and injects `CONVEX_URL` / `CONVEX_SITE_URL`, which silently
 * repoints an ordinary `pnpm dev` at the disposable e2e backend. The file is
 * gitignored, so nothing flags the change, and the failure it causes later — a
 * dev app talking to an empty database — looks unrelated. Verified by
 * observation on 2026-08-07, not assumed.
 */
function withDevEnvProtected(fn: () => void): void {
  const devEnv = path.join(BACKEND_DIR, ".env.local");
  const before = fs.existsSync(devEnv)
    ? fs.readFileSync(devEnv, "utf-8")
    : null;

  try {
    fn();
  } finally {
    try {
      if (before === null) {
        if (fs.existsSync(devEnv)) fs.unlinkSync(devEnv);
      } else if (fs.readFileSync(devEnv, "utf-8") !== before) {
        fs.writeFileSync(devEnv, before);
        console.log(
          "↩︎  restored packages/api/.env.local (the Convex CLI rewrote it)",
        );
      }
    } catch {
      // Best effort — never mask the real failure.
    }
  }
}

/** The backend's base URL: this run's port, unless `CONVEX_URL` overrides it. */
export function localBackendUrl(): string {
  if (process.env.CONVEX_URL) return process.env.CONVEX_URL;
  return `http://127.0.0.1:${runPorts().cloud}`;
}

/**
 * The local backend's admin key, which is what lets the suite call an
 * *internal* mutation. The alternative — shelling out to `npx convex run` —
 * costs seconds per call in process startup alone; over HTTP it is a few
 * milliseconds. The key is generated per local deployment and never leaves the
 * machine.
 */
export function localBackendCredentials(): { url: string; adminKey: string } {
  const config = readLocalConfig();
  if (!config) {
    throw new Error(
      `No local Convex deployment at ${LOCAL_CONFIG}.\n` +
        "Start it with `pnpm --filter e2e-app convex:local`, or just run the suite — " +
        "Playwright starts it as a webServer.",
    );
  }
  return { url: localBackendUrl(), adminKey: config.adminKey };
}

/**
 * Refuses to run against another project's backend.
 *
 * `/instance_name` returns the instance the backend was booted for, which for a
 * local deployment equals `deploymentName` in its `config.json`. Comparing the
 * two turns "green run, wrong database, silently wiped" into a message naming
 * both sides.
 *
 * Call this before anything writes.
 */
export async function assertLocalBackendIdentity(): Promise<void> {
  const config = readLocalConfig();
  const url = localBackendUrl();

  let reported: string;
  try {
    const response = await fetch(`${url}/instance_name`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    reported = (await response.text()).trim();
  } catch (cause) {
    throw new Error(
      `No Convex backend answering at ${url}` +
        (config
          ? ` (expected the local deployment "${config.deploymentName}")`
          : "") +
        ". Start it with `pnpm --filter e2e-app convex:local`.",
      { cause },
    );
  }

  // No local deployment here, yet something is answering on the address we
  // would use — only possible through a `CONVEX_URL` override. Refuse rather
  // than hand someone else's backend to the app.
  if (!config) {
    throw new Error(
      `${url} is serving "${reported}", but this project has no local Convex ` +
        `deployment yet (${LOCAL_CONFIG} does not exist).\n\n` +
        "That address belongs to another Convex project on this machine. The " +
        "suite stopped rather than seed it — seeding WIPES the database.\n" +
        "Create this project's deployment first: `pnpm --filter e2e-app convex:local`.",
    );
  }

  if (reported !== config.deploymentName) {
    throw new Error(
      `${url} is serving a different Convex deployment.\n` +
        `  expected: ${config.deploymentName}\n` +
        `  found:    ${reported}\n\n` +
        "Another Convex backend on this machine is using that port. The suite " +
        "stopped rather than seed it — seeding WIPES the database.\n" +
        "Unset CONVEX_URL if it is pinning the wrong port; otherwise re-run — " +
        "each run picks fresh ports.",
    );
  }

  await assertOurCodeAndKey(url, config.adminKey, reported);
}

/**
 * The half of the identity check that a name cannot provide.
 *
 * This repo provisions an *anonymous* deployment, and the Convex CLI names
 * every anonymous agent-mode deployment `anonymous-agent`. Two projects built
 * from this template on one machine would therefore pass the name comparison
 * above while being completely different databases — and if they were
 * provisioned at different times they can both have recorded the same port.
 * The name check is kept because it gives a fast, readable failure for *named*
 * local deployments; this is what actually makes the guard sound.
 *
 * Calling our own internal `ping` with our own admin key proves both that the
 * key was accepted — admin keys are per-deployment — and that this project's
 * code is what is deployed there.
 *
 * Retried, because `webServer.url` health-checks `/version`, which answers as
 * soon as the backend process is up and before `convex dev` has finished
 * pushing functions. A backend that is genuinely not ours never starts
 * answering, so the wait is only ever paid on the error path.
 */
async function assertOurCodeAndKey(
  url: string,
  adminKey: string,
  reported: string,
): Promise<void> {
  const { ConvexHttpClient } = await import("convex/browser");
  const client = new ConvexHttpClient(url);
  // `setAdminAuth` exists at runtime but is omitted from Convex's public
  // typings — it is how the CLI authenticates, and the only way to reach an
  // internal function. Cast narrowly rather than widening the whole client.
  (client as unknown as { setAdminAuth(key: string): void }).setAdminAuth(
    adminKey,
  );

  const deadline = Date.now() + 45_000;
  let lastError: unknown;

  for (;;) {
    try {
      const pong = await client.query(
        "seed/e2e/mutations:ping" as never,
        {} as never,
      );
      if (pong === "turbostack-e2e") return;
      lastError = new Error(
        `unexpected ping response: ${JSON.stringify(pong)}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (Date.now() > deadline) break;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `${url} reports the deployment name "${reported}", but would not accept this ` +
      "project's admin key for its own `seed/e2e/mutations:ping`.\n\n" +
      "Admin keys are per-deployment, so this is almost certainly a different " +
      "Convex backend that happens to share a name — anonymous deployments are " +
      "all called `anonymous-agent`. The suite stopped rather than seed it — " +
      "seeding WIPES the database.\n\n" +
      "If this project's backend is simply slow to push its functions, re-run. " +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
