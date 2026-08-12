# Coverage Progress — TarshishDEX

Status snapshot as of **2026-08-12** (post batch-15, commit `d792693`).

## Current state

| Metric | Coverage | Target |
|---|---|---|
| Statements | **98.76%** (3426/3469) | 99.5% |
| Branches | **91.30%** | 99.5% |
| Functions | **98.51%** | 99.5% |
| Lines | **99.77%** (3108/3115) | 99.5% |

- **Statements need 26 more covered** to hit 99.5% (43 statements currently uncovered across 33 files).
- Lines metric already exceeds target; statements are the bottleneck.
- Thresholds are configured in `vitest.config.ts` (check `coverage.thresholds` before finalising).

## The 43 uncovered statements (full map)

Line numbers are 1-based from the JSON coverage (`coverage/coverage-final.json` via `npx vitest run --coverage --coverage.reporter=json`).

### Multi-statement files
| File | Lines | Source text (trimmed) |
|---|---|---|
| `src/components/ui/focus-trap.tsx` | 25, 27, 31 | `if (e.key !== "Tab") return;` / `if (focusable.length === 0) return;` / `if (!first || !last) return;` |
| `src/components/orders/limit-order-table.tsx` | 35, 76 | `return <span …>…</span>;` (oracle loading) / `if (!address) return;` (handleCancel guard) |
| `src/components/swap/swap-widget.tsx` | 48, 49 | `if (quote.priceImpactPct > 1) return "high";` / `if (… > 0.5) return "medium";` |
| `src/components/ui/price-impact-badge.tsx` | 14, 16 | `if (pct <= 0) return "low";` / `if (pct <= 1) return "medium";` |
| `src/lib/theme.tsx` | 22, 33 | `if (typeof window === "undefined") return "dark";` / `if (typeof document === "undefined") return;` |
| `src/lib/hooks/use-window-focus.ts` | 15, 16 | `const onFocus = () => setFocused(true);` / `const onBlur = () => setFocused(false);` |
| `src/lib/server/graceful-shutdown.ts` | 29, 41 | `setTimeout(() => reject(new Error("Shutdown timed out")), timeoutMs)` / `process.on("SIGTERM", () => handleShutdown("SIGTERM"));` |
| `src/lib/soroban/limit-order.ts` | 132, 171 | `parseResultXdr: (scv) => scValToNative(scv),` (place_order) / `parseResultXdr: () => undefined,` (cancel/execute) |
| `src/lib/stellar/limit-order-queries.ts` | 14, 36 | `if (!address) return [];` / `if (!res.ok) throw new Error("Failed to fetch orders");` |

### Single-statement files
| File | Line | Source text (trimmed) |
|---|---|---|
| `src/components/charts/candlestick-chart.tsx` | 29 | `if (!containerRef.current) return;` |
| `src/components/orders/limit-order-form.tsx` | 41 | `if (disabled) return;` |
| `src/components/portfolio/trade-history.tsx` | 123 | `if (Number.isNaN(date.getTime())) return iso;` |
| `src/components/swap/on-chain-preferences.tsx` | 81 | `if (!address) return;` |
| `src/components/swap/swap-execution-panel.tsx` | 96 | `if (!res.ok) throw new Error("Failed to build mark_executed transaction");` |
| `src/components/ui/accessible-icon.tsx` | 15 | `if (!isValidElement(children)) return children;` |
| `src/components/ui/animated-number.tsx` | 41 | `const timer = setTimeout(() => setFlash(false), 600);` |
| `src/components/ui/network-indicator.tsx` | 17 | `if (typeof navigator === "undefined") return;` |
| `src/components/ui/qr-code.tsx` | 23 | `if (!canvas) return;` |
| `src/components/ui/screen-reader-announcement.tsx` | 17 | `return state;` (reducer fallthrough) |
| `src/components/ui/share-link.tsx` | 34 | `setTimeout(() => setCopied(false), 2000);` |
| `src/components/ui/transition-height.tsx` | 42 | `const timer = setTimeout(() => setMounted(false), duration);` |
| `src/components/wallet/connect-wallet-button.tsx` | 208 | `onCancel={() => setConfirmDisconnect(false)}` |
| `src/lib/hooks/use-copy-to-clipboard.ts` | 34 | `setTimeout(() => setCopied(false), 2000);` (fallback path) |
| `src/lib/hooks/use-document-visibility.ts` | 16 | `const handler = () => setVisibility(document.visibilityState);` |
| `src/lib/hooks/use-effect-once.ts` | 13 | `if (ran.current) return;` |
| `src/lib/hooks/use-intersection-observer.ts` | 29 | `if (!entry) return;` |
| `src/lib/hooks/use-on-click-outside.ts` | 19 | `if (!el || el.contains(event.target as Node)) return;` |
| `src/lib/hooks/use-token-balance.ts` | 37 | `if (!asset || !address || !isValidPublicKey(address)) return null;` |
| `src/lib/server/logger.ts` | 17 | `if (envLevel && envLevel in LOG_LEVELS) return envLevel;` |
| `src/lib/soroban/trading-preferences.ts` | 208 | `parseResultXdr: () => null,` (writeTradingPreferences) |
| `src/lib/stellar/queries.ts` | 28 | `if (!input || !output || !amountIn || Number(amountIn) <= 0) return null;` |
| `src/lib/stellar/routing.ts` | 63 | `return { path: [input, bridge, output], fill: null, method: "multi-hop", midPrice: null };` |
| `src/lib/stellar/wallet-kit.ts` | 91 | `if (typeof window === "undefined") return false;` |

## Batch-16 plan (next session — 30+ achievable statements)

Test patterns to reuse:
- **Component mocks**: `src/components/__tests__/components-coverage-15.test.tsx` — hoisted `walletState`, `useSwapQuoteMock`, `useOraclePriceMock`, `useUserLimitOrdersMock`, `useXlmBalanceMock`, `isWalletAvailableMock`.
- **Routing mocks**: `src/lib/__tests__/lib-coverage-15.test.tsx` — `fetchOrderbookMock`, `simulateFillMock`, `strictSendPathsMock`, `loggerWarnMock`, real `isSameAsset`.
- **Soroban client mocks**: `src/lib/soroban/__tests__/soroban-clients.test.ts` — `buildMock` captures `parseResultXdr` into `capturedParse`; `stubRawResult()` makes `simulate()` run the parser.

Targets (26+ needed):
1. **focus-trap**: dispatch non-Tab keydown (L25); Tab with no focusable children (L27). L31 is defensively unreachable (first/last always defined when length>0) — skip or leave.
2. **limit-order-table**: mock `useOraclePrice` → `{ isLoading: true }` renders "…" (L35). L76 guard unreachable via UI (Cancel only renders with address) — skip.
3. **swap-widget**: mock `useSwapQuote` quotes with `priceImpactPct` 2 (L48) and 0.75 (L49).
4. **price-impact-badge**: render with impactPct 0 (L14) and 0.75 (L16).
5. **theme**: stub `window`/`document` undefined then render `ThemeProvider` (L22/L33) — verify React still mounts with `vi.stubGlobal`.
6. **use-window-focus**: `renderHook` + `fireEvent` focus/blur on `window`.
7. **graceful-shutdown**: extend `server-lib-3.test.ts` — L41 (SIGTERM wrapper) is skipped because the mock capture overwrites `handler` with the SIGINT wrapper; capture both callbacks and invoke each. L29 (timeout) needs fake timers + an `onShutdown` that never resolves.
8. **limit-order.ts L132/L171** + **trading-preferences L208**: in `soroban-clients.test.ts`, invoke `capturedParse!` after building so the arrow bodies execute (`scValToNative(scv)`, `undefined`, `null`).
9. **limit-order-queries L36**: mock `global.fetch` → `{ ok: false }` for `usePaginatedLimitOrders`. L14 unreachable (query disabled when no address) — skip.
10. **trade-history L123**: entry with invalid `createdAt` date string → `formatDate` returns iso.
11. **swap-execution-panel L96**: render with `orderId`, mock `executeSwap` to invoke the `onSuccess` marking callback, mock `fetch` → `!ok` → throw path.
12. **accessible-icon L15**: pass a non-element child (e.g. string) → returns as-is.
13. **animated-number L41**: change `value` prop → flash timer runs.
14. **share-link L34**: `navigator.share` undefined + `navigator.clipboard.writeText` resolves → copied timer.
15. **transition-height L42**: rerender `show={false}` → hide timer.
16. **connect-wallet-button L208**: connected state → open dropdown → Disconnect → click Cancel in `DisconnectDialog`.
17. **use-copy-to-clipboard L34**: clipboard rejects → fallback `execCommand` path with fake timers.
18. **use-document-visibility L16**: dispatch `visibilitychange` event.
19. **use-effect-once L13**: rerender with a new effect identity → `ran.current` guard hit.
20. **use-intersection-observer L29**: mock `IntersectionObserver` callback with empty/undefined entry.
21. **use-on-click-outside L19**: mousedown inside the ref element.
22. **use-token-balance L37**: mock `isValidPublicKey` to reject (queryFn guard) — note: `enabled` gates the query, so this may be unreachable; verify.
23. **logger L17**: `vi.stubEnv("LOG_LEVEL", "info")` + `vi.resetModules()` + fresh import.
24. **queries L28**: `useSwapQuote` with null input via direct queryFn invocation or mock — verify reachability (enabled gates it).
25. **routing L63**: bridge first leg not fully filled (`findBestRoute(XLM, AQUA, "10")` with `simulateFillMock` returning `fullyFilled: false` on the USDC leg) — lib-15 test may already partially cover; extend.
26. **wallet-kit L91**: `vi.stubGlobal("window", undefined)` + call `isWalletAvailable()`.
27. **screen-reader-announcement L17**: reducer fallthrough — only via unknown action; skip if impossible.
28. **network-indicator / qr-code / candlestick L29 / on-chain-preferences L81 / limit-order-form L41**: defensively unreachable or SSR-only; likely skip.

## Workflow rules (from user)

- One commit per improvement — **do not bundle**.
- Push to main after each phase; only start the next phase once the previous is pushed.
- User wants **99.5% overall coverage across all project areas**.

## Commit history for this effort (most recent first)

```
d792693 test: final coverage batch — bridge routing failures, limit-order catches, wallet-kit events, sw-register, trading-preferences failure paths, 3 hooks, swap-widget flows, oracle/cancel branches, panel marking — 31 tests
92a2946 fix: correct Token shapes in watchlist tests + valid AQUA issuer for routing
9d1a617 test: cover routing bridge/horizon branches, wallet-kit, wallet-store, trading-preferences, limit-order client, orderbook, watchlist, localStorage-value, blockquote + route 429s — 16 tests
e77e775 test: cover swap-widget edge cases, command-palette, asset-browser, live-sync, token-selector, on-chain prefs, market-table, limit-order-form, candlestick, donut — 42 tests
3a904f1 fix: spec-compliant SSE cancel handler + cover rate-limit cleanup, volume-chart formatters
```
