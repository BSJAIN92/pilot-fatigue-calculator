import assert from "node:assert/strict";
import { formatLocalDate } from "../src/local-date.js";

const localCalendarValue = {
  getFullYear: () => 2027,
  getMonth: () => 0,
  getDate: () => 2,
};

assert.equal(formatLocalDate(localCalendarValue), "2027-01-02");
console.log("Local date test passed.");
