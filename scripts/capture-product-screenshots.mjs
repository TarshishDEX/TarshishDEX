/**
 * TarshishDEX — product page screenshot capture (run against the live deploy).
 *
 * Captures the main product pages (swap, markets, portfolio, analytics,
 * assets, orders) at the desktop viewport into docs/screenshots/. Uses the
 * shared Freighter stub for pages that need a connected wallet (swap,
 * portfolio, orders) so balances and on-chain data render from Horizon.
 *
 * Usage: node scripts/capture-product-screenshots.mjs
 *   BASE_URL=https://tarshishdex.vercel.app  (override target)
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { ACCOUNT, FREIGHTER_STUB, SESSION } from "./lib/freighter-stub.mjs";

const BASE_URL = process.env.BASE_URL ?? "https://tarshishdex.vercel.app";
const OUT_DIR = path.resolve("docs/screenshots");
const VIEWPORT = { width: 1280, height: 800 };

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const failures = [];

async function shot(page, file) {
  const target = path.join(OUT_DIR, file);
  try {
    await page.screenshot({ path: target });
    const kb = Math.round(fs.statSync(target).size / 1024);
    if (kb < 8) throw new Error(`suspiciously small (${kb} KB) — likely blank`);
    console.log(`✓ ${file} (${kb} KB)`);
  } catch (err) {
    try {
      fs.unlinkSync(target);
    } catch {}
    failures.push(file);
    console.error(`✗ ${file}: ${err.message}`);
  }
}

/**
 * Drive a real connect through the UI (the app never auto-connects from an
 * injected session), so wallet-backed pages show real balances. Best-effort:
 * pages still capture if the connect flow fails for any reason.
 */
async function connectViaPicker(page, url = BASE_URL) {
  await page.goto(url, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(1200);
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible().catch(() => false)) {
    await connectBtn.click();
    await page.waitForTimeout(1000);
    await page
      .getByRole("button", { name: /freighter/i })
      .first()
      .click({ timeout: 10_000 })
      .catch(() => page.locator("text=/Freighter/i").first().click().catch(() => {}));
  }
  await page
    .locator("header button", { hasText: /G[A-Z0-9]/ })
    .first()
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});
}

/** Navigate to a page and let live data / charts settle before capturing. */
async function capturePage({ file, route, connect = false }) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  if (connect) await context.addInitScript(FREIGHTER_STUB, { acct: ACCOUNT, session: SESSION });
  const page = await context.newPage();
  if (connect) {
    await connectViaPicker(page, `${BASE_URL}${route}`);
  } else {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "load", timeout: 45_000 });
  }
  // SSE streams keep the network busy; settle on a fixed delay instead of
  // networkidle so charts, tables, and quotes have time to paint.
  await page.waitForTimeout(5000);
  await shot(page, file);
  await context.close();
}

await capturePage({ file: "swap.png", route: "/swap", connect: true });
await capturePage({ file: "markets.png", route: "/markets" });
await capturePage({ file: "portfolio.png", route: "/portfolio", connect: true });
await capturePage({ file: "analytics.png", route: "/analytics" });
await capturePage({ file: "assets.png", route: "/assets" });
await capturePage({ file: "orders.png", route: "/orders", connect: true });

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} screenshot(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nAll product screenshots captured → docs/screenshots/");
