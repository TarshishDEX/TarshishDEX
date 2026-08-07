#!/usr/bin/env node
// ── TarshishDEX — create 100 GitHub issues ──────────────────────────────
// Uses `gh issue create` via child_process. Each issue is a separate
// invocation to avoid escaping problems with large body content.
//
// Usage: node scripts/create-issues.mjs
// Prerequisites: gh CLI authenticated

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const REPO = "TarshishDEX/TarshishDEX";
const TMP = "/tmp/tarshishdex-issues";
mkdirSync(TMP, { recursive: true });

let count = 0;

function issue(title, labels, body) {
  const file = join(TMP, `issue-${String(count + 1).padStart(3, "0")}.md`);
  writeFileSync(file, body, "utf-8");
  const cmd = `gh issue create --repo "${REPO}" --title "${title.replace(/"/g, '\\"')}" --label "${labels}" --body-file "${file}"`;
  execSync(cmd, { stdio: "pipe" });
  count++;
  console.log(`  [${count}/100] ${title}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. GOOD FIRST ISSUES (12)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add aria-labels to all icon-only buttons",
  "good first issue,accessibility,area:frontend,priority:medium",
  `### Overview
Several icon-only buttons (e.g., theme toggle, swap direction flip, close modals) lack \`aria-label\` attributes, making them inaccessible to screen readers.

### Acceptance Criteria
- [ ] Every \`<button>\` in \`src/components/\` that contains only an SVG/icon has an \`aria-label\`
- [ ] Labels are descriptive: "Close dialog", "Swap direction", "Toggle theme"

### Files to touch
Look in \`src/components/ui/\`, \`src/components/swap/\`, \`src/components/markets/\`

### Hints
Use \`git grep '<button' src/components/ | grep -v aria-label\` to find offenders.
Search for \`IconButton\` components that may be missing labels.`
);

issue(
  "Add .editorconfig enforcement to CI",
  "good first issue,area:ci-cd,priority:low",
  `### Overview
We have an \`.editorconfig\` file but it is not enforced in CI. Add a step that verifies all committed files conform.

### Acceptance Criteria
- [ ] Add editorconfig-checker (or eclint) to the CI quality job
- [ ] It fails the build when files violate .editorconfig rules
- [ ] \`npm run format:check\` (or a new \`npm run editorconfig:check\`) triggers it locally

### Hints
- \`npm install --save-dev editorconfig-checker\`
- The \`.editorconfig\` at the repo root already defines the rules`
);

issue(
  "Add code comment explaining swap pipeline flow",
  "good first issue,documentation,area:swap,priority:low",
  `### Overview
The swap pipeline (findBestRoute -> selectBestRoute -> buildRoute -> executeSwap) is well-implemented but lacks inline code comments explaining the flow.

### Acceptance Criteria
- [ ] Add a docblock comment atop src/lib/stellar/routing.ts explaining the three routing strategies
- [ ] Add a docblock atop src/lib/stellar/swap-execution.ts explaining the execution phase machine
- [ ] Comments are concise (2-4 lines each) and reference the README architecture docs

### Hints
The README already has a great architecture diagram - reference it in the comments.`
);

issue(
  "Replace hardcoded testnet string with config constant",
  "good first issue,area:frontend,refactor,priority:low",
  `### Overview
Several components display "Network: Testnet" as a hardcoded badge text. These should read from getActiveNetwork().label instead.

### Acceptance Criteria
- [ ] src/app/markets/page.tsx - use getActiveNetwork() instead of hardcoded text
- [ ] src/app/assets/page.tsx - use getActiveNetwork() instead of hardcoded text
- [ ] src/app/analytics/page.tsx - use getActiveNetwork() instead of hardcoded text

### Hints
Import from @/lib/stellar/config:
\`\`\`ts
import { getActiveNetwork } from "@/lib/stellar/config";
const network = getActiveNetwork();
\`\`\``
);

issue(
  "Add loading skeletons to remaining route segments",
  "good first issue,ux,area:frontend,priority:medium",
  `### Overview
We added route-level loading.tsx files for swap, markets, assets, analytics, and portfolio. But some sub-routes still show a plain spinner.

### Acceptance Criteria
- [ ] Add skeleton loading states where plain spinners are used
- [ ] Skeletons match the layout of the page they replace
- [ ] Ensure loading state is scoped to the specific route segment

### Hints
Check existing loading.tsx files in src/app/*/loading.tsx for patterns.`
);

issue(
  "Add alt text to all images in the codebase",
  "good first issue,accessibility,area:frontend,priority:medium",
  `### Overview
Any <img> or <Image> (next/image) component should have meaningful alt text for screen readers.

### Acceptance Criteria
- [ ] Every <img> and <Image> in src/ has an alt attribute
- [ ] Decorative-only images use alt="" (not missing the attribute)
- [ ] Functional images (logos, icons in links) have descriptive alt text

### Hints
Next.js Image components also require alt - same rule applies.`
);

issue(
  "Add CONTRIBUTING.md section on commit conventions",
  "good first issue,documentation,priority:low",
  `### Overview
Our CONTRIBUTING.md does not mention that we follow Conventional Commits. Add a clear section.

### Acceptance Criteria
- [ ] Add a "Commit Conventions" section to CONTRIBUTING.md
- [ ] Include examples: feat:, fix:, docs:, chore:, refactor:, test:
- [ ] Mention that the PR template already enforces this via the checklist

### Hints
See https://www.conventionalcommits.org/ for the spec.`
);

issue(
  "Remove unused imports across the project",
  "good first issue,refactor,area:frontend,priority:low",
  `### Overview
Some files may have unused imports leftover from refactors. Clean them up.

### Acceptance Criteria
- [ ] Run npx eslint --fix and ensure no unused import warnings
- [ ] TypeScript strict mode catches unused locals
- [ ] No functional code changes - purely removing dead imports

### Hints
ESLint rule @typescript-eslint/no-unused-vars flags unused imports.
Run npm run lint first to see current warnings.`
);

issue(
  "Add type=button to all buttons that are not form submits",
  "good first issue,accessibility,area:frontend,priority:low",
  `### Overview
Buttons without explicit type default to type="submit", which can accidentally trigger form submissions when nested in forms.

### Acceptance Criteria
- [ ] All <button> elements not for form submission have type="button"
- [ ] Form submit buttons explicitly use type="submit"

### Hints
Run: grep -r "<button" src/components/ | grep -v "type=" to find offenders.`
);

issue(
  "Add env var validation at app startup",
  "good first issue,area:backend,priority:medium",
  `### Overview
Missing required environment variables currently fail silently at runtime. Add startup validation.

### Acceptance Criteria
- [ ] Create src/lib/server/env-check.ts that validates required env vars
- [ ] Required vars: NEXT_PUBLIC_STELLAR_NETWORK, contract IDs when on production
- [ ] Log clear warnings for missing optional vars

### Hints
Check src/lib/utils/env.ts for existing environment detection helpers.`
);

issue(
  "Add a .github/dependabot.yml config for automated dependency updates",
  "good first issue,area:deps,area:ci-cd,priority:low",
  `### Overview
Automate dependency updates with Dependabot so PRs are opened automatically for outdated packages.

### Acceptance Criteria
- [ ] Create .github/dependabot.yml with npm, Cargo, and GitHub Actions updates
- [ ] Set open-pull-requests-limit: 10
- [ ] Group minor/patch updates together

### Hints
See https://docs.github.com/en/code-security/dependabot/dependabot-version-updates`
);

issue(
  "Remove or replace unused boilerplate public assets",
  "good first issue,refactor,priority:low",
  `### Overview
The public/ directory contains Next.js boilerplate SVGs (file.svg, globe.svg, next.svg, vercel.svg, window.svg) that are not used anywhere in the app.

### Acceptance Criteria
- [ ] Check all references to these files in the codebase
- [ ] Remove any that are unused; replace used ones with custom TarshishDEX assets
- [ ] npm run build still succeeds`
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. BUGS (16)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Swap widget: amount input accepts negative numbers via paste",
  "bug,area:swap,priority:high",
  `### Summary
The swap amount input can accept negative values when pasted, causing BigNumber errors downstream.

### Steps to Reproduce
1. Go to /swap
2. Type -100 in the amount field
3. Click "Review Swap"

### Expected Behavior
Negative amounts should be prevented at the input level.

### Acceptance Criteria
- [ ] Cannot enter negative amounts in the swap input
- [ ] Paste of negative numbers is filtered to absolute value or rejected
- [ ] Add a unit test for the sanitization logic

### Hints
The swap widget is at src/components/swap/swap-widget.tsx. Use Math.abs() or min="0" attribute.`
);

issue(
  "Portfolio fetches fail silently when Horizon is rate-limited",
  "bug,area:portfolio,area:backend,priority:high",
  `### Summary
When Horizon rate-limits the server, portfolio API calls return 502 without retry.

### Acceptance Criteria
- [ ] API routes that call Horizon use the existing retry utility (src/lib/utils/retry.ts)
- [ ] Rate-limit errors (HTTP 429 from Horizon) are distinguished from other failures
- [ ] UI shows "Horizon rate limit - retrying in X seconds" instead of generic error
- [ ] Circuit breaker opens for Horizon 429s

### Hints
Check src/app/api/portfolio/[address]/route.ts - it catches errors but does not retry.`
);

issue(
  "Multi-hop routing returns null for valid bridge pairs when orderbook is thin",
  "bug,area:swap,priority:high",
  `### Summary
When the first hop orderbook is thin, simulateBridgeRoute returns early with fill: null instead of returning the best partial fill.

### Acceptance Criteria
- [ ] simulateBridgeRoute returns a partial fill when the first hop partially fills
- [ ] Partial fills are scored correctly in selectBestRoute
- [ ] A unit test covers this case

### Hints
The relevant code is in src/lib/stellar/routing.ts, simulateBridgeRoute function.
The firstFill.fullyFilled check gates the second hop too strictly.`
);

issue(
  "Toast notifications stack without limit - can overflow viewport",
  "bug,ux,area:frontend,priority:medium",
  `### Summary
The toast store appends without capping. If a user rapidly clicks actions, dozens of toasts stack up.

### Acceptance Criteria
- [ ] Maximum 5 visible toasts at once
- [ ] New toasts beyond the limit dismiss the oldest toast
- [ ] Add a unit test in toast.test.tsx for the MAX_TOASTS cap

### Hints
The toast store is a zustand store. Add a MAX_TOASTS = 5 constant.`
);

issue(
  "Market stats page crashes for tokens without Horizon trade data",
  "bug,area:markets,priority:medium",
  `### Summary
getMarketStatsForTokens fails when some tokens have no trade history, causing the entire call to 502.

### Acceptance Criteria
- [ ] Each token stats query is individually try-caught
- [ ] Tokens without data are skipped instead of causing batch failure
- [ ] API response includes a skipped count for tokens with no data

### Hints
File: src/lib/stellar/prices.ts, function getMarketStatsForTokens.
Consider using Promise.allSettled instead of Promise.all.`
);

issue(
  "Orderbook depth chart does not update when switching trading pairs",
  "bug,area:markets,area:frontend,priority:medium",
  `### Summary
The OrderbookDepth component may not re-fetch when the pair changes.

### Acceptance Criteria
- [ ] Component re-fetches orderbook data when base or counter props change
- [ ] Loading state is shown during the fetch transition
- [ ] TanStack Query cache keys include both asset identifiers

### Hints
The query hook is useOrderbook in src/lib/stellar/queries.ts.
Ensure query key array includes both selling and buying asset strings.`
);

issue(
  "Freighter wallet connection state persists after extension is disabled",
  "bug,area:wallet,priority:medium",
  `### Summary
If a user disables the Freighter extension while connected, the wallet store still shows connected state.

### Acceptance Criteria
- [ ] Poll wallet availability periodically (every 30s) using isWalletAvailable()
- [ ] Auto-disconnect when the wallet extension is no longer detected
- [ ] Show a toast notification about disconnection

### Hints
The wallet store is at src/lib/stellar/wallet-store.ts.
The availability check is in src/lib/stellar/wallet-kit.ts.`
);

issue(
  "SSE stream leaks resources when clients disconnect without clean close",
  "bug,area:api,area:backend,priority:high",
  `### Summary
The SSE stream in src/app/api/events/route.ts may leak file descriptors on abrupt client disconnects.

### Acceptance Criteria
- [ ] Heartbeat interval cleanup is handled on abort
- [ ] Add a maximum stream duration (10 minutes) for graceful close
- [ ] Cleanup function always called via signal.addEventListener

### Hints
File: src/app/api/events/route.ts. Ensure cancel() method cleans up properly.`
);

issue(
  "Candlestick chart shows empty state without explanation when no trade data exists",
  "bug,ux,area:analytics,priority:medium",
  `### Summary
The PriceChartPanel displays an empty chart area without any empty-state message.

### Acceptance Criteria
- [ ] Show "No trade data available for this pair" when candles array is empty
- [ ] Provide a suggestion to try a different resolution or pair
- [ ] Match the existing EmptyResults component style

### Hints
Check src/components/analytics/price-chart-panel.tsx and src/components/ui/empty-results.tsx.`
);

issue(
  "Asset search is case-sensitive - lowercase queries miss uppercase assets",
  "bug,ux,area:assets,priority:medium",
  `### Summary
The asset browser search filters are case-sensitive. Searching 'usdc' will not find 'USDC'.

### Acceptance Criteria
- [ ] Asset code search is case-insensitive
- [ ] Issuer search is case-insensitive
- [ ] Search term is normalized before filtering

### Hints
File: src/components/assets/asset-browser.tsx.
Use .toLowerCase() on both the search term and the asset code when comparing.`
);

issue(
  "Swap execution: insufficient XLM for trustline causes unclear error",
  "bug,area:swap,area:wallet,priority:high",
  `### Summary
When swapping to a new asset, the engine adds a changeTrust operation. If the account lacks XLM for the trustline reserve (0.5 XLM), the error is cryptic.

### Acceptance Criteria
- [ ] Pre-simulation check: verify account has enough XLM for trustline reserve
- [ ] Show clear error: "Insufficient XLM for trustline reserve (0.5 XLM required)"
- [ ] Include this check in the swap simulation phase

### Hints
The trustline logic is in src/lib/stellar/swap-execution.ts, function needsTrustline.`
);

issue(
  "Trade history pagination: Load More button disappears after first page",
  "bug,area:portfolio,priority:medium",
  `### Summary
The trade history pagination may not properly track the cursor for subsequent pages.

### Acceptance Criteria
- [ ] Cursor-based pagination correctly advances to page 2, 3, etc.
- [ ] Load More is visible as long as there are more records
- [ ] No more trades message appears when exhausted

### Hints
Check src/components/portfolio/trade-history.tsx and src/lib/stellar/history.ts.`
);

issue(
  "API health endpoint should include contract and RPC health",
  "bug,area:api,priority:medium",
  `### Summary
GET /api/health only probes Horizon. It should also check Soroban RPC and contract reachability.

### Acceptance Criteria
- [ ] Health endpoint includes soroban_rpc section with reachability status
- [ ] Status field reflects the worst of all checks (ok/degraded/down)
- [ ] Contract reachability checked via read-only get_version call

### Hints
File: src/app/api/health/route.ts. RPC URL is in getActiveNetwork().`
);

issue(
  "Wallet address not validated against active network passphrase on connect",
  "bug,area:wallet,security,priority:high",
  `### Summary
The wallet store accepts any connected address without verifying it belongs to the active network.

### Acceptance Criteria
- [ ] Verify wallet event networkPassphrase matches getActiveNetwork().passphrase
- [ ] Show warning toast and disconnect if wrong network detected
- [ ] Add this check in src/components/providers/wallet-provider.tsx

### Hints
The wallet events subscription is in subscribeWalletEvents in src/lib/stellar/wallet-kit.ts.`
);

issue(
  "Swap route JSON response needs consistent formatting",
  "bug,area:api,security,priority:medium",
  `### Summary
GET /api/swap/quote returns raw strings for minReceived and feeEstimateXlm. These should be consistently formatted.

### Acceptance Criteria
- [ ] Response fields are consistently formatted (always strings, proper decimals)
- [ ] priceImpactPct is rounded to 2 decimal places
- [ ] Documentation matches the actual response shape

### Hints
The route handler is src/app/api/swap/quote/route.ts.
The type is defined in src/lib/stellar/types.ts.`
);

issue(
  "Token selector modal has no search debounce - fires on every keystroke",
  "bug,performance,area:swap,priority:medium",
  `### Summary
The TokenSelector component triggers asset lookups on every keystroke without debouncing.

### Acceptance Criteria
- [ ] Search input is debounced (300ms)
- [ ] Previous in-flight request is cancelled when a new search starts
- [ ] Use the existing useDebounce hook

### Hints
File: src/components/swap/token-selector.tsx.
Import useDebounce from src/lib/hooks/use-debounce.ts.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. ENHANCEMENTS (22)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add price alert system for watched assets",
  "enhancement,area:markets,ux,priority:high",
  `### Overview
Let users set price alerts for watched assets. When the price crosses a threshold, show a browser notification.

### Acceptance Criteria
- [ ] "Set Alert" button on the market table row
- [ ] Modal: choose asset, above/below, target price
- [ ] Alerts stored in localStorage
- [ ] Poll market stats API every 60s and check against stored alerts
- [ ] Use the Notifications API for browser alerts
- [ ] Max 5 alerts per user

### Hints
A partial price alert panel exists at src/components/features/price-alert-panel.tsx. Wire it up fully.`
);

issue(
  "Implement token watchlist with star/bookmark functionality",
  "enhancement,area:markets,area:portfolio,ux,priority:high",
  `### Overview
Users should be able to star/bookmark assets to a personal watchlist for quick access.

### Acceptance Criteria
- [ ] Star icon on each market table row and asset browser row
- [ ] Watchlist stored in localStorage
- [ ] A "Watchlist" filter tab on the markets page
- [ ] Watchlisted assets appear at the top of the market table
- [ ] Max 20 watchlisted assets

### Hints
Create src/lib/hooks/use-watchlist.ts using the useLocalStorage hook pattern.`
);

issue(
  "Add dark/light mode system preference detection and toggle persistence",
  "enhancement,ux,area:frontend,priority:medium",
  `### Overview
A ThemeProvider and useTheme hook exist (src/lib/theme.tsx) but are not wired into the layout.

### Acceptance Criteria
- [ ] Wrap the app layout with ThemeProvider
- [ ] Add a theme toggle button in the header using ThemeToggle component
- [ ] Theme persists across page refreshes (localStorage)
- [ ] System preference is respected on first visit

### Hints
Files: src/lib/theme.tsx (provider), src/components/ui/theme-toggle.tsx (button), src/app/layout.tsx (wrap here).`
);

issue(
  "Add keyboard shortcut for global command palette (Cmd+K)",
  "enhancement,ux,area:frontend,priority:medium",
  `### Overview
A CommandPalette component exists. Wire it to Cmd+K / Ctrl+K for global search and navigation.

### Acceptance Criteria
- [ ] Cmd+K / Ctrl+K opens the command palette modal
- [ ] Search across: assets (by code), pages (Swap, Markets, Portfolio, etc.)
- [ ] Default action: navigate to the selected item
- [ ] Escape closes, FocusTrap inside

### Hints
Components: src/components/ui/command-palette.tsx, src/lib/hooks/use-keyboard-shortcuts.ts.`
);

issue(
  "Add transaction simulation preview in the swap widget",
  "enhancement,area:swap,ux,priority:high",
  `### Overview
Users should see a detailed simulation breakdown before signing, not just a brief summary.

### Acceptance Criteria
- [ ] Route path visualization (A -> B or A -> XLM -> B)
- [ ] Execution price with 7 decimal places
- [ ] Price impact % with color coding (green < 1%, yellow 1-5%, red > 5%)
- [ ] Estimated fee, minimum received, warning list
- [ ] Mobile: collapsible sections

### Hints
The swap widget is src/components/swap/swap-widget.tsx.
The SwapRoute type in src/lib/stellar/types.ts has all the data.`
);

issue(
  "Add CSV export for portfolio holdings and trade history",
  "enhancement,area:portfolio,ux,priority:medium",
  `### Overview
Let users export their portfolio balances and trade history as CSV for tax reporting.

### Acceptance Criteria
- [ ] "Export CSV" button on the portfolio page
- [ ] Export options: balances only, trade history only, or both
- [ ] CSV includes headers and properly formatted columns
- [ ] Download triggers via blob URL

### Hints
Use Blob and URL.createObjectURL for download triggers.`
);

issue(
  "Add trade notifications - toast when a watched pair executes a trade",
  "enhancement,area:markets,ux,priority:medium",
  `### Overview
Stream live trades and show toasts for significant moves on watched pairs.

### Acceptance Criteria
- [ ] Subscribe to SSE events for watched pairs
- [ ] Show toast: "XLM/USDC: 10,000 XLM traded at 0.1025 USD"
- [ ] Only show for pairs the user has starred
- [ ] Debounce: max 1 per pair per 5 seconds

### Hints
The SSE stream is at /api/events. Use streamTradesRecords from src/lib/stellar/live.ts.`
);

issue(
  "Add a slippage preset selector (0.1%, 0.5%, 1%, 3%) with custom input",
  "enhancement,area:swap,ux,priority:medium",
  `### Overview
The swap widget currently only has a custom slippage input. Add preset buttons.

### Acceptance Criteria
- [ ] Preset buttons: 0.1%, 0.5%, 1% (default), 3%, Custom
- [ ] Clicking a preset updates the slippage input and the quote
- [ ] On-chain preferences save the last-used slippage

### Hints
File: src/components/swap/swap-widget.tsx and src/components/swap/on-chain-preferences.tsx.`
);

issue(
  "Add a network status indicator to the header",
  "enhancement,area:frontend,area:backend,ux,priority:low",
  `### Overview
Show the current Stellar network status in the header - latency and latest ledger.

### Acceptance Criteria
- [ ] Poll /api/health every 30s
- [ ] Show green/yellow/red dot with latency in ms
- [ ] Show latest ledger sequence number
- [ ] On click, navigate to Stellar Expert

### Hints
The health endpoint returns horizon.latencyMs.`
);

issue(
  "Implement swap history panel showing recent user transactions",
  "enhancement,area:swap,ux,priority:medium",
  `### Overview
After executing swaps, users should see recent transactions below the swap widget.

### Acceptance Criteria
- [ ] Show last 10 swap transactions (from localStorage or Horizon)
- [ ] Each entry: timestamp, amounts, tx hash (linked to explorer)
- [ ] Status icon: pending, success, failed
- [ ] History persists across page refreshes

### Hints
Store swap results in localStorage. Use TransactionStatusIcon component for status.`
);

issue(
  "Add responsive mobile bottom navigation bar",
  "enhancement,ux,area:frontend,priority:medium",
  `### Overview
On mobile, add a persistent bottom nav bar for quick access.

### Acceptance Criteria
- [ ] Bottom nav visible on screens < 768px width
- [ ] Icons + labels: Swap, Markets, Portfolio, Assets, More
- [ ] Active route is highlighted
- [ ] Safe area padding for iOS

### Hints
Use the useMediaQuery hook for responsive detection.`
);

issue(
  "Add fee comparison showing estimated savings vs centralized exchanges",
  "enhancement,area:swap,ux,priority:low",
  `### Overview
Show users how much they save on fees vs a 0.1% CEX fee.

### Acceptance Criteria
- [ ] Calculate savings: (amount * 0.001) - actual Stellar fee
- [ ] Display as "You saved ~$X.XX vs. centralized exchanges"
- [ ] Only show when savings are positive

### Hints
The Stellar fee is estimated in estimateSwapFeeXlm in src/lib/stellar/simulation.ts.`
);

issue(
  "Add asset price sparkline in the market table",
  "enhancement,area:markets,ux,priority:medium",
  `### Overview
Show a mini 7-day price sparkline next to each asset in the market table.

### Acceptance Criteria
- [ ] Fetch 7-day OHLCV data for each asset
- [ ] Render a small line chart (sparkline) inline in the table cell
- [ ] Color: green for upward trend, red for downward
- [ ] Tooltip on hover showing 7d high/low

### Hints
Lightweight-charts can render small charts, or use a simple SVG path.`
);

issue(
  "Add an asset detail page at /assets/[code] with full issuer info",
  "enhancement,area:assets,ux,priority:high",
  `### Overview
Clicking an asset should navigate to a detail page with issuer info, stats, and recent trades.

### Acceptance Criteria
- [ ] New route: src/app/assets/[code]/page.tsx
- [ ] Display: asset code, issuer address, domain, flags
- [ ] Trustline count, total supply
- [ ] Recent trades for the asset (last 20)
- [ ] SEO metadata for the asset page

### Hints
Create a dynamic route. Use fetchAssetCatalog for issuer details.`
);

issue(
  "Add percentage-based input mode for swap amounts",
  "enhancement,area:swap,ux,priority:medium",
  `### Overview
Let users enter a percentage of their balance (25%, 50%, 75%, MAX) for swap amounts.

### Acceptance Criteria
- [ ] Percentage buttons: 25%, 50%, 75%, MAX
- [ ] Clicking calculates amount from wallet balance
- [ ] MAX uses full balance minus XLM reserve for fees
- [ ] Buttons disabled when wallet not connected

### Hints
Fetch balance using fetchXlmBalance from src/lib/stellar/account.ts.`
);

issue(
  "Add sorting and filtering to the trade history table",
  "enhancement,area:portfolio,ux,priority:medium",
  `### Overview
The trade history table should allow sorting by amount and filtering by asset.

### Acceptance Criteria
- [ ] Sort by: date, amount, asset pair
- [ ] Filter by asset code (e.g., show only USDC trades)
- [ ] Active sort/filter state shown with visual indicators

### Hints
File: src/components/portfolio/trade-history.tsx.`
);

issue(
  "Add a real-time last-trade ticker banner at the top of the markets page",
  "enhancement,area:markets,ux,priority:medium",
  `### Overview
A scrolling ticker showing recent trades for a "live exchange" feel.

### Acceptance Criteria
- [ ] Ticker bar at the top of the markets page
- [ ] Shows: asset pair, price, amount, time ago
- [ ] Auto-scrolls or animates new trades
- [ ] Subscribes to SSE events stream

### Hints
SSE endpoint: /api/events. Use streamTradesRecords from src/lib/stellar/live.ts.`
);

issue(
  "Add tooltips explaining market stats metrics",
  "enhancement,ux,documentation,area:markets,priority:medium",
  `### Overview
Add info tooltips for 24h volume, spread, mid price, and other metrics.

### Acceptance Criteria
- [ ] Info icon next to each column header
- [ ] Hovering shows tooltip with 1-2 sentence explanation
- [ ] Use existing Tooltip component

### Hints
Column headers in src/components/markets/market-table.tsx.
Tooltip component at src/components/ui/tooltip.tsx.`
);

issue(
  "Add portfolio value chart - track account value over time",
  "enhancement,area:portfolio,ux,priority:high",
  `### Overview
Show a line chart of portfolio total value over the last 30 days.

### Acceptance Criteria
- [ ] Track portfolio value snapshots daily (localStorage)
- [ ] Render line chart of total value over time
- [ ] 7d and 30d toggles
- [ ] Empty state: "Connect wallet and check back tomorrow"

### Hints
Store daily snapshots as { date, value } objects. Use lightweight-charts.`
);

issue(
  "Add copy-to-clipboard for all addresses, hashes, and contract IDs",
  "enhancement,ux,area:frontend,priority:medium",
  `### Overview
Any displayed address or hash should be clickable to copy with a success toast.

### Acceptance Criteria
- [ ] Every address/hash display uses CopyButton component
- [ ] Clicking copies to clipboard
- [ ] Toast: "Copied to clipboard"
- [ ] Visual feedback: icon changes to checkmark for 2s

### Hints
CopyButton at src/components/ui/copy-button.tsx.`
);

issue(
  "Truncate long issuer addresses in asset browser with tooltip",
  "enhancement,ux,area:assets,priority:low",
  `### Overview
Issuer addresses are 56 characters long and break the table layout. Truncate them.

### Acceptance Criteria
- [ ] Show first 8 and last 6 characters: "GABCDEF...XYZ123"
- [ ] Full address in tooltip on hover
- [ ] Copy button next to truncated address

### Hints
File: src/components/assets/asset-browser.tsx. Utility: src/lib/utils/truncate-hash.ts.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 4. TESTING (10)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add unit tests for formatting utilities (formatNumber, formatXlm, formatUsd)",
  "testing,area:testing,priority:high",
  `### Overview
The formatting utilities in src/lib/utils.ts have partial coverage. Add comprehensive tests.

### Acceptance Criteria
- [ ] Test formatNumber: large numbers, decimals, negative, zero
- [ ] Test formatXlm: typical amounts, zero, very small amounts
- [ ] Test formatUsd: dollar formatting, cents, zero
- [ ] Test edge cases: NaN, Infinity, undefined

### Hints
Existing tests in src/lib/utils.test.ts. Follow the describe/it patterns.`
);

issue(
  "Add integration tests for the swap quote API endpoint",
  "testing,area:testing,area:api,priority:high",
  `### Overview
The /api/swap/quote endpoint has no integration tests.

### Acceptance Criteria
- [ ] Test valid quote returns 200 with expected shape
- [ ] Test invalid asset returns 400
- [ ] Test missing amount returns 400
- [ ] Test same input/output returns 404
- [ ] Test negative amount returns 400

### Hints
Create src/app/api/swap/quote/route.test.ts. Use NextRequest to call the handler.`
);

issue(
  "Add E2E test for the complete swap flow",
  "testing,area:swap,e2e,priority:high",
  `### Overview
Add a Playwright test for the complete swap quote flow.

### Acceptance Criteria
- [ ] Navigate to /swap, select XLM as input, USDC as output
- [ ] Enter amount "100", verify quote returned

### Hints
E2E tests at e2e/smoke.spec.ts. Playwright config at playwright.config.ts.`
);

issue(
  "Add test for the rate limiter middleware",
  "testing,area:backend,area:testing,priority:high",
  `### Overview
The rate limiter has no tests. Add unit tests.

### Acceptance Criteria
- [ ] Test: requests under limit pass through
- [ ] Test: requests over limit return 429
- [ ] Test: window resets after expiry
- [ ] Test: different IPs have separate limits
- [ ] Test: swap/quote gets stricter limit

### Hints
Create src/lib/server/rate-limit.test.ts. Mock NextRequest.`
);

issue(
  "Add edge case tests for selectBestRoute",
  "testing,area:swap,area:testing,priority:medium",
  `### Overview
selectBestRoute has basic tests. Add edge case coverage.

### Acceptance Criteria
- [ ] Empty array -> null
- [ ] Single route -> returns that route
- [ ] Equal output, different hops -> picks fewer hops

### Hints
Existing tests: src/lib/stellar/routing.test.ts.`
);

issue(
  "Add test for wallet store - connect, disconnect, account switch",
  "testing,area:wallet,area:testing,priority:medium",
  `### Overview
The Zustand wallet store has no tests.

### Acceptance Criteria
- [ ] Test initial state (disconnected)
- [ ] Test connect updates address
- [ ] Test disconnect clears address
- [ ] Test persistence round-trip

### Hints
Create src/lib/stellar/wallet-store.test.ts. Mock wallet-kit with vi.mock().`
);

issue(
  "Add test for the input validation utilities",
  "testing,area:testing,priority:medium",
  `### Overview
Validators in src/lib/utils/validators.ts have no tests.

### Acceptance Criteria
- [ ] Test isValidUrl, isValidEmail, isValidHexColor
- [ ] Test isValidDomain, isValidPercentage, isValidPositiveInteger
- [ ] Cover valid, invalid, and edge case inputs

### Hints
Create src/lib/utils/validators.test.ts.`
);

issue(
  "Add Playwright visual regression tests for critical pages",
  "testing,area:testing,ux,priority:medium",
  `### Overview
Catch UI regressions with Playwright screenshot comparisons.

### Acceptance Criteria
- [ ] Screenshot tests for home, swap, markets, portfolio pages
- [ ] Desktop (1280x720) and mobile (390x844) viewports
- [ ] Baseline screenshots stored in the repo

### Hints
Use page.screenshot() with fullPage: true and toMatchSnapshot().`
);

issue(
  "Add test coverage report to CI as a PR comment",
  "testing,area:ci-cd,priority:medium",
  `### Overview
Coverage is computed but not surfaced visibly in PRs.

### Acceptance Criteria
- [ ] Comment the coverage delta on every PR
- [ ] Fail build if coverage drops below thresholds

### Hints
Coverage thresholds are in vitest.config.ts. CI workflow: .github/workflows/ci.yml.`
);

issue(
  "Add contract fuzz testing with proptest",
  "testing,area:smart-contracts,area:testing,priority:medium",
  `### Overview
Contract tests use fixed values. Add property-based testing to catch edge cases.

### Acceptance Criteria
- [ ] Add proptest to contract dev-dependencies
- [ ] Fuzz test set_preferences with random slippage values
- [ ] Fuzz test batch_get_preferences with random account arrays
- [ ] Fuzz test publish with random price values

### Hints
Add proptest = "1" to [dev-dependencies] in the contract Cargo.toml.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 5. DOCUMENTATION (10)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Create API reference docs with request/response examples for every endpoint",
  "documentation,area:docs,area:api,priority:high",
  `### Overview
Create comprehensive API docs with curl examples and response JSON.

### Acceptance Criteria
- [ ] Create docs/api-reference.md
- [ ] Each endpoint: method, URL, query params, curl example, response JSON
- [ ] Error responses documented (400, 404, 429, 502)
- [ ] Note SSE endpoints

### Hints
Endpoints defined in src/app/api/*/route.ts. Use README API section as starting point.`
);

issue(
  "Add JSDoc comments to all exported functions in the Stellar services layer",
  "documentation,area:docs,priority:high",
  `### Overview
All exported functions in src/lib/stellar/ need JSDoc documentation.

### Acceptance Criteria
- [ ] Every exported function has @param and @returns JSDoc
- [ ] Every exported function has a one-line summary
- [ ] Types documented where non-obvious

### Hints
Files: account.ts, asset.ts, catalog.ts, config.ts, history.ts, horizon.ts, live.ts, orderbook.ts, prices.ts, queries.ts, routing.ts, simulation.ts, swap-execution.ts, tokens.ts, types.ts, wallet-kit.ts, wallet-store.ts`
);

issue(
  "Add architecture decision records (ADRs) for key design choices",
  "documentation,area:docs,priority:medium",
  `### Overview
Document the rationale behind major architectural decisions.

### Acceptance Criteria
- [ ] Create docs/adr/ directory
- [ ] ADR 001: Why Next.js App Router
- [ ] ADR 002: Why TanStack Query over SWR
- [ ] ADR 003: Why Zustand over Redux
- [ ] ADR 004: Why standalone Docker output
- [ ] ADR 005: Why SSE over WebSockets

### Hints
Format: https://adr.github.io/madr/`
);

issue(
  "Add a troubleshooting guide for common wallet connection issues",
  "documentation,area:wallet,area:docs,priority:medium",
  `### Overview
Wallet connection problems are the most common support issue.

### Acceptance Criteria
- [ ] Create docs/troubleshooting.md
- [ ] Cover: "Freighter not detected", "Wrong network", "Transaction rejected", "Insufficient balance"
- [ ] Include screenshots where helpful

### Hints
Wallet provider at src/components/providers/wallet-provider.tsx.`
);

issue(
  "Create a Swagger/OpenAPI spec for the Developer API",
  "documentation,area:api,area:docs,priority:medium",
  `### Overview
Provide an OpenAPI 3.0 specification for the REST API.

### Acceptance Criteria
- [ ] Create docs/openapi.yml
- [ ] All 9 GET endpoints documented with parameters, responses, and examples
- [ ] Health endpoint and SSE endpoint included
- [ ] Validate with an OpenAPI linter

### Hints
Use https://editor.swagger.io/ to validate.`
);

issue(
  "Add code examples to the README for using Stellar services externally",
  "documentation,area:docs,priority:medium",
  `### Overview
Show developers how to import and use TarshishDEX services in their own projects.

### Acceptance Criteria
- [ ] Add "Using the Services" section to README
- [ ] Example: swap quote using findBestRoute
- [ ] Example: portfolio fetch using fetchPortfolioSummary
- [ ] Example: live trade streaming using streamTradesRecords

### Hints
Services are in src/lib/stellar/. Examples should be self-contained.`
);

issue(
  "Create a project roadmap with community-votable feature requests",
  "documentation,area:docs,priority:low",
  `### Overview
Convert README roadmap into a living GitHub Project board with community voting.

### Acceptance Criteria
- [ ] Create ROADMAP.md with Now, Next, Later columns
- [ ] Enable GitHub Discussions for feature voting
- [ ] Add discussion categories: Idea, Voting, Planned, In Progress`
);

issue(
  "Add inline documentation for CSS design system tokens",
  "documentation,area:design,area:docs,priority:medium",
  `### Overview
CSS custom properties in src/app/globals.css need comments explaining their purpose.

### Acceptance Criteria
- [ ] Each CSS variable in :root has a comment
- [ ] Grouped by category: Background, Text, Borders, Accents, Surfaces

### Hints
File: src/app/globals.css. Look for @theme and :root blocks.`
);

issue(
  "Add a glossary of Stellar/DEX/DeFi terms for newcomers",
  "documentation,area:docs,priority:low",
  `### Overview
Newcomers may not know Stellar-specific terms. Create a glossary.

### Acceptance Criteria
- [ ] Create docs/glossary.md
- [ ] Define 20+ terms: trustline, stroop, lumen, orderbook, spread, mid price, slippage, path payment, Soroban, Horizon, SSE
- [ ] Each definition is 1-2 sentences, beginner-friendly`
);

issue(
  "Create a project presentation slide deck for hackathon judges",
  "documentation,area:docs,priority:medium",
  `### Overview
A polished slide deck helps communicate the project to judges.

### Acceptance Criteria
- [ ] Create docs/pitch-deck.md with slides:
  - Problem, Solution, Demo screenshots, Technical highlights, Live demo link
- [ ] Keep to 10 slides max
- [ ] Use TarshishDEX brand colors`
);

// ═══════════════════════════════════════════════════════════════════════════
// 6. SMART CONTRACTS (10)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add an emergency pause mechanism to the market-oracle contract",
  "enhancement,area:smart-contracts,security,priority:high",
  `### Overview
The market-oracle contract cannot be paused in an emergency. Add a circuit-breaker.

### Acceptance Criteria
- [ ] Add paused: bool to instance storage
- [ ] set_paused(env, paused: bool) - admin only
- [ ] All publisher writes check the pause flag
- [ ] Emit a ContractPaused event
- [ ] Unit tests for paused/unpaused states

### Hints
File: src/contracts/market-oracle/src/lib.rs. Add DataKey::Paused.`
);

issue(
  "Add Soroban event indexing documentation",
  "enhancement,area:smart-contracts,area:docs,priority:medium",
  `### Overview
Document how to query and index contract events.

### Acceptance Criteria
- [ ] Add section to docs/deployment.md about event indexing
- [ ] Show how to query events via Soroban RPC getEvents method
- [ ] Include example filters for each event type
- [ ] Mention Sophon and Mercury as indexing options

### Hints
Event types: Initialized, PreferencesChanged, AdminTransferred, PricePublished, PublisherUpdated.`
);

issue(
  "Add trigger orders (stop-loss / take-profit) to trading-preferences contract",
  "enhancement,area:smart-contracts,epic,priority:medium",
  `### Overview
Extend the contract to support simple trigger orders queryable by off-chain bots.

### Acceptance Criteria
- [ ] New struct: TriggerOrder { asset, trigger_price, order_type }
- [ ] set_trigger / get_triggers functions
- [ ] Emit TriggerSet event
- [ ] Unit tests for set/get/update/delete

### Hints
Follow existing Preferences pattern. Use DataKey::Triggers(Address).`
);

issue(
  "Add asset symbol validation in the market-oracle contract",
  "enhancement,area:smart-contracts,priority:medium",
  `### Overview
The publish function accepts any Symbol as base/counter. Add validation for asset code format.

### Acceptance Criteria
- [ ] Asset symbols must be 1-12 alphanumeric characters
- [ ] Reject with Error::InvalidAsset if empty or too long
- [ ] Unit test for valid/invalid symbols

### Hints
File: src/contracts/market-oracle/src/lib.rs. Add Error::InvalidAsset variant.`
);

issue(
  "Add a contract migration guide for upgrading to new contract versions",
  "documentation,area:smart-contracts,priority:medium",
  `### Overview
Document how to migrate state between contract versions.

### Acceptance Criteria
- [ ] Create docs/contract-migration.md
- [ ] Explain immutable-deploy pattern
- [ ] Show how to read old state and write to new contract
- [ ] Include migration script example

### Hints
Contracts deployed at addresses in docs/deployment.md.`
);

issue(
  "Add a batch-publish function to the market-oracle",
  "enhancement,area:smart-contracts,performance,priority:medium",
  `### Overview
Publishers make one transaction per pair. Add batch function for efficiency.

### Acceptance Criteria
- [ ] batch_publish(env, publisher, observations: Vec<(Symbol, Symbol, i128)>)
- [ ] Auth check once, validate individually, partial success allowed
- [ ] Unit test: batch of 3, batch with one invalid price

### Hints
Reuse publish function logic in a loop within the contract.`
);

issue(
  "Add a query to get all publisher addresses and their status",
  "enhancement,area:smart-contracts,priority:low",
  `### Overview
There is no way to list all authorized publishers without knowing their addresses.

### Acceptance Criteria
- [ ] Track publisher addresses in instance storage
- [ ] get_all_publishers(env) -> Vec<(Address, bool)>
- [ ] Update set_publisher to maintain the list

### Hints
Use Vec<(Address, bool)> stored under DataKey::PublisherList.`
);

issue(
  "Add Oracle price confidence interval (low/high estimates)",
  "enhancement,area:smart-contracts,priority:medium",
  `### Overview
The oracle publishes a single price. Add low/high estimates for confidence intervals.

### Acceptance Criteria
- [ ] Extend Observation struct: add price_low, price_high
- [ ] Validate: price_low <= price <= price_high (all positive)
- [ ] Update existing tests and TypeScript client

### Hints
File: src/contracts/market-oracle/src/lib.rs. TS client: src/lib/soroban/market-oracle.ts.`
);

issue(
  "Add Soroban RPC health check to the health endpoint",
  "enhancement,area:smart-contracts,area:api,priority:medium",
  `### Overview
GET /api/health should verify deployed contracts are reachable and responding.

### Acceptance Criteria
- [ ] Call get_version() on both deployed contracts
- [ ] Include contracts section in health response
- [ ] If unreachable, status = "degraded"
- [ ] Timeout each contract call at 5 seconds

### Hints
Health endpoint: src/app/api/health/route.ts. Use Soroban client from src/lib/soroban/.`
);

issue(
  "Audit contracts for missing events - ensure all state changes emit events",
  "enhancement,area:smart-contracts,priority:medium",
  `### Overview
Verify every state-changing function emits a typed contract event.

### Acceptance Criteria
- [ ] set_version emits VersionSet (done)
- [ ] transfer_admin emits AdminTransferred (done)
- [ ] remove_preferences emits PreferencesChanged (done)
- [ ] All other state changes emit events with relevant data

### Hints
Files: src/contracts/trading-preferences/src/lib.rs, src/contracts/market-oracle/src/lib.rs.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 7. DEVOPS / CI-CD (6)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add Docker image scanning with Trivy or Docker Scout",
  "enhancement,area:ci-cd,security,priority:high",
  `### Overview
Scan the Docker image for known vulnerabilities before pushing.

### Acceptance Criteria
- [ ] Add CI job that builds Docker image and scans it
- [ ] Fail on HIGH/CRITICAL vulnerabilities
- [ ] Upload scan report as artifact

### Hints
CI file: .github/workflows/ci.yml. Use docker scout quickview or trivy image.`
);

issue(
  "Add stale issue/PR automation to close inactive items after 90 days",
  "enhancement,area:ci-cd,priority:low",
  `### Overview
Automatically label and close issues/PRs inactive for 90 days.

### Acceptance Criteria
- [ ] Create .github/workflows/stale.yml with actions/stale
- [ ] Stale after 60 days, close after 30 more
- [ ] Exempt epic and security labels
- [ ] Comment before closing

### Hints
GitHub Action: https://github.com/actions/stale`
);

issue(
  "Add bundle size analysis to CI",
  "enhancement,area:ci-cd,performance,priority:medium",
  `### Overview
Track Next.js bundle sizes and fail on significant increases.

### Acceptance Criteria
- [ ] Add @next/bundle-analyzer to dev dependencies
- [ ] CI job builds and captures bundle sizes
- [ ] Warn on >5% increase, fail on >20% increase

### Hints
Use ANALYZE=true next build or nextjs-bundle-analysis GitHub Action.`
);

issue(
  "Add pre-commit hooks via husky (lint-staged already configured)",
  "enhancement,area:ci-cd,priority:medium",
  `### Overview
We have .lintstagedrc.json but husky is not installed.

### Acceptance Criteria
- [ ] Install husky as dev dependency
- [ ] Create .husky/pre-commit hook running npx lint-staged
- [ ] Create .husky/pre-push hook running typecheck and tests
- [ ] Document in CONTRIBUTING.md`
);

issue(
  "Add npm run dev:prod script for local production testing",
  "enhancement,area:devops,priority:low",
  `### Overview
Developers need an easy way to test the production build locally.

### Acceptance Criteria
- [ ] Add "dev:prod": "npm run build && npm start" to package.json scripts
- [ ] Document in README`
);

issue(
  "Add a .env.staging template for the QA environment",
  "enhancement,area:devops,priority:low",
  `### Overview
Add a staging template alongside .env.example and .env.test.

### Acceptance Criteria
- [ ] Create .env.staging.example with testnet config and debug logging
- [ ] Document in README

### Hints
Use .env.example as the starting template.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 8. PERFORMANCE (4)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Lazy-load heavy chart components to reduce initial page load JS",
  "performance,area:analytics,area:frontend,priority:medium",
  `### Overview
The candlestick chart and its data payload add significant JS. Lazy-load them.

### Acceptance Criteria
- [ ] Use next/dynamic with ssr: false for CandlestickChart, VolumeChart, AllocationDonut
- [ ] Show skeleton while loading
- [ ] Measure Lighthouse score before/after

### Hints
Use: const Chart = dynamic(() => import("@/components/charts/..."), { ssr: false, loading: () => <Skeleton /> })`
);

issue(
  "Add caching layer for frequently-accessed Horizon queries",
  "performance,area:backend,priority:high",
  `### Overview
Repeated Horizon calls for the same data waste bandwidth. Add server-side caching.

### Acceptance Criteria
- [ ] Cache keys include network + query params
- [ ] TTLs: orderbook 5s, asset catalog 60s, market stats 15s
- [ ] In-memory by default (Map), optional Redis adapter
- [ ] Cache-Control headers set on API responses

### Hints
Check existing query-cache.ts at src/lib/server/query-cache.ts.`
);

issue(
  "Add pagination to the asset browser for large catalogs",
  "performance,area:assets,ux,priority:medium",
  `### Overview
The asset browser fetches all assets at once. Add cursor-based pagination.

### Acceptance Criteria
- [ ] Add cursor-based pagination to /api/assets
- [ ] "Load More" button or infinite scroll
- [ ] API response includes nextCursor

### Hints
Files: src/app/api/assets/route.ts, src/components/assets/asset-browser.tsx.`
);

issue(
  "Replace raw img tags with next/image for automatic optimization",
  "performance,area:frontend,priority:medium",
  `### Overview
Replace <img> tags with next/image for lazy loading, proper sizing, and optimization.

### Acceptance Criteria
- [ ] All <img> in src/components/ replaced with next/image <Image>
- [ ] Add width/height or fill props
- [ ] priority on above-the-fold images
- [ ] Verify no layout shift (CLS)

### Hints
import Image from "next/image". For logo: <Image src="/favicon.svg" width={32} height={32} alt="TarshishDEX" priority />`
);

// ═══════════════════════════════════════════════════════════════════════════
// 9. ACCESSIBILITY (6)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Audit and fix color contrast ratios across the design system",
  "accessibility,area:design,area:frontend,priority:high",
  `### Overview
Dark theme color contrasts may not meet WCAG AA (4.5:1 for normal text).

### Acceptance Criteria
- [ ] Audit all text colors using a contrast checker
- [ ] Fix any ratio below 4.5:1 for body text
- [ ] Fix any ratio below 3:1 for large/heading text
- [ ] Test with Chrome DevTools Accessibility panel

### Hints
CSS variables in src/app/globals.css. Use https://webaim.org/resources/contrastchecker/.`
);

issue(
  "Ensure all interactive elements are keyboard accessible",
  "accessibility,area:frontend,priority:high",
  `### Overview
Dropdowns, modals, and tooltips should be fully keyboard navigable.

### Acceptance Criteria
- [ ] Tab through all interactive elements in logical order
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate within dropdown menus
- [ ] Focus trapped inside open modals
- [ ] Focus returns to trigger when modal closes

### Hints
Existing FocusTrap in src/components/ui/focus-trap.tsx. Test with keyboard-only.`
);

issue(
  "Wire the SkipLink component into the app layout",
  "accessibility,area:frontend,priority:medium",
  `### Overview
The SkipLink component exists but is not wired into the layout.

### Acceptance Criteria
- [ ] Add SkipLink as first focusable element in <body>
- [ ] Visible on focus, targets <main> element

### Hints
Component: src/components/ui/skip-link.tsx. Wire in src/app/layout.tsx.`
);

issue(
  "Add screen reader announcements for dynamic content updates",
  "accessibility,area:frontend,priority:medium",
  `### Overview
Screen readers should be notified when swap quotes update or toasts appear.

### Acceptance Criteria
- [ ] Use ScreenReaderAnnouncement for live-region updates
- [ ] Announce quote updates, transaction submissions, and errors
- [ ] Use aria-live="polite" for updates, "assertive" for errors

### Hints
Component: src/components/ui/screen-reader-announcement.tsx.`
);

issue(
  "Add reduced-motion support for animations and transitions",
  "accessibility,area:frontend,priority:medium",
  `### Overview
Users who prefer reduced motion should not see animations.

### Acceptance Criteria
- [ ] Add @media (prefers-reduced-motion: reduce) to globals.css
- [ ] Disable: hover transforms, toast slide-in, spinner, skeleton pulse

### Hints
Tailwind has motion-reduce: variants. Add global CSS rule for prefers-reduced-motion.`
);

issue(
  "Add focus-visible styles to all interactive elements",
  "accessibility,area:design,area:frontend,priority:medium",
  `### Overview
Ensure all buttons, links, inputs have visible focus indicators.

### Acceptance Criteria
- [ ] All interactive elements have :focus-visible styles
- [ ] Focus ring color consistent (primary color)
- [ ] No element uses outline: none without replacement
- [ ] Test with Tab navigation through every page

### Hints
Use Tailwind: focus-visible:ring-2 focus-visible:ring-primary pattern.`
);

// ═══════════════════════════════════════════════════════════════════════════
// 10. UX POLISH (4)
// ═══════════════════════════════════════════════════════════════════════════

issue(
  "Add a confetti/celebration animation on successful swap execution",
  "ux,area:swap,priority:low",
  `### Overview
A small celebration when a swap completes makes the experience delightful.

### Acceptance Criteria
- [ ] Confetti animation on swap success
- [ ] Only for successful on-chain transactions
- [ ] Respects prefers-reduced-motion
- [ ] Runs for ~3 seconds then auto-dismisses

### Hints
Consider canvas-confetti (2.5KB gzipped) or pure CSS solution.`
);

issue(
  "Add a connection quality indicator for SSE live data streams",
  "ux,area:markets,area:api,priority:low",
  `### Overview
Users should know if their live data stream is healthy or disconnected.

### Acceptance Criteria
- [ ] Small dot indicator next to "Live" label
- [ ] Green: connected, Yellow: reconnecting, Red: disconnected
- [ ] Manual reconnect button when disconnected

### Hints
SSE EventSource has onopen, onerror, and readyState properties.`
);

issue(
  "Add a copy trade feature - pre-fill swap from a market row",
  "ux,area:swap,area:markets,priority:medium",
  `### Overview
Clicking "Trade" on a market row should navigate to /swap with the pair pre-selected.

### Acceptance Criteria
- [ ] "Trade" button on each market table row
- [ ] Navigates to /swap?input=XLM&output=USDC:ISSUER
- [ ] Swap widget reads query params and pre-selects assets

### Hints
File: src/components/markets/market-table.tsx. Add query param link.`
);

issue(
  "Add a what's new / changelog modal on first visit after version update",
  "ux,area:frontend,priority:low",
  `### Overview
Returning users should see what changed since their last visit.

### Acceptance Criteria
- [ ] Store last-seen version in localStorage
- [ ] On version bump, show modal with latest CHANGELOG entries
- [ ] "Got it" dismisses and updates stored version

### Hints
Check src/lib/utils/env.ts for APP_VERSION. CHANGELOG.md has version sections.`
);

// ── Final summary ────────────────────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════════");
console.log(`  ✅ Created ${count} issues in ${REPO}`);
console.log("═══════════════════════════════════════════");
