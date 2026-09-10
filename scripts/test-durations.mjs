import assert from "node:assert/strict";
import { validateLegDuration } from "../src/duration-validation.js";

assert.equal(validateLegDuration(-1, false).error, "Arrival is before departure");
assert.equal(validateLegDuration(0, false).error, "Departure and arrival are the same");
assert.equal(validateLegDuration(120, false).requiresConfirmation, false);
assert.equal(validateLegDuration(1441, false).requiresConfirmation, true);
assert.equal(validateLegDuration(1441, true).requiresConfirmation, false);

console.log("Duration validation tests passed.");
