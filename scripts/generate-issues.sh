#!/usr/bin/env bash
# ── TarshishDEX — generate 100 GitHub issues ─────────────────────────────
# Creates 100 well-structured, contributor-friendly issues across all
# categories. Each issue includes a clear description, acceptance criteria,
# and contributor hints.
#
# Usage: ./scripts/generate-issues.sh
# Prerequisites: gh CLI authenticated on TarshishDEX/TarshishDEX
set -euo pipefail

REPO="TarshishDEX/TarshishDEX"
TOTAL=0

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"
  gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body" > /dev/null
  TOTAL=$((TOTAL + 1))
  echo "  [$TOTAL/100] $title"
}

# ═══════════════════════════════════════════════════════════════════════════
# 1. GOOD FIRST ISSUES (12) — beginner-friendly
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add aria-labels to all icon-only buttons" \
  "good first issue,accessibility,area:frontend,priority:medium" \
'### Overview
Several icon-only buttons (e.g., theme toggle, swap direction flip, close modals) lack `aria-label` attributes, making them inaccessible to screen readers.

### Acceptance Criteria
- [ ] Every `<button>` in `src/components/` that contains only an SVG/icon has an `aria-label`
- [ ] Labels are descriptive: "Close dialog", "Swap direction", "Toggle theme"
- [ ] A quick `grep -r "<button" src/components/` scan reveals no icon-only buttons without aria-label

### Files to touch
Look in `src/components/ui/`, `src/components/swap/`, `src/components/markets/`

### Hints
Use `git grep '<button' src/components/ | grep -v aria-label` to find offenders.
Search for `IconButton` components that may be missing labels.'

create_issue \
  "Add `.editorconfig` enforcement to CI" \
  "good first issue,area:ci-cd,priority:low" \
'### Overview
We have an `.editorconfig` file but it is not enforced in CI. Add a step that verifies all committed files conform.

### Acceptance Criteria
- [ ] Add `editorconfig-checker` (or `eclint`) to the CI quality job
- [ ] It fails the build when files violate `.editorconfig` rules
- [ ] `npm run format:check` (or a new `npm run editorconfig:check`) triggers it locally

### Hints
- `npm install --save-dev editorconfig-checker`
- The `.editorconfig` at the repo root already defines the rules'

create_issue \
  "Add code comment explaining swap pipeline flow" \
  "good first issue,documentation,area:swap,priority:low" \
'### Overview
The swap pipeline (`findBestRoute → selectBestRoute → buildRoute → executeSwap`) is well-implemented but lacks inline code comments explaining the flow.

### Acceptance Criteria
- [ ] Add a docblock comment atop `src/lib/stellar/routing.ts` explaining the three routing strategies
- [ ] Add a docblock atop `src/lib/stellar/swap-execution.ts` explaining the execution phase machine
- [ ] Comments are concise (2-4 lines each) and reference the README architecture docs

### Hints
The README already has a great architecture diagram — reference it in the comments.'

create_issue \
  "Replace hardcoded 'testnet' string with config constant" \
  "good first issue,area:frontend,refactor,priority:low" \
'### Overview
Several components display "Network: Testnet" as a hardcoded badge text. These should read from `getActiveNetwork().label` instead.

### Acceptance Criteria
- [ ] `src/app/markets/page.tsx` — use `getActiveNetwork()` instead of "Network: Testnet"
- [ ] `src/app/assets/page.tsx` — use `getActiveNetwork()` instead of "Live on Testnet"
- [ ] `src/app/analytics/page.tsx` — use `getActiveNetwork()` instead of "Live on Testnet"
- [ ] The badge text automatically updates when switching to Mainnet

### Hints
Import from `@/lib/stellar/config`:
```ts
import { getActiveNetwork } from "@/lib/stellar/config";
const network = getActiveNetwork();
```'

create_issue \
  "Add loading skeletons to remaining route segments" \
  "good first issue,ux,area:frontend,priority:medium" \
'### Overview
We added route-level `loading.tsx` files for swap, markets, assets, analytics, and portfolio. But some sub-routes (e.g., dynamic portfolio `[address]` modals) still show a plain spinner.

### Acceptance Criteria
- [ ] Add skeleton loading states where plain spinners are used
- [ ] Skeletons match the layout of the page they replace (same grid, same sizes)
- [ ] Ensure the loading state is scoped to the specific route segment, not the global layout

### Hints
Check existing `loading.tsx` files in `src/app/*/loading.tsx` for patterns.'

create_issue \
  "Add `alt` text to all images in the codebase" \
  "good first issue,accessibility,area:frontend,priority:medium" \
'### Overview
Any `<img>` or `<Image>` (next/image) component should have meaningful `alt` text for screen readers.

### Acceptance Criteria
- [ ] Every `<img>` and `<Image>` in `src/` has an `alt` attribute
- [ ] Decorative-only images use `alt=""` (not missing the attribute)
- [ ] Functional images (logos, icons in links) have descriptive alt text
- [ ] Run `grep -r "<img" src/ | grep -v "alt="` to find offenders — should return empty

### Hints
Next.js `Image` components also require `alt` — same rule applies.'

create_issue \
  "Add CONTRIBUTING.md section on commit conventions" \
  "good first issue,documentation,priority:low" \
'### Overview
Our CONTRIBUTING.md doesn not mention that we follow Conventional Commits. Add a clear section.

### Acceptance Criteria
- [ ] Add a "Commit Conventions" section to `CONTRIBUTING.md`
- [ ] Include examples: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- [ ] Mention that the PR template already enforces this via the checklist

### Hints
See https://www.conventionalcommits.org/ for the spec.'

create_issue \
  "Remove unused imports across the project" \
  "good first issue,refactor,area:frontend,priority:low" \
'### Overview
Some files may have unused imports leftover from refactors. Clean them up.

### Acceptance Criteria
- [ ] Run `npx eslint --fix` and ensure no "unused import" warnings remain
- [ ] TypeScript strict mode catches unused locals — ensure `tsc --noEmit` is clean
- [ ] No functional code changes — purely removing dead imports

### Hints
- ESLint rule `@typescript-eslint/no-unused-vars` flags unused imports
- Run `npm run lint` first to see current warnings'

create_issue \
  "Add `type=\"button\"` to all buttons that are not form submits" \
  "good first issue,accessibility,area:frontend,priority:low" \
'### Overview
Buttons without explicit `type` default to `type="submit"`, which can accidentally trigger form submissions when nested in forms.

### Acceptance Criteria
- [ ] All `<button>` elements in `src/components/` that are not form submit buttons have `type="button"`
- [ ] Form submit buttons explicitly use `type="submit"`

### Hints
Run: `grep -r "<button" src/components/ | grep -v "type="` to find offenders.'

create_issue \
  "Add env var validation at app startup" \
  "good first issue,area:backend,priority:medium" \
'### Overview
Missing required environment variables currently fail silently at runtime. Add a startup validation that logs clear errors.

### Acceptance Criteria
- [ ] Create `src/lib/server/env-check.ts` that validates required env vars at startup
- [ ] Required vars: `NEXT_PUBLIC_STELLAR_NETWORK`, contract IDs when on production
- [ ] Log a clear warning for missing optional vars (e.g., `LOG_LEVEL`, `HORIZON_URL`)
- [ ] Import and call in `src/middleware.ts` at module level

### Hints
Check `src/lib/utils/env.ts` for existing environment detection helpers.'

create_issue \
  "Add a `.github/dependabot.yml` config for automated dependency updates" \
  "good first issue,area:deps,area:ci-cd,priority:low" \
'### Overview
Automate dependency updates with Dependabot so PRs are opened automatically for outdated packages.

### Acceptance Criteria
- [ ] Create `.github/dependabot.yml` with:
  - npm weekly updates for `package.json`
  - Cargo weekly updates for `src/contracts/Cargo.toml`
  - GitHub Actions monthly updates for workflow files
- [ ] Set `open-pull-requests-limit: 10`
- [ ] Group minor/patch updates together

### Hints
See https://docs.github.com/en/code-security/dependabot/dependabot-version-updates'

create_issue \
  "Remove or replace unused `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` public assets" \
  "good first issue,refactor,priority:low" \
'### Overview
The `public/` directory contains Next.js boilerplate SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) that are not used anywhere in the app.

### Acceptance Criteria
- [ ] Check all references to these files in the codebase
- [ ] Remove any that are unused; replace any that are used with custom TarshishDEX assets
- [ ] `npm run build` still succeeds

### Hints
`grep -r "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src/`'

# ═══════════════════════════════════════════════════════════════════════════
# 2. BUGS (16) — real issues to investigate & fix
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Swap widget: amount input accepts negative numbers via paste" \
  "bug,area:swap,priority:high" \
'### Summary
The swap amount input (`<input type="number">`) can accept negative values when pasted or typed with arrow keys, which causes `BigNumber` errors downstream.

### Steps to Reproduce
1. Go to `/swap`
2. Type `-100` in the amount field
3. Click "Review Swap"

### Expected Behavior
Negative amounts should be prevented at the input level (min="0" or a controlled `onChange` filter).

### Acceptance Criteria
- [ ] Cannot enter negative amounts in the swap input
- [ ] Paste of negative numbers is filtered to absolute value or rejected
- [ ] Add a unit test in `src/lib/utils.test.ts` for the sanitization logic (new test case)

### Hints
The swap widget is at `src/components/swap/swap-widget.tsx`.
Use `Math.abs()` or a `min="0"` attribute + a controlled onChange handler.'

create_issue \
  "Portfolio fetches fail silently when Horizon is rate-limited" \
  "bug,area:portfolio,area:backend,priority:high" \
'### Summary
When Horizon rate-limits the server, portfolio API calls return 502 without retry. The frontend shows a generic error. We should retry with exponential backoff and surface rate-limit specific messaging.

### Acceptance Criteria
- [ ] API routes that call Horizon use the existing retry utility (`src/lib/utils/retry.ts`)
- [ ] Rate-limit errors (HTTP 429 from Horizon) are distinguished from other failures
- [ ] The UI shows "Horizon rate limit — retrying in X seconds" instead of a generic error
- [ ] Circuit breaker in `src/lib/server/circuit-breaker.ts` opens for Horizon 429s

### Hints
Check `src/app/api/portfolio/[address]/route.ts` — it catches errors but doesn not retry.
The retry utility is at `src/lib/utils/retry.ts`.'

create_issue \
  "Multi-hop routing returns null for valid bridge pairs when orderbook is thin" \
  "bug,area:swap,priority:high" \
'### Summary
When the first hop orderbook is thin and the order doesn not fully fill, `simulateBridgeRoute` returns early with `fill: null` instead of returning the best partial fill. This causes `selectBestRoute` to skip potentially viable bridge routes.

### Steps to Reproduce
1. Try swapping a low-liquidity token → USDC with a large amount
2. The bridge route through XLM may show null fill even though partial execution is possible

### Acceptance Criteria
- [ ] `simulateBridgeRoute` returns a partial fill when the first hop partially fills, rather than null
- [ ] Partial fills are scored correctly in `selectBestRoute`
- [ ] A unit test in `src/lib/stellar/routing.test.ts` covers this case

### Hints
The relevant code is in `src/lib/stellar/routing.ts`, `simulateBridgeRoute` function.
The issue is that `firstFill.fullyFilled` check gates the second hop.'

create_issue \
  "Toast notifications stack without limit — can overflow viewport on rapid actions" \
  "bug,ux,area:frontend,priority:medium" \
'### Summary
The toast store in `src/components/ui/toast.tsx` appends without capping. If a user rapidly clicks actions, dozens of toasts stack up and overflow the viewport.

### Acceptance Criteria
- [ ] Maximum 5 visible toasts at once
- [ ] New toasts beyond the limit dismiss the oldest toast
- [ ] Add a unit test in `src/components/ui/toast.test.tsx` for the MAX_TOASTS cap

### Hints
The toast store is a zustand store. Add a `MAX_TOASTS = 5` constant and check array length before pushing.'

create_issue \
  "Market stats page crashes when fetching stats for tokens without Horizon trade data" \
  "bug,area:markets,priority:medium" \
'### Summary
`getMarketStatsForTokens` in `src/lib/stellar/prices.ts` can fail when some tokens have no trade history, causing the entire `/api/market/stats` call to 502.

### Acceptance Criteria
- [ ] Each token stats query is individually try-caught
- [ ] Tokens without data are skipped instead of causing the entire batch to fail
- [ ] The API response includes a `skipped` count for tokens with no data
- [ ] Add a unit test for tokens with empty trade history

### Hints
The failing file is `src/lib/stellar/prices.ts`, function `getMarketStatsForTokens`.
Consider using `Promise.allSettled` instead of `Promise.all`.'

create_issue \
  "Orderbook depth chart doesn not update when switching trading pairs" \
  "bug,area:markets,area:frontend,priority:medium" \
'### Summary
The `OrderbookDepth` component in `src/components/markets/orderbook-depth.tsx` renders with initial data but may not re-fetch when the pair changes.

### Acceptance Criteria
- [ ] The component re-fetches orderbook data when `base` or `counter` props change
- [ ] A loading state is shown during the fetch transition
- [ ] Check that TanStack Query cache keys include both asset identifiers

### Hints
The query hook is `useOrderbook` in `src/lib/stellar/queries.ts`.
Ensure the query key array is `["orderbook", sellingStr, buyingStr]` — not just `["orderbook"]`.'

create_issue \
  "Freighter wallet connection state persists after extension is disabled" \
  "bug,area:wallet,priority:medium" \
'### Summary
If a user disables the Freighter extension while connected, the wallet store still shows "connected" state. The `isWalletAvailable` check only runs once on mount.

### Acceptance Criteria
- [ ] Poll wallet availability periodically (every 30s) using `isWalletAvailable()`
- [ ] Auto-disconnect when the wallet extension is no longer detected
- [ ] Show a toast notification: "Freighter extension not detected — disconnected"

### Hints
The wallet store is at `src/lib/stellar/wallet-store.ts`.
The availability check is in `src/lib/stellar/wallet-kit.ts`.'

create_issue \
  "Server-Sent Events stream leaks file descriptors when clients disconnect without clean close" \
  "bug,area:api,area:backend,priority:high" \
'### Summary
The SSE stream in `src/app/api/events/route.ts` uses `setInterval` for heartbeats. If a client disconnects abruptly, the interval and stream cleanup may not fire, leaking resources.

### Acceptance Criteria
- [ ] The `request.signal.aborted` check also handles cleanup of the heartbeat interval
- [ ] Add a maximum stream duration (e.g., 10 minutes) after which the stream gracefully closes
- [ ] The cleanup function is always called in a `finally` block or via `request.signal.addEventListener("abort", ...)`

### Hints
The file is `src/app/api/events/route.ts`.
The `ReadableStream` API has a `cancel()` method — ensure it cleans up properly.'

create_issue \
  "Candlestick chart shows empty state without explanation when no trade data exists" \
  "bug,ux,area:analytics,priority:medium" \
'### Summary
The `PriceChartPanel` displays an empty chart area when there is no trade data for a pair. There is no empty-state message.

### Acceptance Criteria
- [ ] Show "No trade data available for this pair" when candles array is empty
- [ ] Provide a suggestion to try a different resolution or pair
- [ ] Match the existing EmptyResults component style

### Hints
Check `src/components/analytics/price-chart-panel.tsx` and `src/components/ui/empty-results.tsx`.'

create_issue \
  "Asset search is case-sensitive — searching 'usdc' doesn not find 'USDC'" \
  "bug,ux,area:assets,priority:medium" \
'### Summary
The asset browser search filters are case-sensitive, making the search frustrating for users.

### Acceptance Criteria
- [ ] Asset code search is case-insensitive
- [ ] Issuer search is case-insensitive
- [ ] The search term is normalized before filtering

### Hints
File: `src/components/assets/asset-browser.tsx`.
Use `.toLowerCase()` on both the search term and the asset code when comparing.'

create_issue \
  "Swap execution: insufficient XLM for trustline creation causes unclear error" \
  "bug,area:swap,area:wallet,priority:high" \
'### Summary
When swapping to a new asset, the swap engine adds a `changeTrust` operation. If the account has insufficient XLM to cover the trustline reserve (0.5 XLM), the error is cryptic.

### Acceptance Criteria
- [ ] Pre-simulation check: verify the account has enough XLM for the trustline reserve
- [ ] Show a clear error: "Insufficient XLM for trustline reserve (0.5 XLM required)"
- [ ] Include this check in the swap simulation phase

### Hints
The trustline logic is in `src/lib/stellar/swap-execution.ts`, function `needsTrustline`.
XLM minimum balance for trustlines: 0.5 XLM per trustline.'

create_issue \
  "Trade history pagination: Load More button disappears after the first page" \
  "bug,area:portfolio,priority:medium" \
'### Summary
The trade history pagination may not properly track the cursor for subsequent pages, causing the "Load More" button to disappear after page 1.

### Acceptance Criteria
- [ ] Cursor-based pagination correctly advances to page 2, 3, etc.
- [ ] "Load More" is visible as long as there are more records
- [ ] "No more trades" message appears when exhausted

### Hints
Check `src/components/portfolio/trade-history.tsx` and `src/lib/stellar/history.ts`.
Ensure the Horizon `next` link is being followed correctly.'

create_issue \
  "API health endpoint should include contract health (not just Horizon)" \
  "bug,area:api,priority:medium" \
'### Summary
`GET /api/health` only probes Horizon. For a complete health picture, it should also check the Soroban RPC and (optionally) verify contract IDs are accessible.

### Acceptance Criteria
- [ ] Health endpoint includes a `soroban_rpc` section with reachability status
- [ ] The `status` field reflects the worst of all checks (ok/degraded/down)
- [ ] Contract reachability is checked via a read-only `get_version` call (non-blocking)

### Hints
File: `src/app/api/health/route.ts`. RPC URL is in `getActiveNetwork()`.'

create_issue \
  "Wallet address is not validated against the active network passphrase on connect" \
  "bug,area:wallet,security,priority:high" \
'### Summary
The wallet store accepts any connected address without verifying it belongs to the active network. A Testnet address could be used on the Mainnet config.

### Acceptance Criteria
- [ ] Verify the wallet events `networkPassphrase` matches `getActiveNetwork().passphrase`
- [ ] Show a warning toast and disconnect if the wrong network is detected
- [ ] Add this check in `src/components/providers/wallet-provider.tsx`

### Hints
The wallet events subscription is in `subscribeWalletEvents` in `src/lib/stellar/wallet-kit.ts`.
The `STATE_UPDATED` event includes `networkPassphrase`.'

create_issue \
  "Swap route json response exposes internal path representation" \
  "bug,area:api,security,priority:medium" \
'### Summary
`GET /api/swap/quote` returns the full `SwapRoute` object including `minReceived` and `feeEstimateXlm` as raw strings. These should be consistently formatted and documented.

### Acceptance Criteria
- [ ] Response fields are consistently formatted (always strings, always include decimal places)
- [ ] `priceImpactPct` is rounded to 2 decimal places
- [ ] Documentation in README matches the actual response shape

### Hints
The route handler is `src/app/api/swap/quote/route.ts`.
The type is defined in `src/lib/stellar/types.ts`.'

create_issue \
  "Token selector modal has no search debounce — fires Horizon calls on every keystroke" \
  "bug,performance,area:swap,priority:medium" \
'### Summary
The `TokenSelector` component triggers asset lookups on every keystroke without debouncing, potentially hitting Horizon rate limits.

### Acceptance Criteria
- [ ] Search input is debounced (300ms)
- [ ] The previous in-flight request is cancelled when a new search starts
- [ ] Use the existing `useDebounce` hook from `src/lib/hooks/use-debounce.ts`

### Hints
File: `src/components/swap/token-selector.tsx`.
Import `useDebounce` from the hooks directory.'

# ═══════════════════════════════════════════════════════════════════════════
# 3. ENHANCEMENTS (22) — feature improvements
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add price alert system — notify when an asset crosses a user-set threshold" \
  "enhancement,area:markets,ux,priority:high" \
'### Overview
Let users set price alerts for watched assets. When the price crosses a threshold, show a browser notification.

### Acceptance Criteria
- [ ] UI: "Set Alert" button on the market table row
- [ ] Modal: choose asset, above/below, target price
- [ ] Alerts stored in localStorage
- [ ] Poll market stats API every 60s and check against stored alerts
- [ ] Use the Notifications API for browser alerts (`Notification.requestPermission()`)
- [ ] Max 5 alerts per user

### Hints
A partial price alert panel exists at `src/components/features/price-alert-panel.tsx`.
Wire it up fully.'

create_issue \
  "Implement token watchlist with star/bookmark functionality" \
  "enhancement,area:markets,area:portfolio,ux,priority:high" \
'### Overview
Users should be able to star/bookmark assets to a personal watchlist for quick access.

### Acceptance Criteria
- [ ] Star icon on each market table row and asset browser row
- [ ] Watchlist stored in localStorage
- [ ] A "Watchlist" filter tab on the markets page
- [ ] Watchlisted assets appear at the top of the market table
- [ ] Max 20 watchlisted assets

### Hints
Create a `src/lib/hooks/use-watchlist.ts` hook using the `useLocalStorage` hook pattern.
The market table is at `src/components/markets/market-table.tsx`.'

create_issue \
  "Add dark/light mode system preference detection and toggle persistence" \
  "enhancement,ux,area:frontend,priority:medium" \
'### Overview
A `ThemeProvider` and `useTheme` hook exist (`src/lib/theme.tsx`) but are not wired into the layout. Integrate them.

### Acceptance Criteria
- [ ] Wrap the app layout with `<ThemeProvider>`
- [ ] Add a theme toggle button in the header using the existing `ThemeToggle` component
- [ ] Theme persists across page refreshes (localStorage)
- [ ] System preference is respected on first visit
- [ ] The `light` class on `<html>` drives the Tailwind light-mode styles

### Hints
Files: `src/lib/theme.tsx` (provider), `src/components/ui/theme-toggle.tsx` (button), `src/app/layout.tsx` (wrap here).'

create_issue \
  "Add keyboard shortcut for global search / command palette (⌘K)" \
  "enhancement,ux,area:frontend,priority:medium" \
'### Overview
A `CommandPalette` component exists in the UI library. Wire it to ⌘K / Ctrl+K and let users search assets, navigate pages, and execute common actions.

### Acceptance Criteria
- [ ] ⌘K / Ctrl+K opens the command palette modal
- [ ] Search across: assets (by code), pages (Swap, Markets, Portfolio, Assets, Analytics)
- [ ] Default action: navigate to the selected item
- [ ] Escape closes the palette
- [ ] Focus trap inside the palette (use `FocusTrap` component)

### Hints
Components: `src/components/ui/command-palette.tsx`, `src/lib/hooks/use-keyboard-shortcuts.ts`.
Wire it in `src/app/layout.tsx`.'

create_issue \
  "Add transaction simulation preview in the swap widget" \
  "enhancement,area:swap,ux,priority:high" \
'### Overview
Users should see a detailed simulation breakdown (price impact, min received, fee, path hops) before signing, not just a brief summary.

### Acceptance Criteria
- [ ] Expand the "Review Swap" step to show:
  - Route path visualization (A → B or A → XLM → B)
  - Execution price with 7 decimal places
  - Price impact % with color coding (green < 1%, yellow 1-5%, red > 5%)
  - Estimated fee in XLM
  - Minimum received (worst-case slippage)
  - Warning list (if any)
- [ ] Mobile: collapsible sections for each detail

### Hints
The swap widget is `src/components/swap/swap-widget.tsx`.
The `SwapRoute` type in `src/lib/stellar/types.ts` has all the data you need.'

create_issue \
  "Add CSV export for portfolio holdings and trade history" \
  "enhancement,area:portfolio,ux,priority:medium" \
'### Overview
Let users export their portfolio balances and trade history as CSV for tax reporting or external analysis.

### Acceptance Criteria
- [ ] "Export CSV" button on the portfolio page
- [ ] Export options: balances only, trade history only, or both
- [ ] CSV includes headers and properly formatted columns
- [ ] Download triggers via a blob URL with the `.csv` extension
- [ ] Dates are in ISO 8601 format

### Hints
A CSV export utility might already exist — check `src/lib/utils/` for any export helpers.
Use `Blob` and `URL.createObjectURL` for download triggers.'

create_issue \
  "Add trade notifications — toast when a watched pair executes a trade" \
  "enhancement,area:markets,ux,priority:medium" \
'### Overview
When a user is watching a trading pair, stream live trades and show toasts for significant moves.

### Acceptance Criteria
- [ ] Subscribe to SSE events for watched pairs
- [ ] Show a toast: "XLM/USDC: 10,000 XLM traded at 0.1025 USD"
- [ ] Only show for pairs the user has starred (from the watchlist)
- [ ] Debounce toasts: max 1 per pair per 5 seconds

### Hints
The SSE stream is at `/api/events?base=XLM&counter=USDC:ISSUER`.
The toast system is at `src/components/ui/toast.tsx`.'

create_issue \
  "Add a slippage preset selector (0.1%, 0.5%, 1%, 3%) with custom input" \
  "enhancement,area:swap,ux,priority:medium" \
'### Overview
The swap widget currently only has a custom slippage input. Add preset buttons for common values.

### Acceptance Criteria
- [ ] Preset buttons: 0.1%, 0.5%, 1% (default), 3%, Custom
- [ ] Clicking a preset updates the slippage input and the quote
- [ ] "Custom" mode shows the number input
- [ ] On-chain preferences save the last-used slippage

### Hints
File: `src/components/swap/swap-widget.tsx`.
The slippage is managed by the `OnChainPreferences` component in `src/components/swap/on-chain-preferences.tsx`.'

create_issue \
  "Add a network status indicator to the header (latency + block height)" \
  "enhancement,area:frontend,area:backend,ux,priority:low" \
'### Overview
Show the current Stellar network status in the header — latency to Horizon and the latest ledger sequence.

### Acceptance Criteria
- [ ] Poll `/api/health` every 30s
- [ ] Show a green/yellow/red dot with the latency in ms
- [ ] Show the latest ledger sequence number
- [ ] On click, navigate to the Stellar Expert explorer for the current ledger

### Hints
The health endpoint already returns `horizon.latencyMs`.
You can also call `server.ledgers().limit(1).order("desc").call()` for the latest ledger.'

create_issue \
  "Implement swap history panel showing recent user transactions" \
  "enhancement,area:swap,ux,priority:medium" \
'### Overview
After executing swaps, users should see a history of their recent transactions below the swap widget.

### Acceptance Criteria
- [ ] Show last 10 swap transactions (from localStorage or Horizon)
- [ ] Each entry: timestamp, input amount → output amount, tx hash (linked to explorer)
- [ ] Status icon: pending, success, failed
- [ ] "Clear history" button
- [ ] History persists across page refreshes

### Hints
Store swap results in localStorage after execution.
Use the `TransactionStatusIcon` component for status display.'

create_issue \
  "Add responsive mobile bottom navigation bar" \
  "enhancement,ux,area:frontend,priority:medium" \
'### Overview
On mobile, the header navigation is hidden behind a hamburger menu. Add a persistent bottom nav bar for quick access.

### Acceptance Criteria
- [ ] Bottom nav visible on screens < 768px width
- [ ] Icons + labels: Swap, Markets, Portfolio, Assets, More (hamburger)
- [ ] Active route is highlighted
- [ ] Safe area padding for iOS (env(safe-area-inset-bottom))
- [ ] Matches the existing dark theme

### Hints
Use the `useMediaQuery` hook for responsive detection.
Check `src/lib/hooks/use-media-query.ts`.'

create_issue \
  "Add fee comparison: show estimated savings vs. centralized exchanges" \
  "enhancement,area:swap,ux,priority:low" \
'### Overview
Show users how much they are saving on fees vs. a hypothetical 0.1% CEX fee.

### Acceptance Criteria
- [ ] Calculate savings: (amount × 0.001) - actual Stellar fee
- [ ] Display as "You saved ~$X.XX vs. centralized exchanges"
- [ ] Only show when savings are positive
- [ ] Include in the swap review step

### Hints
The Stellar fee is already estimated in `estimateSwapFeeXlm` in `src/lib/stellar/simulation.ts`.
Convert XLM fee to USD using the XLM price (from market stats).'

create_issue \
  "Add asset price sparkline in the market table" \
  "enhancement,area:markets,ux,priority:medium" \
'### Overview
Show a mini 7-day price sparkline next to each asset in the market table for quick trend visualization.

### Acceptance Criteria
- [ ] Fetch 7-day OHLCV data for each asset in the table
- [ ] Render a small line chart (sparkline) inline in the table cell
- [ ] Color: green for upward trend, red for downward
- [ ] Tooltip on hover showing the 7d high/low

### Hints
Lightweight-charts can render small charts, or use a simple SVG path.
The candle endpoint is at `/api/market/candles`.'

create_issue \
  "Add an asset detail page at /assets/[code] with full issuer info" \
  "enhancement,area:assets,ux,priority:high" \
'### Overview
Clicking an asset in the browser should navigate to a detail page with issuer info, trustline stats, flags, and recent trades.

### Acceptance Criteria
- [ ] New route: `src/app/assets/[code]/page.tsx`
- [ ] Display: asset code, issuer address, domain, flags (auth_required, auth_revocable, etc.)
- [ ] Trustline count, total supply
- [ ] Recent trades for the asset (last 20)
- [ ] Link back to asset browser
- [ ] SEO metadata for the asset page

### Hints
Create a dynamic route. Use `fetchAssetCatalog` with the specific code to get issuer details.
The Horizon `/assets` endpoint has all the issuer info.'

create_issue \
  "Add percentage-based input mode for swap amounts" \
  "enhancement,area:swap,ux,priority:medium" \
'### Overview
Let users enter a percentage of their balance (25%, 50%, 75%, 100%) for the swap amount instead of manually typing.

### Acceptance Criteria
- [ ] Percentage buttons next to the amount input: 25%, 50%, 75%, MAX
- [ ] Clicking a percentage calculates the amount from the connected wallet balance
- [ ] "MAX" uses the full balance minus a small XLM reserve (for fees)
- [ ] Buttons are disabled when wallet is not connected

### Hints
Fetch the balance using `fetchXlmBalance` from `src/lib/stellar/account.ts`.
Calculate: `balance * (pct / 100)` with proper decimal handling.'

create_issue \
  "Add sorting and filtering to the trade history table" \
  "enhancement,area:portfolio,ux,priority:medium" \
'### Overview
The trade history table shows trades chronologically but doesn not allow sorting by amount or filtering by asset.

### Acceptance Criteria
- [ ] Sort by: date (default, desc), amount, asset pair
- [ ] Filter by asset code (e.g., show only USDC trades)
- [ ] Active sort/filter state is shown with visual indicators
- [ ] Use the existing `SortIndicator` component

### Hints
File: `src/components/portfolio/trade-history.tsx`.
The data comes from `fetchTradeHistory` in `src/lib/stellar/history.ts`.'

create_issue \
  "Add a real-time last-trade ticker banner at the top of the markets page" \
  "enhancement,area:markets,ux,priority:medium" \
'### Overview
A scrolling ticker showing the most recent trades gives a "live exchange" feel.

### Acceptance Criteria
- [ ] Ticker bar at the top of the markets page
- [ ] Shows: asset pair, price, amount, time ago
- [ ] Auto-scrolls or animates new trades in from the right
- [ ] Subscribes to the SSE events stream
- [ ] Max 20 recent trades in the ticker

### Hints
The SSE endpoint is `/api/events?base=XLM&counter=USDC:ISSUER`.
Use the `streamTradesRecords` function from `src/lib/stellar/live.ts`.'

create_issue \
  "Add tooltips explaining market stats metrics (24h vol, spread, mid price)" \
  "enhancement,ux,documentation,area:markets,priority:medium" \
'### Overview
New users may not know what "spread" or "mid price" means. Add informative tooltips.

### Acceptance Criteria
- [ ] Info icon (i) next to each column header
- [ ] Hovering shows a tooltip with a 1-2 sentence explanation
- [ ] Tooltips use the existing `Tooltip` component

### Hints
Column headers are in `src/components/markets/market-table.tsx`.
The Tooltip component is at `src/components/ui/tooltip.tsx`.'

create_issue \
  "Add portfolio value chart — track account value over time" \
  "enhancement,area:portfolio,ux,priority:high" \
'### Overview
Show a line chart of the portfolio total value over the last 30 days.

### Acceptance Criteria
- [ ] Track portfolio value snapshots daily (localStorage)
- [ ] Render a line chart of total value over time
- [ ] 7d and 30d toggles
- [ ] Show absolute change and percentage change
- [ ] Empty state: "Connect wallet and check back tomorrow for your value chart"

### Hints
Store daily snapshots: `{ date: "2026-08-05", value: 12345.67 }`.
Use lightweight-charts for the line chart.'

create_issue \
  "Add copy-to-clipboard for all addresses, transaction hashes, and contract IDs" \
  "enhancement,ux,area:frontend,priority:medium" \
'### Overview
Any displayed address or hash should be clickable to copy with a success toast.

### Acceptance Criteria
- [ ] Every address/hash display uses the `CopyButton` component
- [ ] Clicking copies to clipboard
- [ ] Toast: "Copied to clipboard"
- [ ] Visual feedback: clipboard icon changes to checkmark for 2 seconds

### Hints
The `CopyButton` component is at `src/components/ui/copy-button.tsx`.
The toast system is at `src/components/ui/toast.tsx`.'

create_issue \
  "Add a liquidity depth visualization tooltip on the orderbook chart" \
  "enhancement,area:markets,ux,priority:low" \
'### Overview
When hovering over the orderbook depth chart, show the cumulative volume at that price point.

### Acceptance Criteria
- [ ] Crosshair tooltip on the depth chart
- [ ] Shows: price, cumulative bid volume, cumulative ask volume
- [ ] Updates in real-time as the mouse moves

### Hints
The depth chart is in `src/components/markets/orderbook-depth.tsx`.
If using lightweight-charts, the `Crosshair` primitive supports tooltips.'

create_issue \
  "Truncate long issuer addresses in asset browser with tooltip showing full address" \
  "enhancement,ux,area:assets,priority:low" \
'### Overview
Issuer addresses in the asset browser are 56 characters long and break the table layout. Truncate them.

### Acceptance Criteria
- [ ] Show first 8 and last 6 characters: "GABCDEF...XYZ123"
- [ ] Full address in tooltip on hover
- [ ] Copy button next to truncated address
- [ ] Use the existing `truncateHash` utility

### Hints
File: `src/components/assets/asset-browser.tsx`.
Utility: `src/lib/utils/truncate-hash.ts`.'

# ═══════════════════════════════════════════════════════════════════════════
# 4. TESTING (12) — test coverage and quality
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add unit tests for quantity formatting utilities (formatNumber, formatXlm, formatUsd)" \
  "testing,area:testing,priority:high" \
'### Overview
The formatting utilities in `src/lib/utils.ts` have partial coverage. Add comprehensive tests.

### Acceptance Criteria
- [ ] Test `formatNumber`: large numbers (1B+), decimals, negative, zero
- [ ] Test `formatXlm`: typical XLM amounts, zero, very small amounts (stroops)
- [ ] Test `formatUsd`: dollar formatting, cents, zero
- [ ] Test edge cases: NaN, Infinity, undefined, null
- [ ] All tests pass

### Hints
Existing tests are in `src/lib/utils.test.ts`.
Follow the existing `describe`/`it` patterns.'

create_issue \
  "Add integration tests for the swap quote API endpoint" \
  "testing,area:testing,area:api,priority:high" \
'### Overview
The `/api/swap/quote` endpoint has no integration tests. Add tests using the Next.js test helpers.

### Acceptance Criteria
- [ ] Test valid XLM→USDC quote returns 200 with expected shape
- [ ] Test invalid asset returns 400
- [ ] Test missing amount returns 400
- [ ] Test same input/output asset returns 404
- [ ] Test negative amount returns 400
- [ ] Mock the Horizon calls if needed (or use Testnet)

### Hints
Create `src/app/api/swap/quote/route.test.ts`.
Use `NextRequest` and call the `GET` handler directly.'

create_issue \
  "Add snapshot tests for smart contract test outputs" \
  "testing,area:smart-contracts,area:testing,priority:medium" \
'### Overview
The contract tests already generate snapshots in `test_snapshots/`. Ensure all contract functions have snapshot coverage.

### Acceptance Criteria
- [ ] Each contract function has a corresponding snapshot test
- [ ] Snapshots are generated with `cargo test` (they already are via `#[test]`)
- [ ] Document in the contracts README how to update snapshots
- [ ] CI fails on snapshot mismatches

### Hints
Contracts: `src/contracts/trading-preferences/src/lib.rs`, `src/contracts/market-oracle/src/lib.rs`.
Snapshots are in `test_snapshots/test/`.'

create_issue \
  "Add E2E test for the complete swap flow (select token → enter amount → get quote)" \
  "testing,area:swap,e2e,priority:high" \
'### Overview
The E2E smoke tests verify pages render. Add a test for the actual swap quote flow.

### Acceptance Criteria
- [ ] Navigate to /swap
- [ ] Select XLM as input, USDC as output
- [ ] Enter amount "100"
- [ ] Verify a quote is returned (output amount is displayed)
- [ ] Run on CI with Playwright

### Hints
Existing E2E tests: `e2e/smoke.spec.ts`.
Playwright config: `playwright.config.ts`.'

create_issue \
  "Add test for the rate limiter middleware" \
  "testing,area:backend,area:testing,priority:high" \
'### Overview
The rate limiter in `src/lib/server/rate-limit.ts` has no tests. Add unit tests.

### Acceptance Criteria
- [ ] Test: requests under limit pass through
- [ ] Test: requests over limit return 429
- [ ] Test: window resets after expiry
- [ ] Test: different IPs have separate rate limits
- [ ] Test: swap/quote gets the stricter limit (10/min vs 60/min)

### Hints
Create `src/lib/server/rate-limit.test.ts`.
The function takes a `NextRequest`. Mock it with `new NextRequest("http://localhost/api/test")`.'

create_issue \
  "Add test for the `selectBestRoute` edge case — empty array, single route, tie" \
  "testing,area:swap,area:testing,priority:medium" \
'### Overview
`selectBestRoute` in `src/lib/stellar/routing.ts` has basic tests. Add edge case coverage.

### Acceptance Criteria
- [ ] Empty array → null
- [ ] Single route → returns that route
- [ ] Two routes with equal output, different hops → picks fewer hops
- [ ] Routes with null fields gracefully handled
- [ ] All tests pass

### Hints
Existing tests: `src/lib/stellar/routing.test.ts`.
Build fake `SwapRoute` objects for the test cases.'

create_issue \
  "Add unit tests for the URL utility functions" \
  "testing,area:testing,priority:low" \
'### Overview
URL utilities in `src/lib/utils/url.ts` lack test coverage.

### Acceptance Criteria
- [ ] Test `buildQueryString`: empty params, single param, multiple params, special chars
- [ ] Test `parseQueryString`: valid string, empty, malformed
- [ ] Test `joinPath`: normal paths, trailing slashes, empty segments
- [ ] All tests pass

### Hints
Create `src/lib/utils/url.test.ts`.
Follow the existing test style from `src/lib/utils.test.ts`.'

create_issue \
  "Add test coverage report to CI as a PR comment" \
  "testing,area:ci-cd,priority:medium" \
'### Overview
Coverage is computed but not surfaced visibly. Add a coverage report comment on PRs.

### Acceptance Criteria
- [ ] Use a GitHub Action like `davelosert/vitest-coverage-report-action` or similar
- [ ] Comment the coverage delta on every PR
- [ ] Fail the build if coverage drops below thresholds

### Hints
Coverage thresholds are already in `vitest.config.ts`.
The CI workflow is `.github/workflows/ci.yml`.'

create_issue \
  "Add contract fuzz testing with proptest for trading-preferences" \
  "testing,area:smart-contracts,area:testing,priority:medium" \
'### Overview
The contract tests use fixed values. Add property-based/fuzz testing to catch edge cases.

### Acceptance Criteria
- [ ] Add `proptest` to contract dev-dependencies
- [ ] Fuzz test `set_preferences` with random slippage values (0-100000 bps)
- [ ] Fuzz test `batch_get_preferences` with random account arrays
- [ ] Fuzz test `publish` with random price values (including negative, zero)

### Hints
Cargo.toml: `src/contracts/trading-preferences/Cargo.toml`.
Add `proptest = "1"` to `[dev-dependencies]`.'

create_issue \
  "Add test for wallet store — connect, disconnect, account switch" \
  "testing,area:wallet,area:testing,priority:medium" \
'### Overview
The Zustand wallet store (`src/lib/stellar/wallet-store.ts`) has no tests.

### Acceptance Criteria
- [ ] Test initial state (disconnected, null address)
- [ ] Test connect action updates address
- [ ] Test disconnect action clears address
- [ ] Test account switch updates address
- [ ] Test persistence (localStorage) round-trip
- [ ] Mock the wallet-kit module for tests

### Hints
Create `src/lib/stellar/wallet-store.test.ts`.
Mock `@/lib/stellar/wallet-kit` using `vi.mock()`.'

create_issue \
  "Add test for the input validation utilities" \
  "testing,area:testing,priority:medium" \
'### Overview
The validators in `src/lib/utils/validators.ts` have no tests.

### Acceptance Criteria
- [ ] Test `isValidUrl`: valid URLs, invalid, empty, null
- [ ] Test `isValidEmail`: valid emails, invalid, edge cases
- [ ] Test `isValidHexColor`: #fff, #000000, invalid
- [ ] Test `isValidDomain`: valid domains, subdomains, invalid
- [ ] Test `isValidPercentage`: valid ranges, out of range, NaN
- [ ] Test `isValidPositiveInteger`: valid, zero, negative, decimals

### Hints
Create `src/lib/utils/validators.test.ts`.'

create_issue \
  "Add Playwright visual regression tests for critical pages" \
  "testing,area:testing,ux,priority:medium" \
'### Overview
Catch UI regressions with Playwright screenshot comparisons.

### Acceptance Criteria
- [ ] Screenshot tests for: home page, swap page, markets page, portfolio page
- [ ] Desktop (1280x720) and mobile (390x844) viewports
- [ ] Baseline screenshots stored in the repo
- [ ] CI job compares against baselines
- [ ] Document in CONTRIBUTING.md how to update baselines

### Hints
Playwright: `page.screenshot()` with `fullPage: true`.
Use `toMatchSnapshot()` from `@playwright/test`.'

# ═══════════════════════════════════════════════════════════════════════════
# 5. DOCUMENTATION (10)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Create API reference docs with request/response examples for every endpoint" \
  "documentation,area:docs,area:api,priority:high" \
'### Overview
The README lists API endpoints but doesn not show full request/response examples. Create comprehensive API docs.

### Acceptance Criteria
- [ ] Create `docs/api-reference.md`
- [ ] Each endpoint: method, URL, query params table, curl example, response JSON example
- [ ] Error responses documented (400, 404, 429, 502)
- [ ] Note which endpoints are SSE (Server-Sent Events)
- [ ] Link from README

### Hints
Endpoints are defined in `src/app/api/*/route.ts`.
Use the existing README API section as a starting point.'

create_issue \
  "Add JSDoc comments to all exported functions in the Stellar services layer" \
  "documentation,area:docs,priority:high" \
'### Overview
`src/lib/stellar/` functions need JSDoc documentation for contributors.

### Acceptance Criteria
- [ ] Every exported function in `src/lib/stellar/*.ts` has a `@param` and `@returns` JSDoc
- [ ] Every exported function has a one-line summary
- [ ] Types are documented where non-obvious
- [ ] No `any` in JSDoc — use proper types

### Hints
Files to document: account.ts, asset.ts, catalog.ts, config.ts, history.ts, horizon.ts, live.ts, orderbook.ts, prices.ts, queries.ts, routing.ts, simulation.ts, swap-execution.ts, tokens.ts, types.ts, wallet-kit.ts, wallet-store.ts'

create_issue \
  "Add architecture decision records (ADRs) for key design choices" \
  "documentation,area:docs,priority:medium" \
'### Overview
Document the rationale behind major architectural decisions.

### Acceptance Criteria
- [ ] Create `docs/adr/` directory
- [ ] ADR 001: Why Next.js App Router over Pages Router
- [ ] ADR 002: Why TanStack Query over SWR
- [ ] ADR 003: Why Zustand over Redux/Context
- [ ] ADR 004: Why standalone Docker output over serverful
- [ ] ADR 005: Why SSE over WebSockets for live data
- [ ] Template: Context, Decision, Consequences sections

### Hints
Format: https://adr.github.io/madr/'

create_issue \
  "Add a troubleshooting guide for common wallet connection issues" \
  "documentation,area:wallet,area:docs,priority:medium" \
'### Overview
Wallet connection problems are the most common support issue. Add a troubleshooting guide.

### Acceptance Criteria
- [ ] Create `docs/troubleshooting.md`
- [ ] Cover: "Freighter not detected", "Wrong network", "Transaction rejected", "Insufficient balance"
- [ ] Include screenshots where helpful
- [ ] Link from the wallet connect button area (contextual help)

### Hints
The wallet provider is at `src/components/providers/wallet-provider.tsx`.
Use the `isWalletAvailable` function for detection logic.'

create_issue \
  "Create a Swagger/OpenAPI spec for the Developer API" \
  "documentation,area:api,area:docs,priority:medium" \
'### Overview
Provide an OpenAPI 3.0 specification for the REST API so developers can generate clients.

### Acceptance Criteria
- [ ] Create `docs/openapi.yml` (or `openapi.json`)
- [ ] All 9 GET endpoints documented with parameters, responses, and examples
- [ ] Include the SSE endpoint (as a special type)
- [ ] Health endpoint included
- [ ] Validate the spec with an OpenAPI linter

### Hints
Use https://editor.swagger.io/ to validate.
The endpoints are listed in the README API section.'

create_issue \
  "Add code examples to the README showing how to use the Stellar services in external projects" \
  "documentation,area:docs,priority:medium" \
'### Overview
Show developers how to import and use TarshishDEX services in their own Stellar projects.

### Acceptance Criteria
- [ ] Add a "Using the Services" section to README
- [ ] Example: swap quote using `findBestRoute`
- [ ] Example: portfolio fetch using `fetchPortfolioSummary`
- [ ] Example: live trade streaming using `streamTradesRecords`
- [ ] Each example is self-contained and copy-pasteable

### Hints
The services are in `src/lib/stellar/`.
Examples should work in any Node.js/TypeScript project.'

create_issue \
  "Create a project roadmap with community-votable feature requests" \
  "documentation,area:docs,priority:low" \
'### Overview
Convert the existing README roadmap into a living GitHub Project board with community voting.

### Acceptance Criteria
- [ ] Create `ROADMAP.md` with: Now, Next, Later columns
- [ ] Link to GitHub Discussions for feature voting
- [ ] Enable GitHub Discussions on the repo
- [ ] Add `discussions` category labels: "Idea", "Voting", "Planned", "In Progress"

### Hints
Enable Discussions in repo Settings → Features → Discussions.'

create_issue \
  "Add inline documentation for the CSS design system tokens" \
  "documentation,area:design,area:docs,priority:medium" \
'### Overview
The Tailwind design tokens in `src/app/globals.css` should be documented so contributors know what each CSS variable controls.

### Acceptance Criteria
- [ ] Each CSS custom property in `:root` has a comment explaining its purpose
- [ ] Group comments by category: Background, Text/foreground, Borders, Accents, Surfaces
- [ ] Note which variables are used by which components

### Hints
File: `src/app/globals.css`.
Look for `@theme` blocks and `:root` blocks.'

create_issue \
  "Add a glossary of Stellar/DEX/DeFi terms for newcomers" \
  "documentation,area:docs,priority:low" \
'### Overview
Newcomers to Stellar may not know terms like "trustline", "stroop", "path payment", etc.

### Acceptance Criteria
- [ ] Create `docs/glossary.md`
- [ ] Define 20+ terms: trustline, stroop, lumen, orderbook, spread, mid price, slippage, path payment, Soroban, Horizon, SSE, etc.
- [ ] Each definition is 1-2 sentences, beginner-friendly
- [ ] Link from README

### Hints
Use the Stellar docs (https://developers.stellar.org) as reference.'

create_issue \
  "Create a project presentation slide deck (PDF) for hackathon judges" \
  "documentation,area:docs,priority:medium" \
'### Overview
A polished slide deck helps communicate the project to judges.

### Acceptance Criteria
- [ ] Create `docs/pitch-deck.md` (or PDF) with these slides:
  - Problem: Stellar lacks a professional DEX UI
  - Solution: TarshishDEX architecture
  - Demo: Screenshots of swap, portfolio, markets
  - Technical highlights: routing, simulation, Soroban contracts
  - Live demo link + repo link
  - Team / Credits
- [ ] Keep to 10 slides max
- [ ] Use the TarshishDEX brand colors

### Hints
Use https://sli.dev/ or just create a markdown file with embedded images.'

# ═══════════════════════════════════════════════════════════════════════════
# 6. SMART CONTRACTS (10)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add an emergency pause mechanism to the market-oracle contract" \
  "enhancement,area:smart-contracts,security,priority:high" \
'### Overview
The market-oracle contract cannot be paused in an emergency. Add a circuit-breaker.

### Acceptance Criteria
- [ ] Add `paused: bool` to instance storage
- [ ] `set_paused(env, paused: bool)` — admin only
- [ ] All publisher write operations check the pause flag
- [ ] Emit a `ContractPaused { paused: bool }` event
- [ ] Add unit tests: paused contract rejects publishes, unpaused accepts them

### Hints
File: `src/contracts/market-oracle/src/lib.rs`.
Add `DataKey::Paused` variant and a `set_paused` function.'

create_issue \
  "Add Sophon event indexing instructions for the trading-preferences contract" \
  "enhancement,area:smart-contracts,area:docs,priority:medium" \
'### Overview
The contracts emit typed events but there is no documentation on how to index them.

### Acceptance Criteria
- [ ] Add a section to `docs/deployment.md` about event indexing
- [ ] Show how to query events via the Soroban RPC `getEvents` method
- [ ] Include example filters for each event type
- [ ] Mention Sophon and Mercury as indexing options

### Hints
Event types: `Initialized`, `PreferencesChanged`, `AdminTransferred`, `PricePublished`, `PublisherUpdated`.
RPC docs: https://developers.stellar.org/docs/soroban/reference/rpc'

create_issue \
  "Add a limit-order-like data structure to the trading-preferences contract" \
  "enhancement,area:smart-contracts,epic,priority:medium" \
'### Overview
Extend the contract to support simple stop-loss / take-profit triggers that can be queried by off-chain bots.

### Acceptance Criteria
- [ ] New struct: `TriggerOrder { asset: Symbol, trigger_price: i128, order_type: Symbol }`
- [ ] `set_trigger(env, account, trigger)` — account-authenticated
- [ ] `get_triggers(env, account) -> Vec<TriggerOrder>`
- [ ] Emit `TriggerSet` event
- [ ] Unit tests for set/get/update/delete triggers

### Hints
Follow the existing `Preferences` pattern for per-account storage.
Use `DataKey::Triggers(Address)` as the storage key.'

create_issue \
  "Add input validation for asset symbols in the market-oracle contract" \
  "enhancement,area:smart-contracts,priority:medium" \
'### Overview
The `publish` function accepts any Symbol as base/counter. Add validation for asset code format.

### Acceptance Criteria
- [ ] Asset symbols must be 1-12 alphanumeric characters
- [ ] Reject with `Error::InvalidAsset` if the symbol is empty or too long
- [ ] Unit test: valid symbol passes, empty string fails, >12 chars fails

### Hints
File: `src/contracts/market-oracle/src/lib.rs`.
Use `Symbol::iter()` to check length. Add `Error::InvalidAsset` variant.'

create_issue \
  "Add a contract migration guide for upgrading to new contract versions" \
  "documentation,area:smart-contracts,priority:medium" \
'### Overview
Both contracts have a `set_version` function. Document how to migrate state to a new contract deployment.

### Acceptance Criteria
- [ ] Create `docs/contract-migration.md`
- [ ] Explain the immutable-deploy pattern (new contract ID per version)
- [ ] Show how to read state from old contract, write to new contract
- [ ] Include a migration script example
- [ ] Document the contract IDs on Testnet

### Hints
The contracts are at deployed addresses listed in `docs/deployment.md`.'

create_issue \
  "Add a batch-publish function to the market-oracle for multiple pairs" \
  "enhancement,area:smart-contracts,performance,priority:medium" \
'### Overview
Publishers currently make one transaction per pair. Add a batch function for efficiency.

### Acceptance Criteria
- [ ] `batch_publish(env, publisher, observations: Vec<(Symbol, Symbol, i128)>)`
- [ ] Auth check once for the publisher (not per observation)
- [ ] Each observation validated individually
- [ ] Partial success allowed (valid ones published, invalid ones skipped)
- [ ] Unit test: batch of 3, batch with one invalid price

### Hints
Reuse the `publish` function logic in a loop.
Use `Vec<(Symbol, Symbol, i128)>` for the observations parameter.'

create_issue \
  "Add a query to get all publisher addresses and their status" \
  "enhancement,area:smart-contracts,priority:low" \
'### Overview
There is no way to list all authorized publishers without knowing their addresses in advance.

### Acceptance Criteria
- [ ] Track publisher addresses in instance storage (`DataKey::PublisherList`)
- [ ] `get_all_publishers(env) -> Vec<(Address, bool)>`
- [ ] Update `set_publisher` to maintain the list
- [ ] Unit test: add publisher → appears in list, revoke → still in list but false

### Hints
Use `Vec<(Address, bool)>` stored under `DataKey::PublisherList`.
Be careful with Vec growth — cap at some reasonable limit.'

create_issue \
  "Add contract events for all state-changing operations (currently some are missing)" \
  "enhancement,area:smart-contracts,priority:medium" \
'### Overview
Audit both contracts and ensure every state-changing function emits a typed contract event.

### Acceptance Criteria
- [ ] `set_version` emits `VersionSet` — already done
- [ ] `transfer_admin` emits `AdminTransferred` — already done
- [ ] `remove_preferences` emits `PreferencesChanged` — already done
- [ ] All other state changes emit events
- [ ] Events include all relevant data for off-chain indexing

### Hints
Files: `src/contracts/trading-preferences/src/lib.rs`, `src/contracts/market-oracle/src/lib.rs`.
Look for `#[contractevent]` annotations.'

create_issue \
  "Add Oracle price confidence interval — publish low/high estimates alongside the price" \
  "enhancement,area:smart-contracts,priority:medium" \
'### Overview
The oracle publishes a single price. Add low/high estimates for a confidence interval.

### Acceptance Criteria
- [ ] Extend `Observation` struct: add `price_low: i128, price_high: i128`
- [ ] `publish` function accepts `price_low` and `price_high` alongside `price`
- [ ] Validate: `price_low <= price <= price_high` (all positive)
- [ ] Update existing tests to include the new fields
- [ ] Update the Soroban client in `src/lib/soroban/market-oracle.ts`

### Hints
The Observation struct is in `src/contracts/market-oracle/src/lib.rs`.
The TypeScript client is in `src/lib/soroban/market-oracle.ts`.'

create_issue \
  "Add a Soroban RPC health check to the health endpoint using the deployed contracts" \
  "enhancement,area:smart-contracts,area:api,priority:medium" \
'### Overview
`GET /api/health` should verify the deployed contracts are reachable and responding.

### Acceptance Criteria
- [ ] Call `get_version()` on both deployed contracts
- [ ] Include `contracts` section in the health response
- [ ] If contracts are unreachable, status = "degraded"
- [ ] Timeout each contract call at 5 seconds

### Hints
Health endpoint: `src/app/api/health/route.ts`.
Use the Soroban client from `src/lib/soroban/` to call the contracts.'

# ═══════════════════════════════════════════════════════════════════════════
# 7. DEVOPS / CI-CD (8)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add Docker image scanning with Trivy or Docker Scout" \
  "enhancement,area:ci-cd,security,priority:high" \
'### Overview
Scan the Docker image for known vulnerabilities before pushing to a registry.

### Acceptance Criteria
- [ ] Add a CI job that builds the Docker image
- [ ] Scan with `docker scout` or `trivy`
- [ ] Fail the build on HIGH/CRITICAL vulnerabilities
- [ ] Upload the scan report as an artifact

### Hints
CI file: `.github/workflows/ci.yml`.
`docker scout quickview` or `trivy image tarshishdex:latest`.'

create_issue \
  "Add stale issue/PR automation to close inactive items after 90 days" \
  "enhancement,area:ci-cd,priority:low" \
'### Overview
Automatically label and close issues/PRs that have been inactive for 90 days.

### Acceptance Criteria
- [ ] Create `.github/workflows/stale.yml`
- [ ] Use `actions/stale` action
- [ ] Mark as stale after 60 days of inactivity
- [ ] Close after 30 more days of staleness
- [ ] Exempt issues with `epic` or `security` labels
- [ ] Comment on the issue before closing: "Closing due to inactivity. Feel free to reopen."

### Hints
GitHub Action: https://github.com/actions/stale'

create_issue \
  "Add bundle size analysis to CI — fail on significant size regressions" \
  "enhancement,area:ci-cd,performance,priority:medium" \
'### Overview
Track Next.js bundle sizes and fail CI if a PR causes a significant increase.

### Acceptance Criteria
- [ ] Add `@next/bundle-analyzer` to dev dependencies
- [ ] Create a CI job that builds and captures bundle sizes
- [ ] Compare against the main branch baseline
- [ ] Warn on >5% increase, fail on >20% increase

### Hints
Next.js bundle analyzer: `ANALYZE=true next build`.
Or use `nextjs-bundle-analysis` GitHub Action.'

create_issue \
  "Add pre-commit hooks via husky (lint-staged already configured)" \
  "enhancement,area:ci-cd,priority:medium" \
'### Overview
We have a `.lintstagedrc.json` config but husky is not installed. Set it up.

### Acceptance Criteria
- [ ] Install `husky` as dev dependency
- [ ] Run `npx husky init` to set up the `.husky/` directory
- [ ] Add `.husky/pre-commit` hook that runs `npx lint-staged`
- [ ] Add `.husky/pre-push` hook that runs `npm run typecheck && npm test`
- [ ] Document in `CONTRIBUTING.md` how to set up git hooks

### Hints
The `.lintstagedrc.json` already defines which files to lint/format on pre-commit.
`npx husky init` creates the `.husky/` directory with a sample pre-commit hook.'

create_issue \
  "Deploy to Stellar Futurenet for bleeding-edge testing" \
  "enhancement,area:ci-cd,area:smart-contracts,priority:low" \
'### Overview
Add a CI job to deploy contracts to Futurenet (Stellar's preview network) for testing against upcoming protocol changes.

### Acceptance Criteria
- [ ] Add `futurenet` as a network option in `scripts/deploy-contracts.sh`
- [ ] Create a `deploy-futurenet.yml` workflow (manual dispatch, on PR label)
- [ ] Document Futurenet endpoints and contract IDs in the deployment docs

### Hints
Futurenet RPC: `https://rpc-futurenet.stellar.org`
Futurenet Horizon: `https://horizon-futurenet.stellar.org`'

create_issue \
  "Add Renovate bot config as alternative to Dependabot" \
  "enhancement,area:deps,area:ci-cd,priority:low" \
'### Overview
Some projects prefer Renovate over Dependabot for more granular control. Add a config.

### Acceptance Criteria
- [ ] Create `renovate.json` at the repo root
- [ ] Configure: group minor/patch updates, auto-merge dev deps, weekly schedule
- [ ] Respect the existing `.github/dependabot.yml` — both can coexist
- [ ] Document in CONTRIBUTING.md

### Hints
Renovate docs: https://docs.renovatebot.com/'

create_issue \
  "Add `npm run dev:prod` script that runs the production build locally" \
  "enhancement,area:devops,priority:low" \
'### Overview
Developers need an easy way to test the production build locally before deploying.

### Acceptance Criteria
- [ ] Add `"dev:prod": "npm run build && npm start"` to `package.json` scripts
- [ ] Document in README
- [ ] Ensure `.env.local` is read during the production build

### Hints
File: `package.json`.
`npm start` runs `next start` which serves the production build.'

create_issue \
  "Add a `.env.staging` template for the staging/QA environment" \
  "enhancement,area:devops,priority:low" \
'### Overview
We have `.env.example` and `.env.test`. Add a staging template for the QA deployment.

### Acceptance Criteria
- [ ] Create `.env.staging` with:
  - `NEXT_PUBLIC_STELLAR_NETWORK=testnet`
  - Contract IDs matching the testnet deployment
  - `LOG_LEVEL=debug`
  - Comments explaining each variable
- [ ] Add `.env.staging` to `.gitignore` (keep the template committed as `.env.staging.example`)
- [ ] Document in README

### Hints
Use `.env.example` as the starting template.'

# ═══════════════════════════════════════════════════════════════════════════
# 8. PERFORMANCE (5)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Lazy-load the market chart component to reduce initial page load JS" \
  "performance,area:analytics,area:frontend,priority:medium" \
'### Overview
The candlestick chart and its data payload add significant JS to the initial bundle. Lazy-load them.

### Acceptance Criteria
- [ ] Use `next/dynamic` with `{ ssr: false }` for heavy chart components
- [ ] Show a skeleton while the chart loads
- [ ] Measure Lighthouse score before/after — JS bundle should decrease
- [ ] Focus on: `CandlestickChart`, `VolumeChart`, `AllocationDonut`, `PriceChartPanel`

### Hints
```tsx
const PriceChartPanel = dynamic(() => import("@/components/analytics/price-chart-panel"), {
  ssr: false,
  loading: () => <Skeleton className="h-[32rem] rounded-2xl" />,
});
```'

create_issue \
  "Add memcache or Redis caching layer for frequently-accessed Horizon queries" \
  "performance,area:backend,priority:high" \
'### Overview
Repeated Horizon calls for the same data (orderbook, asset catalog) waste bandwidth and slow responses. Add caching.

### Acceptance Criteria
- [ ] Create a cache layer (`src/lib/server/cache.ts`) wrapping the existing query cache
- [ ] Cache keys include the network + query params
- [ ] TTLs: orderbook 5s, asset catalog 60s, market stats 15s, health 10s
- [ ] In-memory by default (Map), with optional Redis adapter
- [ ] `Cache-Control` headers set on API responses matching cache TTLs

### Hints
A `query-cache.ts` module exists at `src/lib/server/query-cache.ts` — check and extend it.
The `cache-headers.ts` module has cache control builders.'

create_issue \
  "Optimize the portfolio allocation donut chart for large numbers of assets" \
  "performance,area:portfolio,ux,priority:medium" \
'### Overview
The allocation donut chart groups small allocations into "Other" but this is not configurable.

### Acceptance Criteria
- [ ] Group slices below 2% into "Other"
- [ ] "Other" slice shows the count of grouped assets on hover
- [ ] Max 8 slices in the donut
- [ ] Colors are consistently assigned (USDC always blue, XLM always gold, etc.)

### Hints
File: `src/components/charts/allocation-donut.tsx`.
Sort allocations by value descending before grouping.'

create_issue \
  "Add pagination (or infinite scroll) to the asset browser for large catalogs" \
  "performance,area:assets,ux,priority:medium" \
'### Overview
The asset browser fetches all assets at once. For large catalogs on Mainnet, this can be slow.

### Acceptance Criteria
- [ ] Add cursor-based pagination to the asset catalog API (`/api/assets`)
- [ ] "Load More" button at the bottom of the asset browser
- [ ] Infinite scroll option as a user preference
- [ ] API response includes `nextCursor` for the next page

### Hints
Files: `src/app/api/assets/route.ts`, `src/components/assets/asset-browser.tsx`.
Horizon supports cursor-based pagination natively.'

create_issue \
  "Add Image optimization with next/image for all static images" \
  "performance,area:frontend,priority:medium" \
'### Overview
Replace raw `<img>` tags with `next/image` for automatic optimization, lazy loading, and proper sizing.

### Acceptance Criteria
- [ ] All `<img>` in `src/components/` replaced with `next/image` `<Image>`
- [ ] Add `width` and `height` props (or `fill` with parent sizing)
- [ ] `priority` prop on above-the-fold images (logo, hero)
- [ ] Verify no layout shift (CLS) after the change

### Hints
`import Image from "next/image"`.
For the logo: `<Image src="/favicon.svg" width={32} height={32} alt="TarshishDEX" priority />`.'

# ═══════════════════════════════════════════════════════════════════════════
# 9. ACCESSIBILITY (8)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Audit and fix color contrast ratios across the design system" \
  "accessibility,area:design,area:frontend,priority:high" \
'### Overview
Dark theme color contrasts may not meet WCAG AA (4.5:1 for normal text, 3:1 for large text).

### Acceptance Criteria
- [ ] Audit all text colors in `src/app/globals.css` using a contrast checker
- [ ] Fix any ratio below 4.5:1 for body text
- [ ] Fix any ratio below 3:1 for large/heading text
- [ ] Document which tokens were adjusted
- [ ] Test with Chrome DevTools Accessibility panel

### Hints
Use https://webaim.org/resources/contrastchecker/ or Chrome DevTools contrast checker.
CSS variables are in `src/app/globals.css` under `@theme` and `:root`.'

create_issue \
  "Ensure all interactive elements are keyboard accessible (Tab, Enter, Escape)" \
  "accessibility,area:frontend,priority:high" \
'### Overview
Dropdowns, modals, and tooltips should be fully keyboard navigable.

### Acceptance Criteria
- [ ] Tab through all interactive elements in a logical order
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals, dropdowns, and the command palette
- [ ] Arrow keys navigate within dropdown menus
- [ ] Focus is trapped inside open modals (already have FocusTrap)
- [ ] Focus returns to the trigger element when a modal closes

### Hints
Existing: `FocusTrap` in `src/components/ui/focus-trap.tsx`.
Test with keyboard-only navigation (no mouse).'

create_issue \
  "Add skip-to-content link as the first focusable element on every page" \
  "accessibility,area:frontend,priority:medium" \
'### Overview
Keyboard users need a "Skip to main content" link to bypass navigation.

### Acceptance Criteria
- [ ] Add a `SkipLink` as the first element in `<body>`
- [ ] Visible on focus (not hidden with `display: none`)
- [ ] Targets `<main>` element
- [ ] The `SkipLink` component already exists at `src/components/ui/skip-link.tsx` — wire it in

### Hints
Wire it in `src/app/layout.tsx`, right after the `<body>` tag.
Component: `src/components/ui/skip-link.tsx`.'

create_issue \
  "Add screen reader announcements for dynamic content updates" \
  "accessibility,area:frontend,priority:medium" \
'### Overview
When swap quotes update, toasts appear, or errors occur, screen readers aren not notified.

### Acceptance Criteria
- [ ] Use the `ScreenReaderAnnouncement` component for live-region updates
- [ ] Announce: "Quote updated — 100 XLM → 10.25 USDC"
- [ ] Announce: "Transaction submitted" and "Transaction confirmed"
- [ ] Announce: "Error: Insufficient balance"
- [ ] Use `aria-live="polite"` for non-urgent, `aria-live="assertive"` for errors

### Hints
Component: `src/components/ui/screen-reader-announcement.tsx`.'

create_issue \
  "Add accessible form labels and error messages to all inputs" \
  "accessibility,area:frontend,priority:high" \
'### Overview
Some form inputs may lack proper `<label>` associations or `aria-describedby` for error messages.

### Acceptance Criteria
- [ ] Every `<input>` has an associated `<label>` (via `htmlFor` or wrapping)
- [ ] Error messages are linked via `aria-describedby`
- [ ] Use `FieldError` and `InputLabel` components where available
- [ ] Run `axe-core` or Lighthouse accessibility audit — all form-related issues resolved

### Hints
Components: `src/components/ui/field-error.tsx`, `src/components/ui/input-label.tsx`.'

create_issue \
  "Add reduced-motion support for animations and transitions" \
  "accessibility,area:frontend,priority:medium" \
'### Overview
Users who prefer reduced motion should not see animations.

### Acceptance Criteria
- [ ] Add `@media (prefers-reduced-motion: reduce)` to `globals.css`
- [ ] Disable: hover scale transforms, toast slide-in, spinner animation, skeleton pulse
- [ ] Respect the `prefers-reduced-motion` media query globally

### Hints
Tailwind has `motion-reduce:` variants: `motion-reduce:transform-none`.
Add a CSS rule: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }`'

create_issue \
  "Add accessible names to all SVG icons using `<title>` and `aria-hidden`" \
  "accessibility,area:frontend,priority:medium" \
'### Overview
Decorative SVGs should use `aria-hidden="true"` and informative SVGs should have `<title>`.

### Acceptance Criteria
- [ ] Decorative icons (in buttons, backgrounds) get `aria-hidden="true"`
- [ ] Informative icons (status indicators, logos) get a `<title>` element
- [ ] The existing `AccessibleIcon` component wraps SVGs correctly — ensure it is used everywhere

### Hints
Component: `src/components/ui/accessible-icon.tsx`.
Search: `grep -r "<svg" src/components/ | grep -v "aria-hidden"`.'

create_issue \
  "Add focus-visible styles to all interactive elements globally" \
  "accessibility,area:design,area:frontend,priority:medium" \
'### Overview
Focus rings only appear for mouse clicks (via `:focus-visible`), but some elements may be missing them.

### Acceptance Criteria
- [ ] All buttons, links, inputs, selects, and checkboxes have visible `:focus-visible` styles
- [ ] Focus ring color is consistent (use `--color-primary` or a visible outline)
- [ ] No element uses `outline: none` without a replacement focus indicator
- [ ] Test with Tab navigation through every page

### Hints
Tailwind's `focus-visible:ring-2 focus-visible:ring-primary` pattern.
Check `src/app/globals.css` for any `outline: none` overrides.'

# ═══════════════════════════════════════════════════════════════════════════
# 10. UX POLISH (7)
# ═══════════════════════════════════════════════════════════════════════════

create_issue \
  "Add a confetti/celebration animation on successful swap execution" \
  "ux,area:swap,priority:low" \
'### Overview
A small celebration when a swap completes makes the experience delightful.

### Acceptance Criteria
- [ ] Confetti animation on swap success (canvas-confetti or similar lightweight lib)
- [ ] Confetti only for successful on-chain transactions (not simulations)
- [ ] Respects `prefers-reduced-motion`
- [ ] Runs for ~3 seconds then auto-dismisses

### Hints
Consider `canvas-confetti` (2.5KB gzipped) or a pure CSS solution.
Trigger in `src/components/swap/swap-widget.tsx` after a successful `executeSwap` call.'

create_issue \
  "Add animated number transitions for changing values (balances, prices)" \
  "ux,area:frontend,priority:low" \
'### Overview
When prices or balances update, they snap instantly. Smooth transitions look more professional.

### Acceptance Criteria
- [ ] Use a number transition animation (count-up/down effect)
- [ ] Apply to: swap output amount, portfolio balances, market stats
- [ ] Transition duration: ~500ms
- [ ] Accepts a `duration` prop

### Hints
Implement a simple `AnimatedNumber` component using `requestAnimationFrame`.
Or use the `useDelayedValue` hook pattern with interpolation.'

create_issue \
  "Add a connection quality indicator (green/yellow/red) for SSE streams" \
  "ux,area:markets,area:api,priority:low" \
'### Overview
Users should know if their live data stream is healthy or disconnected.

### Acceptance Criteria
- [ ] Small dot indicator next to "Live" label on markets/analytics
- [ ] Green: connected and receiving events
- [ ] Yellow: reconnecting
- [ ] Red: disconnected (with manual reconnect button)
- [ ] Last event timestamp shown

### Hints
SSE EventSource has `onopen`, `onerror`, and readyState properties.
Use `EventSource.readyState` to track connection status.'

create_issue \
  "Add a what's new / changelog modal shown on first visit after an update" \
  "ux,area:frontend,priority:low" \
'### Overview
Returning users should see what changed since their last visit.

### Acceptance Criteria
- [ ] Store last-seen version in localStorage
- [ ] On version bump, show a modal with the latest CHANGELOG.md entries
- [ ] "Got it" button dismisses and updates the stored version
- [ ] Only shows once per version

### Hints
Check `src/lib/utils/env.ts` for `APP_VERSION`.
The CHANGELOG.md has version sections in markdown format.'

create_issue \
  "Add haptic feedback on mobile for swap confirmations and button presses" \
  "ux,priority:low" \
'### Overview
Mobile users expect subtle vibration feedback on important actions.

### Acceptance Criteria
- [ ] Swap confirmation: light haptic
- [ ] Error states: warning haptic (different pattern)
- [ ] Wallet connect/disconnect: light haptic
- [ ] Only on devices that support `navigator.vibrate`

### Hints
`navigator.vibrate(10)` for a light tap, `navigator.vibrate([30, 50, 30])` for a pattern.
Wrap in a `try/catch` since vibration is not universally supported.'

create_issue \
  "Add drag-to-reorder for watchlist assets in the market table" \
  "ux,area:markets,priority:low" \
'### Overview
Users should be able to reorder their watchlist by dragging assets.

### Acceptance Criteria
- [ ] Drag handle icon on each watchlisted row
- [ ] Drag to reorder within the watchlist section
- [ ] Order persists in localStorage
- [ ] Smooth animation during drag
- [ ] Works on touch devices

### Hints
Consider `@dnd-kit/core` or a lightweight custom implementation.
The watchlist state is in localStorage (from the watchlist enhancement issue).'

create_issue \
  "Add a 'copy trade' feature — pre-fill the swap widget from a market row" \
  "ux,area:swap,area:markets,priority:medium" \
'### Overview
Clicking a "Trade" button on a market row should navigate to /swap with the pair pre-selected.

### Acceptance Criteria
- [ ] "Trade" button on each market table row
- [ ] Navigates to `/swap?input=XLM&output=USDC:ISSUER`
- [ ] Swap widget reads query params and pre-selects the assets
- [ ] Preserves other swap state (wallet connection, slippage)

### Hints
File: `src/components/markets/market-table.tsx`.
Add query params: `?input=XLM&output=USDC:GA5Z...`.
Read params in `src/app/swap/page.tsx` or in the `SwapWidget` component.'

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Created $TOTAL issues in $REPO"
echo "═══════════════════════════════════════════════"
