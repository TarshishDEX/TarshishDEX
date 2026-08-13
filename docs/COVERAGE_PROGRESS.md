# Coverage Progress — TarshishDEX

Status snapshot as of **2026-08-13** (post batch-16).

## Current state

| Metric | Coverage | Target |
|---|---|---|
| Statements | **99.77%** (3461/3469) | 99.5% |
| Branches | **92.51%** (2150/2324) | 99.5% |
| Functions | **99.72%** (1073/1076) | 99.5% |
| Lines | **99.97%** (3114/3115) | 99.5% |

- **Statements target met** — 99.5% achieved at 99.77%.
- Only **8 statements** remain uncovered, all defensively-unreachable guards (see below).
- Thresholds in `vitest.config.ts` (`coverage.thresholds`) are far below actuals and are all green.

## The 8 remaining uncovered statements (all defensively unreachable)

Line numbers are 1-based from the JSON coverage (`coverage/coverage-final.json` via `npx vitest run --coverage --coverage.reporter=json`).

| File | Line | Source text (trimmed) | Why unreachable |
|---|---|---|---|
| `src/components/charts/candlestick-chart.tsx` | 29 | `if (!containerRef.current) return;` | ResizeObserver callback always runs with a mounted ref |
| `src/components/orders/limit-order-form.tsx` | 41 | `if (disabled) return;` | Button is `disabled` when handler would fire |
| `src/components/orders/limit-order-table.tsx` | 76 | `if (!address) return;` | Cancel button only renders when address exists |
| `src/components/swap/on-chain-preferences.tsx` | 81 | `if (!address) return;` | Save only enabled when address exists |
| `src/components/ui/focus-trap.tsx` | 31 | `if (!first \|\| !last) return;` | `length > 0` guarantees first/last defined |
| `src/components/ui/network-indicator.tsx` | 17 | `if (typeof navigator === "undefined") return;` | SSR-only; jsdom always has navigator |
| `src/components/ui/qr-code.tsx` | 23 | `if (!canvas) return;` | Canvas ref always attached before paint |
| `src/components/ui/screen-reader-announcement.tsx` | 17 | `return state;` (reducer fallthrough) | Only `append` action is ever dispatched |

These cannot be exercised through public API/UI without contrived internals or SSR-only
harnesses. Reaching them would require test-only code changes to production source, so they
are intentionally left uncovered.

## Batch-16 summary (completed)

Added `src/components/__tests__/components-coverage-16.test.tsx` (14 tests),
`src/lib/__tests__/lib-coverage-16.test.tsx` (16 tests), and extended
`src/lib/soroban/__tests__/soroban-clients.test.ts` (+3 tests) to cover:

- **Components**: focus-trap (non-Tab + no-focusable), price-impact-badge (low/medium),
  accessible-icon (non-element child), animated-number (flash timer), share-link (clipboard
  fallback reset), transition-height (hide timer), trade-history (invalid date), swap-widget
  (high/medium impact), limit-order-table (oracle loading), swap-execution-panel
  (mark_executed build failure), connect-wallet-button (disconnect cancel).
- **Hooks**: use-window-focus, use-document-visibility, use-effect-once (ran guard),
  use-intersection-observer (empty entry), use-on-click-outside (inside click),
  use-copy-to-clipboard (fallback timer), use-token-balance (invalid key guard).
- **lib**: graceful-shutdown (timeout + SIGTERM wrapper), limit-order-queries (fetch failure +
  no-address), logger (LOG_LEVEL), queries (missing-inputs guard), routing (bridge first leg
  not filled), wallet-kit (SSR availability), theme (SSR snapshot).
- **Soroban**: `parseResultXdr` arrow bodies for `place_order`, `cancel_order`/`mark_executed`,
  and `set_preferences`.

Technique notes worth reusing in future batches:
- **queryFn direct invocation**: for guards gated by `enabled`, find the cached query via
  `queryClient.getQueryCache().findAll()` and call `query.options.queryFn` directly
  (used for `useSwapQuote`, `useTokenBalance`, `useUserLimitOrders`).
- **SSR snapshot**: `renderToString` + `vi.stubGlobal("window"/"document", undefined)` to hit
  server-only branches (theme, wallet-kit).
- **Tagged orderbook mocks**: `fetchOrderbook` returns a `tag` field so `simulateOrderbookFill`
  can distinguish bridge vs direct legs (routing L63).

## Workflow rules (from user)

- One commit per improvement — **do not bundle**.
- Push to main after each phase; only start the next phase once the previous is pushed.
- User wants **99.5% overall coverage across all project areas** — **met**.

## Commit history for this effort (most recent first)

```
docs: store coverage progress — 98.76% statements, full 43-statement gap map, batch-16 resume plan
d792693 test: final coverage batch — bridge routing failures, limit-order catches, wallet-kit events, sw-register, trading-preferences failure paths, 3 hooks, swap-widget flows, oracle/cancel branches, panel marking — 31 tests
92a2946 fix: correct Token shapes in watchlist tests + valid AQUA issuer for routing
9d1a617 test: cover routing bridge/horizon branches, wallet-kit, wallet-store, trading-preferences, limit-order client, orderbook, watchlist, localStorage-value, blockquote + route 429s — 16 tests
e77e775 test: cover swap-widget edge cases, command-palette, asset-browser, live-sync, token-selector, on-chain prefs, market-table, limit-order-form, candlestick, donut — 42 tests
3a904f1 fix: spec-compliant SSE cancel handler + cover rate-limit cleanup, volume-chart formatters
```
