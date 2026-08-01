# Deployment

## Soroban contracts — Stellar Testnet

Status: **pending** (requires a funded Testnet deployer account).

Run the deploy script (or the `Deploy` GitHub Actions workflow with the
`STELLAR_SOURCE_ACCOUNT` secret):

```bash
cd src/contracts
cargo build --workspace --target wasm32v1-none --release
STELLAR_SOURCE_ACCOUNT=S... bash ../../scripts/deploy-contracts.sh
```

### Deployed addresses

| Contract            | Address                            | Network |
| ------------------- | ---------------------------------- | ------- |
| trading-preferences | `C...` (to be filled after deploy) | Testnet |
| market-oracle       | `C...` (to be filled after deploy) | Testnet |

### Contract-call transaction

| Purpose                            | Transaction hash     | Explorer link                                  |
| ---------------------------------- | -------------------- | ---------------------------------------------- |
| `initialize` (trading-preferences) | `...` (to be filled) | https://stellar.expert/explorer/testnet/tx/... |
| `set_preferences` (via UI)         | `...` (to be filled) | https://stellar.expert/explorer/testnet/tx/... |
| `publish` (market-oracle)          | `...` (to be filled) | https://stellar.expert/explorer/testnet/tx/... |

## Frontend

- **Docker**: `docker compose up --build` → http://localhost:3000
- **Hosting**: wire the `Deploy` workflow template (Vercel/Netlify/Fly.io) and add secrets.

### Live demo

Pending — to be filled once hosted: `https://tarshishdex.vercel.app`
