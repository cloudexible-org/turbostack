# Agent Instructions & Guidelines

This document defines the core standards and automated workflows that any AI agent must follow when contributing to this repository.

## 1. Environment & Terminal Execution
* **OS Awareness:** Before executing any terminal commands, identify the host Operating System.
* **Command Syntax:** * Use POSIX-compliant commands for macOS/Linux.
    * Use PowerShell or CMD-specific syntax if the environment is detected as Windows.
* **Package Manager:** Always use `pnpm` for all package operations and script executions (e.g., `pnpm dev`, `pnpm install`).

## 2. Local Scratch Space
* **Use `.scratch/`:** For any temporary file — throwaway scripts, repro cases, screenshots, logs, dumps, draft notes, intermediate output — write it under `.scratch/` instead of `/tmp` or the repo root. Its contents are gitignored, so nothing leaks into a commit.
* **Namespace your work:** Create `.scratch/<short-task-name>/` rather than dropping loose files at the folder root.
* **Never depend on it:** Committed code, docs, tests, and config must not reference a `.scratch/` path — the folder is empty on every other machine and in CI. If an artifact turns out to be worth keeping, move it into the tracked repo (`scripts/`, `docs/assets/`, fixtures beside their tests) and call that out.
* **No secrets:** Credentials belong in Doppler (see `doppler.yaml`), not here.
* See `.scratch/README.md` for the full rundown.

## 3. Documentation & Changelog
* **Automatic Logging:** Every time a new feature is implemented, a bug is fixed, or a breaking change is introduced, add a **changelog fragment**: a new file `docs/changelog.d/<YYYY-MM-DD>-<branch-slug>.md` (today's date, then the branch name in kebab case, e.g. `2026-10-01-feat-group-threads.md`). **Never edit `docs/changelog.md` outside a release** — only the release step below writes it, and CI fails any other PR into `main` that touches it (unless the PR carries the `changelog-edit` label, e.g. to fix a typo in a released entry). One file per change means parallel PRs and worktrees never conflict over the changelog. To change an entry that hasn't been released yet, edit its fragment. Format and examples: [`docs/changelog.d/README.md`](docs/changelog.d/README.md).
* **Entry Format:** A fragment is what the change would have added to the changelog, in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format: one or more of these headings, each followed by `- ` entries, and nothing else:
    * `### Added` for new features.
    * `### Fixed` for bug fixes.
    * `### Changed` for refactors.
    * (`### Deprecated`, `### Removed` and `### Security` also exist.)
* **Context:** Include a brief description of *what* changed and *why*.
* **Check it:** `pnpm lint` validates every fragment; `pnpm changelog:preview` prints what the next release will list.
* **Releases:** A release is a PR into `main` from a `release/<version>` branch, the only branch allowed to edit `docs/changelog.md`. Its one commit (`chore(release): v<version>`) bumps the version in the root and every workspace `package.json` and runs `pnpm changelog:release <version>`, which writes every fragment into `docs/changelog.md` as `## [<version>] - <YYYY-MM-DD>` and deletes them. Cut one only when asked. See [`docs/changelog.d/README.md`](docs/changelog.d/README.md#releasing).

## 4. TypeScript & Type Safety
* **No `any`:** The use of `any` is strictly prohibited. Use `unknown` if a type is truly dynamic, or define proper interfaces/types.
* **Shared Types:** Logic for data fetching must leverage the generated types from `packages/api` (Convex).
* **Inference:** Allow TypeScript to infer types where obvious, but explicitly define types for function parameters, return values, and complex state objects.

## 5. Testing & Quality Assurance
* **Page Objects Pattern:** Whenever a new page is created in `apps/app` or `apps/www`, or a significant UI component is added to `packages/ui`, you must:
    1.  Update or create the corresponding page object in `packages/e2e-kit/src/page-objects/` (exported from `@repo/e2e-kit/page-objects`). Page objects locate and drive; they never assert — other suites (e.g. marketing captures) reuse them.
    2.  Ensure selectors are resilient (prefer data-attributes like `data-testid` over CSS classes).
* **E2E / Integration Tests:** One Playwright package per app, under the root `e2e/` (not `apps/`). `e2e/app` drives the Vite app (`apps/app`) with two projects: `app` (static chrome, `specs/app/`) and `app-convex` (against a real, seeded Convex local backend, `specs/app-convex/`). `e2e/www` drives the Next.js marketing site (`apps/www`), `specs/`. Put a spec in the suite of the app it asserts against. Run `pnpm test:e2e:app`, `pnpm test:e2e:www`, or `pnpm test:e2e` for both. The harness — servers, the Convex backend and its seed, ports, run locks, page objects — lives in `packages/e2e-kit`; a suite is a thin `playwright.config.ts` calling `defineAppSuite` / `defineWwwSuite` plus its specs, so any other Playwright consumer (such as a marketing screenshot suite) boots the apps identically. Ensure that new features are accompanied by a Playwright test script utilizing the updated page objects.
* **Convex-backed specs:** Anything asserting on backend data belongs in `e2e/app/specs/app-convex/`, seeded from `packages/api/convex/seed/e2e/fixture.ts` (re-exported as `@repo/e2e-kit/seed`). The suite talks only to a **local, anonymous** Convex deployment, booted per run on ports the OS hands it — never hard-code 3210 or read the port from `.convex/local/default/config.json`, and read `docs/e2e-architecture.md` §1a and §1c before touching that harness: seeding wipes the database, and a wrong port can wipe a *different project's or worktree's*.
* **The suites are independent of `pnpm dev` and of each other, across worktrees:** any number of git worktrees can run either suite at once, alongside `pnpm dev`. Every server — Vite, Next, and the Convex backend — listens on a port allocated per run, Next builds into its own `distDir`, and each worktree has its own Convex database. A run lock refuses a second run of the same suite in the *same* checkout, which would share that database. Keep it that way — do not reintroduce a fixed port, a shared `distDir`, or `reuseExistingServer: true` for any server, the Convex backend included.
* **Unit Tests:** New utility functions or business logic in `packages/api` or `apps/app` must have a corresponding `.test.ts` file for Vitest.

## 6. Styling & Components
* **Tailwind v4:** Use the CSS-first approach. Do not use deprecated Tailwind v3 configuration patterns.
* **Shadcn UI:** Use shadcn/ui components whenever possible for UI elements.
* **Base UI Primitives:** Only use **Base UI** primitives for headless components. Do **not** use Radix UI primitives at all.
* **Design System tokens:** Always use the CSS variables defined in `global.css` (e.g. `--color-primary`, `--radius-md`) for colors, spacing, and other design tokens. Do not hardcode raw values.
* **Biome:** Run `pnpm lint` and `pnpm format` (via Biome) before marking a task as complete to ensure the codebase remains clean.

## 7. Commit Standards
* **Conventional Commits:** All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat: add user login`, `fix: resolve crash on startup`).

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
