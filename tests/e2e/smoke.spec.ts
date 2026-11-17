import { expect, test } from "@playwright/test";

test("home page opens", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("admin panel opens", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("form")).toBeVisible();
});
