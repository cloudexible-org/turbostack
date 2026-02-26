# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
