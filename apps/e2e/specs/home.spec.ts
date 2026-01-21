import { expect, test } from "@playwright/test";
import { HomePage } from "../page-objects/page";

test("has title", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(await homePage.getHeading()).toBeVisible();
});
