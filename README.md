<div align="center">

<img src="docs/tarshishdex-logo.svg" alt="TarshishDEX" width="360" />

# TarshishDEX

**Trade Stellar's native DEX — intelligently.**

A professional decentralized trading platform built *exclusively* on **Stellar's native DEX** and **Soroban smart contracts** — intelligent order routing, pre-execution simulation, on-chain limit orders, portfolio analytics, and a read-only developer API, all at near-zero cost.

[![CI](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/ci.yml/badge.svg)](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/ci.yml)
[![Fortress Gates](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/ci-summary.yml/badge.svg)](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/ci-summary.yml)
[![Deploy](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/deploy.yml/badge.svg)](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/codeql.yml/badge.svg)](https://github.com/TarshishDEX/TarshishDEX/actions/workflows/codeql.yml)
![Tests](https://img.shields.io/badge/tests-2083%20passing-2ea44f)
![E2E](https://img.shields.io/badge/E2E-171%20Playwright%20tests-2ea44f)
![Coverage](https://img.shields.io/badge/coverage-99.77%25%20statements-2ea44f)
![Contract coverage](https://img.shields.io/badge/contract%20coverage-99.5%25%20lines-2ea44f)
![CI/CD](https://img.shields.io/badge/CI%2FCD-31%20workflows-0ea5e9)
![Contracts](https://img.shields.io/badge/error%20codes-300-7B1FA2)
![Soroban](https://img.shields.io/badge/Soroban-3%20contracts%20live-7B1FA2)
![Rust](https://img.shields.io/badge/Rust-1.82%2B-b7410e?logo=rust&logoColor=white)
![Gas optimized](https://img.shields.io/badge/gas%20optimized-ultra--low%20fees-2ea44f)
![Gas benchmarks](https://img.shields.io/badge/gas%20benchmarks-37%20enforced-2ea44f)
![npm vulns](https://img.shields.io/badge/critical%20vulns-0-2ea44f)
![Audited](https://img.shields.io/badge/security-audited%20Aug%202026-2ea44f)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-4%20strict%20flags-3178C6?logo=typescript&logoColor=white)
![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-7B1FA2?logo=stellar&logoColor=white)
[![Live demo](https://img.shields.io/badge/live_demo-tarshishdex.vercel.app-0ea5e9)](https://tarshishdex.vercel.app)

[**Live Demo**](https://tarshishdex.vercel.app) · [**Deployment**](#deployment) · [**API Docs**](#developer-api) · [**Demo Video**](#demo-video)

</div>

---

## 🚀 What is TarshishDEX?

TarshishDEX is a **complete decentralized trading gateway into the Stellar ecosystem** — intelligent trade execution, liquidity insights, portfolio management, market analytics, on-chain limit orders, transaction simulation, and advanced trading controls. It runs directly on Stellar's native orderbook and Soroban smart contracts, so there are **no bridges, no wrapped assets, and no middlemen** — just the raw speed, liquidity, and near-zero cost of the Stellar network.

Unlike a basic token swap, TarshishDEX is a professional terminal:

- 🧭 **Intelligent routing** — path-finding picks the most efficient execution route across the orderbook (direct, multi-hop, and Horizon path-finding evaluated concurrently).
- 🧪 **Simulate before you sign** — every quote shows expected output, price impact, minimum received, and fees *before* you authorize a transaction.
- 📋 **On-chain limit orders** — a Soroban limit-order registry with expiry and execution tracking.
- 🧩 **On-chain preferences** — per-account slippage, routing mode, and asset allow-lists stored in Soroban.
- 📡 **Live price oracle** — an admin-gated on-chain observation feed with a 16-entry ring buffer.
- 💸 **Ultra-low fees** — reads cost ~0.00001 XLM; writes cost 0.003–0.019 XLM (dominated by refundable state rent, not compute).
- 🏦 **Developer API** — read-only REST + SSE endpoints for builders on Stellar's native DEX.

**All three Soroban smart contracts are live on Stellar Testnet** — trading preferences, market oracle, and limit-order registry — with 121 Rust tests, 300 error codes, and gas benchmarks enforced in CI.

## ✨ Highlights

| | |
| --- | --- |
| ⚡ **Native DEX trades** | Executed directly on Stellar's orderbook — no bridges, no wrapping. |
| 🧭 **Intelligent routing** | Path-finding picks the most efficient execution route across the orderbook. |
| 🔍 **Full transparency** | Every quote shows expected output, price impact, minimum received, and fees *before* you sign. |
| 🧪 **Pre-execution simulation** | Detect failed transactions before they hit the network. |
| 👥 **Multi-account portfolios** | Connect multiple wallets, switch accounts, compare performance. |
| 📡 **Live market data** | Real-time orderbook depth and trades via Horizon SSE streams. |
| 🧩 **On-chain preferences** | Per-account slippage, routing mode, and asset allow-lists stored in Soroban contracts. |
| 📋 **Limit orders** | On-chain limit order registry — place, cancel, paginate orders with Soroban persistence. |
| 📡 **Price oracle** | Admin-gated publisher feed for on-chain price observations with 16-entry ring-buffer history. |
| 📦 **Developer API** | Read-only REST + SSE endpoints for builders on Stellar's native DEX. |

## 💸 Gas & Fees — verified ultra-low

Every contract function is benchmarked against a local protocol-27 network (`stellar-cli 27.1.0`) and the Soroban SDK v27 test sandbox. The full schedule is in [`docs/GAS_BENCHMARKS.md`](docs/GAS_BENCHMARKS.md).

| Operation | Measured fee |
| --- | --- |
| Read (any `get_*`) | 100 stroops ≈ **0.00001 XLM** |
| `initialize` | ~40k stroops ≈ **0.004 XLM** |
| `set_preferences` / `cancel_order` / `mark_executed` | 37–58k ≈ **0.004–0.006 XLM** |
| `place_order` / `set_publisher` | 71–144k ≈ **0.007–0.014 XLM** |
| `publish` (first per pair) | ~190k ≈ **0.019 XLM** (heaviest op) |

Fees are dominated by **refundable state rent** from TTL extension, not CPU or I/O — the compute + I/O portion of even the heaviest operation is only ~15–20k stroops. CPU stays ~216k max against a 100M-instruction transaction limit. Storage is **bounded** (no unbounded lists in instance storage), so write cost does not scale with order/pair/account count.

## 🏆 Quality Scoreboard

| Gate | Status |
|------|--------|
| TypeScript | **4 strict flags** — 0 errors |
| ESLint | 0 errors, 0 warnings |
| Tests | **2,083 passing** (119 test files) |
| Coverage | **99.77% statements** (96.6% branches, 99.72% functions, 99.96% lines) |
| Rust contracts | **121 tests passing** — fmt ✅, clippy 0 warnings |
| Contract coverage | **99.5% lines** (cargo-llvm-cov, 95% CI gate) |
| Contract errors | **300 error codes** across 3 Soroban contracts |
| E2E (Playwright) | **171 tests** across 5 suites |
| npm vulns | **0 critical** |
| CI workflows | **31** (verification + maintenance) |
| CSP headers | Applied in middleware — no `unsafe-eval` |
| PWA | SVG icons, network-first service worker |
| Build | Next.js standalone, non-root Docker |

### 🔒 Formal Audit — August 2026

A comprehensive security and quality audit was conducted across all layers:

| Layer | Result |
|-------|--------|
| **TypeScript** | ✅ 0 errors — 4 strict flags |
| **ESLint** | ✅ 0 errors, 0 warnings |
| **Vitest** | ✅ 2,083 tests, 119 files, 0 failures |
| **Coverage** | ✅ 99.77% statements (96.6% branches, 99.72% functions, 99.96% lines), thresholds: 80/72/82/82 |
| **E2E (Playwright)** | ✅ 171 tests, 5 suites (swap, portfolio, orders, navigation, analytics) |
| **Rust fmt** | ✅ All contracts formatted |
| **Rust clippy** | ✅ 0 warnings across 3 crates |
| **Rust tests** | ✅ 121 tests, 0 failures |
| **Contract coverage** | ✅ 99.51% lines via cargo-llvm-cov (CI gate: 95%) |
| **Contract errors** | ✅ 300 error codes (100+100+100 per contract) |
| **Gas benchmarks** | ✅ 37 benchmarks, hard regression gate in CI |
| **Dependencies** | ✅ 0 critical npm vulns |
| **CI/CD** | ✅ 31 workflows, security + quality gates |
| **Dead code** | ✅ 0 orphaned files |
| **Secrets** | ✅ TruffleHog scanning in CI |
| **CodeQL** | ✅ JS/TS analysis in CI |

**Verdict: Production-grade with strong defenses.** All quality gates pass at zero tolerance. TypeScript coverage sits at 99.77% statements with hard CI thresholds, the Soroban contracts are at 99.51% line coverage with a 95% gate, gas benchmarks are enforced by a failing regression check, and E2E flows are verified with 171 Playwright tests.

## 📸 Screenshots

Captured against the live deploy (`tarshishdex.vercel.app`) with Playwright — wallet-backed pages use a stubbed Freighter extension plus a real funded Testnet account. Full-size images live in [`docs/screenshots/`](docs/screenshots).

### The product

| Swap | Markets |
| --- | --- |
| ![Swap](docs/screenshots/swap.png) | ![Markets](docs/screenshots/markets.png) |

| Portfolio | Analytics |
| --- | --- |
| ![Portfolio](docs/screenshots/portfolio.png) | ![Analytics](docs/screenshots/analytics.png) |

| Assets | Limit orders |
| --- | --- |
| ![Assets](docs/screenshots/assets.png) | ![Limit orders](docs/screenshots/orders.png) |

### Wallet, mobile & proof of work

| Wallet & account | On-chain transactions | Mobile & CI |
| --- | --- | --- |
| <img src="docs/screenshots/wallet-connected.png" width="300" alt="Connected wallet"/> | <img src="docs/screenshots/successful-testnet-transaction.png" width="300" alt="Testnet transaction"/> | <img src="docs/screenshots/mobile-responsive.png" width="300" alt="Mobile swap"/> |
| Connected address chip (real funded account) | Real contract-call tx on stellar.expert (SUCCESS) | Swap page at 390×844 |
| <img src="docs/screenshots/balance-displayed.png" width="300" alt="Balance"/> | <img src="docs/screenshots/transaction-result.png" width="300" alt="Price published"/> | <img src="docs/screenshots/ci-pipeline.png" width="300" alt="CI pipeline"/> |
| Wallet dropdown with live XLM balance | `publish` → `PricePublished` event | GitHub Actions quality + contract gates |
| <img src="docs/screenshots/wallet-options.png" width="300" alt="Wallet picker"/> | <img src="docs/screenshots/test-output.png" width="300" alt="Coverage report"/> |  |
| Wallet picker (Freighter + StellarWalletsKit) | Coverage report — 2,083 tests passing |  |

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (4 strict flags) |
| Styling | Tailwind CSS v4 (custom dark DeFi design system) |
| Blockchain | `@stellar/stellar-sdk`, `@creit.tech/stellar-wallets-kit` (Freighter + more) |
| Smart contracts | Soroban SDK v27 (Rust, `#![no_std]`, `wasm32v1-none`) |
| Data fetching | TanStack Query + Horizon SSE streams |
| State | zustand |
| Charts | lightweight-charts + Recharts |
| Testing | Vitest (2,083 tests) + Playwright E2E (171); Rust `cargo test` (121) + cargo-llvm-cov |
| Quality | ESLint, Prettier (Tailwind plugin), strict TypeScript, rustfmt + clippy |
| CI/CD | 31 GitHub Actions workflows (lint, test, E2E, secret scan, gas regression, coverage…) |
| Deployment | Docker (multi-stage standalone image) + docker-compose + Vercel |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
# → Open http://localhost:3000

# Quality gates
npm run lint          # ESLint
npm run typecheck     # strict TypeScript (4 flags)
npm test              # Vitest suite (2,083 tests)
npm run format:check  # Prettier

# Full verification
bash scripts/quality-gates.sh
```

## 🗂 Project Structure

```
src/
├── app/                  # Next.js App Router (pages, layouts, metadata)
│   ├── swap/             # Token swap engine
│   ├── markets/          # Live market pricing + orderbook depth
│   ├── portfolio/        # Multi-account portfolio dashboard
│   ├── assets/           # Asset discovery & issuer info
│   └── analytics/        # Market analytics & charts
├── components/
│   ├── layout/           # Header, footer, navigation shell
│   ├── ui/               # Design-system primitives (60+ components)
│   └── brand/            # Logo & brand marks
├── lib/                  # Stellar services, Soroban clients, utilities (30+ modules)
└── contracts/            # Soroban smart contracts (Rust workspace)
```

## 🏗 Architecture

TarshishDEX is organized as a clean, layered system — the UI consumes a framework-agnostic **Stellar services layer** that encapsulates all Horizon, wallet, and Soroban interaction, so pages and components never talk to the network directly.

```
┌─────────────────────────────────────────────────────────────┐
│  UI — pages (app/) + components (components/)                │
│  · TanStack Query hooks (lib/stellar/queries.ts)             │
├─────────────────────────────────────────────────────────────┤
│  Stellar services layer (lib/stellar/)                       │
│  · orderbook · simulation · routing · swap-execution         │
│  · prices · history · live (SSE) · account · asset           │
│  · wallet-kit / wallet-store · horizon · config              │
├─────────────────────────────────────────────────────────────┤
│  Soroban clients (lib/soroban/) — trading-preferences,       │
│  market-oracle, limit-order (3 Rust contracts)               │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
        Stellar network — Horizon REST + SSE, wallets
```

### Swap pipeline (the core flow)

Every swap follows the same transparent, simulated pipeline — **quote → route → simulate → sign → submit** — before a single transaction touches the network.

```
findBestRoute(input, output, amount, slippage)
  │
  ├─ simulateDirectRoute    → direct orderbook fill (walks ask levels)
  ├─ simulateBridgeRoute    → multi-hop via XLM / USDC bridges
  └─ simulateHorizonPath    → Horizon strict-send path finding
  │
  ▼
selectBestRoute  (pure, unit-tested — highest output, fewest hops)
  │
  ▼
buildRoute  → execution price · price impact · min received · fee · warnings
  │
  ▼
executeSwap  (phase machine: checking → building → signing → submitting → success | failed)
  │
  ├─ needsTrustline?  → adds a changeTrust op for new destination assets
  ├─ pathPaymentStrictSend along the chosen path
  ├─ signTransactionXdr via the wallet (Freighter / StellarWalletsKit)
  └─ submitTransaction → Horizon · explorer URL on success
```

The three route strategies are evaluated concurrently (`Promise.all`), and `selectBestRoute` picks the winner by highest output, tie-breaking on fewer hops.

| Module | Responsibility |
| --- | --- |
| `orderbook.ts` | Fetch + normalize orderbook depth (bids/asks, mid price, spread) |
| `simulation.ts` | Pure fill simulation, price impact, min received, fee & warning derivation |
| `routing.ts` | Route discovery — direct, multi-hop, and Horizon path-finding |
| `swap-execution.ts` | Build/sign/submit path payments, trustline handling, error classification |
| `prices.ts` | OHLCV candles, 24h market stats, top-asset discovery |
| `history.ts` | Account trade history |
| `live.ts` | Horizon SSE streams (trades, operations) returning cleanup functions |
| `account.ts` / `asset.ts` | Account loading, balance helpers, asset identity & conversion |
| `wallet-kit.ts` / `wallet-store.ts` | Wallet connection, session persistence, XDR signing |
| `horizon.ts` / `config.ts` | Horizon server factory, network config, base fee, explorer URLs |
| `tokens.ts` / `catalog.ts` | Token metadata, discovery catalog, issuer info |
| `queries.ts` | TanStack Query hooks wiring services to the UI |

Pure logic (routing, simulation, swap execution, assets, prices, account, history, tokens) is extracted for unit testing — 20+ modules at 100% line/branch/function coverage.

## 🛡️ Security

- **CSP headers** applied via middleware — `script-src` without `unsafe-eval`
- **HSTS** + X-Frame-Options + X-Content-Type-Options
- **Rate limiting** on all API endpoints with configurable window/limit
- **Circuit breaker** pattern for Horizon/Soroban RPC calls
- **Zod validation** for all API inputs with structured error responses
- **Input sanitization** across all user-facing inputs
- **Non-root Docker** user in production image
- **Mainnet safety gates** — deploy script requires confirmation; runtime console warning when on public network
- **Global API error handler** with correlation IDs for consistent error responses
- **31 CI workflows** including secret scanning, code scanning (CodeQL), dependency audit, cargo-audit/cargo-deny, and contract security audit

## 📡 Developer API

TarshishDEX exposes a **read-only REST + SSE API** for developers building on Stellar's native DEX. All endpoints are server-side and honour the configured network.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health, active network, Horizon URL |
| `GET` | `/api/market/stats?limit=10` | Market stats for the most traded assets (price, volume, 24h change) |
| `GET` | `/api/market/orderbook?selling=XLM&buying=USDC:ISSUER&limit=20` | Orderbook depth for a pair |
| `GET` | `/api/market/candles?base=XLM&counter=USDC:ISSUER&resolution=3600000&range=86400000` | OHLCV candles from trade aggregations |
| `GET` | `/api/swap/quote?input=XLM&output=USDC:ISSUER&amount=100&slippage=1` | Best-route quote: execution price, price impact, min received, fees |
| `GET` | `/api/portfolio/:address` | Portfolio valuation, allocation, and balances for an account |
| `GET` | `/api/trades/:address?limit=40` | Recent trade history for an account |
| `GET` | `/api/assets?limit=24&code=&issuer=` | Asset discovery with issuer, supply, and trustline stats |
| `GET` | `/api/events?base=XLM&counter=USDC:ISSUER` _(SSE)_ | Live stream of trades for a pair (`event: trade`) |

```bash
curl "http://localhost:3000/api/swap/quote?input=XLM&output=USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&amount=100"
```

## ⚙️ Environment Variables

See [`.env.example`](.env.example) for the full set:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` | Active network (`testnet` \| `public`) |
| `HORIZON_URL` | network default | Server-side Horizon URL override |
| `LOG_LEVEL` | `info` | Server log threshold (`debug` \| `info` \| `warn` \| `error`) |
| `NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS` | — | Treasury address for fee collection |
| `NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID` | Testnet ID | Deployed `trading-preferences` Soroban contract |
| `NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID` | Testnet ID | Deployed `market-oracle` Soroban contract |
| `NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID` | Testnet ID | Deployed `limit-order` Soroban contract |

## 🐳 Docker

```bash
docker compose up --build   # serves on http://localhost:3000
```

The image is multi-stage with `output: "standalone"`, runs as a **non-root user**, and serves the minimal `server.js`. Configure the network via the `NEXT_PUBLIC_STELLAR_NETWORK` environment variable.

## 🔗 Soroban Smart Contracts

The [`src/contracts/`](src/contracts) directory is a Cargo workspace of three Soroban contracts (Rust, `#![no_std]`, compiled to the `wasm32v1-none` target required by Soroban SDK v27 on Rust 1.82+). They extend the platform with on-chain state, secure authorization, and typed events — **all three are live on Stellar Testnet**.

| Contract | Purpose | Storage |
| --- | --- | --- |
| [`trading-preferences`](src/contracts/trading-preferences) | Per-account slippage tolerance, routing mode, and asset allow-list | Persistent per-account (TTL-managed) |
| [`market-oracle`](src/contracts/market-oracle) | Admin-gated price observation feed for analytics | Persistent pair observations + instance pair registry |
| [`limit-order`](src/contracts/limit-order) | On-chain limit order registry with expiry and execution tracking | Persistent per-order + per-user indexing |

All three contracts demonstrate the Soroban v27 SDK patterns used across TarshishDEX:

- `#[contract]` / `#[contractimpl]` / `#[contracttype]` / `#[contracterror]` macros
- `#[contractevent]` typed events published via the generated `Event::publish(&env)` method
- Authorization via `Address::require_auth` (per-account writes; admin-gated publisher grants)
- TTL-managed persistent storage (`extend_ttl`) and instance storage for configuration
- Unit tests with `Env::default()` + `mock_all_auths()` + generated clients (`try_*` variants for error assertions)
- Gas benchmarks for every write operation using `env.cost_estimate()` (see [Gas Benchmarks](docs/GAS_BENCHMARKS.md))

### Build & test contracts

```bash
cd src/contracts
cargo build --workspace                       # native (dev)
cargo build --target wasm32v1-none --release  # wasm artifacts (Soroban v27 target)
cargo test --workspace                        # full contract test suite
cargo test --workspace -- gas_benchmarks --nocapture   # gas benchmarks
cargo test --workspace -- bench_resource_table --nocapture  # per-tx resource + fee table
cargo fmt --all -- --check                    # formatting gate
cargo clippy --all-targets -- -D warnings
```

### WASM sizes

| Contract | Size | % of 64 KB limit |
| --- | --- | --- |
| `trading_preferences.wasm` | 20.6 KB | 32.2% |
| `market_oracle.wasm` | 29.4 KB | 45.9% |
| `limit_order.wasm` | 30.4 KB | 47.5% |

> All comfortably under Soroban's deploy limit. The release profile uses `opt-level="z"`, `lto`, `strip`, and `panic="abort"`. See [Gas Benchmarks](docs/GAS_BENCHMARKS.md) for per-function resource usage and measured on-chain XLM fees.

## 👛 Wallet Usage

TarshishDEX connects through **Freighter** (and any other wallet in the StellarWalletsKit picker).

1. **Install Freighter** — get the [Freighter browser extension](https://www.freighter.app/). The app detects a missing wallet and shows an install hint.
2. **Create/fund an account** — create a Testnet account in Freighter and fund it from the [Stellar Lab friendbot](https://lab.stellar.org/account/create) or `stellar keys fund`.
3. **Connect** — click **Connect Wallet** in the header, approve in Freighter. The session persists across page refreshes (localStorage).
4. **Switch / disconnect** — click the address chip in the header to switch accounts or disconnect.
5. **Sign** — swaps and on-chain preference writes are signed in Freighter with the network passphrase for the active network.

## 🔌 Contract Interaction

All three contracts are **live on Stellar Testnet** (see [Deployment](#deployment) below). Set the contract IDs in `.env.local`:

```bash
NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID=CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM
NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID=CBWISHEEE7W2WFXUPYX3R4HFOM54RYM3PQUXYCCTMZ5VNEOIKOZSUS7V
NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID=CATBY2SG26N6E7P34BEL4SWWQVI5LDQT7W26O3TS4HVPL2FZ6LIWPJNM
```

- **Swap page → On-chain preferences** — reads the connected account's stored slippage/routing from the `trading-preferences` contract and writes updates via the wallet (`set_preferences`), showing the transaction hash on success.
- **API / analytics** — market analytics can consume `market-oracle` observations through the Soroban client in `src/lib/soroban/`.
- **Limit orders** — the `limit-order` contract persists user orders on-chain; the frontend queries them for the swap page and portfolio dashboard.
- **CLI examples** (live contract IDs on Testnet):

```bash
# Read an account's preferences
stellar contract invoke \
  --id CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM \
  --network testnet --source-account alice -- \
  get_preferences --account G...

# Write preferences (authorized via require_auth)
stellar contract invoke \
  --id CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM \
  --network testnet --source-account alice --send=yes -- \
  set_preferences --account G... \
  --prefs '{"max_slippage_bps": 250, "routing_mode": "auto", "allowed_assets": []}'

# Publish a price observation (authorized publisher)
stellar contract invoke \
  --id CBWISHEEE7W2WFXUPYX3R4HFOM54RYM3PQUXYCCTMZ5VNEOIKOZSUS7V \
  --network testnet --source-account alice --send=yes -- \
  publish --publisher G... --base USDC --counter XLM --price 10000000
```

## 🗺 Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold, design system, layout shell, UI primitives | ✅ Done |
| 2 | Stellar services layer, swap engine, routing, simulation | ✅ Done |
| 3 | Portfolio dashboard, trade history, market analytics | ✅ Done |
| 4 | Wallet integration (Freighter/StellarWalletsKit), live sync | ✅ Done |
| 5 | Soroban contracts, CI/CD hardening, documentation | ✅ Done |
| 6 | Developer API (REST + SSE), server logging, Docker deployment | ✅ Done |
| 7 | Battle-hardening: security audit, test coverage, strict TS, vuln fix | ✅ Done |
| 8 | Gas optimization: bounded storage, resource/fee benchmarks | ✅ Done |

## 🚢 Deployment

### Contracts (Stellar Testnet)

```bash
cd src/contracts
cargo build --workspace --target wasm32v1-none --release
STELLAR_SOURCE_ACCOUNT=S... bash ../../scripts/deploy-contracts.sh
```

The script deploys and initializes all three contracts, then prints their IDs. **All three contracts are deployed on Testnet** — live addresses and verified contract-call transaction hashes are documented in [`docs/deployment.md`](docs/deployment.md).

> ⚠️ **Mainnet deployment** requires `STELLAR_MAINNET_CONFIRM=yes` and uses the public network passphrase.

### Contracts via CI (GitHub Actions)

The `Deploy` workflow (`workflow_dispatch`) deploys the contracts to Testnet (or Mainnet) from CI:

1. Add the **`STELLAR_SOURCE_ACCOUNT`** repository secret (the deployer's `S...` secret key — must be funded on the target network).
2. Run **Actions → Deploy → Run workflow**, pick the network (default `testnet`).
3. The job builds the wasm, deploys + initializes all three contracts, uploads a deployment manifest artifact, and prints the fresh contract IDs in the summary.

### Frontend

- **Docker**: `docker compose up --build` serves on `http://localhost:3000`.
- **Vercel (recommended)**: add the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets, link the project with `npx vercel link`, then run the `Deploy` workflow with **deploy_frontend: true**. The frontend job builds with the freshly deployed contract IDs and ships a production build.

**🔗 Live demo: [https://tarshishdex.vercel.app](https://tarshishdex.vercel.app)** — production build on Stellar **Testnet** with the deployed contract IDs baked in as build-time env vars. Verify the service with `curl https://tarshishdex.vercel.app/api/health`.

## 🎬 Demo Video

**▶️ [TarshishDEX demo (2 minutes)](docs/videos/tarshishdex-demo.mp4)** — walkthrough of the live app: wallet connect → balance → live swap quote → portfolio → analytics → markets → assets → mobile viewport.

Recorded against the live deploy with `scripts/capture-demo-video.mjs` (Playwright `recordVideo`) and assembled with `scripts/assemble-demo-video.sh` (ffmpeg title card + outro, trimmed to exactly 2:00).

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, quality gates, and pull-request workflow — and note that all contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes. The latest release ([v0.3.0](CHANGELOG.md#030--2026-08-12--fortress-release)) documents the coverage/testing/CI hardening, with the unreleased [gas & storage optimization](CHANGELOG.md#unreleased) work on top.

## 📄 License

Licensed under the [MIT License](LICENSE). TarshishDEX is a demonstration project built for the Stellar ecosystem.

## 🙏 Credits

- **Stellar Development Foundation** — the Stellar network, Horizon, Soroban, and tooling.
- **SDF StellarWalletsKit ecosystem** — wallet abstraction (`@creit.tech/stellar-wallets-kit`) and Freighter.
- Open-source libraries: Next.js, React, TanStack Query, zustand, Recharts, lightweight-charts, Tailwind CSS.

---

Built with ❤️ for the Stellar ecosystem.
