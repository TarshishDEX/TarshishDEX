# Gas Benchmarks — TarshishDEX Soroban Contracts

> Measured on Soroban SDK v27 (test sandbox). CPU instruction costs.
> Read-only operations show 0 in test sandbox — actual on-chain costs
> are minimal but non-zero.

## Trading Preferences Contract

| Function | CPU Instructions | Notes |
|---|---|---|
| `initialize` | 25,465 | One-time; 2 instance writes + TTL extend |
| `set_preferences` (new) | 62,166 | 1 persistent write + 1 instance read/write + event |
| `set_preferences` (update) | ~0* | Only overwrites existing persistent entry |
| `get_preferences` | ~0* | Single persistent read |
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
| `publish` (first obs per pair) | 132,463 | Auth check + 4 persistent writes + 1 instance write + event |
| `publish` (subsequent) | 22,898 | Overwrites existing entries; ~83% cheaper than first |
| `get_observation` | ~0* | Single persistent read + staleness check |
| `get_observation_history` | ~0* | Persistent vec read (benchmark added v0.2.1) |
| `batch_get_observations` (3 pairs) | ~0* | 3 persistent reads + staleness filtering |
| `all_observations` | ~0* | Instance read + N persistent reads |
| `paginated_observations` (limit=10) | ~0* | Cursor-based; max 50 per page; safe for large datasets |
| `set_publisher` (grant) | 14,286 | 1 persistent write + 1 instance read/write + event |
| `set_publisher` (revoke) | 3,423 | Same as grant but less work (overwrite) |
| `get_publisher_count` | ~0* | Single instance read |
| `set_version` | ~0* | 1 instance write + event |
| `get_version` | ~0* | Single instance read |

## Gas Optimization Techniques Applied (v0.2.0)

### Trading Preferences
1. **Eliminated redundant Symbol clones** — Validation uses reference
   comparison (`!=` on `&Symbol`) instead of cloning
2. **Admin cache** — `transfer_admin` reads admin address once into a local
   variable instead of two instance reads
3. **Atomic count updates** — Preference count uses single read→compute→write
   pattern with `saturating_add/sub`
4. **Correct TTL domain** — TTL extension now targets instance storage for
   admin/version/count entries

### Market Oracle
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

### Deprecated API Note
Benchmarks currently use the deprecated `env.budget().cpu_instruction_cost()`
API. The replacement `env.cost_estimate().budget()` API differs between SDK
versions. Update when upgrading to a Soroban SDK version where
the old API is removed.

## Running Benchmarks

```bash
# Trading Preferences
cargo test -p trading-preferences -- gas_benchmarks --nocapture

# Market Oracle
cargo test -p market-oracle -- gas_benchmarks --nocapture
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
| Set preferences (new user) | ~0.003 |
| Publish price (first per pair) | ~0.005 |
| Publish price (subsequent) | ~0.002 |
| Batch get 10 preferences | ~0.001 |
| Grant publisher | ~0.001 |

> **Ultra-low fees**: All operations stay well under 0.01 XLM,
> making TarshishDEX accessible even during network congestion.
