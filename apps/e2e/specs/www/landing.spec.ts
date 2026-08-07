import { expect, test } from "@playwright/test";
import { LandingPage } from "../../page-objects/www/landing.page";

/**
 * Coverage for the `apps/www` marketing site.
 *
 * Asserts only on statically-rendered chrome and on client-side animation
 * state — never on backend data. `NEXT_PUBLIC_CONVEX_URL` is a placeholder in
 * CI that never connects, and Clerk is optional (`apps/www/env.ts` marks the
 * publishable key optional, and the nav/hero auth buttons render only when it
 * is set), so nothing here may depend on either being configured.
 */
test.describe("landing chrome", () => {
  test("renders the hero", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.getHeading()).toBeVisible();
    await expect(landing.getTagline()).toBeVisible();
    await expect(landing.getGithubLink()).toHaveAttribute(
      "href",
      "https://github.com/cloudexible-org/turbostack",
    );
  });

  /**
   * Button-styled links must stay links. `components/ui/button` exposes
   * `ButtonLink` (a plain `<a>` carrying `buttonVariants`) precisely because
   * `<Button render={<a />} />` sets `nativeButton={false}`, and Base UI then
   * stamps `role="button"` over the anchor's implicit link role — so assistive
   * technology announces a navigating link as a button. Base UI's own docs say
   * links "should not be rendered as buttons through the `render` prop".
   *
   * `getByRole("link", { exact: true })` fails on both halves of the old bug:
   * the overridden role, and the doubled accessible name ("GitHub GitHub") that
   * an `aria-label`led icon produced next to identical visible text.
   */
  test("button-styled links keep link semantics and a single name", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    for (const link of [landing.getGithubLink(), landing.getStarLink()]) {
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute(
        "href",
        "https://github.com/cloudexible-org/turbostack",
      );
      // A link, never a button — and never both.
      await expect(link).not.toHaveAttribute("role", "button");
    }

    // The decorative icon must not contribute a second "GitHub" to the name.
    await expect(page.getByRole("img", { name: "GitHub" })).toHaveCount(0);
  });

  /**
   * Every `target="_blank"` link must announce itself. Sighted users see a new
   * tab appear; screen reader users get no signal at all, and Back no longer
   * returns them where they were (WCAG 3.2.5).
   *
   * Asserted as an invariant over the whole page rather than link by link, so a
   * new external link added later cannot quietly skip the hint — that is the
   * failure this is really guarding against, since every individual link here
   * already passes.
   */
  test("every link that opens a new tab announces it", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const total = await landing.getNewTabLinks().count();
    expect(total).toBeGreaterThan(0);
    await expect(landing.getAnnouncedNewTabLinks()).toHaveCount(total);
  });

  test("renders the sticky nav and footer", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.getNav()).toBeVisible();
    await expect(landing.getBrandLink()).toBeVisible();
    await expect(landing.getFooterLink()).toHaveAttribute(
      "href",
      "https://cloudexible.com",
    );
  });

  test("renders every landing section", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    for (const name of [
      "stack-marquee",
      "showcase",
      "built-with",
      "cta",
    ] as const) {
      await expect(landing.getSection(name)).toBeAttached();
    }
    await expect(landing.getFeatureCards()).toHaveCount(9);
  });

  test("theme toggle switches the document theme", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const before = await landing.themeClass();
    await landing.getThemeToggle().click();
    await expect.poll(() => landing.themeClass()).not.toBe(before);
  });
});

/**
 * Motion behaviour.
 *
 * These are the only tests in the repo that exercise `motion` at runtime.
 * `apps/www` has ~70 `motion` usages across nine components, and before this
 * suite existed a `motion` upgrade could regress every scroll animation on the
 * page while `typecheck`, `test`, `check` and `build` all stayed green — which
 * is precisely why the 12 -> 13 bump was held back for its own change. Note
 * Playwright's `toBeVisible()` does NOT consider `opacity`, so a reveal that
 * never fires still reads as "visible"; these assert computed opacity instead.
 */
test.describe("motion", () => {
  test("below-the-fold content starts hidden and reveals on scroll", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Feature cards live ~1.5 viewports down and are staggered children of a
    // `whileInView` group, so they must start fully transparent.
    const firstCard = landing.getFeatureCards().first();
    await expect(firstCard).toHaveCSS("opacity", "0");

    await landing.wheel(8);
    await expect(firstCard).toHaveCSS("opacity", "1");
  });

  test("the hero drifts as it scrolls away", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const hero = landing.getHeroContent();
    // `useScroll` + `useTransform` map the hero's own scroll progress to a
    // 0 -> 120px drift, so at rest there is no transform at all.
    await expect(hero).toHaveCSS("transform", "none");

    await landing.wheel(4);
    await expect
      .poll(
        async () => await hero.evaluate((el) => getComputedStyle(el).transform),
      )
      .toMatch(/^matrix\(/);
  });

  test("the reading-progress bar advances with scroll", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const scaleX = async () =>
      await landing.getReadingProgress().evaluate((el) => {
        const t = getComputedStyle(el).transform;
        // `matrix(a, b, c, d, tx, ty)` — `a` is the horizontal scale.
        const m = t.match(/matrix\(([^,]+),/);
        return m ? Number.parseFloat(m[1]) : 0;
      });

    expect(await scaleX()).toBeCloseTo(0, 2);

    await landing.wheel(12);
    // Springs settle asymptotically, so assert a threshold, not a value.
    await expect.poll(scaleX).toBeGreaterThan(0.2);
  });

  test("scrolling reaches the foot of the page and reveals the CTA", async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    expect(await landing.scrollY()).toBe(0);

    await landing.wheel(32);
    expect(await landing.scrollY()).toBeGreaterThan(1000);

    // Every reveal on the page should have fired by the time we are at the end.
    const reveals = landing.getReveals();
    for (let i = 0; i < (await reveals.count()); i++) {
      await expect(reveals.nth(i)).toHaveCSS("opacity", "1");
    }
  });
});

/**
 * `MotionProvider` branches on `useReducedMotion`: it skips Lenis entirely for
 * those users while `MotionConfig reducedMotion="user"` drops transforms and
 * keeps opacity. That branch had no coverage, and it is the accessible path.
 */
test.describe("reduced motion", () => {
  test("skips smooth scrolling but still reveals content", async ({ page }) => {
    const landing = new LandingPage(page);
    // Emulate before navigating: `MotionProvider` reads `useReducedMotion` at
    // mount to decide whether to render Lenis at all, so flipping the media
    // query after load would not re-run that branch. `reducedMotion` is not a
    // test-level `use` option in Playwright 1.62 — it is set through the media
    // emulation API.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await landing.goto();

    expect(await landing.hasLenis()).toBe(false);
    await expect(landing.getHeading()).toBeVisible();

    await landing.wheel(8);
    await expect(landing.getFeatureCards().first()).toHaveCSS("opacity", "1");
  });
});
