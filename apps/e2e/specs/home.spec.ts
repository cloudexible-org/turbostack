import { expect, test } from "@playwright/test";
import { HomePage } from "../page-objects/page";

/**
 * Smoke coverage for the `apps/app` shell.
 *
 * Asserts only on statically-rendered chrome, never on message data: the suite
 * runs against a shared Convex deployment (see `docs/e2e-architecture.md` §8),
 * and in CI `VITE_CONVEX_URL` is a placeholder that never connects. Anything
 * asserted here has to hold with the backend unreachable.
 */
test("renders the app shell", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.getHeading()).toBeVisible();
  await expect(homePage.getTagline()).toBeVisible();
});

test("renders the message composer", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.getMessageInput()).toBeVisible();
  await expect(homePage.getSendButton()).toBeVisible();
});
