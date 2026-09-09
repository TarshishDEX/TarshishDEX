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
| Gas benchmarks for all write operations | ✅ | 37 benchmarks, hard regression gate in CI (`docs/GAS_BENCHMARKS.md`) |
| WASM sizes under 64KB limit | ✅ | 20.6 / 29.4 / 30.4 KB — all under 48% of the 64 KB limit |
| Contract tests (134 total) | ✅ | Unit tests + 6 fuzz/property tests + gas/resource benchmarks |

### Phase 4 — Production Hardening ✅ Complete

| Milestone | Status | Evidence |
|-----------|--------|----------|
| 30 GitHub Actions workflows | ✅ | CI, deploy, CodeQL, secret scan, gas regression, a11y, visual regression… |
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
| Frontend test coverage | 98.74% statements (94.66% branches, 99.33% functions, 99.24% lines) | 50%+ ✅ |
| Unit tests | 2,321 passing (134 files) | ✅ |
| E2E tests | 57 Playwright tests across 5 suites | ✅ |
| Contract test count | 134 (Rust) — 99.57% line coverage | 66+ ✅ |
| Contract error surface | 28 error codes (13+9+6, only returned errors) | ✅ |
| API route test coverage | API integration workflow + E2E smoke tests | ✅ |
| TypeScript strict mode | ✅ Enabled (4 strict flags) | Passed ✅ |
| CI workflow count | 30 | 30 ✅ |
| npm vulnerabilities | 0 critical (37 total: 21 low, 7 moderate, 9 high) | 0 critical ✅ |
| WASM binary sizes | 20.6 / 29.4 / 30.4 KB (32–48% of limit) | All under 64KB ✅ |
| Formal audit | ✅ Security & quality audit, Aug 2026 — all gates pass | ✅ |

## Stellar Drips Wave Checklist

- [x] Open-source (MIT license)
- [x] Built on Stellar native DEX
- [x] Soroban smart contracts deployed on Testnet
- [x] Wallet integration (Freighter + StellarWalletsKit)
- [x] Live demo (tarshishdex.vercel.app)
- [x] Documentation (README, API docs, architecture diagrams)
- [x] CI/CD pipeline (30 workflows)
- [x] Security hardening (CSP, HSTS, rate limiting, input validation)
- [x] Gas benchmarks for all contract operations (37 enforced in CI)
- [x] Unit tests for core business logic (2,321) + 57 Playwright E2E tests
- [x] Formal security & quality audit (Aug 2026)
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
- [ ] Spell checker for codebase (cspell config retained; workflow removed in 31af0e9)

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
