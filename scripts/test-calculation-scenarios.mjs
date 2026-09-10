import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import moment from "moment-timezone";
import { calculateDurationMinutes } from "../src/calculate-duration.js";

const scenarios = [
  {
    name: "International Date Line with an earlier local arrival date",
    expectedMinutes: 720,
    input: {
      departureAirport: "AKL",
      departureDate: "2026-01-02",
      departureTime: "10:00",
      departureTimeZone: "Pacific/Auckland",
      arrivalAirport: "HNL",
      arrivalDate: "2026-01-01",
      arrivalTime: "23:00",
      arrivalTimeZone: "Pacific/Honolulu",
    },
  },
  {
    name: "Overnight flight",
    expectedMinutes: 360,
    input: {
      departureAirport: "DEL",
      departureDate: "2026-01-15",
      departureTime: "23:00",
      departureTimeZone: "Asia/Kolkata",
      arrivalAirport: "SIN",
      arrivalDate: "2026-01-16",
      arrivalTime: "07:30",
      arrivalTimeZone: "Asia/Singapore",
    },
  },
  {
    name: "Half-hour timezone offset",
    expectedMinutes: 240,
    input: {
      departureAirport: "DEL",
      departureDate: "2026-01-15",
      departureTime: "10:00",
      departureTimeZone: "Asia/Kolkata",
      arrivalAirport: "DXB",
      arrivalDate: "2026-01-15",
      arrivalTime: "12:30",
      arrivalTimeZone: "Asia/Dubai",
    },
  },
];

const startedAt = Date.now();
const results = scenarios.map((scenario) => {
  let actualMinutes = null;
  let error = "";
  try {
    actualMinutes = calculateDurationMinutes(scenario.input);
    assert.equal(actualMinutes, scenario.expectedMinutes);
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : String(caughtError);
  }
  return {
    name: scenario.name,
    status: error ? "failed" : "passed",
    expectedMinutes: scenario.expectedMinutes,
    actualMinutes,
    error,
    input: scenario.input,
  };
});

const failed = results.filter((result) => result.status === "failed");
for (const result of results) {
  console.log(`${result.status.toUpperCase()}: ${result.name} (${result.actualMinutes} minutes)`);
}

if (process.argv.includes("--store")) {
  const convexUrl = process.env.TEST_RESULTS_CONVEX_URL;
  const writeKey = process.env.TEST_RESULTS_WRITE_KEY;
  if (!convexUrl || !writeKey) {
    throw new Error("TEST_RESULTS_CONVEX_URL and TEST_RESULTS_WRITE_KEY are required to store results.");
  }
  const client = new ConvexHttpClient(convexUrl);
  await client.mutation("testResults:record", {
    writeKey,
    runId: randomUUID(),
    source: "manual",
    status: failed.length ? "failed" : "passed",
    startedAt,
    completedAt: Date.now(),
    timezoneDataVersion: moment.tz.dataVersion,
    results,
  });
  console.log("Stored test results in Convex.");
}

assert.equal(failed.length, 0, `${failed.length} calculation scenario(s) failed.`);
