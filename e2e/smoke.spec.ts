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

/**
 * API integration tests — validate live responses from key endpoints.
 * Uses Playwright's request fixture (no browser needed).
 */
test.describe("TarshishDEX — API endpoints", () => {
  const XLM_USDC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

  test("health returns correct shape and headers", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("tarshishdex");
    expect(body.timestamp).toBeGreaterThan(0);
    expect(body.uptime).toBeGreaterThan(0);
  });

  test("swap/quote returns a valid route for XLM→USDC", async ({ request }) => {
    const response = await request.get(
      `/api/swap/quote?input=XLM&output=${encodeURIComponent(XLM_USDC)}&amount=10&slippage=1`
    );
    // 200 when a route exists; 404 when testnet has no viable path for the pair.
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.path).toBeDefined();
      expect(body.path.length).toBeGreaterThanOrEqual(2);
      expect(body.sourceAmount).toBe("10");
      expect(body.outputAmount).toBeDefined();
      expect(Number(body.outputAmount)).toBeGreaterThan(0);
      expect(body.executionPrice).toBeGreaterThan(0);
      expect(body.method).toMatch(/^(direct|multi-hop|path-finding)$/);
    }
  });

  test("swap/quote rejects missing params with 400", async ({ request }) => {
    const response = await request.get("/api/swap/quote");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("market/orderbook returns depth for XLM/USDC", async ({ request }) => {
    const response = await request.get(
      `/api/market/orderbook?selling=XLM&buying=${encodeURIComponent(XLM_USDC)}&limit=10`
    );
    // May return 502 if Horizon has no orderbook for this pair on testnet.
    expect([200, 502]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.base).toBeDefined();
      expect(body.counter).toBeDefined();
      expect(body.bids).toBeDefined();
      expect(body.asks).toBeDefined();
      expect(Array.isArray(body.bids)).toBe(true);
      expect(Array.isArray(body.asks)).toBe(true);
      // midPrice may be null if orderbook is thin on testnet
    }
  });

  test("market/orderbook rejects missing params with 400", async ({ request }) => {
    const response = await request.get("/api/market/orderbook");
    expect(response.status()).toBe(400);
  });

  test("market/stats returns asset stats", async ({ request }) => {
    const response = await request.get("/api/market/stats?limit=5");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.count).toBeDefined();
    expect(body.stats).toBeDefined();
    expect(Array.isArray(body.stats)).toBe(true);
  });

  test("assets returns asset catalog", async ({ request }) => {
    const response = await request.get("/api/assets?limit=10");
    // May return 502 if Horizon is unreachable in test env
    expect([200, 502]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.count).toBeDefined();
      expect(Array.isArray(body.assets)).toBe(true);
    }
  });

  test("orders returns count when no user param", async ({ request }) => {
    const response = await request.get("/api/orders");
    // May return 502 if limit-order contract not deployed
    expect([200, 502]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.count).toBeDefined();
      expect(typeof body.count).toBe("number");
    }
  });

  test("portfolio rejects invalid address with 400", async ({ request }) => {
    const response = await request.get("/api/portfolio/not-a-valid-key");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid");
  });

  test("trades rejects invalid address with 400", async ({ request }) => {
    const response = await request.get("/api/trades/not-a-valid-key");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid");
  });

  test("unknown API route returns Next.js 404", async ({ request }) => {
    const response = await request.get("/api/nonexistent");
    expect(response.status()).toBe(404);
  });
});
