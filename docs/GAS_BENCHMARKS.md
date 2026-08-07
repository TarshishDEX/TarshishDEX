# Gas Benchmarks — TarshishDEX Soroban Contracts

> Measured on Soroban SDK v27 (test sandbox). CPU instruction costs.
> Read-only operations show 0 in test sandbox — actual on-chain costs
> are minimal but non-zero. All benchmarks use the current
> `env.cost_estimate().budget()` API.

## Trading Preferences Contract

| Function | CPU Instructions | Notes |
|---|---|---|
| `initialize` | 25,465 | One-time; 2 instance writes + TTL extend |
| `set_preferences` (new) | 78,252 | 1 persistent write + 1 instance read/write + event |
| `set_preferences` (update) | ~0* | Only overwrites existing persistent entry |
| `get_preferences` | ~0* | Single persistent read |
| `paginated_get_preferences` (limit=10) | ~0* | Cursor-based; max 50/page; safe for large datasets |
| `remove_preferences` | ~0* | Persistent delete + instance read/write |
| `batch_get_preferences` (10 accts) | 166,442 | Scales linearly; ~16.6k per account |
| `get_preference_count` | ~0* | Single instance read |
| `set_version` | 6,482 | 1 instance write + event |
| `get_version` | ~0* | Single instance read |

\* Read-only operations show 0 in test sandbox. On-chain costs are
typically < 5,000 CPU instructions for simple storage reads.

## Market Oracle Contract

| Function | CPU Instructions | Notes |
|---|---|---|
| `initialize` | 25,465 | One-time; 2 instance writes + TTL extend |
| `publish` (first obs per pair) | 132,585 | Auth check + 4 persistent writes + 1 instance write + event |
| `publish` (subsequent) | 22,898 | Overwrites existing entries; ~83% cheaper than first |
| `get_observation` | ~0* | Single persistent read + staleness check |
| `get_observation_history` | ~0* | Persistent vec read |
| `batch_get_observations` (3 pairs) | ~0* | 3 persistent reads + staleness filtering |
| `all_observations` | ~0* | Instance read + N persistent reads |
| `paginated_observations` (limit=10) | ~0* | Cursor-based; max 50 per page; safe for large datasets |
| `set_publisher` (grant) | 14,286 | 1 persistent write + 1 instance read/write + event |
| `set_publisher` (revoke) | 3,423 | Same as grant but less work (overwrite) |
| `get_publisher_count` | ~0* | Single instance read |
| `set_version` | ~0* | 1 instance write + event |
| `get_version` | ~0* | Single instance read |

## Limit Order Contract

| Function | CPU Instructions | Notes |
|---|---|---|
| `initialize` | 25,465 | One-time; 2 instance writes + TTL extend |
| `place_order` (first) | 114,591 | Auth check + 3 persistent writes + 2 instance writes + event |
| `place_order` (subsequent) | 38,108 | Less work; ~67% cheaper than first order |
| `cancel_order` | ~0* | Auth check + persistent remove + instance count update |
| `mark_executed` | ~0* | Same pattern as cancel + event with tx_hash |
| `get_order` | ~0* | Single persistent read by ID |
| `get_user_orders` (3 orders) | ~0* | Persistent vec read for user's order IDs |
| `paginated_orders` (limit=10) | ~0* | Cursor-based; max 50/page; O(1) per page |
| `get_order_count` | ~0* | Single instance read |
| `set_version` | 6,482 | 1 instance write + event |
| `get_version` | ~0* | Single instance read |

## Gas Optimization Techniques Applied

### Trading Preferences (v0.2.0)
1. **Eliminated redundant Symbol clones** — Validation uses reference
   comparison (`!=` on `&Symbol`) instead of cloning
2. **Admin cache** — `transfer_admin` reads admin address once into a local
   variable instead of two instance reads
3. **Atomic count updates** — Preference count uses single read→compute→write
   pattern with `saturating_add/sub`
4. **Correct TTL domain** — TTL extension now targets instance storage for
   admin/version/count entries

### Market Oracle (v0.2.0)
1. **O(1) ring buffer** — Replaced `Vec::remove(0)` (O(n) shift) with
   index-based wrapping for observation history. `MAX_HISTORY=16` entries,
   write position tracked separately
2. **Deduplicated pair tracking** — Uses `contains` check before `push_back`
   to prevent unbounded growth in `all_observations()`
3. **Admin cache** — Same pattern as trading-preferences
4. **Publisher auth cache** — Publisher authorization reads stored in local
   variable before storage writes in `publish()`
5. **Atomic publisher count** — Same read→compute→write pattern
6. **Paginated observations** — `paginated_observations(limit, cursor)` with
   max 50 per page for predictable gas with large pair counts

### Limit Order (v0.3.0)
1. **Per-user order cap** — Enforced `MAX_ORDERS_PER_USER=25` to prevent
   unbounded storage growth per account
2. **Auto-incrementing IDs** — Simple `NextOrderId` counter avoids expensive
   ID collision checks
3. **Saturating arithmetic** — All count increments/decrements use
   `saturating_add/sub` to avoid overflow checks
4. **Global + per-user indexes** — Dual indexing (OrderList + UserOrders)
   enables both full pagination and user-scoped queries without scanning
5. **O(1) per-page pagination** — Cursor-based with `limit.min(50)` cap for
   predictable read costs regardless of total order count

## Running Benchmarks

```bash
# All contracts
cargo test --workspace -- gas_benchmarks --nocapture

# Individual contracts
cargo test -p trading-preferences -- gas_benchmarks --nocapture
cargo test -p market-oracle -- gas_benchmarks --nocapture
cargo test -p limit-order -- gas_benchmarks --nocapture

# E2E integration tests
cargo test -p market-oracle --test e2e -- --nocapture
```

## On-Chain Cost Estimation

Soroban charges fees in stroops based on:
- **CPU instructions** (~25 stroops per instruction)
- **Read entries** (~6,250 stroops per read)
- **Write entries** (~10,000 stroops per write)
- **Read bytes** (~134 stroops per KB)
- **Write bytes** (~670 stroops per KB)

### Estimated On-Chain Costs (XLM)

| Operation | Est. Fee (XLM) |
|---|---|
| Initialize contract | ~0.002 |
| Set preferences (new user) | ~0.004 |
| Place limit order (first) | ~0.005 |
| Place limit order (subsequent) | ~0.002 |
| Publish price (first per pair) | ~0.005 |
| Publish price (subsequent) | ~0.002 |
| Batch get 10 preferences | ~0.001 |
| Cancel/cancel order | ~0.001 |
| Grant publisher | ~0.001 |

> **Ultra-low fees**: All operations stay well under 0.01 XLM,
> making TarshishDEX accessible even during network congestion.

## WASM Binary Sizes (release build, wasm32v1-none)

| Contract | Size | % of 64KB Limit |
|---|---|---|
| `trading_preferences.wasm` | 17,958 bytes (17.5 KB) | 27.4% |
| `limit_order.wasm` | 24,962 bytes (24.4 KB) | 38.1% |
| `market_oracle.wasm` | 27,025 bytes (26.4 KB) | 41.3% |

> All three contracts fit comfortably within Soroban's ~64 KB deploy limit.
> The release profile uses `opt-level = "z"`, `lto = true`,
> `strip = "symbols"`, `codegen-units = 1`, and `panic = "abort"`
> for minimal, deterministic binaries. Combined WASM size: 70 KB across
> three contracts.

## E2E Integration Tests

Run with:
```bash
cargo test -p market-oracle --test e2e -- --nocapture
```

Covers full TarshishDEX workflows:
- Admin initialization and transfer
- User preference lifecycle (set, read, paginate, remove)
- Publisher access grant/revoke and price publishing
- Batch reads for frontend dashboards
- Observation history tracking
- Multi-user preference pagination
- Publisher revoke enforcement
- Paginated observation pagination
