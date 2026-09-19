# e2e-www

Playwright suite for the Next.js marketing site (`apps/www`).

```bash
pnpm test:e2e:www                        # from the repo root
pnpm --filter e2e-www test:ui            # interactive
```

- **Specs:** `specs/` — static chrome and client-side behaviour only (motion,
  theme, scrolling). There is no backend; the Convex URL is a placeholder.
- **Page objects:** `page-objects/`.
- **Server:** `next dev` on a free port, building into `apps/www/.next-e2e` so
  it never contends with `pnpm dev` for Next's dev lock.

Safe to run alongside `pnpm dev` and from several git worktrees at once; a
second run in the *same* checkout is refused. See `docs/e2e-architecture.md`,
§1b and §1c.
