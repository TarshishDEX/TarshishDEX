# TarshishDEX Threat Model

## Scope

This threat model covers:
- Soroban smart contracts (trading-preferences, limit-order, market-oracle)
- Next.js frontend application
- API routes and middleware
- Wallet integration (StellarWalletsKit)

Out of scope:
- Stellar network infrastructure (Horizon, Core, Soroban RPC)
- Third-party wallet extensions (Freighter, Albedo)
- Vercel hosting infrastructure

## Threat Actors

| Actor | Motivation | Capability |
|-------|-----------|------------|
| **Malicious user** | Steal funds, manipulate prices | Can submit transactions, call contracts |
| **Front-running bot** | Extract MEV from pending swaps | Can observe mempool, submit competing txs |
| **Compromised relayer** | Execute orders at unfavorable prices | Has relayer ACL access |
| **Web attacker (XSS)** | Steal wallet sessions, inject UI | Can exploit frontend vulnerabilities |
| **Denial-of-service** | Disable API, degrade UX | Can flood API endpoints |

## Asset Inventory

| Asset | Sensitivity | Location |
|-------|------------|----------|
| User wallet session (address) | Medium | Zustand store (localStorage persisted) |
| Network passphrase | Low | Zustand store (localStorage persisted) |
| Limit order data | Medium | Soroban contract storage |
| Price observations | Medium | Soroban contract storage |
| Trading preferences | Low | Soroban contract storage |
| Swap quotes | Low | In-memory (React Query cache) |

## Threat Scenarios & Mitigations

### T1: Unauthorized Order Execution
**Threat**: Attacker executes another user's limit order.
**Mitigation**: `mark_executed` requires either order owner auth or relayer ACL
membership. Relayer ACL is admin-managed. `require_auth()` enforced on-chain.

### T2: Price Manipulation via Oracle
**Threat**: Rogue publisher submits fake prices to the oracle.
**Mitigation**: Publishers are admin-gated (`set_publisher`). Each observation
records the publisher address for audit. Frontend rejects stale observations
(>720 ledgers). Publisher auth checked on every `publish()` call.

### T3: Slippage Bypass
**Threat**: Frontend ignores user's slippage preference.
**Mitigation**: Slippage is stored on-chain in trading-preferences contract.
Frontend computes `minReceived` from the quote and slippage before building
the transaction. The Stellar path payment enforces `destMin` on-chain.

### T4: XSS via User Input
**Threat**: Attacker injects malicious script via asset codes or addresses.
**Mitigation**: CSP headers (`script-src 'self'`). Input validated with Zod
schemas. React's JSX auto-escapes output. No `dangerouslySetInnerHTML`.

### T5: API Rate Limit Exhaustion
**Threat**: Attacker floods API routes to degrade service.
**Mitigation**: Sliding-window rate limiter (100 req/60s per IP). 429
responses with `Retry-After` header. Horizon pool limits concurrent connections.

### T6: Stale Contract Storage
**Threat**: Contract state entries expire due to Soroban state rent.
**Mitigation**: All persistent and instance storage entries receive TTL
extensions (518,400 ledgers ≈ 30 days) on every write. TTL extension is
verified in gas benchmark tests.

### T7: Overflow in Price Calculation
**Threat**: Large price × amount causes i128 overflow.
**Mitigation**: `checked_mul` with `ArithmeticOverflow` error in `place_order`.
Soroban WASM traps on overflow as secondary defense.

### T8: Same-Asset Swaps
**Threat**: User accidentally swaps XLM→XLM, paying fees for nothing.
**Mitigation**: `base != counter` validation in `place_order`. Frontend
disables swap button when `isSameAsset(input, output)`.

### T9: Missing Trustline
**Threat**: Swap destination asset lacks a trustline, causing transaction failure.
**Mitigation**: `needsTrustline()` checks account balances before building
transaction. `changeTrust` operation auto-added when needed.

## Residual Risks

| Risk | Severity | Likelihood | Acceptance Rationale |
|------|----------|------------|---------------------|
| Admin key compromise | Critical | Low | Single admin — requires hardware wallet + multisig in future |
| Soroban SDK vulnerability | High | Low | Single dependency; cargo-audit + scout-audit in CI |
| Horizon downtime | Medium | Low | Stellar Foundation SLA; multiple Horizon providers available |
| Wallet extension exploit | High | Very Low | Out of scope; user responsible for wallet security |

## Review Cadence

This threat model should be reviewed:
- After every contract upgrade
- After major frontend releases
- At minimum quarterly
