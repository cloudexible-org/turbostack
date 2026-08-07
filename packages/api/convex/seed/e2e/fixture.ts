/**
 * The world the e2e suite starts from.
 *
 * Deliberately plain data with no Convex imports, so `apps/e2e` can import this
 * file directly and assert against the same constants the seed writes. A test
 * that hard-codes `"Seeded: first message"` and a fixture that writes something
 * else fail as a mystery; sharing the definition makes that impossible.
 *
 * Keep it small. This is a template repo's demo backend — one `messages` table
 * — and the fixture exists to prove the harness works end to end, not to model
 * a product.
 */

export type SeedMessage = {
  /** Stable handle used by tests to look a row up in the manifest. */
  slug: string;
  author: string;
  body: string;
};

/**
 * Bodies are distinctive on purpose. `apps/app` renders every message in one
 * flat list with no filtering, so a test asserting on "hello" would match any
 * row a developer left behind; these will not collide by accident.
 */
export const SEED_MESSAGES: SeedMessage[] = [
  {
    slug: "first",
    author: "seed-author-a",
    body: "Seeded message: the first one",
  },
  {
    slug: "second",
    author: "seed-author-b",
    body: "Seeded message: the second one",
  },
  {
    slug: "third",
    author: "seed-author-a",
    body: "Seeded message: the third one",
  },
];

/** Slug → document id, returned by `apply` so tests never hard-code an id. */
export type SeedManifest = {
  messages: Record<string, string>;
};
