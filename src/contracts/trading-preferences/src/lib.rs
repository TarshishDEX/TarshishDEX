#![no_std]

//! # Trading Preferences
//!
//! Per-account trading preferences for TarshishDEX. Each account stores its own
//! slippage tolerance, routing mode, and asset allow-list, and can only modify
//! its own preferences (authorization enforced via `require_auth`).
//!
//! Demonstrates: secure access control, TTL-managed persistent per-account
//! state, and typed on-chain events via `#[contractevent]`.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, symbol_short, Address, Env,
    Symbol, Vec,
};

/// TTL (in ledgers) applied to preference entries — roughly 30 days at 5s/ledger.
const TTL_LEDGERS: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidSlippage = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Preferences {
    /// Maximum acceptable slippage in basis points (1% = 100 bps).
    pub max_slippage_bps: u32,
    /// Preferred routing mode ("direct", "auto", or "bridge").
    pub routing_mode: Symbol,
    /// Assets the account is willing to trade. Empty = all assets allowed.
    pub allowed_assets: Vec<Symbol>,
}

impl Preferences {
    /// Sensible defaults for an account with no stored preferences.
    /// Takes the env explicitly — `Env::default()` is not safe on-chain.
    pub fn defaults(env: &Env) -> Self {
        Self {
            max_slippage_bps: 100,
            routing_mode: symbol_short!("auto"),
            allowed_assets: Vec::new(env),
        }
    }
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Initialized,
    Admin,
    Preferences(Address),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Initialized {
    #[topic]
    pub admin: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreferencesChanged {
    #[topic]
    pub account: Address,
    #[topic]
    pub action: Symbol, // "set" | "rm"
    pub preferences: Preferences,
}

#[contract]
pub struct TradingPreferences;

#[contractimpl]
impl TradingPreferences {
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

    /// Set (or overwrite) the preferences for `account`. Only the account
    /// itself may write its own preferences.
    pub fn set_preferences(env: Env, account: Address, prefs: Preferences) -> Result<(), Error> {
        account.require_auth();
        if prefs.max_slippage_bps > 10_000 {
            return Err(Error::InvalidSlippage);
        }
        let key = DataKey::Preferences(account.clone());
        env.storage().persistent().set(&key, &prefs);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);
        PreferencesChanged {
            account,
            action: symbol_short!("set"),
            preferences: prefs,
        }
        .publish(&env);
        Ok(())
    }

    /// Read the preferences for `account` (defaults when unset).
    pub fn get_preferences(env: Env, account: Address) -> Preferences {
        env.storage()
            .persistent()
            .get(&DataKey::Preferences(account))
            .unwrap_or_else(|| Preferences::defaults(&env))
    }

    /// Delete the preferences for `account`. Only the account itself may do so.
    pub fn remove_preferences(env: Env, account: Address) -> Result<(), Error> {
        account.require_auth();
        let key = DataKey::Preferences(account.clone());
        if !env.storage().persistent().has(&key) {
            return Err(Error::NotInitialized);
        }
        env.storage().persistent().remove(&key);
        PreferencesChanged {
            account,
            action: symbol_short!("rm"),
            preferences: Preferences::defaults(&env),
        }
        .publish(&env);
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn default_prefs(env: &Env) -> Preferences {
        Preferences {
            max_slippage_bps: 50,
            routing_mode: symbol_short!("auto"),
            allowed_assets: Vec::from_array(env, [symbol_short!("USDC"), symbol_short!("XLM")]),
        }
    }

    #[test]
    fn initialize_sets_admin() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);
        assert!(client.try_initialize(&admin).is_ok());
        assert_eq!(
            client.try_initialize(&admin),
            Err(Ok(Error::AlreadyInitialized))
        );
    }

    #[test]
    fn set_and_get_preferences_roundtrip() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);

        let prefs = default_prefs(&env);
        client.set_preferences(&account, &prefs);
        assert_eq!(client.get_preferences(&account), prefs);
    }

    #[test]
    fn unset_preferences_return_defaults() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(
            client.get_preferences(&account),
            Preferences::defaults(&env)
        );
    }

    #[test]
    fn remove_preferences_deletes_entry() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_preferences(&account, &default_prefs(&env));
        client.remove_preferences(&account);
        assert_eq!(
            client.get_preferences(&account),
            Preferences::defaults(&env)
        );
        assert_eq!(
            client.try_remove_preferences(&account),
            Err(Ok(Error::NotInitialized))
        );
    }

    #[test]
    fn rejects_excessive_slippage() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        let mut prefs = default_prefs(&env);
        prefs.max_slippage_bps = 50_000;
        assert_eq!(
            client.try_set_preferences(&account, &prefs),
            Err(Ok(Error::InvalidSlippage))
        );
    }
}
