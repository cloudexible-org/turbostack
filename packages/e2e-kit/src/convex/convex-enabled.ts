/**
 * Whether this run includes the Convex-backed specs.
 *
 * On by default, because locally that is the point — the `app-convex` project
 * drives `apps/app` against a real, seeded backend.
 *
 * `E2E_CONVEX=0` skips the backend for a quick run that doesn't need seeded
 * data. The `app` and `www` projects — which assert only statically-rendered
 * chrome and client-side behaviour — still run.
 *
 * Shared by `defineAppSuite` and `global-setup.ts` so the two can never
 * disagree about whether a backend is expected.
 */
export function convexEnabled(): boolean {
  return process.env.E2E_CONVEX !== "0";
}
