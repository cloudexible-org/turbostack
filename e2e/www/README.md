# e2e-www

Playwright suite for the Next.js marketing site (`apps/www`).

```bash
pnpm test:e2e:www                        # from the repo root
pnpm --filter e2e-www test:ui            # interactive
```

- **Specs:** `specs/` — static chrome and client-side behaviour only (motion,
  theme, scrolling). There is no backend; the Convex URL is a placeholder.
- **Page objects:** `packages/e2e-kit/src/page-objects/`
  (`@repo/e2e-kit/page-objects`), shared with any other suite driving www.
- **Server:** `defineWwwSuite` runs `next dev` on a free port, building into
  `apps/www/.next-e2e-www` so it never contends with `pnpm dev` — or another
  suite — for Next's dev lock.

Safe to run alongside `pnpm dev` and from several git worktrees at once; a
second run in the *same* checkout is refused. See `docs/e2e-architecture.md`,
§1b and §1c.
