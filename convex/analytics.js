import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const track = mutation({
  args: {
    anonymousId: v.string(),
    sessionId: v.string(),
    event: v.string(),
    page: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingUser = await ctx.db
      .query("anonymousUsers")
      .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        lastSeenAt: now,
        visitCount:
          existingUser.visitCount + (args.event === "page_view" ? 1 : 0),
      });
    } else {
      await ctx.db.insert("anonymousUsers", {
        anonymousId: args.anonymousId,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: args.event === "page_view" ? 1 : 0,
      });
    }

    await ctx.db.insert("activityEvents", {
      ...args,
      createdAt: now,
    });
  },
});
