# Contributing to TarshishDEX

First off — thank you for taking the time to contribute! 🎉

TarshishDEX is a decentralized trading interface built on Stellar's native DEX and Soroban smart contracts. This guide outlines how to set up a development environment, run the quality gates, and open a pull request that can be merged quickly.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Layout](#project-layout)
- [Quality Gates](#quality-gates)
- [Commit Conventions](#commit-conventions)
- [Opening a Pull Request](#opening-a-pull-request)
- [Testing](#testing)
- [Adding an API Endpoint](#adding-an-api-endpoint)
- [Working on Contracts](#working-on-contracts)
- [Code of Conduct](#code-of-conduct)

## Development Setup

**Prerequisites**

- [Node.js](https://nodejs.org/) 20+ and npm
- [Rust](https://rustup.rs/) 1.82+ with the `wasm32v1-none` target (only needed for the Soroban contracts)
- Optional: the [Freighter](https://www.freighter.app/) browser extension and a funded Testnet account for wallet flows

**Install & run**

```bash
npm install
npm run dev
# → http://localhost:3000
```

Copy `.env.example` to `.env.local` and adjust the network or contract IDs if you deploy your own contracts:

```bash
cp .env.example .env.local
```

## Project Layout

| Path               | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `src/app/`         | Next.js App Router — pages, layouts, API routes        |
| `src/components/`  | UI components (layout, ui primitives, feature panels)  |
| `src/lib/stellar/` | Stellar services layer (orderbook, routing, swaps…)    |
| `src/lib/soroban/` | Soroban contract clients (trading-preferences, oracle) |
| `src/contracts/`   | Rust Soroban contracts (Cargo workspace)               |
| `scripts/`         | Deploy, screenshot, and demo-video tooling             |

A deeper walkthrough of the architecture lives in the [README](README.md#architecture).

## Quality Gates

Every merge is gated by CI (see `.github/workflows/ci.yml`). Run all gates locally before pushing:

```bash
npm run lint            # ESLint
npm run typecheck       # strict TypeScript
npm test                # Vitest suite
npm run format:check    # Prettier (run `npm run format` to fix)
```

Contract gates (only if you touched `src/contracts/`):

```bash
cd src/contracts
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test --workspace
```

> All four frontend gates and the Rust gates must pass for CI to go green.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/), which keeps the history readable and enables tooling. Examples:

```
feat(swap): surface min-received on every quote
fix(routing): prefer fewer hops when outputs are equal
test(simulation): cover partial-fill edge case
docs: expand the developer API section
refactor(stellar): extract orderbook normalization
ci: pin stellar-cli version in deploy job
```

Structure: `type(scope): subject` — keep the subject imperative and under ~72 characters.

## Opening a Pull Request

1. **Branch from `main`** — use a descriptive name like `feat/orderbook-depth-chart`.
2. **Keep changes focused** — one logical change per PR. Large features are easier to review in smaller steps.
3. **Include tests** — new logic and changed behavior should ship with unit tests.
4. **Update docs** — if you change the API, env vars, or architecture, reflect it in the README.
5. **Run the quality gates** above and mention the results in the PR description.
6. **Describe your change** — what, why, and how it was verified. Reference related issues.

## Testing

- **Vitest + React Testing Library** — test files sit next to their modules (`*.test.ts`). Run `npm run test:watch` while developing.
- **Pure logic first** — routing, simulation, and swap-execution are extracted as pure, testable functions; keep them that way.
- **Soroban contracts** — Rust unit tests with `Env::default()` + `mock_all_auths()` live next to each contract.

## Adding an API Endpoint

API routes live under `src/app/api/`. Endpoints are **server-side** and honour the configured network. To add one:

1. Create `src/app/api/<name>/route.ts` exporting a `GET` handler.
2. Reuse the services layer (`src/lib/stellar/`) — no direct Horizon calls in route handlers.
3. Validate query params (see `src/lib/api/params.ts`) and return typed JSON.
4. Document the endpoint in the README's [Developer API](README.md#developer-api) table.

## Working on Contracts

See [README — Soroban Smart Contracts](README.md#soroban-smart-contracts) for the workspace layout and SDK patterns. Note that deployed Testnet instances exist; changing contract storage or authorization logic may require a fresh deployment (see `scripts/deploy-contracts.sh` and `docs/deployment.md`).

## Code of Conduct

Please note that all contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, be constructive, and assume good faith.

---

Licensed under the [MIT License](LICENSE) — by contributing, you agree that your contributions are licensed under the same terms.
