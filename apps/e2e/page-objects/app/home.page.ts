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

  // --- Convex-backed surfaces ---------------------------------------------
  //
  // Only meaningful when the suite runs against a seeded local backend (the
  // `app-convex` project). With the CI placeholder URL the query never
  // resolves and the list stays on "Loading…" forever.

  /** One `<li>` per message. Also matches the loading and empty placeholders. */
  getMessageItems() {
    return this.page.getByRole("listitem");
  }

  /** A specific message by its exact body text. */
  getMessage(body: string) {
    return this.page.getByRole("listitem").filter({ hasText: body });
  }

  getLoadingPlaceholder() {
    return this.page.getByText("Loading…", { exact: true });
  }

  /**
   * Sends a message and waits for the input to clear, which `App.tsx` does
   * synchronously before awaiting the mutation — so this returns before the
   * write has necessarily landed. Assert on the list, not on this.
   */
  async sendMessage(body: string) {
    await this.getMessageInput().fill(body);
    await this.getSendButton().click();
  }
}
