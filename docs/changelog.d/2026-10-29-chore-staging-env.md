### Added
- **Staging environment:** `main` now deploys to each Vercel project's `staging` custom environment through `.github/workflows/deploy-staging.yml`, which uses the Vercel CLI with a `git archive` of the commit so commits by authors outside the Vercel team (such as @cloudexible-juno) deploy too. It deploys only the apps a push affects, and reads the `VERCEL_TOKEN` secret and the `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_APP` and `VERCEL_PROJECT_ID_WWW` repository variables, so the template carries no IDs; until they are set, it skips with a notice instead of failing. Staging runs on a dev-type Convex `staging` deployment and shares the Clerk development instance with local dev. `docs/infrastructure.md` documents the branches, environments and variables, and how to set staging up; the forking checklist in `AGENTS.md` points to it. *Why:* changes can be tested on a deployed environment before they reach production, the way AssistLine and Sannaii already work.

### Changed
- **Production deploys from `prod`, not `main`:** `apps/app/vercel.json` and `apps/www/vercel.json` enable Git deployments only for `prod`. You promote to production by opening a PR from `main` into `prod`.

### Fixed
- **Installs without a `.git`:** the root `prepare` script skips `lefthook install` outside a git repository, so a build from a `git archive` (as the staging workflow uploads) no longer fails at `pnpm install`.
