import type { Locator, Page } from "@playwright/test";

/**
 * The `apps/www` landing page — the Next.js marketing site served at `/`.
 *
 * Locators are verified against the DOM rendered by `apps/www/app/page.tsx` and
 * the sections under `apps/www/components/landing/`. Per
 * `docs/e2e-architecture.md` §4, an unexecuted page object states an intention,
 * not the app: keep these in sync by running the suite, not by reading it.
 *
 * Getters are synchronous — a Playwright locator is a lazy selector, not a
 * query, so there is nothing to await until it is acted on or asserted against.
 * The scroll helpers are the exception: they drive the page and settle it.
 */
export class LandingPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
    // The hero's staggered mount reveal runs ~1.2s. Waiting for it here keeps
    // every spec from racing the entrance animation.
    await this.getHeroContent().waitFor({ state: "visible" });
  }

  // --- Chrome -------------------------------------------------------------

  getNav() {
    return this.page.getByTestId("site-nav");
  }

  getBrandLink() {
    return this.getNav().getByRole("link", { name: "Turbostack" });
  }

  getThemeToggle() {
    return this.page.getByRole("button", { name: "Toggle theme" });
  }

  /**
   * The reading-progress bar. It is driven by a spring on `scrollYProgress`,
   * so assert on its `scaleX` rather than on a fixed value.
   */
  getReadingProgress() {
    return this.page.getByTestId("reading-progress");
  }

  // --- Hero ---------------------------------------------------------------

  getHeading() {
    return this.page.getByRole("heading", {
      name: "The Modern Monorepo",
      level: 1,
    });
  }

  getTagline() {
    return this.page.getByText("The ultimate type-safe, full-stack monorepo", {
      exact: false,
    });
  }

  /**
   * The hero's GitHub CTA — a `ButtonLink`, i.e. a real `<a href>` that keeps
   * its implicit link role. It is addressed by role on purpose: routing it
   * through `<Button render={<a />} />` would stamp `role="button"` on it and
   * this locator would stop matching, which is the regression to catch.
   */
  getGithubLink() {
    return this.page.getByRole("link", {
      name: "GitHub (opens in a new tab)",
      exact: true,
    });
  }

  /** The closing CTA's GitHub link — same component, different label. */
  getStarLink() {
    return this.page.getByRole("link", {
      name: "Star on GitHub (opens in a new tab)",
      exact: true,
    });
  }

  /** Every link that opens a new tab, by DOM attribute. */
  getNewTabLinks() {
    return this.page.locator('a[target="_blank"]');
  }

  /** Links whose *accessible name* says they open a new tab. */
  getAnnouncedNewTabLinks() {
    return this.page.getByRole("link", { name: /\(opens in a new tab\)$/ });
  }

  /** The scroll-linked hero block — carries the `y` drift transform. */
  getHeroContent() {
    return this.page.getByTestId("hero-content");
  }

  // --- Sections -----------------------------------------------------------

  getFeatureCards() {
    return this.page.getByTestId("feature-card");
  }

  getReveals() {
    return this.page.getByTestId("reveal");
  }

  getSection(
    name: "stack-marquee" | "showcase" | "built-with" | "cta",
  ): Locator {
    return this.page.getByTestId(name);
  }

  getFooterLink() {
    return this.page.getByRole("link", { name: "Cloudexible" });
  }

  // --- Scrolling ----------------------------------------------------------

  /**
   * Scroll with real wheel events. Lenis (root mode) intercepts them and eases
   * the document scroll, so a `window.scrollTo` would fight it and synthetic
   * `WheelEvent`s are ignored as untrusted — only `mouse.wheel` moves the page.
   */
  async wheel(ticks: number) {
    for (let i = 0; i < ticks; i++) {
      await this.page.mouse.wheel(0, 120);
      await this.page.waitForTimeout(30);
    }
    await this.settle();
  }

  /** Wait for Lenis's easing to stop moving the page. */
  async settle() {
    await this.page.waitForFunction(
      () =>
        new Promise<boolean>((resolve) => {
          const start = window.scrollY;
          setTimeout(() => resolve(Math.abs(window.scrollY - start) < 1), 250);
        }),
      undefined,
      { timeout: 15_000 },
    );
  }

  scrollY() {
    return this.page.evaluate(() => Math.round(window.scrollY));
  }

  /** True when Lenis mounted — it is skipped entirely under reduced motion. */
  hasLenis() {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains("lenis"),
    );
  }

  themeClass() {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }
}
