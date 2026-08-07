# Changelog

All notable changes to TarshishDEX are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-08-05

### Added

- **Swap engine**: Full swap pipeline with intelligent routing (direct, bridge, Horizon path-finding), pre-execution simulation, price impact calculation, and multi-hop support.
- **Portfolio dashboard**: Multi-account portfolio with balance tables, trade history, allocation donut chart, and P&L tracking.
- **Market analytics**: Live market stats, OHLCV candlestick charts, orderbook depth visualization, and volume charts.
- **Wallet integration**: Freighter + StellarWalletsKit with session persistence, multi-account switching, and XDR signing.
- **Soroban smart contracts**: `trading-preferences` (per-account slippage/routing/allow-list) and `market-oracle` (admin-gated price observations with staleness detection). Both live on Stellar Testnet.
- **Developer API**: Read-only REST + SSE endpoints for health, market stats, orderbook, candles, swap quotes, portfolio, trades, assets, and live trade events.
- **Design system**: 60+ UI components (Button, Card, Badge, Toast, Tooltip, Tabs, Modal, Select, Switch, Checkbox, RadioGroup, ProgressBar, Meter, Pagination, CommandPalette, DataTable, etc.).
- **Utility library**: 30+ utility modules (validators, debounce, throttle, memoize, random, math, date, string, array, object, env, url, hash, etc.).
- **Hook library**: 20+ React hooks (useDebounce, useCopyToClipboard, useKeyboardShortcuts, useLocalStorage, useMediaQuery, useIntersectionObserver, useWindowSize, etc.).
- **CI/CD**: GitHub Actions for frontend quality gates + Soroban contract gates; deploy workflow for contracts + Vercel frontend.
- **Docker**: Multi-stage production image with standalone Next.js output, non-root user.
- **Documentation**: README with architecture diagram, API docs, deployment guide, screenshots, demo video.

### Security

- Rate limiting middleware with configurable window/limit
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, CSP, CORS)
- Input validation and sanitization in all API routes
- Structured logging with request IDs
- Circuit breaker and request timeout for Horizon calls
- Zod validation for all API inputs
- Graceful shutdown handling

## [0.1.0] - 2026-08-07

### Added
- Initial production release of TarshishDEX
- Swap interface with Stellar native DEX integration
- Market overview with orderbook depth visualization
- Portfolio tracking with balance table and trade history
- Asset browser with search and filtering
- Analytics with candlestick charts and volume data
- Wallet connection via Stellar Wallets Kit
- On-chain trading preferences via Soroban smart contracts
- Price alerts, keyboard shortcuts, notification center
- Dark/light theme support
- PWA with offline support
- Comprehensive test suite with Vitest and Playwright

### Security
- Rate limiting on API routes
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Input sanitization and validation
- CORS middleware
- Circuit breaker for external calls
- Request timeout protection

### Infrastructure
- Docker multi-stage build
- GitHub Actions CI/CD pipeline
- Soroban contract compilation and testing
- Health check endpoint
- Graceful shutdown handling
