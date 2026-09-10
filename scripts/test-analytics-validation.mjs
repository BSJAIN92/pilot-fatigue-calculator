import assert from "node:assert/strict";
import { validateAndCleanAnalytics } from "../convex/lib/analyticsValidation.js";

const base = {
  anonymousId: "browser-id",
  sessionId: "session-id",
  event: "page_view",
  page: "/",
};

assert.equal(validateAndCleanAnalytics(base).event, "page_view");
assert.throws(() => validateAndCleanAnalytics({ ...base, event: "invented_event" }));
assert.throws(() => validateAndCleanAnalytics({ ...base, anonymousId: "x".repeat(65) }));
assert.throws(() => validateAndCleanAnalytics({ ...base, details: { unwanted: true } }));

const leg = {
  operator: "add",
  departureCountry: "IN",
  departureAirport: "DEL — Indira Gandhi International Airport",
  departureTimeZone: "Asia/Kolkata",
  departureDate: "2026-09-10",
  departureTime: "10:00",
  arrivalCountry: "GB",
  arrivalAirport: "LHR — London Heathrow Airport",
  arrivalTimeZone: "Europe/London",
  arrivalDate: "2026-09-10",
  arrivalTime: "15:00",
  duration: "9h 30m",
};

const calculation = validateAndCleanAnalytics({
  ...base,
  event: "calculation_updated",
  details: { legCount: 1, totalDuration: "9h 30m", legs: [leg] },
});
assert.equal(calculation.details.legs.length, 1);
assert.throws(() => validateAndCleanAnalytics({
  ...base,
  event: "calculation_updated",
  details: { legCount: 51, totalDuration: "0h 0m", legs: [] },
}));

console.log("Analytics validation tests passed.");
