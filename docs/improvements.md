# TurboStack Improvements

A checklist of upgrades
## A. Promote into the base template

### A1. Portless named local URLs
Each app gets a stable HTTPS `.localhost` URL instead of a bare port.

- Add `portless` as a **root** dev dependency.
- Each app wraps its own `dev` script in named mode; the root `dev` stays `turbo dev --ui tui`
  so Turbo orchestrates (preserving the TUI) while Portless registers one route per app:
  - Vite app → `portless app.<project> --app-port 5173 vite`
  - Next app → `portless www.<project> next dev` (Next picks up Portless's injected `PORT`)
  - Storybook → `portless storybook.<project> --app-port 6006 storybook dev -p 6006`
- **Gotchas already paid for (bake these in as defaults + comments):**
  - Vite must bind `host: "127.0.0.1"` in `vite.config.ts`. It otherwise defaults to IPv6
    `[::1]`, which the IPv4-targeting Portless proxy can't reach → 502.
  - Apps with hardcoded ports (Vite `strictPort: 5173`, Storybook `-p 6006`) must pin
    `--app-port` to match.
  - e2e/CI must bypass the proxy: run the dev server as `PORTLESS=skip pnpm --filter app dev`.
  - The Convex package keeps a plain `convex dev` — no Portless wrapper.
- **Requires Node 24+** — see [B4](#b4-node-version-pinning--alignment).

### A2. PostHog analytics as an optional, key-gated package
Today it lives only in `apps/app/src/main.tsx`. Promote to a shared `@repo/analytics` package.

- Provider mounts **only if** the public key env var is present; absent key → provider isn't
  mounted at all, so `usePostHog()` cleanly no-ops (keeps local/CI runs silent).
- Document `*_PUBLIC_POSTHOG_KEY` and `*_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`)
  in `.env.example`.
- Consume from both `apps/app` and `apps/www`.
- Keep the "diff state across transitions in a hook, not in the reducer" pattern for custom
  events so business logic stays side-effect-free.
- The base already advertises "Vercel Analytics Ready" — make product analytics a first-class peer.

### A3. Convex-deploy-on-Vercel wiring for *both* app types
This project shipped a bug where only `apps/www` had the deploy wrapper, so the connected Vite
project ran a plain `vite build` and the Convex backend silently never deployed — production
drifted from `packages/api/convex`.

- Ship a correct `vercel.json` for **both** the Next and Vite templates:
  - Build: `convex deploy --cmd "turbo build --filter=<app>"`
  - Inject the prod URL via `--cmd-url-env-var-name` (`NEXT_PUBLIC_CONVEX_URL` for Next,
    `VITE_CONVEX_URL` for Vite).
  - Ignore command: `turbo-ignore <app>`.
- Document that `CONVEX_DEPLOY_KEY` must be set in the Vercel project.

### A4. `@repo/api` exposes TypeScript source via an `exports` map
No committed `index.js` / `index.d.ts` build artifacts (this project had to delete stale ones
that broke imports). Start clean: `@repo/api` exports its TS source directly, matching `@repo/ui`.

### A5. Base `.claude/` config committed
Ship a committed `.claude/settings.json` so every new project starts with sensible tool
permissions (`pnpm exec`, `npx turbo`, Biome, etc.) and the `CLAUDE.md` → `AGENTS.md` symlink
already wired — instead of re-curating `settings.local.json` per repo.

---

## B. Gaps to add (net-new)

### B1. GitHub Actions CI
Only `.gitlab-ci.yml` exists today; there's no `.github/`. Most new projects start on GitHub.

- Add `.github/workflows/ci.yml` running `lint → typecheck → unit → e2e → build`.
- Wire Turbo remote caching.

### B2. Git hooks for the standards `CLAUDE.md` already mandates
`CLAUDE.md` requires Conventional Commits and "run Biome before marking complete," but nothing
enforces it.

- Add **lefthook** (pnpm-friendly): pre-commit Biome on staged files + `commit-msg` commitlint.
- Makes the documented rules automatic instead of aspirational.

### B3. A dedicated `typecheck` task in `turbo.json`
The base has `build / lint / test / dev` but no `tsc --noEmit` task — type errors only surface
at build time.

- Add a `typecheck` task and wire it into CI ([B1](#b1-github-actions-ci)) and hooks ([B2](#b2-git-hooks-for-the-standards-claudemd-already-mandates)).

### B4. Node version pinning & alignment
`engines.node` is `>=20`, but Portless requires **24+**, and there's no `.nvmrc`. These
contradict each other.

- Add `.nvmrc` / `.node-version` pinned to `24`.
- Bump `engines.node` to `>=24`.

### B5. `only-allow pnpm` preinstall guard
`CLAUDE.md` says "always use pnpm" but nothing blocks `npm install` / `yarn`.

- Add a one-line `preinstall` script (`npx only-allow pnpm`) to enforce it.

### B6. Typed, validated env
Both apps read raw `import.meta.env` / `process.env`. Missing or typo'd vars fail as runtime
`undefined` instead of at startup.

- Add a tiny env-schema module (e.g. `@t3-oss/env` + `zod`; `www` already depends on `zod`)
  so env is validated and typed.

### B7. Automated dependency updates
The changelog shows recurring manual "bump everything" commits.

- Add **Renovate** or **Dependabot**. The pnpm catalog means most updates land in one place.

### B8. Repo hygiene files
`CODEOWNERS`, a PR template, and issue templates are absent. Cheap, and every repo wants them.

---

## C. Optional / nice-to-have

- **Error monitoring (Sentry).** Natural companion to PostHog — analytics is wired, error
  tracking isn't.
- **Storybook a11y enforcing.** The a11y + Chromatic + vitest-browser addons are installed, but
  a11y is set to `"todo"` (non-blocking). Default it to `"error"` so accessibility regressions
  fail — the UI library is a core package.
- **Pin the Biome `$schema` version to the catalog.** `biome.json` references `2.4.15` while the
  catalog pins `^2.5.0`; add a script (or just keep them synced) to avoid drift.

---

## Suggested first pass

The four highest-leverage items — they close the biggest gap between what `CLAUDE.md` promises
and what's actually enforced, and benefit every new project regardless of what it builds:

1. **A1** — Portless named local URLs
2. **B1** — GitHub Actions CI
3. **B2** — lefthook + commitlint
4. **B3** — `typecheck` turbo task
