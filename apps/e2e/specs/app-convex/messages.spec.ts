import { expect, test } from "@playwright/test";
import { SEED_MESSAGES } from "../../../../packages/api/convex/seed/e2e/fixture";
import { HomePage } from "../../page-objects/app/home.page";

/**
 * `apps/app` against a real Convex backend.
 *
 * These are the only specs in the repo that exercise the backend at all. The
 * `app` project asserts that the shell renders with an unreachable placeholder
 * URL; this one asserts that data actually round-trips — a query that reads
 * seeded rows, and a mutation whose write survives a reload.
 *
 * The backend is the **local** deployment, reseeded by `fixtures/global-setup.ts`
 * before the run. It is never a cloud deployment: seeding wipes the database,
 * and the local backend is the only one that is disposable.
 *
 * ─── Why these are safe to run in parallel ──────────────────────────────────
 *
 * `api.messages.list` is unfiltered — every spec sees every row — so isolation
 * comes from *what* each spec asserts, not from a private slice of the world.
 * Both specs below assert only on rows they own: the seeded bodies, which are
 * distinctive by construction (`fixture.ts`), and a body carrying a unique
 * per-run token. Neither deletes anything, and neither asserts a total count or
 * an empty state — both of which would race any other spec's writes.
 */

test("renders the messages seeded into Convex", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  // Proves the query resolved rather than sitting on its loading placeholder —
  // "Loading…" is itself a listitem, so a naive count assertion would pass
  // against a backend that never answered.
  await expect(home.getLoadingPlaceholder()).toBeHidden();

  for (const message of SEED_MESSAGES) {
    await expect(home.getMessage(message.body)).toBeVisible();
  }
});

test("a sent message survives a reload", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await expect(home.getLoadingPlaceholder()).toBeHidden();

  // Unique per run so a leftover row from an earlier run cannot make this pass,
  // and so concurrent specs cannot collide on it.
  const body = `e2e round-trip ${process.pid}-${Date.now()}`;

  await expect(home.getMessage(body)).toHaveCount(0);
  await home.sendMessage(body);

  // Convex is reactive, so the row appears without a reload.
  await expect(home.getMessage(body)).toBeVisible();

  // The reload is the point: it re-reads from the backend, so this fails if the
  // mutation only ever updated local state. Per §9 of docs/e2e-architecture.md,
  // asserting the optimistic update alone would overclaim.
  await page.reload();
  await expect(home.getLoadingPlaceholder()).toBeHidden();
  await expect(home.getMessage(body)).toBeVisible();
});
