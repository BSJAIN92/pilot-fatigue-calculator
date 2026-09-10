import { mutation } from "./_generated/server";
import { v } from "convex/values";

const testInput = v.object({
  departureAirport: v.string(),
  departureDate: v.string(),
  departureTime: v.string(),
  departureTimeZone: v.string(),
  arrivalAirport: v.string(),
  arrivalDate: v.string(),
  arrivalTime: v.string(),
  arrivalTimeZone: v.string(),
});

const testResult = v.object({
  name: v.string(),
  status: v.union(v.literal("passed"), v.literal("failed")),
  expectedMinutes: v.number(),
  actualMinutes: v.union(v.number(), v.null()),
  error: v.string(),
  input: testInput,
});

export const record = mutation({
  args: {
    writeKey: v.string(),
    runId: v.string(),
    source: v.string(),
    status: v.union(v.literal("passed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.number(),
    timezoneDataVersion: v.string(),
    results: v.array(testResult),
  },
  handler: async (ctx, args) => {
    const expectedKey = process.env.TEST_RESULTS_WRITE_KEY;
    if (!expectedKey || args.writeKey !== expectedKey) {
      throw new Error("Test-result write access denied.");
    }
    if (args.results.length < 1 || args.results.length > 100) {
      throw new Error("Invalid number of test results.");
    }

    await ctx.db.insert("testRuns", {
      runId: args.runId,
      source: args.source.slice(0, 40),
      status: args.status,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
      timezoneDataVersion: args.timezoneDataVersion.slice(0, 30),
      passed: args.results.filter((result) => result.status === "passed").length,
      failed: args.results.filter((result) => result.status === "failed").length,
    });

    for (const result of args.results) {
      await ctx.db.insert("testResults", {
        runId: args.runId,
        name: result.name.slice(0, 160),
        status: result.status,
        expectedMinutes: result.expectedMinutes,
        actualMinutes: result.actualMinutes,
        error: result.error.slice(0, 500),
        input: result.input,
      });
    }
  },
});
