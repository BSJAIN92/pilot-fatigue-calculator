import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const overview = query({
  args: { readKey: v.string() },
  handler: async (ctx, { readKey }) => {
    const expectedKey = process.env.ANALYTICS_READ_KEY;
    if (!expectedKey || readKey !== expectedKey) {
      throw new Error("Analytics read access denied.");
    }

    const summary = await ctx.db
      .query("analyticsSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const popularRoutes = await ctx.db
      .query("routeStats")
      .withIndex("by_count")
      .order("desc")
      .take(10);
    const recentEvents = await ctx.db
      .query("activityEvents")
      .withIndex("by_created_at")
      .order("desc")
      .take(25);
    const latestTestRun = await ctx.db
      .query("testRuns")
      .order("desc")
      .first();

    return {
      summary: summary || {
        anonymousDevices: 0,
        pageViews: 0,
        calculationUpdates: 0,
        totalEvents: 0,
        updatedAt: 0,
      },
      popularRoutes: popularRoutes.map(({ departureAirport, arrivalAirport, count }) => ({
        departureAirport,
        arrivalAirport,
        count,
      })),
      recentEvents: recentEvents.map(({ event, page, createdAt }) => ({ event, page, createdAt })),
      latestTestRun,
    };
  },
});

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSummary = await ctx.db
      .query("analyticsSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (existingSummary) return { initialized: false };

    const users = await ctx.db.query("anonymousUsers").take(10_000);
    const events = await ctx.db.query("activityEvents").take(10_000);
    const routeCounts = new Map();
    for (const event of events) {
      if (event.event !== "calculation_updated" || !event.details?.legs) continue;
      for (const leg of event.details.legs) {
        const routeKey = `${leg.departureAirport}→${leg.arrivalAirport}`;
        const existing = routeCounts.get(routeKey) || {
          departureAirport: leg.departureAirport,
          arrivalAirport: leg.arrivalAirport,
          count: 0,
        };
        existing.count += 1;
        routeCounts.set(routeKey, existing);
      }
    }

    const now = Date.now();
    await ctx.db.insert("analyticsSummary", {
      key: "global",
      anonymousDevices: users.length,
      pageViews: events.filter((event) => event.event === "page_view").length,
      calculationUpdates: events.filter((event) => event.event === "calculation_updated").length,
      totalEvents: events.length,
      updatedAt: now,
    });
    for (const [routeKey, route] of routeCounts) {
      await ctx.db.insert("routeStats", {
        routeKey,
        ...route,
        updatedAt: now,
      });
    }
    return { initialized: true };
  },
});
