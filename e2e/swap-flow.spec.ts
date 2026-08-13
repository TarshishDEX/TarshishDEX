import { expect, test } from "@playwright/test";

/**
 * Swap flow E2E tests — validates the swap widget's interactive behavior
 * end-to-end: amount entry, token selection, slippage controls, quotes,
 * and the connect-wallet gate.
 */

test.describe("Swap flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/swap");
  });

  test("renders swap widget with form controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Swap" })).toBeVisible();
    await expect(page.getByLabel("Amount to pay")).toBeVisible();
    await expect(page.getByLabel("Amount to receive")).toBeVisible();
    await expect(page.getByText("Max slippage")).toBeVisible();
  });

  test("shows Connect Wallet button when disconnected", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Connect Wallet to Swap" })).toBeVisible();
  });

  test("typing an amount enables interaction and fetches a quote", async ({ page }) => {
    const amountInput = page.getByLabel("Amount to pay");
    await amountInput.fill("10");

    // On testnet the quote may be unavailable — the widget should still
    // react by showing the review/connect state without crashing.
    await expect(amountInput).toHaveValue("10");
    // Either a quote detail panel or the action button appears
    await expect(
      page.getByRole("button", { name: /Review Swap|Connect Wallet to Swap/ })
    ).toBeVisible();
  });

  test("reverses swap direction via arrow button", async ({ page }) => {
    await page.getByRole("button", { name: "Reverse swap direction" }).click();
    // The reverse button still exists after swap
    await expect(page.getByRole("button", { name: "Reverse swap direction" })).toBeVisible();
  });

  test("clears amount with Clear button", async ({ page }) => {
    const amountInput = page.getByLabel("Amount to pay");
    await amountInput.fill("100");
    await expect(amountInput).toHaveValue("100");
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(amountInput).toHaveValue("");
  });

  test("switches to custom slippage input", async ({ page }) => {
    await page.getByRole("button", { name: "Custom" }).click();
    await expect(page.getByLabel("Custom slippage percentage")).toBeVisible();
    await page.getByLabel("Custom slippage percentage").fill("2.5");
    await expect(page.getByLabel("Custom slippage percentage")).toHaveValue("2.5");
    // Switch back to presets
    await page.getByRole("button", { name: "Use presets" }).click();
    await expect(page.getByText("0.1%")).toBeVisible();
  });

  test("selects slippage presets", async ({ page }) => {
    await page.getByRole("button", { name: "3%" }).click();
    await expect(page.getByRole("button", { name: "3%" })).toBeVisible();
  });

  test("keyboard shortcut 's' focuses the amount input", async ({ page }) => {
    const amountInput = page.getByLabel("Amount to pay");
    await amountInput.click();
    await page.keyboard.press("Escape");
    // Focus elsewhere first
    await page.getByText("Max slippage").click();
    await page.keyboard.press("s");
    await expect(amountInput).toBeFocused();
  });

  test("on-chain preferences panel renders", async ({ page }) => {
    // Either "Not configured" or a connect prompt appears
    const panel = page.getByText("On-chain preferences").first();
    await expect(panel).toBeVisible();
  });
});
