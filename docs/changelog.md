# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Turbo Remote Caching in CI:** Wired `TURBO_TOKEN` / `TURBO_TEAM` into `.github/workflows/ci.yml` so CI shares a remote cache with Vercel builds. Both are optional — Turbo falls back to local cache when unset. To enable: add a `TURBO_TOKEN` repo secret (Vercel access token) and a `TURBO_TEAM` repo variable (Vercel team slug).
- **Vite app wired to the Convex stack:** Replaced the default Vite counter boilerplate in `apps/app` with a live Convex demo — a `messages` schema table with `list`/`send` functions (`packages/api/convex/messages.ts`), a `ConvexProvider` mounted in `main.tsx` from the typed env, and `App.tsx` showing a reactive query + mutation. Added `convex` as an app dependency and tightened `VITE_CONVEX_URL` to required (it now backs the Convex client). The app was previously a deployed-but-empty SPA that used none of the stack.

### Changed
- **README refresh:** Updated `README.md` for the current state — Clerk shown as optional, PostHog analytics and `packages/analytics` added, Portless dev URLs, typed env, git hooks, and CI documented; expanded the dev-workflow commands (`typecheck`, `test`, `lint`/`format`); fixed the stale `apps/web` path (→ `apps/www`), the "Vite (Unit)" typo (→ Vitest), the Node version (→ 26), and the outdated "initial build will fail" deploy note.
- **Node 26:** Bumped `.nvmrc` / `.node-version` to `26` and `engines.node` to `>=26`, aligning the runtime with the `@types/node` 26 bump.

### Removed
- **Redundant Storybook Vitest setup:** Removed `packages/ui/.storybook/vitest.setup.ts` and its `setupFiles` reference. `@storybook/addon-vitest` applies preview annotations automatically since Storybook 10.3, so the manual `setProjectAnnotations` call only emitted a warning. a11y enforcement is unaffected (verified: a violating story still fails the test run).

## [3.0.2] - 2026-06-29

### Fixed
- **Clerk truly optional in Convex auth config:** `packages/api/convex/auth.config.ts` now only registers the Clerk auth provider when `CLERK_JWT_ISSUER_DOMAIN` is set; otherwise `providers` is empty and Convex deploys/runs without auth. Previously the provider always referenced the env var, so `convex deploy` failed ("environment variable CLERK_JWT_ISSUER_DOMAIN is used in auth config file but its value was not set") on any deployment without Clerk configured — e.g. Vercel preview deployments. This matches the app layer, where Clerk is already bypassed when unset.

## [3.0.1] - 2026-06-29

### Added
- **Convex agent skills:** Ran `npx convex ai-files install` to add Convex agent skills (`.claude/skills/` for Claude Code, plus a portable `.agents/skills/` copy and `skills-lock.json`) covering component creation, migrations, performance audits, auth setup, and quickstart. Also appended a Convex pointer block to `AGENTS.md` directing agents to the generated `convex/_generated/ai/guidelines.md`.

## [3.0.0] - 2026-06-29

### Added
- **Portless named local URLs:** Added `portless` as a root dev dependency and wrapped each app's own `dev` script in named mode, so apps get stable HTTPS `.localhost` URLs instead of bare ports (`app.turbostack`, `www.turbostack`, `storybook.turbostack`). The root `dev` stays `turbo dev --ui tui` (Turbo still orchestrates + keeps the TUI). Convex keeps a plain `convex dev`. Vite now binds `host: "127.0.0.1"` (it can otherwise listen on IPv6 `[::1]`, which the IPv4 proxy can't reach → 502), and apps with hardcoded ports pin `--app-port` to match. e2e/CI bypass the proxy via `PORTLESS=0` (Playwright's `webServer` runs `PORTLESS=0 pnpm --filter app dev` and targets `127.0.0.1:5173` directly). Requires Node 24+.
- **`typecheck` Turbo task:** Added a dedicated `tsc --noEmit` (`tsc -b` for the Vite app) `typecheck` script to `app`, `www`, `@repo/api`, and `@repo/ui`, a `typecheck` task in `turbo.json`, and a root `pnpm typecheck` passthrough — so type errors surface independently instead of only at build time.
- **Git hooks (lefthook + commitlint):** Added `lefthook.yml` and `commitlint.config.mjs` to enforce the standards already documented in `CLAUDE.md` — Biome runs on staged files at pre-commit, and commit messages are validated against Conventional Commits at commit-msg. Hooks install automatically via the root `prepare` script. *Why:* the rules were aspirational; nothing enforced them.
- **`only-allow pnpm` guard:** Added a `preinstall` script so `npm install` / `yarn` are rejected, enforcing the pnpm-only policy from `CLAUDE.md`.
- **Node version pinning:** Added `.nvmrc` and `.node-version` pinned to `24`.
- **GitHub Actions validation CI:** Added `.github/workflows/ci.yml` running `lint → typecheck` on pushes to `main` and on pull requests. No tests and no build/deploy — deployment stays with Vercel, and the existing `.gitlab-ci.yml` (self-hosted home server) is untouched. Tests are intentionally excluded from CI: the `@repo/ui` unit suite runs Storybook stories in a real browser, so it stays a local-only `pnpm test`.
- **Root `pnpm test` script:** Added `turbo test --filter=!e2e` so the default test run covers unit tests while excluding the Playwright e2e package (run that separately via `pnpm --filter e2e test`).
- **Repo hygiene files:** Added `.github/CODEOWNERS`, a pull request template, and GitHub issue forms (bug report + feature request). The PR template's checklist mirrors the `CLAUDE.md` standards (Conventional Commit, lint, typecheck, test, changelog).
- **Automated dependency updates (Dependabot):** Added `.github/dependabot.yml` for the pnpm workspace/catalog (`npm`) and GitHub Actions, on a weekly schedule. Minor/patch bumps are grouped into a single PR (majors stay individual) with Conventional-Commit prefixes, replacing the recurring manual "bump everything" commits.
- **`@repo/analytics` package (key-gated PostHog):** Added a shared analytics package exposing an `AnalyticsProvider` (plus `usePostHog`/`posthog` re-exports). The provider mounts PostHog **only when an API key is present**, so with no key it's skipped entirely and `usePostHog()` cleanly no-ops — keeping local/CI runs silent. Consumed by both `apps/www` (in `layout.tsx`) and `apps/app` (in `main.tsx`), each passing its own typed env. Documented `NEXT_PUBLIC_POSTHOG_KEY` / `VITE_POSTHOG_KEY` (and optional `*_POSTHOG_HOST`, default `https://us.i.posthog.com`) in `.env.example` and the env schemas. Makes product analytics a first-class peer to the existing Vercel Analytics.
- **Typed, validated environment variables (`@t3-oss/env`):** Added `apps/www/env.ts` (`@t3-oss/env-nextjs`) and `apps/app/src/env.ts` (`@t3-oss/env-core`) so env is parsed and typed at startup/build instead of read as raw `process.env` / `import.meta.env`. `www` now imports `env` in `ConvexClientProvider`, `page.tsx`, and `proxy.ts`; `NEXT_PUBLIC_CONVEX_URL` is required (removing the silent `?? ""` fallback that masked a missing URL), while Clerk vars stay optional. The Vite app's vars are optional for now (not yet consumed) — tighten `VITE_CONVEX_URL` to required once a Convex provider is wired in. Set `SKIP_ENV_VALIDATION=1` to bypass validation for env-less build steps.

### Changed
- **Bumped `engines.node` to `>=24`** (was `>=20`) to align with the toolchain and the planned Portless requirement.
- **`@repo/api` exports TS source via an `exports` map:** Added `"exports": { ".": "./index.ts" }` and removed the `build: tsc` script, matching `@repo/ui`. Deleted the stale committed `index.js` / `index.d.ts` / `index.d.ts.map` (build artifacts that predated the package's `noEmit` config and could shadow imports) and gitignored them. Also removes the spurious "no output files for `@repo/api#build`" Turbo warning.
- **Storybook a11y is now blocking:** Changed `packages/ui/.storybook/preview.ts` `a11y.test` from `"todo"` (report-only) to `"error"`, so accessibility violations fail the UI test run. The existing stories already pass clean.

### Fixed
- **Convex deploy wrapper for the Vite app:** Added `apps/app/vercel.json` mirroring the Next app's — `convex deploy --cmd "turbo build --filter=app"` with `--cmd-url-env-var-name VITE_CONVEX_URL` and `turbo-ignore app`. Previously only `apps/www` had a deploy wrapper, so a Vite app connected to Vercel ran a plain `vite build` and silently never deployed its Convex backend. Requires `CONVEX_DEPLOY_KEY` to be set in the Vercel project.
- **Biome config drift:** Migrated `biome.json` to the installed `2.5.0` schema (was pinned to `2.4.15`) and replaced the deprecated `linter.rules.recommended: true` with `preset: "recommended"`. Excluded static `*.svg` assets from linting — the `noSvgWithoutTitle` a11y rule is meant for inline JSX, not vendored image files, and was firing on framework boilerplate once the config deserialized cleanly.

## [2.3.0] - 2026-06-17

### Added
- **CLAUDE.md symlink:** Added `CLAUDE.md` as a symlink to `AGENTS.md` so Claude Code automatically picks up agent instructions from the same file.

### Changed
- **Dependency Upgrade:** Bumped all monorepo dependencies to latest versions — `@biomejs/biome` (2.4.15 → 2.5.0), `convex` (1.39.1 → 1.41.0), `react`/`react-dom` (19.2.6 → 19.2.7), `tailwindcss`/`@tailwindcss/postcss` (4.3.0 → 4.3.1), `storybook` and all addons (10.4.0 → 10.4.6), `@clerk/nextjs` (7.3.7 → 7.5.3), `lucide-react` (1.16.0 → 1.20.0), `next` (16.2.6 → 16.2.9), `vite` (8.0.13 → 8.0.16), `playwright`/`@playwright/test` (1.60.0 → 1.61.0), `vitest` and related (4.1.7 → 4.1.9), and other minor bumps.

## [2.2.0] - 2026-05-26

### Added
- **GitLab CI/CD Setup:** Added `.gitlab-ci.yml` configuring automated deployment to a self-hosted Docker runner.
- **Docker Compose Stack:** Added `docker-compose.yml` defining the Next.js app (`apps/www`), a local self-hosted Convex backend (`convex-backend`), and a Tailscale sidecar.
- **Next.js Standalone Dockerfile:** Added `apps/www/Dockerfile` using multi-stage builds and Next.js standalone mode.
- **Tailscale Sidecar configuration:** Configured automated Tailscale serving for the Next.js app on port 443 and TCP port forwarding to Convex backend on port 3210.
- **Convex Standalone Mode:** Updated `apps/www/next.config.ts` to output in standalone mode for optimized Docker builds.

### Changed
- **Optional Clerk Authentication:** Configured Clerk authentication to be completely optional. When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not defined, Clerk providers and components will be bypassed, rendering only a standard non-authenticated Convex UI.

### Fixed
- **TypeScript Error in Convex Auth:** Added a local declaration for `process` in `packages/api/convex/auth.config.ts` to resolve `Cannot find name 'process'` compiler errors during local development check.
- **GitLab CI/CD Container Health Check:** Simplified the "wait for healthy" loop in `.gitlab-ci.yml` to directly reference the container name `convex-backend` instead of dynamically calling `docker compose ps -q`, resolving an issue where `docker inspect` failed with an empty argument error.

## [2.1.0] - 2026-03-17

### Changed
- **Dependency Upgrade:** Bumped dependencies across the monorepo to the latest available versions, including `@clerk/nextjs` (v6 → v7), `vite` (v7 → v8), `@biomejs/biome` (v2.4.7), and others.
- Refactored `apps/www/app/page.tsx` to use the new `<Show>` component from Clerk v7, replacing deprecated `<SignedIn>` and `<SignedOut>` components.

## [2.0.0] - 2026-02-26

### Summary
Major monorepo restructuring: dropped React Native/Expo in favor of Capacitor-ready Vite app, split web presence into marketing site (www) and app (app).

### Added
- New `apps/app` — Vite + React + SWC + TypeScript SPA with service worker, fixed dev port 5173, and Tailwind CSS v4. Ready for Capacitor native builds.

### Changed
- **Renamed** `apps/web` → `apps/www` for marketing/landing pages (Next.js).
- **Removed** service worker from `apps/www` (push notifications moved to `apps/app`).
- **Dependency Upgrade:** Updated all core packages — Next.js 16.1.6, Convex 1.32.0, Tailwind CSS 4.2.1, Storybook 10.2.13, Playwright 1.58.2, Clerk 6.38.2, Base UI 1.2.0, Lucide 0.575.0, Biome 2.4.4.

### Removed
- `apps/native` (Expo/React Native app) — replaced by Capacitor strategy via `apps/app`.

## [1.0.0] - 2026-01-20

### Summary
TurboStack 1.0.0: A premium, production-ready monorepo for building type-safe applications with Next.js, Expo, Convex, and Clerk. Standardized on Tailwind v4, shadcn/ui, Base UI primitives, and the Biome toolchain.

### Added
- Feature cards for Biome Toolchain and Vercel Analytics Ready on the landing page.
- Comprehensive `AGENTS.md` guidelines for development standards.

### Changed
- **Version Upgrade:** Bumped all core packages to version `1.0.0`.
- **Dependency Refresh:** Updated all dependencies to their latest stable versions (Next.js 16, Convex 1.17+, Lucide 0.469+).
- **Tooling:** Replaced ESLint/Prettier with Biome for 25x faster linting and formatting.
- **UI Architecture:** Standardized on `shadcn/ui` and `Base UI`. Explicitly removed `Radix UI` primitives in favor of `Base UI`.
- **Documentation:** Complete overhaul of `README.md` and project metadata.
