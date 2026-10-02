/**
 * Changelog fragments: one file per change, gathered into `docs/changelog.md`
 * only when a release is cut.
 *
 * Every PR used to add its entry at the top of `## [Unreleased]`, the same
 * line every other open PR was adding to, so any two of them conflicted.
 * Now each change adds its own file to `docs/changelog.d/`, and no two PRs
 * touch the same file. See `docs/changelog.d/README.md` for the format.
 *
 * This module is pure (text in, text out) so it can be tested without a
 * repository; `cli.mjs` does the file system and git work.
 */

/** Keep a Changelog's sections, in the order a release lists them. */
export const SECTIONS = [
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
];

/** `2026-10-01-feat-group-threads.md`: the date orders a release's entries. */
const FRAGMENT_NAME = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_HEADING = /^## \[/m;

/**
 * Throws unless `name` is a fragment's file name.
 * @param {string} name
 */
export function assertFragmentName(name) {
  if (!FRAGMENT_NAME.test(name)) {
    throw new Error(
      `${name}: fragment names are <YYYY-MM-DD>-<kebab-slug>.md, e.g. 2026-10-01-feat-group-threads.md`,
    );
  }
}

/**
 * Splits a fragment into its sections. A fragment is what the change would
 * have added to the changelog: one or more `### <Section>` headings, each
 * followed by its `- ` entries.
 *
 * @param {string} text
 * @param {string} name the file name, for error messages
 * @returns {Map<string, string>} section → its entries, verbatim
 */
export function parseFragment(text, name) {
  /** @type {Map<string, string[]>} */
  const lines = new Map();
  /** @type {string | null} */
  let section = null;

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const heading = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (heading) {
      if (!line.startsWith("### ")) {
        throw new Error(
          `${name}: only "### <Section>" headings belong in a fragment; found "${line}"`,
        );
      }
      section = heading[1];
      if (!SECTIONS.includes(section)) {
        throw new Error(
          `${name}: unknown section "${section}"; use one of ${SECTIONS.join(", ")}`,
        );
      }
      if (lines.has(section)) {
        throw new Error(`${name}: "### ${section}" appears twice`);
      }
      lines.set(section, []);
      continue;
    }
    if (section === null) {
      if (line.trim() !== "") {
        throw new Error(
          `${name}: text before the first "### <Section>" heading`,
        );
      }
      continue;
    }
    lines.get(section)?.push(line);
  }

  /** @type {Map<string, string>} */
  const sections = new Map();
  for (const [heading, body] of lines) {
    const entries = body.join("\n").trim();
    if (!entries.startsWith("- ")) {
      throw new Error(
        `${name}: "### ${heading}" needs at least one "- " entry right under it`,
      );
    }
    sections.set(heading, entries);
  }
  if (sections.size === 0) {
    throw new Error(`${name}: empty; add a "### <Section>" and an entry`);
  }
  return sections;
}

/**
 * Newest first, as the changelog has always read; fragments from the same day
 * by name, so the order never depends on the file system.
 * @param {string} a
 * @param {string} b
 */
export function compareFragmentNames(a, b) {
  const byDate = b.slice(0, 10).localeCompare(a.slice(0, 10));
  return byDate !== 0 ? byDate : a.localeCompare(b);
}

/**
 * Gathers fragments into one block of `### <Section>` groups: what a release
 * puts under its version heading.
 *
 * @param {{ name: string, text: string }[]} fragments
 * @returns {string} the block, or "" when there are no fragments
 */
export function compileFragments(fragments) {
  /** @type {Map<string, string[]>} */
  const bySection = new Map(SECTIONS.map((section) => [section, []]));
  const sorted = [...fragments].sort((a, b) =>
    compareFragmentNames(a.name, b.name),
  );
  for (const { name, text } of sorted) {
    assertFragmentName(name);
    for (const [section, entries] of parseFragment(text, name)) {
      bySection.get(section)?.push(entries);
    }
  }
  return SECTIONS.filter((section) => bySection.get(section)?.length)
    .map((section) => `### ${section}\n${bySection.get(section)?.join("\n")}\n`)
    .join("\n");
}

/**
 * Inserts a `## ` block above the newest release, below the changelog's
 * preamble.
 * @param {string} changelog
 * @param {string} heading e.g. "[Unreleased]"
 * @param {string} body
 */
function insertAboveReleases(changelog, heading, body) {
  const block = `## ${heading}\n\n${body.trimEnd()}\n\n`;
  const match = VERSION_HEADING.exec(changelog);
  if (!match) return `${changelog.trimEnd()}\n\n${block}`;
  return changelog.slice(0, match.index) + block + changelog.slice(match.index);
}

/**
 * Whether a line starts with `prefix` (an entry may mention a heading).
 * @param {string} changelog
 * @param {string} prefix
 */
function hasHeading(changelog, prefix) {
  return changelog.split("\n").some((line) => line.startsWith(prefix));
}

/**
 * Releases the fragments as `## [<version>] - <date>`.
 *
 * @param {string} changelog
 * @param {{ name: string, text: string }[]} fragments
 * @param {{ version: string, date: string }} release
 * @returns {string} the new changelog
 */
export function release(changelog, fragments, { version, date }) {
  if (!VERSION.test(version)) {
    throw new Error(`"${version}" is not a version like 4.9.0`);
  }
  if (!DATE.test(date)) {
    throw new Error(`"${date}" is not a date like 2026-10-01`);
  }
  if (hasHeading(changelog, `## [${version}]`)) {
    throw new Error(`docs/changelog.md already has a ${version} release`);
  }
  if (hasHeading(changelog, "## [Unreleased]")) {
    throw new Error(
      "docs/changelog.md has an [Unreleased] section; move its entries into docs/changelog.d/ first",
    );
  }
  const body = compileFragments(fragments);
  if (!body) {
    throw new Error("docs/changelog.d/ has no fragments to release");
  }
  return insertAboveReleases(changelog, `[${version}] - ${date}`, body);
}

/**
 * Whether a PR may edit `docs/changelog.md` itself. Only a release does: its
 * `release/<version>` branch into `main`. Everything else adds a fragment.
 * PRs into other branches are left alone; whatever they carry is checked when
 * it reaches `main`.
 *
 * @param {{ baseRef: string, headRef: string }} pr
 */
export function mayEditChangelog({ baseRef, headRef }) {
  return baseRef !== "main" || headRef.startsWith("release/");
}
