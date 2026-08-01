#![no_std]

//! # Market Oracle
//!
//! An admin-managed price observation feed for TarshishDEX market analytics.
//! Authorized publishers submit (base, counter, price) observations; the
//! contract stores the latest observation per pair and exposes a read-only
//! query API for the frontend and analytics.
//!
//! Demonstrates: admin-gated access control, TTL-managed keyed storage,
//! and typed on-chain events via `#[contractevent]`.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec,
};

/// TTL (in ledgers) applied to observations and publisher grants.
const TTL_LEDGERS: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    NotAuthorized = 1,
    NotInitialized = 2,
    AlreadyInitialized = 3,
    InvalidPrice = 4,
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
    Publisher(Address),
    Observation(Symbol, Symbol),
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

#[contract]
pub struct MarketOracle;

#[contractimpl]
impl MarketOracle {
    /// One-time initialization, called by the deployer/admin.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        Initialized {
            admin: admin.clone(),
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
        env.storage().persistent().set(&key, &allowed);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);
        PublisherUpdated { publisher, allowed }.publish(&env);
        Ok(())
    }

    /// Publisher: submit the latest price for a pair.
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
        let key = DataKey::Observation(base.clone(), counter.clone());
        env.storage().persistent().set(&key, &observation);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);

        // Track the pair so `all_observations` can enumerate everything.
        let mut pairs: Vec<(Symbol, Symbol)> = env
            .storage()
            .instance()
            .get(&DataKey::Pairs)
            .unwrap_or_else(|| Vec::new(&env));
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

    /// Read the latest observation for a pair.
    pub fn get_observation(env: Env, base: Symbol, counter: Symbol) -> Option<Observation> {
        env.storage()
            .persistent()
            .get(&DataKey::Observation(base, counter))
    }

    /// List all observations currently stored (for analytics).
    pub fn all_observations(env: Env) -> Vec<(Symbol, Symbol, Observation)> {
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
                .get(&DataKey::Observation(base.clone(), counter.clone()))
            {
                out.push_back((base.clone(), counter.clone(), observation));
            }
        }
        out
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
    fn unauthorized_publisher_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let stranger = Address::generate(&env);
        let contract_id = env.register(MarketOracle, ());
        let client = MarketOracleClient::new(&env, &contract_id);

        client.initialize(&admin);
        // `stranger` was never granted publisher access.
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

        let stored = client
            .get_observation(&symbol_short!("XLM"), &symbol_short!("USDC"))
            .unwrap();
        assert_eq!(stored, obs);
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
}
