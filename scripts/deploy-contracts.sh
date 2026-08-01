#!/usr/bin/env bash
# ── TarshishDEX — Soroban contract deployment (Stellar Testnet) ─────────
# Deploys the trading-preferences and market-oracle contracts, initializes
# them, and prints the contract IDs + transaction hashes for documentation.
#
# Prerequisites:
#   - stellar-cli installed (https://developers.stellar.org/docs/tools/cli)
#   - A funded Testnet account. Set STELLAR_SOURCE_ACCOUNT to a secret key
#     (S...) or configure a stellar identity: `stellar keys fund alice`.
#
# Usage:
#   STELLAR_SOURCE_ACCOUNT=S... ./scripts/deploy-contracts.sh
#   # or, with an identity:
#   STELLAR_IDENTITY=alice ./scripts/deploy-contracts.sh
#
# Environment:
#   STELLAR_NETWORK   testnet (default) | public
#   STELLAR_IDENTITY  stellar keys identity name (mutually exclusive with secret)
#   STELLAR_SOURCE_ACCOUNT  secret key for the deployer (mutually exclusive with identity)

set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_DIR="$ROOT/src/contracts/target/wasm32v1-none/release"
TRADING_PREFS_WASM="$WASM_DIR/trading_preferences.wasm"
ORACLE_WASM="$WASM_DIR/market_oracle.wasm"

if [[ -n "${STELLAR_IDENTITY:-}" ]]; then
  SOURCE_FLAG=(--source-account "$STELLAR_IDENTITY")
elif [[ -n "${STELLAR_SOURCE_ACCOUNT:-}" ]]; then
  SOURCE_FLAG=(--source-account "$STELLAR_SOURCE_ACCOUNT")
else
  echo "ERROR: set STELLAR_IDENTITY or STELLAR_SOURCE_ACCOUNT" >&2
  exit 1
fi

if [[ ! -f "$TRADING_PREFS_WASM" || ! -f "$ORACLE_WASM" ]]; then
  echo "ERROR: wasm artifacts missing — build them first:" >&2
  echo "  cd src/contracts && cargo build --workspace --target wasm32v1-none --release" >&2
  exit 1
fi

echo "▶ Deploying trading-preferences to $NETWORK"
TRADING_ID="$(stellar contract deploy --wasm "$TRADING_PREFS_WASM" "${SOURCE_FLAG[@]}" --network "$NETWORK" | tr -d '[:space:]')"
echo "  contract id: $TRADING_ID"

echo "▶ Deploying market-oracle to $NETWORK"
ORACLE_ID="$(stellar contract deploy --wasm "$ORACLE_WASM" "${SOURCE_FLAG[@]}" --network "$NETWORK" | tr -d '[:space:]')"
echo "  contract id: $ORACLE_ID"

# Initialize both contracts (admin = deployer's public key).
# For a secret key, register a temporary identity so the CLI can derive the
# public address: `stellar keys add <name> --secret S...`.
if [[ -n "${STELLAR_SOURCE_ACCOUNT:-}" ]]; then
  DEPLOYER_IDENTITY="tarshishdex-deployer"
  stellar keys add "$DEPLOYER_IDENTITY" --secret "$STELLAR_SOURCE_ACCOUNT" --network "$NETWORK" 2>/dev/null || true
  ADMIN_ADDR="$(stellar keys address "$DEPLOYER_IDENTITY" --network "$NETWORK")"
else
  ADMIN_ADDR="$(stellar keys address "$STELLAR_IDENTITY" --network "$NETWORK")"
fi

echo "▶ Initializing trading-preferences (admin: $ADMIN_ADDR)"
stellar contract invoke --id "$TRADING_ID" "${SOURCE_FLAG[@]}" --network "$NETWORK" --send=yes \
  -- initialize --admin "$ADMIN_ADDR"

echo "▶ Initializing market-oracle (admin: $ADMIN_ADDR)"
stellar contract invoke --id "$ORACLE_ID" "${SOURCE_FLAG[@]}" --network "$NETWORK" --send=yes \
  -- initialize --admin "$ADMIN_ADDR"

cat <<EOF

┌─ Deployed contracts ─────────────────────────────────────────────
│ trading-preferences: $TRADING_ID
│ market-oracle:       $ORACLE_ID
│ network:             $NETWORK
└──────────────────────────────────────────────────────────────────

Copy the IDs into .env.local:
  NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID=$TRADING_ID
  NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID=$ORACLE_ID
EOF
