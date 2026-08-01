/**
 * TarshishDEX — ~2 minute demo video capture (against the live deploy).
 *
 * Drives a scripted walkthrough of the live app with Playwright's
 * recordVideo: home/swap → connect via the wallet picker (Freighter stub) →
 * balance dropdown → live swap quote → portfolio → analytics → markets →
 * assets → mobile viewport. Writes docs/videos/desktop.webm and
 * docs/videos/mobile.webm (stale webms are cleaned first), which
 * assemble-demo-video.sh turns into docs/videos/tarshishdex-demo.mp4 with a
 * title card + outro, trimmed to ~2:00.
 *
 * Usage: node scripts/capture-demo-video.mjs
 *   BASE_URL=https://tarshishdex.vercel.app  (override target)
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { ACCOUNT, FREIGHTER_STUB, SESSION } from "./lib/freighter-stub.mjs";

const BASE_URL = process.env.BASE_URL ?? "https://tarshishdex.vercel.app";
const OUT_DIR = path.resolve("docs/videos");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Remove stale captures so assembly can rely on exactly two webms.
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith(".webm")) fs.unlinkSync(path.join(OUT_DIR, f));
}

// Rename the single webm Playwright finalized on context close to a fixed
// name. (Prefer scanning over video.path(): it can throw/return a Promise
// depending on the Playwright version.)
function finalizeWebm(target) {
  const match = fs
    .readdirSync(OUT_DIR)
    .find((f) => f.endsWith(".webm") && f !== "desktop.webm" && f !== "mobile.webm");
  if (!match) throw new Error(`no webm to finalize as ${target}`);
  const src = path.join(OUT_DIR, match);
  const dst = path.join(OUT_DIR, target);
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.renameSync(src, dst);
  console.log(`✓ ${target} (${Math.round(fs.statSync(dst).size / 1024)} KB)`);
}

const browser = await chromium.launch();

// ── Desktop walkthrough (1280×720) ──────────────────────────────────────
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
});
await desktop.addInitScript(FREIGHTER_STUB, { acct: ACCOUNT, session: SESSION });
const page = await desktop.newPage();
const sleep = (ms) => page.waitForTimeout(ms);

// All navigations use domcontentloaded + the sleeps below — waiting for full
// `load` on the live site (charts/SSE/TanStack refetches) added ~70s of dead
// air and forced the assembly to trim real scenes off the desktop tail.
// 1. Home / swap — hero shot
await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
await sleep(3500);

// 2. Connect Wallet → picker
await page
  .getByRole("button", { name: /connect wallet/i })
  .click()
  .catch(() => {});
await page
  .waitForSelector("text=/freighter|xbull|albedo|connect/i", { timeout: 10_000 })
  .catch(() => {});
await sleep(2500);

// 3. Pick Freighter (real connect flow; stub answers the messaging protocol)
await page
  .getByRole("button", { name: /freighter/i })
  .first()
  .click({ timeout: 10_000 })
  .catch(async () => {
    await page
      .locator("text=Freighter")
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
  });
await sleep(2500);

// 4. Balance dropdown
const chip = page.locator("header button", { hasText: /G[A-Z0-9]/ }).first();
try {
  await chip.waitFor({ state: "visible", timeout: 8000 });
} catch {}
await chip.click().catch(() => {});
await page.waitForSelector("text=/balance/i", { timeout: 5000 }).catch(() => {});
await sleep(2500);
await page.keyboard.press("Escape").catch(() => {});
await sleep(500);

// 5. Live swap quote
await page
  .getByLabel("Amount to pay")
  .fill("100")
  .catch(() => {});
await sleep(3500);
await page
  .getByRole("button", { name: "0.5%" })
  .click()
  .catch(() => {});
await sleep(1500);

// 6. Portfolio
await page.goto(`${BASE_URL}/portfolio`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await sleep(3500);

// 7. Analytics
await page.goto(`${BASE_URL}/analytics`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await sleep(3500);

// 8. Markets
await page.goto(`${BASE_URL}/markets`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await sleep(3000);

// 9. Assets / discovery
await page.goto(`${BASE_URL}/assets`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await sleep(3000);

await desktop.close();
finalizeWebm("desktop.webm");

// ── Mobile viewport (390×844) ───────────────────────────────────────────
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  recordVideo: { dir: OUT_DIR, size: { width: 390, height: 844 } },
});
await mobile.addInitScript(FREIGHTER_STUB, { acct: ACCOUNT, session: SESSION });
const mpage = await mobile.newPage();
await mpage.goto(`${BASE_URL}/swap`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await mpage.waitForTimeout(4000);
await mpage
  .getByLabel("Amount to pay")
  .fill("50")
  .catch(() => {});
await mpage.waitForTimeout(4000);

await mobile.close();
finalizeWebm("mobile.webm");

await browser.close();

console.log("videos →", path.join(OUT_DIR, "desktop.webm"), path.join(OUT_DIR, "mobile.webm"));
