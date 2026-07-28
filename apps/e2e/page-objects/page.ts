import type { Page } from "@playwright/test";

/**
 * The `apps/app` home page — the Vite + React + Convex app served at `/`.
 *
 * Locators here are verified against the real DOM rendered by
 * `apps/app/src/App.tsx`. Per `docs/e2e-architecture.md` §4, an unexecuted page
 * object states an intention, not the app: keep these in sync by running the
 * suite, not by reading it.
 *
 * These are synchronous — a Playwright locator is a lazy selector, not a query,
 * so there is nothing to await until it is acted on or asserted against.
 */
export class HomePage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  getHeading() {
    return this.page.getByRole("heading", { name: "TurboStack", level: 1 });
  }

  getTagline() {
    return this.page.getByText("Vite + React + Convex");
  }

  getMessageInput() {
    return this.page.getByLabel("Message");
  }

  getSendButton() {
    return this.page.getByRole("button", { name: "Send", exact: true });
  }
}
