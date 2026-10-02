#!/usr/bin/env node
/**
 * Changelog fragments (see `lib.mjs` and `docs/changelog.d/README.md`).
 *
 * Usage:
 *   node scripts/changelog/cli.mjs check
 *     Validates every fragment. Part of `pnpm lint`.
 *   node scripts/changelog/cli.mjs check --pr <diff-base>
 *     Also fails a PR into `main` that edits docs/changelog.md, unless it is a
 *     `release/*` branch. Reads GITHUB_BASE_REF / GITHUB_HEAD_REF (CI).
 *   node scripts/changelog/cli.mjs preview
 *     Prints what the next release will list.
 *   node scripts/changelog/cli.mjs release <version> [--date YYYY-MM-DD] [--only <fragment>...]
 *     Writes the fragments into docs/changelog.md as `## [<version>] - <date>`
 *     and deletes them. `--only` releases just those fragments (a hotfix).
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFragmentName,
  compileFragments,
  mayEditChangelog,
  parseFragment,
  release,
} from "./lib.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CHANGELOG = join(ROOT, "docs/changelog.md");
const FRAGMENTS = join(ROOT, "docs/changelog.d");

/** @param {string[]} [only] fragment paths or names; all when omitted */
function readFragments(only) {
  const names = only?.length
    ? only.map((path) => basename(path))
    : readdirSync(FRAGMENTS).filter(
        (name) => name.endsWith(".md") && name !== "README.md",
      );
  return names.map((name) => {
    const path = join(FRAGMENTS, name);
    if (!existsSync(path)) throw new Error(`${name}: not in docs/changelog.d/`);
    return { name, path, text: readFileSync(path, "utf8") };
  });
}

/** @param {string[]} args */
function check(args) {
  const errors = [];
  const fragments = readFragments();
  for (const { name, text } of fragments) {
    try {
      assertFragmentName(name);
      parseFragment(text, name);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const prIndex = args.indexOf("--pr");
  if (prIndex !== -1) {
    const diffBase = args[prIndex + 1];
    if (!diffBase) throw new Error("--pr needs the commit to diff against");
    const baseRef = process.env.GITHUB_BASE_REF ?? "";
    const headRef = process.env.GITHUB_HEAD_REF ?? "";
    const changed = execFileSync(
      "git",
      ["diff", "--name-only", diffBase, "HEAD"],
      { cwd: ROOT, encoding: "utf8" },
    ).split("\n");
    if (
      changed.includes("docs/changelog.md") &&
      !mayEditChangelog({ baseRef, headRef })
    ) {
      errors.push(
        "docs/changelog.md is only edited by a release. Put this change's entry in a fragment instead: docs/changelog.d/README.md",
      );
    }
  }

  if (errors.length) {
    console.error(
      `Changelog check failed:\n${errors.map((e) => `  ${e}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(`Changelog: ${fragments.length} fragment(s) OK.`);
}

function preview() {
  const body = compileFragments(readFragments());
  console.log(body || "No unreleased changes in docs/changelog.d/.");
}

/** @param {string[]} args */
function cut(args) {
  const version = args[0];
  if (!version || version.startsWith("--")) {
    throw new Error(
      "usage: release <version> [--date YYYY-MM-DD] [--only <fragment>...]",
    );
  }
  const dateIndex = args.indexOf("--date");
  const date =
    dateIndex === -1
      ? new Date().toISOString().slice(0, 10)
      : (args[dateIndex + 1] ?? "");
  const onlyIndex = args.indexOf("--only");
  /** @type {string[] | undefined} */
  let only;
  if (onlyIndex !== -1) {
    // Every argument up to the next flag.
    const rest = args.slice(onlyIndex + 1);
    const end = rest.findIndex((arg) => arg.startsWith("--"));
    only = end === -1 ? rest : rest.slice(0, end);
  }
  if (onlyIndex !== -1 && !only?.length) {
    throw new Error("--only needs at least one fragment");
  }

  const fragments = readFragments(only);
  const next = release(readFileSync(CHANGELOG, "utf8"), fragments, {
    version,
    date,
  });
  writeFileSync(CHANGELOG, next);
  for (const { path } of fragments) rmSync(path);
  console.log(
    `Released ${fragments.length} fragment(s) as ${version} - ${date}. Commit docs/changelog.md and the deleted fragments.`,
  );
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "check") check(args);
  else if (command === "preview") preview();
  else if (command === "release") cut(args);
  else {
    console.error("usage: cli.mjs <check|preview|release> …");
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
