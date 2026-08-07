/**
 * Rebuilds the e2e world from `./fixture.ts`.
 *
 * Two **internal** mutations, driven by `apps/e2e/fixtures/global-setup.ts`:
 *
 *   reset — deletes every row the seed owns, one page at a time. Reports
 *           whether it finished, so the caller loops rather than risking one
 *           oversized transaction.
 *   apply — writes the whole fixture in a single transaction and returns a
 *           manifest mapping fixture slugs to the ids they were written as.
 *           Atomic: a fixture that fails validation leaves the database exactly
 *           as it was.
 *
 * They are `internalMutation` rather than `mutation` on purpose. These wipe the
 * database; exposing them as public functions would put "delete everything" on
 * the public API of any app built from this template. The suite reaches them
 * with the local backend's admin key instead — see `apps/e2e/local-backend.ts`.
 *
 * THIS IS DESTRUCTIVE. It is only ever pointed at the local backend, and
 * `assertLocalBackendIdentity` runs before it to prove that backend is this
 * project's and not another one that happened to claim the port.
 */

import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { internalMutation, internalQuery } from "../../_generated/server";
import { SEED_MESSAGES } from "./fixture";

/**
 * Identity probe for `assertLocalBackendIdentity`, and the only reliable half
 * of it.
 *
 * Comparing `/instance_name` against `config.json` catches a *named* local
 * deployment (`local-<team>-<project>`), but this repo provisions an anonymous
 * one, and the Convex CLI names every anonymous agent-mode deployment
 * `anonymous-agent`. Two projects using this template on one machine would
 * therefore agree on the name while being entirely different databases.
 *
 * Reaching this function proves two things a name cannot:
 *   - the caller's admin key was accepted, and admin keys are per-deployment;
 *   - this project's own code is what is deployed there.
 *
 * It is an `internalQuery`, so it is unreachable from the public API and reads
 * nothing.
 */
export const ping = internalQuery({
  args: {},
  returns: v.literal("turbostack-e2e"),
  handler: async () => "turbostack-e2e" as const,
});

/**
 * Every table the fixture owns. `reset` clears these and nothing else.
 *
 * Add a table here the moment the fixture starts writing to it — a table that
 * is written but never reset accumulates across runs, and the first symptom is
 * a duplicate-row assertion failing in a test that looks unrelated.
 */
const SEEDED_TABLES = ["messages"] as const;

/** Bounded so a large table cannot blow the transaction limit in one call. */
const RESET_PAGE_SIZE = 200;

export const reset = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number(), done: v.boolean() }),
  handler: async (ctx) => {
    let deleted = 0;
    let done = true;

    for (const table of SEEDED_TABLES) {
      // `.take()` rather than `.collect()`: the point of paging is to never
      // load an unbounded table into one transaction.
      const page = await ctx.db.query(table).take(RESET_PAGE_SIZE);
      for (const doc of page) {
        await ctx.db.delete(doc._id);
        deleted += 1;
      }
      if (page.length === RESET_PAGE_SIZE) done = false;
    }

    return { deleted, done };
  },
});

export const apply = internalMutation({
  args: {},
  returns: v.object({ messages: v.record(v.string(), v.id("messages")) }),
  handler: async (ctx) => {
    const messages: Record<string, Id<"messages">> = {};

    for (const message of SEED_MESSAGES) {
      messages[message.slug] = await ctx.db.insert("messages", {
        author: message.author,
        body: message.body,
      });
    }

    return { messages };
  },
});
