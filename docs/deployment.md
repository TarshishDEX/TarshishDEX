# Deployment

## Soroban contracts — Stellar Testnet

Status: **live** — all three contracts deployed, initialized, and exercised on Stellar
Testnet (first deployed August 2026; redeployed September 2026 with pause,
batch-publish, and full asset-identity support).

The current deployer account is `GAHZVVLF7I2TBUJOJC2375IPXSF6TLKUGDQDGZ4VQK4HG2YCHFMEN4VN`,
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
| trading-preferences | `CDEXBPA5LPASJR5B2Z4EBKJ74GHT66LDPL5XXBZ4ATHL4XJKI6HQVCAM` | Testnet |
| market-oracle       | `CBL2NE3OKPHOZTABVODI6PX4RCMEOKIC7WOO4TUYPUW43HUG7GCSC5N5` | Testnet |
| limit-order         | `CDPHVZHRTBYVOXOV2TUXSSGGZUK2A6IUGFKA7ACKACMORJDKFGYQMACM` | Testnet |

Copy the IDs into `.env.local`:

```bash
NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID=CDEXBPA5LPASJR5B2Z4EBKJ74GHT66LDPL5XXBZ4ATHL4XJKI6HQVCAM
NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID=CBL2NE3OKPHOZTABVODI6PX4RCMEOKIC7WOO4TUYPUW43HUG7GCSC5N5
NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID=CDPHVZHRTBYVOXOV2TUXSSGGZUK2A6IUGFKA7ACKACMORJDKFGYQMACM
```

### Contract-call transactions

Every hash below is verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).

| Purpose                                    | Transaction hash (prefix) | Full hash                                                          |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------ |
| Deploy `trading-preferences`               | `6958b5dd…`               | `6958b5dd25da43376d13e8aaded92392243eb741f7e44ee7b62c8f387d16120b` |
| `initialize` (trading-preferences)         | `4a75edc8…`               | `4a75edc8a714b751dd764fdd4120f282db6ac8d34ba74be6835bad3388a2cacb` |
| Deploy `market-oracle`                     | `8fa41747…`               | `8fa417478aca11d66430a49eea47bf30e6bb44e4c971d0b553d23fc5d449a76c` |
| `initialize` (market-oracle)               | `b50d3613…`               | `b50d36135958a39853f23aacc615cbdb622290591639c247033c3e9e5b5a734f` |
| Deploy `limit-order`                       | `ac92467f…`               | `ac92467fa3630a896e4e74faabec0a317dbe3af5b8478658417b87797885687c` |
| `initialize` (limit-order)                 | `dedce26a…`               | `dedce26afa78680babe231e11d72a5d345e95bdba07a31235ad03dba1768dc28` |

Explorer links:

- https://stellar.expert/explorer/testnet/tx/6958b5dd25da43376d13e8aaded92392243eb741f7e44ee7b62c8f387d16120b
- https://stellar.expert/explorer/testnet/tx/4a75edc8a714b751dd764fdd4120f282db6ac8d34ba74be6835bad3388a2cacb
- https://stellar.expert/explorer/testnet/tx/8fa417478aca11d66430a49eea47bf30e6bb44e4c971d0b553d23fc5d449a76c
- https://stellar.expert/explorer/testnet/tx/b50d36135958a39853f23aacc615cbdb622290591639c247033c3e9e5b5a734f
- https://stellar.expert/explorer/testnet/tx/ac92467fa3630a896e4e74faabec0a317dbe3af5b8478658417b87797885687c
- https://stellar.expert/explorer/testnet/tx/dedce26afa78680babe231e11d72a5d345e95bdba07a31235ad03dba1768dc28

Contract explorer:

- https://lab.stellar.org/r/testnet/contract/CDEXBPA5LPASJR5B2Z4EBKJ74GHT66LDPL5XXBZ4ATHL4XJKI6HQVCAM
- https://lab.stellar.org/r/testnet/contract/CBL2NE3OKPHOZTABVODI6PX4RCMEOKIC7WOO4TUYPUW43HUG7GCSC5N5
- https://lab.stellar.org/r/testnet/contract/CDPHVZHRTBYVOXOV2TUXSSGGZUK2A6IUGFKA7ACKACMORJDKFGYQMACM

## Frontend

- **Docker**: `docker compose up --build` → http://localhost:3000
- **Vercel**: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets,
  link the project (`npx vercel link`), then run the `Deploy` workflow with
  `deploy_frontend: true` — it builds with the freshly deployed contract IDs
  and ships a production build.

### Live demo

✅ **Live**: [tarshishdex.vercel.app](https://tarshishdex.vercel.app)

Health check: `https://tarshishdex.vercel.app/api/health` → `{"status":"ok","service":"tarshishdex","network":"testnet"}`
