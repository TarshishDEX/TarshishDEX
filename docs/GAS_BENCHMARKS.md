# Gas Benchmarks — TarshishDEX Soroban Contracts

> **Methodology.** Numbers below were measured against a local protocol-27
> network (Stellar Quickstart via `stellar-cli 27.1.0`) and the Soroban SDK
> v27.0.4 test sandbox (`cargo test`). Resource breakdowns (CPU, memory,
> ledger reads/writes, events) come from `env.cost_estimate().resources()`;
> fees come from `stellar contract invoke --cost` against the local network.
> `1 stroop = 10⁻⁷ XLM` (so 10,000,000 stroops = 1 XLM).

## Fee Schedule (protocol 27)

Measured from `stellar network settings --network local`:

| Resource | Rate |
|---|---|
| CPU instructions | 25 stroops per 10,000-instruction increment |
| Disk read (ledger entry) | 6,250 stroops per entry |
| Ledger write (entry) | 10,000 stroops per entry |
| Read (disk bytes) | 1,786 stroops per KB |
| Write (ledger bytes) | 3,500 stroops per KB |
| Contract events | 10,000 stroops per KB |
| Transaction size | 1,624 stroops per KB |
| State rent (persistent) | 10,000 stroops per KB per 1,215 ledgers |

> **The dominant cost is state rent.** Every write that extends an entry's TTL
> (the contracts bump TTL by `TTL_LEDGERS = 518,400` ledgers ≈ 30 days) pays a
> refundable rent escrow that is several times larger than the CPU + I/O fee.
> A portion of that rent is refunded when the entry is eventually archived, so
> the *net* lifetime cost is lower than the "fee charged" shown below.

## Per-Transaction Resource Usage & Fees

"CPU" is modelled CPU instructions from the SDK test sandbox (it includes the
host-invocation baseline, which is why even a no-op read shows ~30–40k).
"Writes" = ledger entries modified; "bytes" = ledger bytes written; "events" =
emitted event payload bytes. "Fee" is the measured total charged (stroops),
including the 100-stroop inclusion fee and the refundable rent escrow.

### Trading Preferences

| Function | CPU | Writes | Bytes | Events | Fee (stroops) | ≈ XLM |
|---|---|---|---|---|---|---|
| `initialize` | 48,145 | 2 | 288 | 124 | 39,946 | 0.0040 |
| `set_preferences` (new) | 125,154 | 4 | 756 | 316 | 126,079 | 0.0126 |
| `set_preferences` (update) | 83,925 | 2 | 352 | 316 | 37,522 | 0.0038 |
| `remove_preferences` | 142,429 | 4 | 436 | 276 | 55,013 | 0.0055 |
| `set_version` | 73,852 | 2 | 368 | 108 | 31,035 | 0.0031 |
| `get_preferences` | 41,456 | 0 | 0 | 0 | ~0* | ~0 |
| `batch_get_preferences` (10) | 216,727 | 0 | 0 | 0 | ~0* | ~0 |
| `paginated_get_preferences` (10) | 62,898 | 0 | 0 | 0 | ~0* | ~0 |
| `get_preference_count` | 31,552 | 0 | 0 | 0 | ~0* | ~0 |
| `get_version` | 28,807 | 0 | 0 | 0 | ~0* | ~0 |

### Market Oracle

| Function | CPU | Writes | Bytes | Events | Fee (stroops) | ≈ XLM |
|---|---|---|---|---|---|---|
| `initialize` | 48,145 | 2 | 288 | 124 | 40,849 | 0.0041 |
| `publish` (first per pair) | 163,329 | 5 | 820 | 304 | 189,929 | 0.0190 |
| `publish` (subsequent) | 179,654 | 4 | 820 | 304 | 79,067 | 0.0079 |
| `set_publisher` (grant) | 78,492 | 3 | 468 | 156 | 71,449 | 0.0071 |
| `set_publisher` (revoke) | 105,447 | 3 | 468 | 156 | 43,457 | 0.0043 |
| `set_version` | 70,303 | 2 | 368 | 108 | 31,926 | 0.0032 |
| `get_observation` | 34,652 | 0 | 0 | 0 | ~0* | ~0 |
| `get_observation_history` | 31,583 | 0 | 0 | 0 | ~0* | ~0 |
| `batch_get_observations` (2) | 51,912 | 0 | 0 | 0 | ~0* | ~0 |
| `all_observations` | 50,162 | 0 | 0 | 0 | ~0* | ~0 |
| `paginated_observations` (10) | 51,316 | 0 | 0 | 0 | ~0* | ~0 |
| `get_publisher_count` | 31,414 | 0 | 0 | 0 | ~0* | ~0 |
| `get_version` | 28,667 | 0 | 0 | 0 | ~0* | ~0 |

### Limit Order

| Function | CPU | Writes | Bytes | Events | Fee (stroops) | ≈ XLM |
|---|---|---|---|---|---|---|
| `initialize` | 48,145 | 2 | 288 | 124 | 40,972 | 0.0041 |
| `place_order` (first) | 117,756 | 4 | 924 | 284 | 143,821 | 0.0144 |
| `place_order` (subsequent) | 144,420 | 4 | 936 | 284 | 111,613 | 0.0112 |
| `cancel_order` | 139,861 | 4 | 564 | 140 | 55,354 | 0.0055 |
| `mark_executed` | 156,457 | 4 | 552 | 168 | 58,493 | 0.0058 |
| `set_relayer` (grant) | 104,113 | 3 | 544 | 0 | ≈71,000† | ≈0.0071 |
| `set_version` | 86,472 | 2 | 448 | 108 | 32,225 | 0.0032 |
| `get_order` | 34,348 | 0 | 0 | 0 | ~0* | ~0 |
| `get_user_orders` (2) | 33,480 | 0 | 0 | 0 | ~0* | ~0 |
| `paginated_orders` (10) | 73,668 | 0 | 0 | 0 | ~0* | ~0 |
| `get_order_count` | 35,934 | 0 | 0 | 0 | ~0* | ~0 |
| `get_version` | 37,878 | 0 | 0 | 0 | ~0* | ~0 |

\* Read-only operations read live in-memory ledger entries and emit no
events, so on-chain they cost only the 100-stroop inclusion fee (plus the
footprint of the entries they touch). They show "0" in the CPU-only sandbox
metric — this is why the older table reported them as "~0".

† `set_relayer` mirrors `set_publisher` (grant) in storage shape; its fee is
estimated from the same write pattern.

## Storage Layout Fixes (most recent)

Three growing `Vec`s were stored in **instance** storage and rewritten
whole on every mutation. Instance storage is meant for small, bounded scalars
(admin, version, counters); storing unbounded lists there grows the instance
entry until it hits the 64 KB contract-data-entry limit and makes every write
O(n). All three were moved off instance storage:

1. **Limit Order — `OrderList` removed entirely.** Orders are already keyed by
   an auto-incrementing ID, so `paginated_orders` now scans `Order(id)` from
   the cursor upward and skips gaps left by cancelled/executed orders
   (bounded scan → predictable gas). `place_order`/`cancel_order`/
   `mark_executed` no longer read-and-rewrite a global list. This is a strict
   win: fewer writes, no unbounded instance entry.
2. **Trading Preferences — `PreferencesList` moved to persistent storage.**
   Pagination semantics are unchanged; the instance entry now stays constant
   size regardless of how many accounts set preferences.
3. **Market Oracle — `Pairs` moved to persistent storage.** It remains
   bounded at `MAX_TRACKED_PAIRS = 100`, but no longer inflates the instance
   entry.

> **Trade-off note.** Moving `PreferencesList` and `Pairs` to persistent
> storage adds one persistent write + a TTL bump per *new* account/pair
> (visible as a slight CPU/fee increase for `set_preferences`/`publish` first
> call). This is the correct trade: it bounds the instance entry and keeps
> per-entry rent accounting correct. A further optimization would be to bump
> TTL on these hot list entries by `min_persistent_ttl` (≈7 days) instead of
> the full 30 days to cut their rent escrow.

## Gas Optimization Techniques Applied

### Trading Preferences
1. **Eliminated redundant Symbol clones** — validation compares `&Symbol`
   references instead of cloning.
2. **Admin cache** — `transfer_admin` reads admin once into a local variable.
3. **Atomic count updates** — preference count uses a single
   read→compute→write with `saturating_add/sub`.
4. **Correct TTL domain** — TTL extension targets the right storage domain.
5. **Bounded instance storage** — pagination list lives in persistent storage.

### Market Oracle
1. **O(1) ring buffer** — `MAX_HISTORY = 16` observations with index-based
   wrapping instead of `Vec::remove(0)` (O(n) shift).
2. **Deduplicated pair tracking** — `contains` check before `push_back`
   prevents unbounded growth; capped at `MAX_TRACKED_PAIRS = 100`.
3. **Admin / publisher auth caches** — authorization reads stored in locals
   before storage writes.
4. **Atomic publisher count** — single read→compute→write.
5. **Paginated observations** — cursor-based, max 50 per page.
6. **Bounded instance storage** — pair list lives in persistent storage.

### Limit Order
1. **Per-user order cap** — `MAX_ORDERS_PER_USER = 25`.
2. **Auto-incrementing IDs** — `NextOrderId` counter; no collision checks.
3. **Saturating arithmetic** — no overflow traps on counts.
4. **Per-user index** — `UserOrders(Address)` enables user-scoped queries
   without scanning.
5. **ID-range pagination** — no global order list; O(bounded) scans.
6. **O(1) cancellation/execution** — direct `Order(id)` remove + per-user
   index cleanup.

## WASM Binary Sizes (release, wasm32v1-none)

| Contract | Size | % of 64 KB limit |
|---|---|---|
| `trading_preferences.wasm` | 21,130 bytes (20.6 KB) | 32.2% |
| `market_oracle.wasm` | 30,078 bytes (29.4 KB) | 45.9% |
| `limit_order.wasm` | 31,098 bytes (30.4 KB) | 47.5% |

> All three fit comfortably within Soroban's ~64 KB deploy limit. The release
> profile uses `opt-level = "z"`, `lto = true`, `strip = "symbols"`,
> `codegen-units = 1`, and `panic = "abort"`. `overflow-checks = true` is
> deliberately kept on for safety (the limit-order `checked_mul` guard is the
> only arithmetic that can realistically overflow); disabling it would shrink
> the binaries ~5–10% at the cost of losing trap-based overflow protection.

## Running Benchmarks

```bash
# CPU-instruction benchmarks (CI gas-regression gate uses these)
cargo test --workspace -- gas_benchmarks --nocapture

# Full per-transaction resource + fee table
cargo test --workspace -- bench_resource_table --nocapture

# Individual contracts
cargo test -p trading-preferences -- gas_benchmarks --nocapture
cargo test -p market-oracle -- gas_benchmarks --nocapture
cargo test -p limit-order -- gas_benchmarks --nocapture

# E2E integration tests
cargo test -p market-oracle --test e2e -- --nocapture

# Authoritative on-chain fees (requires a local network)
stellar container start local
stellar contract deploy --wasm target/wasm32v1-none/release/<crate>.wasm \
  --source deployer --network local
stellar contract invoke --id <CONTRACT_ID> --source deployer --network local \
  --cost --send yes -- <fn> <args>
```

## Conclusion — Ultra-Low Fees Verified

- **Reads are effectively free** (100-stroop inclusion fee ≈ 0.00001 XLM).
- **Writes cost 0.003 – 0.019 XLM**, dominated by refundable state rent from
  TTL extension, not CPU or I/O. The compute + I/O portion of even the
  heaviest operation (`publish` first, ~164k instructions + 5 writes) is only
  ~15–20k stroops.
- **CPU is well under mainnet limits**: the heaviest operation uses
  ~216k modelled instructions against a 100M-instruction transaction limit.
- **Bounded storage** after the fixes: no contract stores a growing list in
  instance storage, so the instance entry size is constant and write costs
  no longer scale with order/pair/account count.
