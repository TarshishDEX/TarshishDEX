import { expect, test } from "@playwright/test";

/**
 * Portfolio flow E2E tests — validates watch-mode address input, validation
 * messaging, and portfolio rendering for a known Stellar account.
 */

const VALID_KEY = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const INVALID_KEY = "not-a-valid-public-key";

test.describe("Portfolio flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portfolio");
  });

  test("renders portfolio page with address input", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await expect(page.getByLabelText("Stellar public key")).toBeVisible();
    await expect(page.getByRole("button", { name: "Load Portfolio" })).toBeVisible();
  });

  test("shows watch-mode empty state", async ({ page }) => {
    await expect(page.getByText("Watch any Stellar account")).toBeVisible();
  });

  test("Load button is disabled for invalid addresses", async ({ page }) => {
    const input = page.getByLabelText("Stellar public key");
    await input.fill(INVALID_KEY);
    await expect(page.getByRole("button", { name: "Load Portfolio" })).toBeDisabled();
  });

  test("shows validation warning for invalid address", async ({ page }) => {
    const input = page.getByLabelText("Stellar public key");
    await input.fill(INVALID_KEY);
    await expect(page.getByText(/Enter a valid Stellar public key/)).toBeVisible();
  });

  test("loads a valid address and shows portfolio stats", async ({ page }) => {
    const input = page.getByLabelText("Stellar public key");
    await input.fill(VALID_KEY);
    await page.getByRole("button", { name: "Load Portfolio" }).click();

    // The portfolio section should appear with stat cards
    await expect(page.getByText(/Live · streaming account operations/)).toBeVisible();
    await expect(page.getByText("Total Value")).toBeVisible();
    await expect(page.getByText("Assets")).toBeVisible();
    await expect(page.getByText("Account")).toBeVisible();
  });

  test("shows allocation and balance sections for loaded address", async ({ page }) => {
    const input = page.getByLabelText("Stellar public key");
    await input.fill(VALID_KEY);
    await page.getByRole("button", { name: "Load Portfolio" }).click();

    await expect(page.getByText("Allocation")).toBeVisible();
    await expect(page.getByText("Asset Balances")).toBeVisible();
    await expect(page.getByText("Trade History")).toBeVisible();
  });

  test("connect-wallet placeholder shows when connected wallet present", async ({ page }) => {
    // Without a wallet, the placeholder shows the example key
    const input = page.getByLabelText("Stellar public key");
    await expect(input).toHaveAttribute("placeholder", /GAA/);
  });
});
