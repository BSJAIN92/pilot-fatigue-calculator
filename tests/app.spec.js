import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/track", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
});

async function enterDelhiToLondon(page) {
  const firstRow = page.locator(".time-row").first();
  await firstRow.locator(".country-select-start").selectOption("IN");
  await firstRow.locator(".airport-input-start").fill(
    "DEL/VIDP — Indira Gandhi International Airport, New Delhi",
  );
  await firstRow.locator(".time-date-start").fill("2026-01-15");
  await firstRow.locator(".time-time-start").fill("10:00");
  await firstRow.locator(".country-select-end").selectOption("GB");
  await firstRow.locator(".airport-input-end").fill(
    "LHR/EGLL — London Heathrow Airport, London",
  );
  await firstRow.locator(".time-date-end").fill("2026-01-15");
  await firstRow.locator(".time-time-end").fill("10:00");
  return firstRow;
}

test("a pilot can calculate a flight from local airport times", async ({ page }) => {
  await page.goto("/");

  const firstRow = page.locator(".time-row").first();
  await expect(firstRow.locator(".leg-title")).toHaveText("Leg 1");
  await expect(firstRow.locator(".row-duration")).toHaveText("Awaiting airports");
  await expect(page.getByText("Missing Data")).toHaveCount(0);
  await expect(page.locator("#leg-summary-list")).toContainText("Add airport details");
  await enterDelhiToLondon(page);

  await expect(firstRow.locator(".utc-preview-start")).toContainText(
    "2026-01-15 04:30 UTC",
  );
  await expect(firstRow.locator(".utc-preview-end")).toContainText(
    "2026-01-15 10:00 UTC",
  );
  await expect(firstRow.locator(".row-duration")).toHaveText("5h 30m");
  await expect(page.locator("#total-display")).toHaveText("5h 30m");
  await page.locator(".copy-btn").click();
  await expect(page.locator("#copy-status")).toHaveText("Copied");
  await expect(page.locator(".operator-select")).toHaveCount(0);
  await expect(page.locator("#leg-summary-list")).toContainText("DEL/VIDP → LHR/EGLL");
  await expect(page.locator("#leg-summary-list")).toContainText("5h 30m");
  const calculatorBox = await page.locator(".calculator-pane").boundingBox();
  const summaryBox = await page.locator(".summary-panel").boundingBox();
  expect(summaryBox.x).toBeGreaterThan(calculatorBox.x + calculatorBox.width);
});

test("time can be deducted from the journey total", async ({ page }) => {
  await page.goto("/");
  await enterDelhiToLondon(page);
  await page.locator("#deduct-btn").click();
  await page.locator("#deduction-label").fill("Positioning credit");
  await page.locator("#deduction-hours").fill("1");
  await page.locator("#deduction-minutes").fill("15");
  await page.locator("#deduction-save").click();

  await expect(page.locator("#total-display")).toHaveText("4h 15m");
  await expect(page.locator("#deduction-summary-list")).toContainText("Positioning credit");
  await expect(page.locator("#deduction-summary-list")).toContainText("−1h 15m");

  await page.locator(".deduction-remove").click();
  await expect(page.locator("#total-display")).toHaveText("5h 30m");
  await expect(page.locator("#deduction-summary-list")).toContainText("No deductions added");
});

test("invalid deductions are rejected and negative totals remain visible", async ({ page }) => {
  await page.goto("/");
  await page.locator("#deduct-btn").click();
  await page.locator("#deduction-save").click();
  await expect(page.locator("#deduction-error")).toContainText("Enter at least 1 minute");
  await expect(page.locator("#deduction-modal")).toBeVisible();

  await page.locator("#deduction-minutes").fill("30");
  await page.locator("#deduction-save").click();
  await expect(page.locator("#total-display")).toHaveText("−0h 30m");
});

test("legs can be added, removed, and cleared", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".time-row")).toHaveCount(1);

  await page.locator("#add-btn").click();
  await expect(page.locator(".time-row")).toHaveCount(2);

  await page.locator(".time-row").last().locator(".remove-btn").click();
  await expect(page.locator(".time-row")).toHaveCount(1);

  await page.locator("#clear-btn").click();
  await expect(page.locator("#confirm-modal")).toBeVisible();
  await page.locator("#confirm-yes").click();
  await expect(page.locator(".time-row")).toHaveCount(1);
  await expect(page.locator("#total-display")).toHaveText("0h 0m");
  await expect(page.locator(".country-select-start")).toHaveValue("");
  await expect(page.locator(".country-select-end")).toHaveValue("");
  await expect(page.locator(".leg-title")).toHaveText("Leg 1");
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the calculator fits and works on a phone-sized screen", async ({ page }) => {
    await page.goto("/");

    const firstRow = page.locator(".time-row").first();
    await firstRow.locator(".country-select-start").selectOption("IN");
    await firstRow.locator(".airport-input-start").fill(
      "DEL/VIDP — Indira Gandhi International Airport, New Delhi",
    );
    await firstRow.locator(".time-date-start").fill("2026-01-15");
    await firstRow.locator(".time-time-start").fill("10:00");

    await firstRow.locator(".country-select-end").selectOption("AE");
    await firstRow.locator(".airport-input-end").fill(
      "DXB/OMDB — Dubai International Airport, Dubai",
    );
    await firstRow.locator(".time-date-end").fill("2026-01-15");
    await firstRow.locator(".time-time-end").fill("12:30");

    await expect(page.locator("#total-display")).toHaveText("4h 0m");
    await expect(firstRow.locator(".utc-preview-start")).toContainText("04:30 UTC");
    await expect(firstRow.locator(".utc-preview-end")).toContainText("08:30 UTC");
    await expect(page.locator("#add-btn")).toBeVisible();
    await expect(page.locator("#clear-btn")).toBeVisible();

    const calculatorBox = await page.locator(".calculator-pane").boundingBox();
    const summaryBox = await page.locator(".summary-panel").boundingBox();
    expect(summaryBox.y).toBeGreaterThanOrEqual(calculatorBox.y + calculatorBox.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
