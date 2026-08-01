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
#   CONTRACT_IDS_FILE path to write machine-readable contract IDs (for CI)

set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_DIR="$ROOT/src/contracts/target/wasm32v1-none/release"
TRADING_PREFS_WASM="$WASM_DIR/trading_preferences.wasm"
ORACLE_WASM="$WASM_DIR/market_oracle.wasm"

if [[ -n "${STELLAR_IDENTITY:-}" ]]; then
  SOURCE_FLAG=(--source-account "$STELLAR_IDENTITY")
elif [[ -n "${STELLAR_SOURCE_ACCOUNT:-}" ]]; then
  # stellar-cli accepts a raw secret key (S...) directly as --source-account,
  # so there is no need to import an identity (CLI v27's `keys add` is
  # interactive-only and would otherwise hang in scripts).
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

# Persist the IDs immediately after deploy (before initialize), so CI can
# capture them even if a later step fails — and a retry won't silently
# orphan deployed-but-unrecorded contracts.
if [[ -n "${CONTRACT_IDS_FILE:-}" ]]; then
  cat > "$CONTRACT_IDS_FILE" <<EOF
TRADING_PREFS_ID=$TRADING_ID
ORACLE_ID=$ORACLE_ID
NETWORK=$NETWORK
EOF
fi

# Initialize both contracts (admin = deployer's public key).
# Deriving the public address from a raw secret key via the Stellar SDK avoids
# the interactive `stellar keys add` prompt (which hangs in non-TTY scripts).
if [[ -n "${STELLAR_SOURCE_ACCOUNT:-}" ]]; then
  # Run from $ROOT so the SDK resolves regardless of the caller's cwd.
  ADMIN_ADDR="$(cd "$ROOT" && node -e "const { Keypair } = require('@stellar/stellar-sdk'); \
    process.stdout.write(Keypair.fromSecret(process.argv[1]).publicKey())" \
    "$STELLAR_SOURCE_ACCOUNT")"
else
  ADMIN_ADDR="$(stellar keys address "$STELLAR_IDENTITY")"
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
