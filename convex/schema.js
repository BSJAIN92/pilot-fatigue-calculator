import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  anonymousUsers: defineTable({
    anonymousId: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    visitCount: v.number(),
    firstCountryCode: v.optional(v.string()),
    lastCountryCode: v.optional(v.string()),
  }).index("by_anonymous_id", ["anonymousId"]),

  analyticsSummary: defineTable({
    key: v.string(),
    anonymousDevices: v.number(),
    pageViews: v.number(),
    calculationUpdates: v.number(),
    totalEvents: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  routeStats: defineTable({
    routeKey: v.string(),
    departureAirport: v.string(),
    arrivalAirport: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index("by_route_key", ["routeKey"])
    .index("by_count", ["count"]),

  visitorCountryStats: defineTable({
    countryCode: v.string(),
    anonymousDevices: v.number(),
    pageViews: v.number(),
    updatedAt: v.number(),
  })
    .index("by_country_code", ["countryCode"])
    .index("by_page_views", ["pageViews"]),

  activityEvents: defineTable({
    anonymousId: v.string(),
    sessionId: v.string(),
    event: v.string(),
    page: v.string(),
    details: v.optional(v.any()),
    countryCode: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_anonymous_id", ["anonymousId"])
    .index("by_event", ["event"])
    .index("by_created_at", ["createdAt"]),

  testRuns: defineTable({
    runId: v.string(),
    source: v.string(),
    status: v.union(v.literal("passed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.number(),
    timezoneDataVersion: v.string(),
    passed: v.number(),
    failed: v.number(),
  }).index("by_run_id", ["runId"]),

  testResults: defineTable({
    runId: v.string(),
    name: v.string(),
    status: v.union(v.literal("passed"), v.literal("failed")),
    expectedMinutes: v.number(),
    actualMinutes: v.union(v.number(), v.null()),
    error: v.string(),
    input: v.any(),
  }).index("by_run_id", ["runId"]),
});
