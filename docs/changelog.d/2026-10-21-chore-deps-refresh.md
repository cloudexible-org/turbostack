### Changed
- Bumped every dependency to its latest release (consolidating Dependabot #35 and #39): `motion` 13 → 14, Biome 2.6, Next 16.4, Convex 1.47, Playwright 1.64, Storybook 10.6.3, Vitest 5.0.5, React 19.3.1 and the rest of the minor/patch set. `@types/node` stays on 24.x to match the pinned Node 24 runtime.
- Biome 2.6 starts formatting and linting Markdown and YAML; both are switched off in `biome.json` so this stays a version bump, and adopting them is left to its own change.
