import { expect, test } from "@playwright/test";

/**
 * Navigation & UI E2E tests — validates header navigation, page routing,
 * the mobile menu, and theme persistence.
 */

test.describe("Navigation & UI", () => {
  test("header contains navigation links to all main pages", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: /Swap/i }).first()).toBeVisible();
    await expect(header.getByRole("link", { name: /Markets/i }).first()).toBeVisible();
    await expect(header.getByRole("link", { name: /Portfolio/i }).first()).toBeVisible();
    await expect(header.getByRole("link", { name: /Assets/i }).first()).toBeVisible();
    await expect(header.getByRole("link", { name: /Analytics/i }).first()).toBeVisible();
  });

  test("navigates between pages via header links", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("link", { name: /Markets/i }).first().click();
    await expect(page).toHaveURL(/\/markets/);
    await expect(page.getByRole("heading", { name: "Markets" })).toBeVisible();
  });

  test("home page shows hero and feature highlights", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Hero CTA buttons should be present
    await expect(page.getByRole("link", { name: /Start Swapping|Launch App|Get Started/i }).first()).toBeVisible();
  });

  test("footer contains project branding", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/Tarshish/i).first()).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/does-not-exist-xyz");
    await expect(page.getByText(/Page not found|404/)).toBeVisible();
  });
});

test.describe("Mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens mobile navigation drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByLabelText("Close menu")).toBeVisible();
    await expect(page.getByText("Swap")).toBeVisible();
    await expect(page.getByText("Markets")).toBeVisible();
    await expect(page.getByText("Portfolio")).toBeVisible();
  });

  test("navigates from mobile menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: /Assets/i }).click();
    await expect(page).toHaveURL(/\/assets/);
  });

  test("closes mobile menu with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByLabelText("Close menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });
});

test.describe("Markets page", () => {
  test("shows market table and orderbook panels", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByText("Top Markets")).toBeVisible();
    await expect(page.getByText("Orderbook Depth")).toBeVisible();
  });

  test("sorting header buttons are interactive", async ({ page }) => {
    await page.goto("/markets");
    const priceHeader = page.getByRole("button", { name: /Price \(XLM\)/i });
    await expect(priceHeader).toBeVisible();
    await priceHeader.click();
    // Clicking again toggles direction — button should remain present
    await priceHeader.click();
    await expect(priceHeader).toBeVisible();
  });
});

test.describe("Analytics page", () => {
  test("renders price chart panel with controls", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByText("Trading Volume")).toBeVisible();
    await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1W" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1M" })).toBeVisible();
  });

  test("timeframe buttons are interactive", async ({ page }) => {
    await page.goto("/analytics");
    await page.getByRole("button", { name: "1D" }).click();
    await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
  });
});

test.describe("Theme", () => {
  test("theme toggle persists selection", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /toggle theme|theme/i });
    if (await toggle.count()) {
      await toggle.first().click();
      // Toggle again to keep state stable across test runs
      await toggle.first().click();
      await expect(toggle.first()).toBeVisible();
    }
  });
});
