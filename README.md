# TarshishDEX

**A decentralized trading interface built exclusively on Stellar's native DEX and Soroban smart contracts.**

TarshishDEX is a complete decentralized trading platform for the Stellar network — intelligent trade execution, liquidity insights, portfolio management, market analytics, transaction simulation, and advanced trading controls — all leveraging the speed, near-zero cost, and built-in liquidity of Stellar's native decentralized exchange.

## Why TarshishDEX

Unlike a basic token swap, TarshishDEX is a professional trading gateway into the Stellar ecosystem:

- **Native DEX trades** — executed directly on Stellar's orderbook. No bridges, no wrapping.
- **Intelligent routing** — path-finding picks the most efficient execution route across the orderbook.
- **Full transparency** — every quote shows expected output, price impact, minimum received, and fees *before* you sign.
- **Pre-execution simulation** — detect failed transactions before they hit the network.
- **Multi-account portfolios** — connect multiple wallets, switch accounts, compare performance.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (custom dark DeFi design system) |
| Blockchain | @stellar/stellar-sdk, @creit.tech/stellar-wallets-kit (Freighter + more) |
| Smart contracts | Soroban SDK (Rust) |
| Data fetching | TanStack Query + Horizon SSE streams |
| Charts | Recharts / lightweight-charts |
| Testing | Vitest + React Testing Library + Testing Library jest-dom |
| Quality | ESLint, Prettier (with Tailwind plugin), strict TypeScript |
| CI/CD | GitHub Actions (lint → typecheck → format → test → build) |

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
└── contracts/            # Soroban smart contracts (Rust workspace) — Phase 5
```

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold, design system, layout shell, UI primitives | ✅ Done |
| 2 | Stellar services layer, swap engine, routing, simulation | 🔨 In progress |
| 3 | Portfolio dashboard, trade history, market analytics | ⏳ Planned |
| 4 | Wallet integration (Freighter/StellarWalletsKit), live sync | ⏳ Planned |
| 5 | Soroban contracts, CI/CD hardening, documentation | ⏳ Planned |

## Development Principles

- **Production-ready architecture** — modular blockchain services, secure configuration, comprehensive error handling.
- **Tested by default** — unit tests for pure logic and components; CI gates every merge.
- **Professional open-source standards** — conventional commits, documented modules, accessibility-minded UI.

## License

Private — TarshishDEX is a demonstration project built for the Stellar ecosystem.
