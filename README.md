# TarshishDEX

**A decentralized trading interface built exclusively on Stellar's native DEX and Soroban smart contracts.**

TarshishDEX is a complete decentralized trading platform for the Stellar network — intelligent trade execution, liquidity insights, portfolio management, market analytics, transaction simulation, and advanced trading controls — all leveraging the speed, near-zero cost, and built-in liquidity of Stellar's native decentralized exchange.

## Why TarshishDEX

Unlike a basic token swap, TarshishDEX is a professional trading gateway into the Stellar ecosystem:

- **Native DEX trades** — executed directly on Stellar's orderbook. No bridges, no wrapping.
- **Intelligent routing** — path-finding picks the most efficient execution route across the orderbook.
- **Full transparency** — every quote shows expected output, price impact, minimum received, and fees _before_ you sign.
- **Pre-execution simulation** — detect failed transactions before they hit the network.
- **Multi-account portfolios** — connect multiple wallets, switch accounts, compare performance.

## Tech Stack

| Layer           | Technology                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript                                |
| Styling         | Tailwind CSS v4 (custom dark DeFi design system)                             |
| Blockchain      | @stellar/stellar-sdk, @creit.tech/stellar-wallets-kit (Freighter + more)     |
| Smart contracts | Soroban SDK (Rust)                                                           |
| Data fetching   | TanStack Query + Horizon SSE streams                                         |
| Charts          | Recharts / lightweight-charts                                                |
| Testing         | Vitest + React Testing Library; Rust `cargo test` for contracts              |
| Quality         | ESLint, Prettier (with Tailwind plugin), strict TypeScript, rustfmt + clippy |
| CI/CD           | GitHub Actions (frontend gates + Soroban contract gates)                     |
| Deployment      | Docker (multi-stage standalone image) + docker-compose                       |

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
# Open http://localhost:3000

# Quality gates
npm run lint        # ESLint
npm run typecheck   # strict TypeScript
npm test            # Vitest suite
npm run format:check
```

## Project Structure

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
│   ├── ui/               # Design-system primitives (Button, Card, Badge…)
│   └── brand/            # Logo & brand marks
├── lib/                  # Utilities, formatting, shared helpers
└── contracts/            # Soroban smart contracts (Rust workspace)
```

## Developer API

TarshishDEX exposes a read-only REST + SSE API for developers building on Stellar's native DEX. All endpoints are server-side and honour the configured network.

| Endpoint                                                                                 | Description                                                         |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `GET /api/health`                                                                        | Service health, active network, Horizon URL                         |
| `GET /api/market/stats?limit=10`                                                         | Market stats for the most traded assets (price, volume, 24h change) |
| `GET /api/market/orderbook?selling=XLM&buying=USDC:ISSUER&limit=20`                      | Orderbook depth for a pair                                          |
| `GET /api/market/candles?base=XLM&counter=USDC:ISSUER&resolution=3600000&range=86400000` | OHLCV candles from trade aggregations                               |
| `GET /api/swap/quote?input=XLM&output=USDC:ISSUER&amount=100&slippage=1`                 | Best-route quote: execution price, price impact, min received, fees |
| `GET /api/portfolio/:address`                                                            | Portfolio valuation, allocation, and balances for an account        |
| `GET /api/trades/:address?limit=40`                                                      | Recent trade history for an account                                 |
| `GET /api/assets?limit=24&code=&issuer=`                                                 | Asset discovery with issuer, supply, and trustline stats            |
| `GET /api/events?base=XLM&counter=USDC:ISSUER`                                           | SSE stream of live trades for a pair (`event: trade`)               |

```bash
curl "http://localhost:3000/api/swap/quote?input=XLM&output=USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&amount=100"
```

### Environment variables

See [`.env.example`](.env.example) for the full set:

| Variable                      | Default         | Purpose                                                       |
| ----------------------------- | --------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet`       | Active network (`testnet` \| `public`)                        |
| `HORIZON_URL`                 | network default | Server-side Horizon URL override                              |
| `LOG_LEVEL`                   | `info`          | Server log threshold (`debug` \| `info` \| `warn` \| `error`) |
| `NEXT_PUBLIC_APP_URL`         | —               | Public base URL of the deployed app                           |

### Docker

```bash
docker compose up --build   # serves on http://localhost:3000
```

The image is multi-stage with `output: "standalone"`, runs as a non-root user, and serves the minimal `server.js`. Configure the network via the `NEXT_PUBLIC_STELLAR_NETWORK` environment variable.

## Soroban Smart Contracts

The [`src/contracts/`](src/contracts) directory is a Cargo workspace of Soroban contracts (Rust, `#![no_std]`, compiled to the `wasm32v1-none` target required by Soroban SDK v27 on Rust 1.82+). They extend the platform with on-chain state, secure authorization, and typed events.

| Contract                                                   | Purpose                                                            | Storage                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| [`trading-preferences`](src/contracts/trading-preferences) | Per-account slippage tolerance, routing mode, and asset allow-list | Persistent per-account (TTL-managed)                  |
| [`market-oracle`](src/contracts/market-oracle)             | Admin-gated price observation feed for analytics                   | Persistent pair observations + instance pair registry |

Both contracts demonstrate the Soroban v27 SDK patterns used across TarshishDEX:

- `#[contract]` / `#[contractimpl]` / `#[contracttype]` / `#[contracterror]` macros
- `#[contractevent]` typed events published via the generated `Event::publish(&env)` method
- Authorization via `Address::require_auth` (per-account writes; admin-gated publisher grants)
- TTL-managed persistent storage (`extend_ttl`) and instance storage for configuration
- Unit tests with `Env::default()` + `mock_all_auths()` + generated clients (`try_*` variants for error assertions)

### Build & test contracts

```bash
cd src/contracts
cargo build --workspace                 # native (dev)
cargo build --target wasm32v1-none --release           # wasm artifacts (Soroban v27 target)
cargo test --workspace                  # 11 unit tests
cargo fmt --all -- --check              # formatting gate
cargo clippy --all-targets -- -D warnings
```

## Roadmap

| Phase | Scope                                                         | Status         |
| ----- | ------------------------------------------------------------- | -------------- |
| 1     | Scaffold, design system, layout shell, UI primitives          | ✅ Done        |
| 2     | Stellar services layer, swap engine, routing, simulation      | ✅ Done        |
| 3     | Portfolio dashboard, trade history, market analytics          | ✅ Done        |
| 4     | Wallet integration (Freighter/StellarWalletsKit), live sync   | ✅ Done        |
| 5     | Soroban contracts, CI/CD hardening, documentation             | ✅ Done        |
| 6     | Developer API (REST + SSE), server logging, Docker deployment | 🔨 In progress |

## Roadmap

| Phase | Scope                                                       | Status         |
| ----- | ----------------------------------------------------------- | -------------- |
| 1     | Scaffold, design system, layout shell, UI primitives        | ✅ Done        |
| 2     | Stellar services layer, swap engine, routing, simulation    | 🔨 In progress |
| 3     | Portfolio dashboard, trade history, market analytics        | ⏳ Planned     |
| 4     | Wallet integration (Freighter/StellarWalletsKit), live sync | ⏳ Planned     |
| 5     | Soroban contracts, CI/CD hardening, documentation           | ⏳ Planned     |

## Development Principles

- **Production-ready architecture** — modular blockchain services, secure configuration, comprehensive error handling.
- **Tested by default** — unit tests for pure logic and components; CI gates every merge.
- **Professional open-source standards** — conventional commits, documented modules, accessibility-minded UI.

## License

Private — TarshishDEX is a demonstration project built for the Stellar ecosystem.
