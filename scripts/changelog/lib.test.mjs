import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assertFragmentName,
  compileFragments,
  mayEditChangelog,
  parseFragment,
  release,
} from "./lib.mjs";

const CHANGELOG = `# Changelog

Preamble.

## [4.8.1] - 2026-09-28

### Changed
- Old entry.
`;

describe("assertFragmentName", () => {
  test("accepts a dated kebab-case name", () => {
    assertFragmentName("2026-10-01-feat-group-threads.md");
  });

  for (const name of [
    "feat-group-threads.md",
    "2026-10-01_feat.md",
    "2026-10-01-Feat.md",
    "2026-10-01-feat.txt",
    "2026-10-01-.md",
  ]) {
    test(`refuses ${name}`, () => {
      assert.throws(() => assertFragmentName(name), /fragment names are/);
    });
  }
});

describe("parseFragment", () => {
  test("keeps each section's entries verbatim, sub-bullets included", () => {
    const sections = parseFragment(
      "### Added\n- **A.** One.\n  - Detail.\n\n  More.\n\n### Fixed\n- B.\n",
      "f.md",
    );
    assert.deepEqual([...sections.keys()], ["Added", "Fixed"]);
    assert.equal(
      sections.get("Added"),
      "- **A.** One.\n  - Detail.\n\n  More.",
    );
    assert.equal(sections.get("Fixed"), "- B.");
  });

  test("refuses an unknown section", () => {
    assert.throws(
      () => parseFragment("### Improved\n- A.\n", "f.md"),
      /unknown section "Improved"/,
    );
  });

  test("refuses other heading levels", () => {
    assert.throws(
      () => parseFragment("## [Unreleased]\n### Added\n- A.\n", "f.md"),
      /only "### <Section>" headings/,
    );
  });

  test("refuses text before the first heading", () => {
    assert.throws(
      () => parseFragment("A note.\n### Added\n- A.\n", "f.md"),
      /text before the first/,
    );
  });

  test("refuses a section twice, an empty section and an empty file", () => {
    assert.throws(
      () => parseFragment("### Added\n- A.\n### Added\n- B.\n", "f.md"),
      /appears twice/,
    );
    assert.throws(
      () => parseFragment("### Added\n\n### Fixed\n- B.\n", "f.md"),
      /needs at least one "- " entry/,
    );
    assert.throws(() => parseFragment("\n", "f.md"), /empty/);
  });
});

describe("compileFragments", () => {
  test("groups by section in Keep a Changelog order, newest fragment first", () => {
    const body = compileFragments([
      { name: "2026-09-30-b.md", text: "### Fixed\n- Old fix.\n" },
      { name: "2026-10-01-z.md", text: "### Fixed\n- New fix.\n" },
      {
        name: "2026-10-01-a.md",
        text: "### Added\n- New.\n### Fixed\n- A fix.\n",
      },
    ]);
    assert.equal(
      body,
      "### Added\n- New.\n\n### Fixed\n- A fix.\n- New fix.\n- Old fix.\n",
    );
  });

  test("is empty without fragments", () => {
    assert.equal(compileFragments([]), "");
  });

  test("names the fragment that is wrong", () => {
    assert.throws(
      () =>
        compileFragments([
          { name: "2026-10-01-a.md", text: "- No heading.\n" },
        ]),
      /2026-10-01-a\.md: text before/,
    );
  });
});

describe("release", () => {
  const fragments = [{ name: "2026-10-01-a.md", text: "### Added\n- New.\n" }];

  test("puts the release above the newest one, below the preamble", () => {
    assert.equal(
      release(CHANGELOG, fragments, { version: "4.9.0", date: "2026-10-02" }),
      `# Changelog

Preamble.

## [4.9.0] - 2026-10-02

### Added
- New.

## [4.8.1] - 2026-09-28

### Changed
- Old entry.
`,
    );
  });

  test("refuses a bad version or date, a repeat, and nothing to release", () => {
    const at = { version: "4.9.0", date: "2026-10-02" };
    assert.throws(
      () => release(CHANGELOG, fragments, { ...at, version: "v4.9" }),
      /not a version/,
    );
    assert.throws(
      () => release(CHANGELOG, fragments, { ...at, date: "2 Oct" }),
      /not a date/,
    );
    assert.throws(
      () => release(CHANGELOG, fragments, { ...at, version: "4.8.1" }),
      /already has/,
    );
    assert.throws(() => release(CHANGELOG, [], at), /no fragments/);
  });

  test("is not fooled by an entry that mentions a heading", () => {
    const mentions = CHANGELOG.replace(
      "- Old entry.",
      "- Renames `## [Unreleased]` and `## [4.9.0]` in this file.",
    );
    assert.match(
      release(mentions, fragments, { version: "4.9.0", date: "2026-10-02" }),
      /^## \[4\.9\.0\] - 2026-10-02$/m,
    );
  });

  test("refuses while the changelog still has an [Unreleased] section", () => {
    assert.throws(
      () =>
        release(
          CHANGELOG.replace("## [4.8.1]", "## [Unreleased]\n\n## [4.8.1]"),
          fragments,
          {
            version: "4.9.0",
            date: "2026-10-02",
          },
        ),
      /\[Unreleased\] section/,
    );
  });
});

describe("mayEditChangelog", () => {
  test("only a release branch edits it on main", () => {
    assert.equal(
      mayEditChangelog({ baseRef: "main", headRef: "feat/x" }),
      false,
    );
    assert.equal(
      mayEditChangelog({ baseRef: "main", headRef: "claude/x" }),
      false,
    );
    assert.equal(
      mayEditChangelog({ baseRef: "main", headRef: "release/4.9.0" }),
      true,
    );
  });

  test("leaves PRs into other branches to the PR that reaches main", () => {
    assert.equal(
      mayEditChangelog({ baseRef: "feat/stack-base", headRef: "feat/x" }),
      true,
    );
  });
});
