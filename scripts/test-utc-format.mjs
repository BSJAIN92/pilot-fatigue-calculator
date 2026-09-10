import assert from "node:assert/strict";
import { formatUtcDateTime } from "../src/utc-format.js";

assert.equal(formatUtcDateTime(0), "1970-01-01 00:00 UTC");
assert.equal(
  formatUtcDateTime(Date.UTC(2026, 8, 10, 14, 5)),
  "2026-09-10 14:05 UTC",
);

console.log("UTC display tests passed.");
