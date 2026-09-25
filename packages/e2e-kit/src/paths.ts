/**
 * Where the things the harness drives live, resolved from this package rather
 * than from whichever suite is running — so a consumer at any depth (`e2e/app`,
 * a marketing suite, …) boots the same servers against the same directories.
 */

import * as path from "node:path";

export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

/** This package — `scripts/convex-local.mjs` lives under it. */
export const KIT_DIR = path.join(REPO_ROOT, "packages", "e2e-kit");

/** The Convex project root — `convex/` and `.convex/` live here. */
export const BACKEND_DIR = path.join(REPO_ROOT, "packages", "api");

export const APP_DIR = path.join(REPO_ROOT, "apps", "app");

export const WWW_DIR = path.join(REPO_ROOT, "apps", "www");
