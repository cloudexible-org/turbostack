/**
 * Free TCP ports for the suite's own app servers.
 *
 * The suite used to pin 5173 and 3100. 5173 is also what `pnpm dev` serves
 * `apps/app` on, so running the two at once failed with "http://127.0.0.1:5173
 * is already used" — and stopping your dev server to run tests is a tax on
 * every run. Asking the OS for a free port removes the collision entirely.
 *
 * ─── Why this shells out ────────────────────────────────────────────────────
 *
 * Playwright evaluates `playwright.config.ts` synchronously — the config module
 * cannot `await` — but every Node API for finding a free port is asynchronous
 * (`server.listen(0)` then read `server.address()`). Running that in a child
 * process is the one way to get the answer before `defineConfig` needs it.
 *
 * ─── The race, and why it is acceptable ─────────────────────────────────────
 *
 * A port is free when we ask and could in principle be taken before the server
 * binds it. Two things make that safe rather than silent: the window is
 * milliseconds, and both servers bind with `--strictPort` / a fixed port, so a
 * loss is a loud startup failure rather than the suite quietly attaching to
 * whatever else is listening. That is the same reasoning as §3 of
 * `docs/e2e-architecture.md` — never adopt a server you did not start.
 */

import { execFileSync } from "node:child_process";

/**
 * Asks the OS for `count` distinct free ports.
 *
 * All sockets are held open until every port has been allocated, so the same
 * port is never handed out twice in one call.
 */
export function freePorts(count: number): number[] {
  const script = `
    const net = require("node:net");
    const servers = [];
    let remaining = ${count};
    const ports = [];
    const next = () => {
      if (remaining-- === 0) {
        // Only release the sockets once every port is decided.
        for (const s of servers) s.close();
        process.stdout.write(JSON.stringify(ports));
        return;
      }
      const server = net.createServer();
      servers.push(server);
      server.listen(0, "127.0.0.1", () => {
        ports.push(server.address().port);
        next();
      });
    };
    next();
  `;

  const out = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf-8",
  });
  const ports: number[] = JSON.parse(out);

  if (ports.length !== count) {
    throw new Error(`Asked for ${count} free ports, got ${ports.length}.`);
  }
  return ports;
}

/**
 * Free ports that stay the same for the whole run, memoised through the
 * environment under the given variable names.
 *
 * This indirection is load-bearing, not tidiness. Playwright evaluates
 * `playwright.config.ts` **once per process** — in the runner, and again in
 * every worker — so allocating directly would give each worker its own ports
 * while the servers are listening on the runner's. The symptom is unmistakable
 * once seen and baffling before: every spec fails with `ERR_CONNECTION_REFUSED`
 * at a *different*, high-numbered port.
 *
 * Workers are forked from the runner and inherit its environment, so recording
 * the chosen ports there makes the first evaluation authoritative and every
 * later one a lookup. Exporting the variables yourself pins the ports, which is
 * occasionally handy for debugging.
 *
 * All ports are allocated in one call when any is missing, so two names can
 * never be handed the same port.
 */
export function stablePorts(envVars: string[]): number[] {
  const cached = envVars.map((name) => Number(process.env[name]));
  if (cached.every((port) => Number.isInteger(port) && port > 0)) return cached;

  const ports = freePorts(envVars.length);
  envVars.forEach((name, i) => {
    process.env[name] = String(ports[i]);
  });
  return ports;
}
