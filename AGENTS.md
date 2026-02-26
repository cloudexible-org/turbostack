# Agent Instructions & Guidelines

This document defines the core standards and automated workflows that any AI agent must follow when contributing to this repository.

## 1. Environment & Terminal Execution
* **OS Awareness:** Before executing any terminal commands, identify the host Operating System.
* **Command Syntax:** * Use POSIX-compliant commands for macOS/Linux.
    * Use PowerShell or CMD-specific syntax if the environment is detected as Windows.
* **Package Manager:** Always use `pnpm` for all package operations and script executions (e.g., `pnpm dev`, `pnpm install`).

## 2. Documentation & Changelog
* **Automatic Logging:** Every time a new feature is implemented, a bug is fixed, or a breaking change is introduced, you must update `docs/changelog.md`.
* **Entry Format:** Use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:
    * `### Added` for new features.
    * `### Fixed` for bug fixes.
    * `### Changed` for refactors.
* **Context:** Include a brief description of *what* changed and *why*.

## 3. TypeScript & Type Safety
* **No `any`:** The use of `any` is strictly prohibited. Use `unknown` if a type is truly dynamic, or define proper interfaces/types.
* **Shared Types:** Logic for data fetching must leverage the generated types from `packages/api` (Convex).
* **Inference:** Allow TypeScript to infer types where obvious, but explicitly define types for function parameters, return values, and complex state objects.

## 4. Testing & Quality Assurance
* **Page Objects Pattern:** Whenever a new page is created in `apps/app` or a significant UI component is added to `packages/ui`, you must:
    1.  Update or create the corresponding file in `e2e/page-objects/`.
    2.  Ensure selectors are resilient (prefer data-attributes like `data-testid` over CSS classes).
* **E2E / Integration Tests:** The `apps/e2e` directory targets the Vite app (`apps/app`) on `http://localhost:5173`. Ensure that new features are accompanied by a Playwright test script utilizing the updated page objects.
* **Unit Tests:** New utility functions or business logic in `packages/api` or `apps/app` must have a corresponding `.test.ts` file for Vitest.

## 5. Styling & Components
* **Tailwind v4:** Use the CSS-first approach. Do not use deprecated Tailwind v3 configuration patterns.
* **Shadcn UI:** Use shadcn/ui components whenever possible for UI elements.
* **Base UI Primitives:** Only use **Base UI** primitives for headless components. Do **not** use Radix UI primitives at all.
* **Design System tokens:** Always use the CSS variables defined in `global.css` (e.g. `--color-primary`, `--radius-md`) for colors, spacing, and other design tokens. Do not hardcode raw values.
* **Biome:** Run `pnpm lint` and `pnpm format` (via Biome) before marking a task as complete to ensure the codebase remains clean.

## 6. Commit Standards
* **Conventional Commits:** All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat: add user login`, `fix: resolve crash on startup`).