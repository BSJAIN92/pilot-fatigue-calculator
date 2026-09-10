import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  anonymousUsers: defineTable({
    anonymousId: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    visitCount: v.number(),
  }).index("by_anonymous_id", ["anonymousId"]),

  activityEvents: defineTable({
    anonymousId: v.string(),
    sessionId: v.string(),
    event: v.string(),
    page: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_anonymous_id", ["anonymousId"])
    .index("by_event", ["event"])
    .index("by_created_at", ["createdAt"]),
});
