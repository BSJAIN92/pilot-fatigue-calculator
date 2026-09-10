import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/track", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
});

test("a pilot can calculate a flight from local airport times", async ({ page }) => {
  await page.goto("/");

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

  await expect(firstRow.locator(".utc-preview-start")).toContainText(
    "2026-01-15 04:30 UTC",
  );
  await expect(firstRow.locator(".utc-preview-end")).toContainText(
    "2026-01-15 10:00 UTC",
  );
  await expect(firstRow.locator(".row-duration")).toHaveText("5h 30m");
  await expect(page.locator("#total-display")).toHaveText("5h 30m");
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

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
