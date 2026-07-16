# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Motion and Lenis on the `www` landing page:** Added `motion` (^12.42.2) and `lenis` (^1.3.25) to `apps/www`, wired through a single `MotionProvider` client boundary (`components/motion-provider.tsx`) mounted in the root layout. Lenis runs in `root` mode so it eases the real document scroll and renders no wrapper element, which keeps the sticky nav working. *Why:* the landing page had no scroll-aware motion — the hero's `animate-in fade-in zoom-in` fired once on mount and the nine feature cards below the fold were fully painted before anyone saw them. Note the package is `motion`, not `framer-motion`: the library was renamed, and `motion/react` is the current import path.
- **Landing page rebuilt as a scrolling narrative:** Split the single `app/page.tsx` into composed sections under `components/landing/` — `Hero` (staggered entrance + scroll-linked parallax hand-off), `StackMarquee` (seamless looping strip of the 12 stack pieces), `Features` (staggered scroll reveal + per-card cursor spotlight), `Showcase` (terminal that types the three setup commands on entry), `Cta` (scroll-linked glow), and `SiteNav` (spring reading-progress bar, elevation on scroll). *Why:* the page was ~1.5 viewports of hero + grid + footer, which is too short for smooth scroll to be worth a library. It is now ~4 viewports (3004px against a 720px viewport), so Lenis has actual distance to smooth and the reveals have somewhere to land.

### Changed
- **`app/page.tsx` is a Server Component again:** the page-level `"use client"` is gone; only the section components that need hooks are client. *Why:* the directive was previously at the top of the whole page, so the entire tree — including static copy and the footer — shipped as client JS.
- **Reduced motion is handled centrally:** `MotionConfig reducedMotion="user"` in `MotionProvider` drops transform animations while keeping opacity fades for users who ask for it, and Lenis is skipped entirely for them, so no section branches on the media query itself. This replaces the previous `tailwindcss-animate` classes, which had no reduced-motion path at all.

### Fixed
- **`www` dev site now hydrates on its portless URL:** Added `allowedDevOrigins: ["*.turbostack.localhost"]` to `apps/www/next.config.ts`. *Why:* `pnpm dev` serves the app through portless at `https://www.turbostack.localhost`, but Next 16 blocks `/_next` dev resources from any origin not on that list, so it refused the HMR client (`⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "www.turbostack.localhost"` in the dev log). Static chunks still returned 200, so the page rendered HTML and then never hydrated — the theme toggle and Clerk buttons were silently inert on that URL. This predates the Motion work but was invisible while the page needed no JS to look correct; Motion SSRs `opacity: 0` and animates in on mount, which turned a dead client into a blank page. Dev-only — Next ignores the setting in production builds, so Vercel is unaffected.

## [4.0.0] - 2026-07-16

### Added
- **CI builds on every run:** Added a `Build` step to `.github/workflows/ci.yml` (job renamed `lint · typecheck` → `lint · typecheck · build`). *Why:* `typecheck` alone can pass while the build is broken — `tsc` is a standalone binary, but Next drives the TypeScript compiler API programmatically, so a compiler that fails to load leaves `typecheck` green and breaks `next build`. Verified by A/B in a clean worktree: with the catalog temporarily set to `typescript@7.0.2`, `pnpm typecheck` exits 0 while `pnpm build` exits 1 (`The "id" argument must be of type string. Received undefined`). The step sets `NEXT_PUBLIC_CONVEX_URL` to a placeholder — `apps/www` validates env at build time and requires a well-formed URL, but only the shape matters since prerendering never connects. No real secrets are needed; every other var the apps read is optional. Branch protection was checked first (none configured), so the job rename doesn't silently un-gate merges.
- **`typecheck` for `apps/e2e`:** Added `apps/e2e/tsconfig.json` (extending `@repo/config/base.json`, with explicit `"types": ["node"]` for `process.env` in `playwright.config.ts`) and a `typecheck` script, plus the missing `@repo/config` dev dependency. *Why:* the package had real TypeScript (`playwright.config.ts`, `specs/`, `page-objects/`) and a `typescript` dependency but no tsconfig at all, so Turbo had nothing to run and the whole package went unchecked. `pnpm typecheck` now covers 6 packages instead of 5; the existing sources pass clean with no errors to triage.
- **Turbo Remote Caching in CI:** Wired `TURBO_TOKEN` / `TURBO_TEAM` into `.github/workflows/ci.yml` so CI shares a remote cache with Vercel builds. Both are optional — Turbo falls back to local cache when unset. To enable: add a `TURBO_TOKEN` repo secret (Vercel access token) and a `TURBO_TEAM` repo variable (Vercel team slug).
- **Vite app wired to the Convex stack:** Replaced the default Vite counter boilerplate in `apps/app` with a live Convex demo — a `messages` schema table with `list`/`send` functions (`packages/api/convex/messages.ts`), a `ConvexProvider` mounted in `main.tsx` from the typed env, and `App.tsx` showing a reactive query + mutation. Added `convex` as an app dependency and tightened `VITE_CONVEX_URL` to required (it now backs the Convex client). The app was previously a deployed-but-empty SPA that used none of the stack.

### Changed
- **README refresh:** Updated `README.md` for the current state — Clerk shown as optional, PostHog analytics and `packages/analytics` added, Portless dev URLs, typed env, git hooks, and CI documented; expanded the dev-workflow commands (`typecheck`, `test`, `lint`/`format`); fixed the stale `apps/web` path (→ `apps/www`), the "Vite (Unit)" typo (→ Vitest), the Node version (→ 26), and the outdated "initial build will fail" deploy note.
- **Node 26:** Bumped `.nvmrc` / `.node-version` to `26` and `engines.node` to `>=26`, aligning the runtime with the `@types/node` 26 bump.

### Removed
- **Redundant Storybook Vitest setup:** Removed `packages/ui/.storybook/vitest.setup.ts` and its `setupFiles` reference. `@storybook/addon-vitest` applies preview annotations automatically since Storybook 10.3, so the manual `setProjectAnnotations` call only emitted a warning. a11y enforcement is unaffected (verified: a violating story still fails the test run).

### Fixed
- **`packages/config` no longer bypasses the TypeScript catalog:** Dropped the `typescript: "latest"` dev dependency from `packages/config`. *Why:* every other package uses `typescript: "catalog:"` (pinned `^6.0.3`, which cannot reach 7), but `packages/config` pinned `latest` — and because `latest` always "satisfies", Dependabot never opens a PR for it. The lockfile happened to hold it at `6.0.3`, so it was latent rather than live, but any lockfile regeneration or `pnpm update` would have silently resolved it to 7.x with no review. The package is JSON-only (it ships `base.json`, `nextjs.json`, `react-library.json`, has no scripts and zero `.ts` source), so it never invoked `tsc` and the dependency was dead weight — dropping it is preferable to aligning it to the catalog. TypeScript 7 remains unadoptable regardless: it is the native port and no longer ships the JS compiler API that Next needs, and both `convex-helpers` (peer `^5.5 || ^6.0.0`) and `tsconfck` (`^5.0.0`) explicitly exclude it.
- **`setup:envs` no longer reports success when it does nothing:** `scripts/setup.mjs` now threads a found-count through its recursion and exits 1 with an error when zero `.env.example` templates are found, instead of printing `✨ Setup complete!` and exiting 0. *Why:* purely defensive — the templates in this repo are named correctly and the script works, but the silent-success-on-zero flaw is what hid the same bug for months in a downstream app whose template was misnamed. Idempotency is unchanged: re-running with an existing `.env.local` still skips without overwriting and exits 0 (both paths tested).
- **Convex deploy no longer fails on missing `CLERK_JWT_ISSUER_DOMAIN`:** `packages/api/convex/auth.config.ts` now hardcodes `providers: []` and no longer references `process.env.CLERK_JWT_ISSUER_DOMAIN`. The [3.0.2] "Clerk truly optional" change did **not** actually fix the deploy failure — Convex requires every env var *referenced* by the auth config to be set on the target deployment, regardless of runtime `if`/ternary guards, so the bare `process.env.CLERK_JWT_ISSUER_DOMAIN` read still failed `convex deploy` on any deployment without the var (e.g. Vercel preview builds, including Dependabot PRs). Removing the reference makes deploys succeed everywhere. *Trade-off:* backend auth is now off unless you re-add the provider and set the env var — matching the app layer, which already ships with Clerk bypassed.

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
