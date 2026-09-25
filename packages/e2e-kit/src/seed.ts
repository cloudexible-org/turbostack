/**
 * The world `defineAppSuite`'s global setup seeds, re-exported so suites can
 * assert against — or stage a capture around — the same constants the seed
 * writes, without reaching into `packages/api` by relative path.
 */

export {
  SEED_MESSAGES,
  type SeedManifest,
  type SeedMessage,
} from "../../api/convex/seed/e2e/fixture";
