# Deployment

## Soroban contracts — Stellar Testnet

Status: **live** — all three contracts deployed, initialized, and exercised on Stellar
Testnet (August 2026).

The deployer account is `GC7J7IBB6FY55R4ZFA2UNCBNEF466CHD2R7RQRH2NHC2YPY6M355XURR`,
created and funded via the Testnet friendbot (10,000 XLM).

To redeploy (or deploy to Mainnet), run the deploy script (or the `Deploy`
GitHub Actions workflow with the `STELLAR_SOURCE_ACCOUNT` secret):

```bash
cd src/contracts
cargo build --workspace --target wasm32v1-none --release
STELLAR_IDENTITY=alice bash ../../scripts/deploy-contracts.sh   # identity
# or
STELLAR_SOURCE_ACCOUNT=S... bash ../../scripts/deploy-contracts.sh  # secret key
```

### CI deployment (GitHub Actions)

The `Deploy` workflow automates the same flow: it installs the pinned
`stellar-cli v27.1.0` tarball, builds the wasm artifacts, deploys +
initializes all three contracts, and uploads a manifest artifact.

Required repository secrets:

| Secret                   | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `STELLAR_SOURCE_ACCOUNT` | Deployer `S...` secret key (funded on the target network) |
| `VERCEL_TOKEN`           | Vercel access token (frontend job only)                   |
| `VERCEL_ORG_ID`          | Vercel team/org id (frontend job only)                    |
| `VERCEL_PROJECT_ID`      | Vercel project id (frontend job only)                     |

The script (and workflow) optionally writes machine-readable contract IDs to
`$CONTRACT_IDS_FILE` (`TRADING_PREFS_ID` / `ORACLE_ID` / `LIMIT_ORDER_ID` / `NETWORK` lines) for
CI consumers, right after deployment.

Run **Actions → Deploy → Run workflow**, choosing the network and whether to
also deploy the frontend.

### Deployed addresses

| Contract            | Address                                                    | Network |
| ------------------- | ---------------------------------------------------------- | ------- |
| trading-preferences | `CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM` | Testnet |
| market-oracle       | `CBWISHEEE7W2WFXUPYX3R4HFOM54RYM3PQUXYCCTMZ5VNEOIKOZSUS7V` | Testnet |
| limit-order         | `CATBY2SG26N6E7P34BEL4SWWQVI5LDQT7W26O3TS4HVPL2FZ6LIWPJNM` | Testnet |

Copy the IDs into `.env.local`:

```bash
NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID=CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM
NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID=CBWISHEEE7W2WFXUPYX3R4HFOM54RYM3PQUXYCCTMZ5VNEOIKOZSUS7V
NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID=CATBY2SG26N6E7P34BEL4SWWQVI5LDQT7W26O3TS4HVPL2FZ6LIWPJNM
```

### Contract-call transactions

Every hash below is verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).

| Purpose                                    | Transaction hash (prefix) | Full hash                                                          |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------ |
| Deploy `trading-preferences`               | `d593be2c…`               | `d593be2c34381723cb6170b8136f337211dadeab36705c5cf6fd87cf8c4b3c79` |
| `initialize` (trading-preferences)         | `0e3fcae3…`               | `0e3fcae310d2690627394235b83250a62720bc4b4e64c9d3db95b582193351e2` |
| `set_preferences` (contract call, UI flow) | `42bb9d5f…`               | `42bb9d5f218174b837a4db3007463fc80a009b76a3c43080c11194e205e47e6d` |
| Deploy `market-oracle`                     | `71135c57…`               | `71135c5704729b17ece315ac80ce4b05c272714911cc57876fa098cbe36428cf` |
| `initialize` (market-oracle)               | `beddffc3…`               | `beddffc39187adc1dbd31febdd6ba465770eae47b78110962971c7c8b0c536d8` |
| `set_publisher` (market-oracle)            | `991d2b30…`               | `991d2b30e68d0ed3b1b13f044274e70b7c3ce88418dd2c6967dedfacd16ee179` |
| `publish` observation (market-oracle)      | `b975861d…`               | `b975861d1b0a8ac70eb95e2040b55b97a5e5ae516227dc434d830ea4133671b6` |
| Deploy `limit-order`                       | `e787e735…`               | `e787e7358104081251511f27b843057064defefe76e5cf885ca0ae184bb71244` |
| Create `limit-order`                       | `df8342f9…`               | `df8342f94e7033fcc20fa20cfa56d9931c37e5f92b3b7150fdd82e39dec29e20` |
| `initialize` (limit-order)                 | `ab29a3ee…`               | `ab29a3eec2d139e4f1c39bf25b67c1e6a376841790f5f434b5fa4699057db733` |

Explorer links:

- https://stellar.expert/explorer/testnet/tx/d593be2c34381723cb6170b8136f337211dadeab36705c5cf6fd87cf8c4b3c79
- https://stellar.expert/explorer/testnet/tx/0e3fcae310d2690627394235b83250a62720bc4b4e64c9d3db95b582193351e2
- https://stellar.expert/explorer/testnet/tx/42bb9d5f218174b837a4db3007463fc80a009b76a3c43080c11194e205e47e6d
- https://stellar.expert/explorer/testnet/tx/71135c5704729b17ece315ac80ce4b05c272714911cc57876fa098cbe36428cf
- https://stellar.expert/explorer/testnet/tx/beddffc39187adc1dbd31febdd6ba465770eae47b78110962971c7c8b0c536d8
- https://stellar.expert/explorer/testnet/tx/991d2b30e68d0ed3b1b13f044274e70b7c3ce88418dd2c6967dedfacd16ee179
- https://stellar.expert/explorer/testnet/tx/b975861d1b0a8ac70eb95e2040b55b97a5e5ae516227dc434d830ea4133671b6
- https://stellar.expert/explorer/testnet/tx/e787e7358104081251511f27b843057064defefe76e5cf885ca0ae184bb71244
- https://stellar.expert/explorer/testnet/tx/df8342f94e7033fcc20fa20cfa56d9931c37e5f92b3b7150fdd82e39dec29e20
- https://stellar.expert/explorer/testnet/tx/ab29a3eec2d139e4f1c39bf25b67c1e6a376841790f5f434b5fa4699057db733

Contract explorer:

- https://lab.stellar.org/r/testnet/contract/CBCFZA7IONESTWX3YEP76UAPNQD3UQ6NU4INECNDXP2YVXUOR2H33JKM
- https://lab.stellar.org/r/testnet/contract/CBWISHEEE7W2WFXUPYX3R4HFOM54RYM3PQUXYCCTMZ5VNEOIKOZSUS7V
- https://lab.stellar.org/r/testnet/contract/CATBY2SG26N6E7P34BEL4SWWQVI5LDQT7W26O3TS4HVPL2FZ6LIWPJNM

## Frontend

- **Docker**: `docker compose up --build` → http://localhost:3000
- **Vercel**: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets,
  link the project (`npx vercel link`), then run the `Deploy` workflow with
  `deploy_frontend: true` — it builds with the freshly deployed contract IDs
  and ships a production build.

### Live demo

✅ **Live**: [tarshishdex.vercel.app](https://tarshishdex.vercel.app)

Health check: `https://tarshishdex.vercel.app/api/health` → `{"status":"ok","service":"tarshishdex","network":"testnet"}`
