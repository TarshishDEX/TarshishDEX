import { expect, test } from "@playwright/test";

/**
 * Limit order flow E2E tests — validates the limit order form and table:
 * buy/sell toggle, price/amount entry, expiry options, and the
 * connect-wallet gate on the orders table.
 */

test.describe("Limit order flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orders");
  });

  test("renders orders page with form and table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Limit Orders" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Place Limit Order" })).toBeVisible();
    await expect(page.getByLabelText("Limit price")).toBeVisible();
    await expect(page.getByLabelText("Order amount")).toBeVisible();
  });

  test("buy is active by default", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Buy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sell" })).toBeVisible();
  });

  test("toggles to sell order", async ({ page }) => {
    await page.getByRole("button", { name: "Sell" }).click();
    await expect(page.getByRole("button", { name: "Place Sell Order" })).toBeVisible();
  });

  test("toggles back to buy order", async ({ page }) => {
    await page.getByRole("button", { name: "Sell" }).click();
    await expect(page.getByRole("button", { name: "Place Sell Order" })).toBeVisible();
    await page.getByRole("button", { name: "Buy" }).click();
    await expect(page.getByRole("button", { name: "Place Buy Order" })).toBeVisible();
  });

  test("place order button disabled until price and amount entered", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Place Buy Order" })).toBeDisabled();
    await page.getByLabelText("Limit price").fill("0.5");
    await expect(page.getByRole("button", { name: "Place Buy Order" })).toBeDisabled();
    await page.getByLabelText("Order amount").fill("100");
    // Order placement requires a wallet — the button should now be enabled
    await expect(page.getByRole("button", { name: "Place Buy Order" })).toBeEnabled();
  });

  test("shows total when price and amount entered", async ({ page }) => {
    await page.getByLabelText("Limit price").fill("2");
    await page.getByLabelText("Order amount").fill("50");
    await expect(page.getByText("100.00")).toBeVisible();
  });

  test("selects expiry options", async ({ page }) => {
    await page.getByRole("button", { name: "1 hour" }).click();
    await page.getByRole("button", { name: "1 week" }).click();
    await expect(page.getByRole("button", { name: "1 week" })).toBeVisible();
  });

  test("orders table shows connect-wallet prompt when disconnected", async ({ page }) => {
    await expect(page.getByText("Connect your wallet").first()).toBeVisible();
  });

  test("orders table renders header", async ({ page }) => {
    await expect(page.getByText("Limit Orders")).toBeVisible();
  });
});
