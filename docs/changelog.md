# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **`typecheck` Turbo task:** Added a dedicated `tsc --noEmit` (`tsc -b` for the Vite app) `typecheck` script to `app`, `www`, `@repo/api`, and `@repo/ui`, a `typecheck` task in `turbo.json`, and a root `pnpm typecheck` passthrough — so type errors surface independently instead of only at build time.
- **Git hooks (lefthook + commitlint):** Added `lefthook.yml` and `commitlint.config.mjs` to enforce the standards already documented in `CLAUDE.md` — Biome runs on staged files at pre-commit, and commit messages are validated against Conventional Commits at commit-msg. Hooks install automatically via the root `prepare` script. *Why:* the rules were aspirational; nothing enforced them.
- **`only-allow pnpm` guard:** Added a `preinstall` script so `npm install` / `yarn` are rejected, enforcing the pnpm-only policy from `CLAUDE.md`.
- **Node version pinning:** Added `.nvmrc` and `.node-version` pinned to `24`.
- **GitHub Actions validation CI:** Added `.github/workflows/ci.yml` running `lint → typecheck` on pushes to `main` and on pull requests. No tests and no build/deploy — deployment stays with Vercel, and the existing `.gitlab-ci.yml` (self-hosted home server) is untouched. Tests are intentionally excluded from CI: the `@repo/ui` unit suite runs Storybook stories in a real browser, so it stays a local-only `pnpm test`.
- **Root `pnpm test` script:** Added `turbo test --filter=!e2e` so the default test run covers unit tests while excluding the Playwright e2e package (run that separately via `pnpm --filter e2e test`).
- **Repo hygiene files:** Added `.github/CODEOWNERS`, a pull request template, and GitHub issue forms (bug report + feature request). The PR template's checklist mirrors the `CLAUDE.md` standards (Conventional Commit, lint, typecheck, test, changelog).
- **Automated dependency updates (Dependabot):** Added `.github/dependabot.yml` for the pnpm workspace/catalog (`npm`) and GitHub Actions, on a weekly schedule. Minor/patch bumps are grouped into a single PR (majors stay individual) with Conventional-Commit prefixes, replacing the recurring manual "bump everything" commits.
- **Typed, validated environment variables (`@t3-oss/env`):** Added `apps/www/env.ts` (`@t3-oss/env-nextjs`) and `apps/app/src/env.ts` (`@t3-oss/env-core`) so env is parsed and typed at startup/build instead of read as raw `process.env` / `import.meta.env`. `www` now imports `env` in `ConvexClientProvider`, `page.tsx`, and `proxy.ts`; `NEXT_PUBLIC_CONVEX_URL` is required (removing the silent `?? ""` fallback that masked a missing URL), while Clerk vars stay optional. The Vite app's vars are optional for now (not yet consumed) — tighten `VITE_CONVEX_URL` to required once a Convex provider is wired in. Set `SKIP_ENV_VALIDATION=1` to bypass validation for env-less build steps.

### Changed
- **Bumped `engines.node` to `>=24`** (was `>=20`) to align with the toolchain and the planned Portless requirement.

### Fixed
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
