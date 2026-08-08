import { expect, test } from "@playwright/test";

/**
 * Smoke test suite — verifies core pages render without errors.
 * Run with: npx playwright test
 */

test.describe("TarshishDEX — page rendering", () => {
  test("home page loads and shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("trading gateway");
  });

  test("swap page loads the swap widget", async ({ page }) => {
    await page.goto("/swap");
    await expect(page.getByRole("heading", { name: /swap/i }).first()).toBeVisible();
  });

  test("markets page loads the market table", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByRole("heading", { name: /markets/i }).first()).toBeVisible();
  });

  test("assets page loads the asset browser", async ({ page }) => {
    await page.goto("/assets");
    await expect(page.getByRole("heading", { name: /assets/i }).first()).toBeVisible();
  });

  test("analytics page loads the price chart", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: /analytics/i }).first()).toBeVisible();
  });

  test("portfolio page loads", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { name: /portfolio/i }).first()).toBeVisible();
  });

  test("health API returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.service).toBe("tarshishdex");
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page-12345");
    await expect(page.locator("text=Page not found")).toBeVisible();
  });
});
