/**
 * Whether this run includes the Convex-backed specs.
 *
 * On by default, because locally that is the point — the `app-convex` project
 * drives `apps/app` against a real, seeded backend.
 *
 * CI sets `E2E_CONVEX=0`. Starting a Convex local backend there would mean
 * downloading the backend binary and provisioning a deployment on a cold runner
 * for every push, and the sibling project this harness came from does not run
 * its Convex suite in CI at all. Turning it off keeps the `app` and `www`
 * projects — which assert only statically-rendered chrome and client-side
 * behaviour — running on every push exactly as before.
 *
 * Shared by `playwright.config.ts` and `fixtures/global-setup.ts` so the two
 * can never disagree about whether a backend is expected.
 */
export function convexEnabled(): boolean {
  return process.env.E2E_CONVEX !== "0";
}
