# Changelog

All notable changes to TarshishDEX are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-08-11 — Battle-Hardening Release

This release is the result of an intensive 8-round security, quality, and test-coverage
audit preparing TarshishDEX for Stellar Drips Wave and Grant Fox program submission.

34 commits. 0 → 302 tests. 0 → 0 critical npm vulns. 15% → 23% coverage.
20+ modules at 100% line/branch/function coverage.

---

### 🔴 Critical Security & Bug Fixes

- **CSP headers applied to middleware** — `security.ts` had CSP defined but was never imported into `middleware.ts`. All pages now serve Content-Security-Policy headers.
- **Broken `batchReadTradingPreferences` fixed** — used `JSON.stringify` + XDR base64 encoding which always failed. Now correctly reads Soroban contract state.
- **Limit-order contract orphaned IDs fixed** — `cancel_order` and `mark_executed` removed the Order entry from persistent storage but left orphaned IDs in the `OrderList` (global index) and `UserOrders` (per-user index) vectors. Added `remove_from_indexes()` called by both methods.
- **Removed `unsafe-eval` from CSP** — was unnecessarily permissive. Build succeeds without it, closing a script injection vector.
- **Mainnet safety checks** — `config.ts` console-warns when `NEXT_PUBLIC_STELLAR_NETWORK=public`. Deploy script requires `STELLAR_MAINNET_CONFIRM=yes` for public network. CI passes this automatically for production workflows.
- **Missing `limit_order_id` in deploy CI** — only exported 2 of 3 Soroban contract IDs to the frontend build, so the limit-order contract was deployed but never wired into the UI.

### 🟠 Quality & API Hardening

- **Global `apiHandler()` wrapper** — catches unhandled exceptions in API routes and returns consistent `500` responses with correlation IDs. Applied to `swap/quote`, `orders`, and `market/orderbook`.
- **Zod validation wired into swap/quote** — `swapQuoteParamsSchema` existed in schemas but was never used. Now validates all incoming swap quote requests with structured field-level error responses.
- **Rate limit configs for all API endpoints** — previously only `orders`, `swap/quote`, `market/stats`, and `market/pools` had explicit limits. Added configs for orderbook, candles, events (SSE), assets, portfolio, and trades.
- **Contract ID format validation** — `validateEnv()` now checks `NEXT_PUBLIC_*_CONTRACT_ID` (56-char base32 starting with `C`) and `NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS` (Stellar public key format). Catches typos early.
- **Fee collector address configurable** — `NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS` overrides hardcoded treasury, enabling custom destinations per deployment.

### 🟡 TypeScript Strictness

- **`noUncheckedIndexedAccess` enabled** — all 42 resulting null-safety errors fixed across 14 files using explicit guards and non-null assertions. Catches real null-pointer bugs at compile time.
- **`noImplicitReturns` enabled** — caught a missing return in `transition-height` `useLayoutEffect`.
- **`noFallthroughCasesInSwitch` enabled** — prevents accidental switch fallthrough bugs.
- **Four strict flags total**: `strict` + `noUncheckedIndexedAccess` + `noImplicitReturns` + `noFallthroughCasesInSwitch`.

### 🟢 Testing — 0 → 302 Tests

- **Utility module tests**: 25+ modules now tested (array, assert, async, classnames, clipboard, color, constants, date, deep-equal, env, event-emitter, export-csv, format-currency, format-number, hash, math, memoize, network, noop, object, pipe, random, retry, safe-json, seo). Utils coverage: 0.79% → 66.24%.
- **Stellar service tests** — tokens, prices, account, and history modules all at **100%** line/branch/function coverage. Edge cases: null midPrice, missing orderbook, candle failures, sort with null values, missing optional fields, crypto fallback.
- **Simulation tests** — zero amountIn, extreme price impact (>5%), clean fill, partial fill.
- **Asset tests** — missing issuer throw, XLM code without issuer treated as native.
- **Config tests** — public network env override, explorer URL builders.
- **Server utility tests** — content-type negotiation, cursor pagination (encode/decode round-trip, edge cases), circuit breaker (threshold, recovery after timeout).
- **Soroban config tests** — contract ID env vars, RPC server caching.
- **API E2E smoke tests** — 10 API-level tests using Playwright request fixture covering health, swap/quote, orderbook, stats, assets, orders, portfolio, and 404.
- **Coverage thresholds**: raised from 15/10/10/15 → 22/20/19/22.

### 🔵 Infrastructure & CI

- **`quality-gates.sh`** — single-script verification running Prettier, ESLint, TypeScript, Vitest, Rust contract tests, and Next.js build. Supports `--quick` and `--fix` modes.
- **Contract security CI** — `cargo-audit` + `cargo-deny` workflow runs on every push to contracts and weekly. Added `deny.toml` with permissive OSI-approved license allowlist.
- **CI workflow count**: 18 → 19 (new `contract-audit.yml`).

### 🟣 PWA & UI

- **PWA icons created** — manifest referenced non-existent `icon-192.png` and `icon-512.png`. Created SVG icons at both sizes.
- **Service worker upgraded** — network-first strategy with layered caches (static assets cache-first with auto-update, pages network-first with offline fallback, API requests bypass cache).
- **Error boundaries for all routes** — previously only the root `error.tsx` existed. Added dedicated error boundaries for swap, markets, portfolio, assets, analytics, and orders.

### 📝 Documentation & Config

- **`GRANTS.md`** — milestone tracking with 4 development phases, key performance indicators, and checklists for Stellar Drips Wave and Grant Fox programs.
- **`.env.example` cleaned** — removed duplicate `LOG_LEVEL`, organized into logical sections (Network, Application, Contracts, Fees, Testing). Added missing vars.
- **`robots.txt` fixed** — was pointing to wrong domain.

### 📦 Dependencies

- **npm overrides for protobufjs + uuid** — reduced vulns from 42 → 34, criticals 3 → 2.
- **vitest 2.x → 4.x** — eliminated 2 remaining critical vulns. Total vulns: 34 → 30. **0 critical.**
- **`validateEnv()` wired up** — was dead code; now runs via Next.js instrumentation hook at startup.

---

## [0.1.0] — 2026-08-07 — Initial Release

### Added

- **Swap engine**: Full swap pipeline with intelligent routing (direct, bridge, Horizon path-finding), pre-execution simulation, price impact calculation, and multi-hop support.
- **Portfolio dashboard**: Multi-account portfolio with balance tables, trade history, allocation donut chart, and P&L tracking.
- **Market analytics**: Live market stats, OHLCV candlestick charts, orderbook depth visualization, and volume charts.
- **Wallet integration**: Freighter + StellarWalletsKit with session persistence, multi-account switching, and XDR signing.
- **Soroban smart contracts**: `trading-preferences` (per-account slippage/routing/allow-list), `market-oracle` (admin-gated price observations), and `limit-order` (on-chain order registry). All live on Stellar Testnet.
- **Developer API**: Read-only REST + SSE endpoints for health, market stats, orderbook, candles, swap quotes, portfolio, trades, assets, and live trade events.
- **Design system**: 60+ UI components (Button, Card, Badge, Toast, Tooltip, Tabs, Modal, Select, Switch, Checkbox, RadioGroup, ProgressBar, Meter, Pagination, CommandPalette, DataTable, etc.).
- **Utility library**: 30+ utility modules (validators, debounce, throttle, memoize, random, math, date, string, array, object, env, url, hash, etc.).
- **Hook library**: 20+ React hooks (useDebounce, useCopyToClipboard, useKeyboardShortcuts, useLocalStorage, useMediaQuery, useIntersectionObserver, useWindowSize, etc.).
- **CI/CD**: GitHub Actions for frontend quality gates + Soroban contract gates; deploy workflow for contracts + Vercel frontend.
- **Docker**: Multi-stage production image with standalone Next.js output, non-root user.
- **Documentation**: README with architecture diagram, API docs, deployment guide, screenshots, demo video.
- **PWA**: Service worker, manifest, dark/light theme support.

### Security

- Rate limiting middleware with configurable window/limit
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, CSP, CORS)
- Input validation and sanitization in all API routes
- Structured logging with request IDs
- Circuit breaker and request timeout for Horizon calls
- Zod validation schemas for all API inputs
- Graceful shutdown handling
