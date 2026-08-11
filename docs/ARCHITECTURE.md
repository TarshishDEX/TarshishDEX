# TarshishDEX Architecture

## System Overview

TarshishDEX is a non-custodial decentralized exchange frontend for the Stellar
network. It interacts with the native Stellar DEX (orderbook + AMM pools) and
augments it with on-chain Soroban smart contracts for limit orders, trading
preferences, and market oracle price feeds.

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Next.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │  Swap    │ │ Markets  │ │ Analytics/Portfolio│   │
│  │  Widget  │ │  Table   │ │     Dashboard      │   │
│  └────┬─────┘ └────┬─────┘ └─────────┬──────────┘   │
│       │             │                │               │
│  ┌────┴─────────────┴────────────────┴──────────┐   │
│  │           React Query / Zustand              │   │
│  └─────────────────────┬────────────────────────┘   │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────┐
│              Next.js API Routes (Edge)               │
│  /api/swap/quote  /api/market/*  /api/orders ...     │
└────────────────────────┼────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Horizon    │ │ Soroban RPC  │ │ Stellar Core │
│   (REST)     │ │   (JSON-RPC) │ │   (P2P)      │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Key Architectural Decisions

### ADR-001: Frontend-Driven Execution Model

**Decision**: Limit orders are stored on-chain but executed via the frontend
(not an on-chain matching engine).

**Rationale**:
- Soroban contracts have a 64KB WASM size limit and limited compute budget
- On-chain matching engines are expensive to run and hard to upgrade
- Frontend-driven execution enables flexible routing across DEX orderbooks,
  AMM pools, and multi-hop paths
- Users get the best execution price by comparing all available liquidity

**Trade-offs**:
- Requires the frontend to be online to trigger execution
- Introduces a trust assumption on the relayer (mitigated by the relayer ACL)
- Execution latency is higher than an on-chain matcher

### ADR-002: Three-Contract Architecture

**Decision**: Split on-chain state across three independent Soroban contracts
rather than one monolithic contract.

**Rationale**:
- Each contract stays well under the 64KB WASM limit (18KB, 27KB, 29KB)
- Independent deployability — upgrade the oracle without touching limit orders
- Clean separation of concerns: preferences, orders, oracle
- Lower per-transaction gas costs (only the relevant contract is invoked)

**Contracts**:
1. **trading-preferences** — per-account slippage, routing mode, asset allow-lists
2. **limit-order** — on-chain order storage with price conditions and expiry
3. **market-oracle** — admin-managed price observation feed

### ADR-003: React Query for Server State

**Decision**: Use TanStack React Query for all Horizon/Soroban data fetching
instead of a custom cache layer or Redux.

**Rationale**:
- Built-in stale-while-revalidate with configurable intervals
- Automatic background refetching keeps UI fresh
- Deduplication of in-flight requests
- Cache invalidation via query keys
- DevTools for debugging

### ADR-004: Zustand for Client State

**Decision**: Use Zustand with `persist` middleware for wallet state instead
of React Context or Redux.

**Rationale**:
- Minimal boilerplate compared to Redux
- `persist` middleware survives page refreshes (address + network persist)
- No provider wrapper needed
- Tiny bundle size (~1KB)

### ADR-005: Ring-Buffer for Oracle History

**Decision**: Use an index-based wrapping ring buffer (O(1) writes) instead
of Vec::remove(0) (O(n) shift) for observation history.

**Rationale**:
- Fixed gas cost per write regardless of history size
- MAX_HISTORY=16 provides enough data for simple moving averages
- Avoids unbounded storage growth
- Implemented after studying Lightecho's architecture migration

### ADR-006: TypeScript Strict Mode

**Decision**: Enable `strict: true` and `noUncheckedIndexedAccess: true`
across the entire codebase.

**Rationale**:
- Catches null/undefined bugs at compile time
- `noUncheckedIndexedAccess` prevents array/record access footguns
- No `any` types — all casts go through `unknown` intermediates
- Industry best practice for financial applications

## Data Flow: Swap Execution

```
1. User enters amount + selects tokens
      │
2. Debounced (400ms) → useSwapQuote()
      │
3. findBestRoute() compares:
   ├── Direct orderbook (fetchOrderbook + simulateOrderbookFill)
   ├── Multi-hop via bridge assets (XLM, USDC)
   └── Horizon path-finding (strictSendPaths)
      │
4. Best route selected (highest output, fewest hops)
      │
5. User reviews → SwapExecutionPanel
      │
6. executeSwap():
   ├── Load account from Horizon
   ├── Add changeTrust op if needed
   ├── Build pathPaymentStrictSend ops
   ├── Sign via StellarWalletsKit
   └── Submit to Horizon
      │
7. On success: optionally mark limit order as executed
```

## Security Model

- **Auth**: All contract mutations require `require_auth()` from the caller
- **Relayers**: Limit orders can be executed by registered relayers (bot accounts)
- **Rate Limiting**: 100 requests per 60 seconds per IP on all API routes
- **CSP**: Content-Security-Policy restricts script sources to self
- **Input Validation**: Zod schemas validate all API parameters
- **Error Sanitization**: User-facing errors are classified; raw errors logged server-side
- **TTL Management**: All Soroban storage entries have 30-day TTL extensions

## Deployment

- **Contracts**: Deployed via `stellar-cli` to Stellar testnet/public
- **Frontend**: Deployed to Vercel with automatic previews on PRs
- **CI**: 15 GitHub Actions workflows covering linting, testing, coverage,
  gas benchmarks, security scanning, and quality scoring
