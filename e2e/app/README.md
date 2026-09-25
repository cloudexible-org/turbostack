# e2e-app

Playwright suite for the Vite app (`apps/app`).

```bash
pnpm test:e2e:app                          # from the repo root
E2E_CONVEX=0 pnpm test:e2e:app             # without the Convex backend (as CI)
pnpm --filter e2e-app test:ui              # interactive
pnpm --filter @repo/e2e-kit convex:local   # just the backend, for poking at data
```

| Project | Specs | Runs against |
|---|---|---|
| `app` | `specs/app/` | a placeholder Convex URL — static chrome only |
| `app-convex` | `specs/app-convex/` | this checkout's local Convex backend, reseeded from `packages/api/convex/seed/e2e/fixture.ts` |

This package holds only specs. The servers, the Convex backend and its seed,
and the page objects come from `packages/e2e-kit` (`defineAppSuite`,
`@repo/e2e-kit/page-objects`), which other suites driving `apps/app` share.

Every run boots its own anonymous local Convex backend on ports the OS hands
it, so the suite is safe to run alongside `pnpm dev` and from several git
worktrees at once; each worktree keeps its own database. A second run in the
*same* checkout — of this suite, or of any other suite that seeds the database
— is refused, since it would wipe this run's seed. Read
`docs/e2e-architecture.md` §1a and §1c before touching
`packages/e2e-kit/src/convex/` — seeding wipes the database it is pointed at.
