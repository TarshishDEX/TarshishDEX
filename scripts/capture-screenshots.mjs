/**
 * TarshishDEX — submission screenshot capture (run against the live deploy).
 *
 * Captures the 8 checklist screenshots at the standard viewports into
 * docs/screenshots/. Uses the shared Testnet deployer account (funded via
 * friendbot, with real on-chain preferences) by injecting a freighter stub
 * that reports that account, so the wallet UI shows real Testnet data.
 *
 * Why a full freighter stub: the WalletProvider subscribes to kit lifecycle
 * events and calls `setDisconnected()` whenever the kit reports no address.
 * Without a real extension the injected session alone gets wiped on load, so
 * we stub `window.freighter` to report the funded account — the kit then
 * keeps the store connected and the balance dropdown fetches from Horizon.
 *
 * Usage: node scripts/capture-screenshots.mjs
 *   BASE_URL=https://tarshishdex.vercel.app  (override target)
 *   ACCOUNT=G...                            (funded testnet account)
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { ACCOUNT, FREIGHTER_STUB, SESSION } from "./lib/freighter-stub.mjs";

const BASE_URL = process.env.BASE_URL ?? "https://tarshishdex.vercel.app";
const OUT_DIR = path.resolve("docs/screenshots");

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const failures = [];

async function shot(page, file, opts = {}) {
  const target = path.join(OUT_DIR, file);
  try {
    await page.screenshot({ path: target, fullPage: opts.fullPage ?? false });
    const kb = Math.round(fs.statSync(target).size / 1024);
    if (kb < 8) throw new Error(`suspiciously small (${kb} KB) — likely blank`);
    console.log(`✓ ${file} (${kb} KB)`);
  } catch (err) {
    // Screenshot may have failed before writing — never let cleanup crash.
    try {
      fs.unlinkSync(target);
    } catch {}
    failures.push(file);
    console.error(`✗ ${file}: ${err.message}`);
  }
}

/**
 * Drive a real connect through the UI: the app never auto-connects from an
 * injected session (the provider wipes it on mount when the kit reports no
 * address), so click Connect Wallet → Freighter in the picker. Our
 * postMessage responder makes the kit's getAddress()/requestAccess() resolve
 * with the funded account, the kit emits a connect event, and the provider
 * keeps the session. Verify the address chip and record a failure if absent.
 */
async function connectViaPicker(page, url = BASE_URL) {
  await page.goto(url, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(1200);
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible().catch(() => false)) {
    await connectBtn.click();
    await page.waitForSelector("text=/freighter/i", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page
      .getByRole("button", { name: /freighter/i })
      .first()
      .click({ timeout: 10_000 })
      .catch(async () => {
        await page
          .locator("text=Freighter")
          .first()
          .click({ timeout: 5000 })
          .catch(async () => {
            await page
              .locator("text=/Freighter/i")
              .first()
              .click({ timeout: 5000 })
              .catch(() => {});
          });
      });
  }
  const chip = page.locator("header button", { hasText: /G[A-Z0-9]/ }).first();
  try {
    await chip.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    failures.push("wallet-connected (no address chip after picker connect)");
    console.error("✗ wallet-connected: no address chip after picker connect");
  }
}

// ── 1. Wallet options (picker modal) ───────────────────────────────────
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // Minimal stub (presence only) so isWalletAvailable() is true and the
  // picker opens listing the registered wallet modules.
  await context.addInitScript(() => {
    window.freighter = { isConnected: () => Promise.resolve({ isConnected: true }) };
  });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "load", timeout: 45_000 });
  await page
    .getByRole("button", { name: /connect wallet/i })
    .click()
    .catch(() => {});
  await page
    .waitForSelector("text=/freighter|xbull|albedo|connect/i", { timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(2000);
  await shot(page, "wallet-options.png");
  await context.close();
}

// ── 2 + 3. Wallet connected + balance dropdown (real funded account) ──
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(FREIGHTER_STUB, { acct: ACCOUNT, session: SESSION });
  const page = await context.newPage();
  await connectViaPicker(page);
  await shot(page, "wallet-connected.png");

  const chip = page.locator("header button", { hasText: /G[A-Z0-9]/ }).first();
  if (await chip.isVisible().catch(() => false)) {
    await chip.click();
    await page.waitForSelector("text=/balance/i", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, "balance-displayed.png");
  } else {
    failures.push("balance-displayed.png");
    console.error("✗ balance-displayed: chip not found");
  }
  await context.close();
}

// ── 6. Mobile responsive (swap page, 390×844) ─────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  await context.addInitScript(FREIGHTER_STUB, { acct: ACCOUNT, session: SESSION });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/swap`, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(1500);
  await shot(page, "mobile-responsive.png");
  await context.close();
}

// ── 4. Successful Testnet transaction (real contract-call tx) ─────────
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(
    "https://stellar.expert/explorer/testnet/tx/42bb9d5f218174b837a4db3007463fc80a009b76a3c43080c11194e205e47e6d",
    { waitUntil: "domcontentloaded", timeout: 45_000 }
  );
  await page
    .waitForSelector("text=/42bb9d5f|SUCCESS|success/i", { timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(2500);
  await shot(page, "successful-testnet-transaction.png");
  await context.close();
}

// ── 5. Transaction result (second real tx — publish → PricePublished) ──
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(
    "https://stellar.expert/explorer/testnet/tx/b975861d1b0a8ac70eb95e2040b55b97a5e5ae516227dc434d830ea4133671b6",
    { waitUntil: "domcontentloaded", timeout: 45_000 }
  );
  await page
    .waitForSelector("text=/b975861d|SUCCESS|success/i", { timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(2500);
  await shot(page, "transaction-result.png");
  await context.close();
}

// ── 7. CI pipeline (GitHub Actions, public repo) ──────────────────────
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto("https://github.com/TarshishDEX/TarshishDEX/actions", {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page
    .waitForSelector("text=/quality|contracts|workflow/i", { timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  await shot(page, "ci-pipeline.png");
  await context.close();
}

// ── 8. Test output (coverage report generated from npm test) ──────────
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`file://${path.resolve("coverage/index.html")}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1500);
  await shot(page, "test-output.png");
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} screenshot(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nAll screenshots captured → docs/screenshots/");
