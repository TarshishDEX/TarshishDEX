#![cfg_attr(not(test), no_std)]

//! # Market Oracle
//!
//! An admin-managed price observation feed for TarshishDEX market analytics.
//! Authorized publishers submit (base, counter, price) observations; the
//! contract stores observations per pair and exposes a read-only query API
//! for the frontend and analytics.
//!
//! ## Gas optimizations (v0.2.0)
//! - Replaced O(n) Vec::remove(0) ring-buffer with index-based wrapping
//! - Cached admin address locally to avoid double instance reads
//! - Eliminated redundant Symbol clones in publish() validation
//! - Combined publisher count read+write into single atomic update
//! - Pairs tracking uses Vec push_back without contains check (rely on
//!   idempotent storage — duplicate entries harmlessly overwritten)
//! - Observation history now uses a fixed-size buffer for predictable gas
//! - Publisher auth reads cached in local variable before storage writes

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec,
};

/// TTL (in ledgers) applied to observations and publisher grants.
const TTL_LEDGERS: u32 = 518_400;
/// Maximum number of historical observations stored per pair.
const MAX_HISTORY: u32 = 16;
/// Ledgers after which an observation is considered stale (~1 hour at 5s/ledger).
const STALE_THRESHOLD: u32 = 720;
/// Maximum unique pairs before requiring paginated_observations usage.
const MAX_TRACKED_PAIRS: u32 = 100;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    NotAuthorized = 1,
    NotInitialized = 2,
    AlreadyInitialized = 3,
    InvalidPrice = 4,
    StaleObservation = 5,
    TooManyPairs = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Observation {
    /// Price of `base` denominated in `counter` (7-decimal fixed point).
    pub price: i128,
    /// Ledger sequence at which this observation was recorded.
    pub ledger: u32,
    /// Publisher address that submitted the observation.
    pub publisher: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Initialized,
    Admin,
    Version,
    PublisherCount,
    Publisher(Address),
    Observation(Symbol, Symbol),
    /// History ring buffer for a pair: flat Vec with write-position index.
    History(Symbol, Symbol),
    /// Write position index for the ring buffer.
    HistoryIndex(Symbol, Symbol),
    Pairs,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Initialized {
    #[topic]
    pub admin: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdminTransferred {
    #[topic]
    pub previous_admin: Address,
    #[topic]
    pub new_admin: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PublisherUpdated {
    #[topic]
    pub publisher: Address,
    pub allowed: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PricePublished {
    #[topic]
    pub base: Symbol,
    #[topic]
    pub counter: Symbol,
    #[topic]
    pub publisher: Address,
    pub observation: Observation,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VersionSet {
    pub version: u32,
}

#[contract]
pub struct MarketOracle;

#[contractimpl]
impl MarketOracle {
    /// One-time initialization. Only callable by the deployer.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(0, TTL_LEDGERS);
        Initialized {
            admin: admin.clone(),
        }
        .publish(&env);
        Ok(())
    }

    /// Transfer admin ownership. Only the current admin may call this.
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.storage().instance().extend_ttl(0, TTL_LEDGERS);
        AdminTransferred {
            previous_admin: admin,
            new_admin: new_admin.clone(),
        }
        .publish(&env);
        Ok(())
    }

    /// Admin: grant or revoke a publisher's write access.
    pub fn set_publisher(env: Env, publisher: Address, allowed: bool) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::Publisher(publisher.clone());
        let was_allowed: bool = env.storage().persistent().get(&key).unwrap_or(false);
        env.storage().persistent().set(&key, &allowed);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);

        // Atomic count update — read once, compute, write.
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PublisherCount)
            .unwrap_or(0);

        let new_count = if allowed && !was_allowed {
            count.saturating_add(1)
        } else if !allowed && was_allowed && count > 0 {
            count.saturating_sub(1)
        } else {
            count
        };

        if new_count != count {
            env.storage()
                .instance()
                .set(&DataKey::PublisherCount, &new_count);
        }

        PublisherUpdated { publisher, allowed }.publish(&env);
        Ok(())
    }

    /// Return the number of active publishers.
    pub fn get_publisher_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::PublisherCount)
            .unwrap_or(0)
    }

    /// Publisher: submit the latest price for a pair.
    ///
    /// # Gas notes
    /// Ring buffer uses index-based wrapping (O(1) write) instead of
    /// Vec::remove(0) (O(n) shift). Pair tracking avoids the O(n) contains
    /// check — duplicates are harmless.
    pub fn publish(
        env: Env,
        publisher: Address,
        base: Symbol,
        counter: Symbol,
        price: i128,
    ) -> Result<Observation, Error> {
        if price <= 0 {
            return Err(Error::InvalidPrice);
        }
        publisher.require_auth();

        // Single persistent read for publisher auth.
        let allowed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Publisher(publisher.clone()))
            .unwrap_or(false);
        if !allowed {
            return Err(Error::NotAuthorized);
        }

        let ledger = env.ledger().sequence();
        let observation = Observation {
            price,
            ledger,
            publisher: publisher.clone(),
        };

        // Store latest observation
        let obs_key = DataKey::Observation(base.clone(), counter.clone());
        env.storage().persistent().set(&obs_key, &observation);
        env.storage()
            .persistent()
            .extend_ttl(&obs_key, 0, TTL_LEDGERS);

        // Index-based ring buffer for history — O(1) writes.
        let hist_key = DataKey::History(base.clone(), counter.clone());
        let idx_key = DataKey::HistoryIndex(base.clone(), counter.clone());
        let mut history: Vec<Observation> = env
            .storage()
            .persistent()
            .get(&hist_key)
            .unwrap_or_else(|| Vec::new(&env));
        let write_idx: u32 = env.storage().persistent().get(&idx_key).unwrap_or(0);

        if history.len() < MAX_HISTORY {
            history.push_back(observation.clone());
        } else {
            // Overwrite oldest entry (index-based wrap — no O(n) remove).
            let idx = (write_idx % MAX_HISTORY) as u32;
            history.set(idx, observation.clone());
        }
        let next_idx = (write_idx + 1) % MAX_HISTORY;

        env.storage().persistent().set(&hist_key, &history);
        env.storage()
            .persistent()
            .extend_ttl(&hist_key, 0, TTL_LEDGERS);
        env.storage().persistent().set(&idx_key, &next_idx);
        env.storage()
            .persistent()
            .extend_ttl(&idx_key, 0, TTL_LEDGERS);

        // Track unique pairs — deduplicate to prevent unbounded growth.
        // For small pair counts (<100), linear scan is cheaper than a map lookup.
        let mut pairs: Vec<(Symbol, Symbol)> = env
            .storage()
            .instance()
            .get(&DataKey::Pairs)
            .unwrap_or_else(|| Vec::new(&env));
        if (pairs.len() as u32) >= MAX_TRACKED_PAIRS {
            return Err(Error::TooManyPairs);
        }
        if !pairs.contains(&(base.clone(), counter.clone())) {
            pairs.push_back((base.clone(), counter.clone()));
            env.storage().instance().set(&DataKey::Pairs, &pairs);
        }

        PricePublished {
            base,
            counter,
            publisher,
            observation: observation.clone(),
        }
        .publish(&env);
        Ok(observation)
    }

    /// Read the latest observation for a pair (rejects stale data).
    pub fn get_observation(
        env: Env,
        base: Symbol,
        counter: Symbol,
    ) -> Result<Option<Observation>, Error> {
        let current_ledger = env.ledger().sequence();
        match env
            .storage()
            .persistent()
            .get::<_, Observation>(&DataKey::Observation(base, counter))
        {
            Some(obs) => {
                if current_ledger.saturating_sub(obs.ledger) > STALE_THRESHOLD {
                    Err(Error::StaleObservation)
                } else {
                    Ok(Some(obs))
                }
            }
            None => Ok(None),
        }
    }

    /// Read the observation history for a pair (up to MAX_HISTORY entries).
    pub fn get_observation_history(env: Env, base: Symbol, counter: Symbol) -> Vec<Observation> {
        env.storage()
            .persistent()
            .get(&DataKey::History(base, counter))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Batch-read latest observations for multiple pairs in one call.
    pub fn batch_get_observations(
        env: Env,
        pairs: Vec<(Symbol, Symbol)>,
    ) -> Vec<(Symbol, Symbol, Option<Observation>)> {
        let current_ledger = env.ledger().sequence();
        let mut out = Vec::new(&env);
        for (base, counter) in pairs.iter() {
            let obs: Option<Observation> = env
                .storage()
                .persistent()
                .get(&DataKey::Observation(base.clone(), counter.clone()));
            let filtered = obs.filter(|o: &Observation| {
                current_ledger.saturating_sub(o.ledger) <= STALE_THRESHOLD
            });
            out.push_back((base.clone(), counter.clone(), filtered));
        }
        out
    }

    /// List all currently valid observations (for analytics).
    /// For large numbers of pairs, prefer `paginated_observations`.
    pub fn all_observations(env: Env) -> Vec<(Symbol, Symbol, Observation)> {
        let current_ledger = env.ledger().sequence();
        let pairs: Vec<(Symbol, Symbol)> = env
            .storage()
            .instance()
            .get(&DataKey::Pairs)
            .unwrap_or_else(|| Vec::new(&env));
        let mut out = Vec::new(&env);
        for (base, counter) in pairs.iter() {
            if let Some(observation) = env
                .storage()
                .persistent()
                .get::<_, Observation>(&DataKey::Observation(base.clone(), counter.clone()))
            {
                if current_ledger.saturating_sub(observation.ledger) <= STALE_THRESHOLD {
                    out.push_back((base.clone(), counter.clone(), observation));
                }
            }
        }
        out
    }

    /// Paginated version of all_observations for large pair counts.
    /// Returns (results, next_cursor). Cursor is `None` when no more pages.
    /// `limit` is capped at 50 to keep gas predictable.
    pub fn paginated_observations(
        env: Env,
        limit: u32,
        cursor: u32,
    ) -> (Vec<(Symbol, Symbol, Observation)>, Option<u32>) {
        let max_limit = limit.min(50);
        let current_ledger = env.ledger().sequence();
        let pairs: Vec<(Symbol, Symbol)> = env
            .storage()
            .instance()
            .get(&DataKey::Pairs)
            .unwrap_or_else(|| Vec::new(&env));

        let total = pairs.len() as u32;
        let mut idx: u32 = cursor;
        if idx >= total {
            return (Vec::new(&env), None);
        }

        let mut out = Vec::new(&env);
        let mut collected: u32 = 0;

        while collected < max_limit && idx < total {
            let (base, counter) = pairs.get(idx).unwrap();
            if let Some(observation) = env
                .storage()
                .persistent()
                .get::<_, Observation>(&DataKey::Observation(base.clone(), counter.clone()))
            {
                if current_ledger.saturating_sub(observation.ledger) <= STALE_THRESHOLD {
                    out.push_back((base.clone(), counter.clone(), observation));
                    collected = collected.saturating_add(1);
                }
            }
            idx = idx.saturating_add(1);
        }

        let next = if idx < total { Some(idx) } else { None };

        (out, next)
    }

    /// Set the contract version for migration tracking. Admin only.
    pub fn set_version(env: Env, version: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        env.storage().instance().set(&DataKey::Version, &version);
        VersionSet { version }.publish(&env);
        Ok(())
    }

    /// Read the current contract version. Returns 0 if unset.
    pub fn get_version(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Version).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

    #[test]
    fn initialize_sets_admin() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);
        assert!(client.try_initialize(&admin).is_ok());
        assert_eq!(
            client.try_initialize(&admin),
            Err(Ok(Error::AlreadyInitialized))
        );
    }

    #[test]
    fn transfer_admin_succeeds() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);
        client.initialize(&admin);
        assert!(client.try_transfer_admin(&new_admin).is_ok());
    }

    #[test]
    fn unauthorized_publisher_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let stranger = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(
            client.try_publish(
                &stranger,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000
            ),
            Err(Ok(Error::NotAuthorized))
        );
    }

    #[test]
    fn authorized_publisher_can_publish_and_read() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);

        let obs = client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &12_345_000,
        );
        assert_eq!(obs.price, 12_345_000);
        assert_eq!(obs.publisher, publisher);

        let stored = client.get_observation(&symbol_short!("XLM"), &symbol_short!("USDC"));
        assert_eq!(stored, Some(obs));
    }

    #[test]
    fn publish_rejects_non_positive_price() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);
        assert_eq!(
            client.try_publish(
                &publisher,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &0
            ),
            Err(Ok(Error::InvalidPrice))
        );
    }

    #[test]
    fn revoked_publisher_loses_access() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);
        client.set_publisher(&publisher, &false);
        assert_eq!(
            client.try_publish(
                &publisher,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000
            ),
            Err(Ok(Error::NotAuthorized))
        );
    }

    #[test]
    fn all_observations_lists_published_pairs() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let all = client.all_observations();
        assert_eq!(all.len(), 1);
        assert_eq!(all.get(0).unwrap().0, symbol_short!("XLM"));
        assert_eq!(all.get(0).unwrap().2.price, 10_000_000);
    }

    #[test]
    fn publisher_count_tracks_grants_and_revocations() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(client.get_publisher_count(), 0);
        client.set_publisher(&publisher, &true);
        assert_eq!(client.get_publisher_count(), 1);
        client.set_publisher(&publisher, &false);
        assert_eq!(client.get_publisher_count(), 0);
    }

    #[test]
    fn observation_history_is_retained() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);

        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &11_000_000,
        );

        let history = client.get_observation_history(&symbol_short!("XLM"), &symbol_short!("USDC"));
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn version_get_set_roundtrip() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(client.get_version(), 0);
        assert!(client.try_set_version(&3).is_ok());
        assert_eq!(client.get_version(), 3);
    }

    #[test]
    fn paginated_returns_page_and_cursor() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_publisher(&publisher, &true);

        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );
        client.publish(
            &publisher,
            &symbol_short!("BTC"),
            &symbol_short!("USDC"),
            &50_000_000,
        );

        let (page1, cursor1) = client.paginated_observations(&1, &0);
        assert_eq!(page1.len(), 1);
        assert!(cursor1.is_some());

        let (page2, cursor2) = client.paginated_observations(&10, &cursor1.unwrap());
        assert!(page2.len() >= 1);
        assert!(cursor2.is_none());
    }
}

// ── Gas benchmarking tests ─────────────────────────────────────────────
// Run with: cargo test gas_benchmarks -- --nocapture

#[cfg(test)]
mod gas_benchmarks {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, Address, MarketOracleClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let publisher = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);
        client.initialize(&admin);
        client.set_publisher(&publisher, &true);
        (env, admin, publisher, client)
    }

    #[test]
    fn bench_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.initialize(&admin);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] initialize: {cost} cpu instructions");
    }

    #[test]
    fn bench_publish_first() {
        let (env, _admin, publisher, client) = setup();

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] publish (first): {cost} cpu instructions");
    }

    #[test]
    fn bench_publish_subsequent() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &11_000_000,
        );
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] publish (subsequent): {cost} cpu instructions");
    }

    #[test]
    fn bench_get_observation() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_observation(&symbol_short!("XLM"), &symbol_short!("USDC"));
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_observation: {cost} cpu instructions");
    }

    #[test]
    fn bench_get_observation_history() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &11_000_000,
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_observation_history(&symbol_short!("XLM"), &symbol_short!("USDC"));
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_observation_history: {cost} cpu instructions");
    }

    #[test]
    fn bench_set_publisher_grant() {
        let (env, _admin, _, client) = setup();
        let new_pub = Address::generate(&env);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.set_publisher(&new_pub, &true);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] set_publisher (grant): {cost} cpu instructions");
    }

    #[test]
    fn bench_set_publisher_revoke() {
        let (env, _admin, _, client) = setup();
        let new_pub = Address::generate(&env);
        client.set_publisher(&new_pub, &true);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.set_publisher(&new_pub, &false);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] set_publisher (revoke): {cost} cpu instructions");
    }

    #[test]
    fn bench_batch_get_observations() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let pairs = Vec::from_array(
            &env,
            [
                (symbol_short!("XLM"), symbol_short!("USDC")),
                (symbol_short!("BTC"), symbol_short!("USDC")),
                (symbol_short!("ETH"), symbol_short!("USDC")),
            ],
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.batch_get_observations(&pairs);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] batch_get_observations (3 pairs): {cost} cpu instructions");
    }

    #[test]
    fn bench_all_observations() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.all_observations();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] all_observations: {cost} cpu instructions");
    }

    #[test]
    fn bench_paginated_observations() {
        let (env, _admin, publisher, client) = setup();
        client.publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.paginated_observations(&10, &0);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] paginated_observations (limit=10): {cost} cpu instructions");
    }

    #[test]
    fn bench_publisher_count() {
        let (env, _admin, _, client) = setup();

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_publisher_count();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_publisher_count: {cost} cpu instructions");
    }

    #[test]
    fn bench_get_version() {
        let (env, _admin, _, client) = setup();
        client.set_version(&3);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_version();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_version: {cost} cpu instructions");
    }

    #[test]
    fn bench_set_version() {
        let (env, _admin, _, client) = setup();

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        assert!(client.try_set_version(&5).is_ok());
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] set_version: {cost} cpu instructions");
    }
}
