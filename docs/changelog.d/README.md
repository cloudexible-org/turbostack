# Changelog fragments

Each change records its changelog entry here, in a file of its own, instead
of in `docs/changelog.md`. When every PR added its entry at the top of
`## [Unreleased]`, any two open PRs conflicted on that line. Two PRs never
add the same file, so fragments cannot conflict.

## Adding one

Create `docs/changelog.d/<YYYY-MM-DD>-<slug>.md`: today's date, then your
branch name in kebab case (`2026-10-01-feat-group-threads.md`). The date
orders the release, newest first.

Write what you would have added to the changelog: one or more Keep a
Changelog headings, each followed by its `- ` entries.

```md
### Added
- **Group threads (`apps/app`, `packages/api`):** A moderator can start a thread…

### Fixed
- **The page no longer scrolls under a long thread list (`packages/ui`):** …
```

The allowed headings are `### Added`, `### Changed`, `### Deprecated`,
`### Removed`, `### Fixed` and `### Security`. Nothing else goes in the
file: no other headings, no text before the first one. Sub-bullets and
indented paragraphs inside an entry are kept as written.

To change an entry that hasn't been released, edit its fragment. A
follow-up fix to unreleased work can amend that fragment or add its own.

## Checking

- `pnpm lint` validates every fragment's name and format.
- `pnpm changelog:preview` prints what the next release will list.
- CI fails a PR into `main` that edits `docs/changelog.md`, unless its
  branch is `release/*` or the PR has the `changelog-edit` label (for
  example, to fix a typo in an entry that was already released).

## Releasing

A release is one PR into `main` from a `release/<version>` branch, cut from
an up-to-date `main`. Its single commit, `chore(release): v<version>`:

1. bumps `version` in the root `package.json` and every workspace package's
   `package.json` to `<version>`;
2. runs the release script, then commits `docs/changelog.md` and the deleted
   fragments with the bump:

   ```bash
   pnpm changelog:release 4.6.0
   ```

The script writes every fragment into `docs/changelog.md` as
`## [4.6.0] - <today>`, grouped by heading, and deletes them.
`--date YYYY-MM-DD` overrides the date. `--only <fragment>...` releases just
those fragments, for a patch release that should list only its fix while the
other fragments wait for the next full release.

This is the only PR into `main` that may edit `docs/changelog.md`. Projects
created from this template inherit the convention as is.

The script is `scripts/changelog/`, tested by `lib.test.mjs` (`pnpm test`).
