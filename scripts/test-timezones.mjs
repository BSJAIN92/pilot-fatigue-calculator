import assert from "node:assert/strict";
import { localTimeToEpochMilliseconds } from "../src/timezone.js";

const normalDeparture = localTimeToEpochMilliseconds(
  "2026-01-15",
  "18:00",
  "America/New_York",
);
const normalArrival = localTimeToEpochMilliseconds(
  "2026-01-16",
  "11:00",
  "Europe/London",
);
assert.equal((normalArrival - normalDeparture) / 60_000, 720);

assert.throws(
  () => localTimeToEpochMilliseconds("2026-03-08", "02:30", "America/New_York"),
  RangeError,
  "A local time skipped by the spring clock change must be rejected.",
);

assert.throws(
  () => localTimeToEpochMilliseconds("2026-11-01", "01:30", "America/New_York"),
  RangeError,
  "A local time repeated by the autumn clock change must be rejected.",
);

const kathmandu = localTimeToEpochMilliseconds(
  "2026-01-15",
  "12:00",
  "Asia/Kathmandu",
);
assert.equal(new Date(kathmandu).toISOString(), "2026-01-15T06:15:00.000Z");

console.log("Timezone tests passed.");
