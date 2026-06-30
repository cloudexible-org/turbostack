import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List the most recent messages (newest first).
 *
 * A small demo function so the apps have a real, reactive query to call.
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      author: v.string(),
      body: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("messages").order("desc").take(50);
  },
});

/** Append a message. Returns the new document id. */
export const send = mutation({
  args: {
    author: v.string(),
    body: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      author: args.author,
      body: args.body,
    });
  },
});
