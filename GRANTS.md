# Grant Program Readiness

TarshishDEX is designed and built for the Stellar ecosystem — targeting the
**Stellar Community Fund (SCF)**, **Drips Wave**, and **Grant Fox** programs.

## Milestone Tracking

### Phase 1 — Core Trading Platform ✅ Complete

| Milestone | Status | Evidence |
|-----------|--------|----------|
| Swap engine with native DEX integration | ✅ | `src/lib/stellar/swap-execution.ts`, `routing.ts` |
| Intelligent route finding (direct, bridge, Horizon) | ✅ | `src/lib/stellar/routing.ts` — 3 concurrent route strategies |
| Pre-execution simulation & price impact | ✅ | `src/lib/stellar/simulation.ts` — pure, unit-tested |
| Multi-hop path payment construction | ✅ | Path-payment strict-send with trustline handling |
| Fee collection mechanism | ✅ | Configurable bps per route method |
| Wallet integration (Freighter + SWK) | ✅ | `src/lib/stellar/wallet-kit.ts`, `wallet-store.ts` |

### Phase 2 — Market Intelligence ✅ Complete

| Milestone | Status | Evidence |
|-----------|--------|----------|
| Live orderbook depth visualization | ✅ | SSE streams + normalized depth data |
| OHLCV candlestick charts | ✅ | Horizon trade aggregations via `prices.ts` |
| Market stats (24h volume, price change) | ✅ | `src/app/api/market/stats/` |
| Asset discovery catalog | ✅ | Issuer metadata, supply, trustline stats |
| Portfolio dashboard with P&L | ✅ | Multi-account, allocation donut chart |

### Phase 3 — Soroban Smart Contracts ✅ Complete

| Milestone | Status | Evidence |
|-----------|--------|----------|
| Trading preferences (per-account on-chain) | ✅ | Deployed on Testnet |
| Market oracle (admin-gated price feed) | ✅ | 16-entry ring-buffer history |
| Limit order registry (on-chain persistence) | ✅ | Per-user indexing, expiry, execution tracking |
| Gas benchmarks for all write operations | ✅ | `docs/GAS_BENCHMARKS.md` |
| WASM sizes under 64KB limit | ✅ | All 3 contracts combined: 70KB |
| Contract tests (66 total) | ✅ | Unit + gas benchmarks + E2E integration |

### Phase 4 — Production Hardening ✅ Complete

| Milestone | Status | Evidence |
|-----------|--------|----------|
| 18 GitHub Actions workflows | ✅ | CI, deploy, CodeQL, secret scan, gas regression |
| Docker multi-stage production image | ✅ | Non-root user, health check |
| Security headers (CSP, HSTS, CORS) | ✅ | Applied via middleware |
| Rate limiting on all API routes | ✅ | Sliding window per IP + endpoint |
| Circuit breaker for Horizon calls | ✅ | Fail-fast after threshold |
| Input validation & sanitization | ✅ | Zod schemas + manual validators |
| Global API error handler | ✅ | Consistent 500s with correlation IDs |
| Quality gates verification script | ✅ | `scripts/quality-gates.sh` |
| npm vulnerability overrides | ✅ | protobufjs, uuid pinned to safe versions |

## Key Performance Indicators

| Metric | Current | Target |
|--------|---------|--------|
| Frontend test coverage | 15% (statements) | 50%+ |
| Contract test count | 66 (Rust) | 66 ✅ |
| API route test coverage | 0% (integration) | E2E smoke only |
| TypeScript strict mode | ✅ Enabled | Passed ✅ |
| CI workflow count | 18 | 18 ✅ |
| npm vulnerabilities | 34 (2 critical, dev-only) | 0 critical production |
| WASM binary sizes | All under 42% of limit | All under 64KB ✅ |

## Stellar Drips Wave Checklist

- [x] Open-source (MIT license)
- [x] Built on Stellar native DEX
- [x] Soroban smart contracts deployed on Testnet
- [x] Wallet integration (Freighter + StellarWalletsKit)
- [x] Live demo (tarshishdex.vercel.app)
- [x] Documentation (README, API docs, architecture diagrams)
- [x] CI/CD pipeline (18 workflows)
- [x] Security hardening (CSP, HSTS, rate limiting, input validation)
- [x] Gas benchmarks for all contract operations
- [x] Unit tests for core business logic
- [x] Quality gates verification script

## Grant Fox Program Checklist

- [x] Public repository with contribution guidelines
- [x] Code of conduct
- [x] Security policy with responsible disclosure
- [x] Conventional commits (enforced via PR title check)
- [x] Stale issue management
- [x] Automated labeling
- [x] Dependency audit workflow
- [x] Bundle size monitoring
- [x] Lighthouse performance audit
- [x] Link checker for documentation
- [x] Spell checker for codebase

## Production Readiness

- ✅ **Non-custodial**: Private keys never leave the user's wallet
- ✅ **Transparent**: Every quote shows output, impact, minimum received, fees
- ✅ **Simulated**: Pre-execution simulation catches failures before broadcast
- ✅ **Rate-limited**: All API endpoints have configurable rate limits
- ✅ **Circuit breaker**: Horizon calls fail fast after threshold failures
- ✅ **Structured logging**: JSON logs with request correlation IDs
- ✅ **Graceful shutdown**: Handles SIGTERM/SIGINT for clean restarts
- ✅ **Health check**: `/api/health` for load balancers and monitoring
- ✅ **Non-root Docker**: Runs as unprivileged `nextjs` user
- ✅ **CSP headers**: Content-Security-Policy applied globally
- ✅ **HSTS**: Strict-Transport-Security in production

## Remaining for Mainnet

> **Note**: Mainnet deployment is intentionally deferred. This project is
> optimized for Testnet + grant evaluation.

- [ ] Mainnet deployment with verified contract source
- [ ] Professional security audit of all 3 Soroban contracts
- [ ] Multi-sig admin for contract upgrades
- [ ] Mainnet fee collector address configuration
- [ ] Production monitoring and alerting
- [ ] Rate limit backed by Redis for multi-instance deployments
