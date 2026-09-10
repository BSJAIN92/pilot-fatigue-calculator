import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAndCleanAnalytics } from "./lib/analyticsValidation";

export const track = mutation({
  args: {
    anonymousId: v.string(),
    sessionId: v.string(),
    event: v.string(),
    page: v.string(),
    details: v.optional(v.any()),
    countryCode: v.optional(v.string()),
    ingestKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expectedIngestKey = process.env.ANALYTICS_INGEST_KEY;
    if (
      process.env.REQUIRE_ANALYTICS_INGEST_KEY === "true" &&
      (!expectedIngestKey || args.ingestKey !== expectedIngestKey)
    ) {
      throw new Error("Analytics write access denied.");
    }
    const cleanedArgs = validateAndCleanAnalytics(args);
    const now = Date.now();

    const recentEvents = await ctx.db
      .query("activityEvents")
      .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", cleanedArgs.anonymousId))
      .order("desc")
      .take(60);
    if (
      recentEvents.length === 60 &&
      recentEvents[recentEvents.length - 1]._creationTime > now - 60_000
    ) {
      throw new Error("Too many analytics events. Please wait before trying again.");
    }

    const existingUser = await ctx.db
      .query("anonymousUsers")
      .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", cleanedArgs.anonymousId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        lastSeenAt: now,
        visitCount:
          existingUser.visitCount + (cleanedArgs.event === "page_view" ? 1 : 0),
        ...(cleanedArgs.event === "page_view"
          ? {
              lastCountryCode: cleanedArgs.countryCode,
              ...(!existingUser.firstCountryCode
                ? { firstCountryCode: cleanedArgs.countryCode }
                : {}),
            }
          : {}),
      });
    } else {
      await ctx.db.insert("anonymousUsers", {
        anonymousId: cleanedArgs.anonymousId,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: cleanedArgs.event === "page_view" ? 1 : 0,
        firstCountryCode: cleanedArgs.countryCode,
        lastCountryCode: cleanedArgs.countryCode,
      });
    }

    if (cleanedArgs.event === "page_view") {
      const countryStats = await ctx.db
        .query("visitorCountryStats")
        .withIndex("by_country_code", (q) => q.eq("countryCode", cleanedArgs.countryCode))
        .unique();
      const firstAttributedCountry = !existingUser?.firstCountryCode;
      if (countryStats) {
        await ctx.db.patch(countryStats._id, {
          anonymousDevices: countryStats.anonymousDevices + (firstAttributedCountry ? 1 : 0),
          pageViews: countryStats.pageViews + 1,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("visitorCountryStats", {
          countryCode: cleanedArgs.countryCode,
          anonymousDevices: firstAttributedCountry ? 1 : 0,
          pageViews: 1,
          updatedAt: now,
        });
      }
    }

    const summary = await ctx.db
      .query("analyticsSummary")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const summaryChanges = {
      anonymousDevices: existingUser ? 0 : 1,
      pageViews: cleanedArgs.event === "page_view" ? 1 : 0,
      calculationUpdates: cleanedArgs.event === "calculation_updated" ? 1 : 0,
      totalEvents: 1,
    };
    if (summary) {
      await ctx.db.patch(summary._id, {
        anonymousDevices: summary.anonymousDevices + summaryChanges.anonymousDevices,
        pageViews: summary.pageViews + summaryChanges.pageViews,
        calculationUpdates: summary.calculationUpdates + summaryChanges.calculationUpdates,
        totalEvents: summary.totalEvents + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("analyticsSummary", {
        key: "global",
        ...summaryChanges,
        updatedAt: now,
      });
    }

    if (cleanedArgs.event === "calculation_updated") {
      for (const leg of cleanedArgs.details.legs) {
        const routeKey = `${leg.departureAirport}→${leg.arrivalAirport}`;
        const existingRoute = await ctx.db
          .query("routeStats")
          .withIndex("by_route_key", (q) => q.eq("routeKey", routeKey))
          .unique();
        if (existingRoute) {
          await ctx.db.patch(existingRoute._id, {
            count: existingRoute.count + 1,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("routeStats", {
            routeKey,
            departureAirport: leg.departureAirport,
            arrivalAirport: leg.arrivalAirport,
            count: 1,
            updatedAt: now,
          });
        }
      }
    }

    await ctx.db.insert("activityEvents", {
      ...cleanedArgs,
      createdAt: now,
    });
  },
});
