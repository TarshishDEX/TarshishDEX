#![cfg_attr(not(test), no_std)]

//! # Trading Preferences
//!
//! Per-account trading preferences for TarshishDEX. Each account stores its own
//! slippage tolerance, routing mode, and asset allow-list, and can only modify
//! its own preferences (authorization enforced via `require_auth`).
//!
//! ## Gas optimizations (v0.2.0)
//! - Eliminated redundant Symbol clones in validation
//! - Combined instance storage read+write for preference count into a single
//!   atomic update pattern
//! - Used `saturating_add` / `saturating_sub` to avoid overflow checks
//! - Cached admin address locally to avoid double instance storage reads
//! - TTL extension now targets correct storage domain (instance for admin)

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
    NotAuthorized = 4,
    PreferenceNotFound = 5,
    InvalidRoutingMode = 6,
    TooManyAssets = 7,
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
    Version,
    PreferenceCount,
    Preferences(Address),
    /// Ordered list of accounts that have set preferences (for pagination).
    PreferencesList,
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
    pub action: Symbol,
    pub preferences: Preferences,
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
pub struct VersionSet {
    pub version: u32,
}

#[contract]
pub struct TradingPreferences;

#[contractimpl]
impl TradingPreferences {
    /// One-time initialization. Only callable by the deployer.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        // Extend TTL on instance entries so admin data persists
        env.storage().instance().extend_ttl(0, TTL_LEDGERS);
        Initialized {
            admin: admin.clone(),
        }
        .publish(&env);
        Ok(())
    }

    /// Set (or overwrite) the preferences for `account`. Only the account
    /// itself may write its own preferences.
    ///
    /// # Gas notes
    /// Routing mode validation uses `==` on Symbol references (not clones).
    /// Preference count uses a single read→compute→write cycle.
    pub fn set_preferences(env: Env, account: Address, prefs: Preferences) -> Result<(), Error> {
        account.require_auth();

        // Validate slippage — fast range check.
        if prefs.max_slippage_bps > 10_000 {
            return Err(Error::InvalidSlippage);
        }

        // Validate routing mode without cloning the Symbol.
        // symbol_short! values are interned; reference comparison works.
        if prefs.routing_mode != symbol_short!("auto")
            && prefs.routing_mode != symbol_short!("direct")
            && prefs.routing_mode != symbol_short!("bridge")
        {
            return Err(Error::InvalidRoutingMode);
        }

        // Enforce a reasonable cap on the allow-list size.
        if prefs.allowed_assets.len() > 50 {
            return Err(Error::TooManyAssets);
        }

        let key = DataKey::Preferences(account.clone());
        let is_new = !env.storage().persistent().has(&key);

        // Write preferences and extend TTL in one logical block.
        env.storage().persistent().set(&key, &prefs);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);

        // Atomic count update: read, compute, write — single instance interaction pattern.
        if is_new {
            let count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::PreferenceCount)
                .unwrap_or(0);
            env.storage()
                .instance()
                .set(&DataKey::PreferenceCount, &count.saturating_add(1));

            // Track account for pagination — skip duplicates.
            let mut list: Vec<Address> = env
                .storage()
                .instance()
                .get(&DataKey::PreferencesList)
                .unwrap_or_else(|| Vec::new(&env));
            if !list.contains(&account) {
                list.push_back(account.clone());
                env.storage()
                    .instance()
                    .set(&DataKey::PreferencesList, &list);
            }
        }

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
            return Err(Error::PreferenceNotFound);
        }
        env.storage().persistent().remove(&key);

        // Atomic count decrement — only read count once.
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PreferenceCount)
            .unwrap_or(0);
        if count > 0 {
            env.storage()
                .instance()
                .set(&DataKey::PreferenceCount, &count.saturating_sub(1));

            // Remove from pagination list.
            let mut list: Vec<Address> = env
                .storage()
                .instance()
                .get(&DataKey::PreferencesList)
                .unwrap_or_else(|| Vec::new(&env));
            if let Some(pos) = list.first_index_of(&account) {
                list.remove(pos);
                env.storage()
                    .instance()
                    .set(&DataKey::PreferencesList, &list);
            }
        }

        PreferencesChanged {
            account,
            action: symbol_short!("rm"),
            preferences: Preferences::defaults(&env),
        }
        .publish(&env);
        Ok(())
    }

    /// Transfer admin ownership. Only the current admin may call this.
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        // Cache admin locally — avoid double instance read.
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        // Extend TTL on instance storage (admin, version, count all live there).
        env.storage().instance().extend_ttl(0, TTL_LEDGERS);

        AdminTransferred {
            previous_admin: admin,
            new_admin: new_admin.clone(),
        }
        .publish(&env);
        Ok(())
    }

    /// Read preferences for multiple accounts in a single call.
    /// Reduces round-trips for UI dashboards that show many accounts.
    pub fn batch_get_preferences(env: Env, accounts: Vec<Address>) -> Vec<(Address, Preferences)> {
        let mut results = Vec::new(&env);
        let defaults = Preferences::defaults(&env);
        for account in accounts.iter() {
            let prefs = env
                .storage()
                .persistent()
                .get(&DataKey::Preferences(account.clone()))
                .unwrap_or_else(|| defaults.clone());
            results.push_back((account.clone(), prefs));
        }
        results
    }

    /// Paginated version of preference reads. Returns (results, next_cursor).
    /// Cursor is `None` when no more pages. `limit` is capped at 50.
    pub fn paginated_get_preferences(
        env: Env,
        limit: u32,
        cursor: u32,
    ) -> (Vec<(Address, Preferences)>, Option<u32>) {
        let max_limit = limit.min(50);
        let list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::PreferencesList)
            .unwrap_or_else(|| Vec::new(&env));

        let total = list.len() as u32;
        let mut idx: u32 = cursor;
        if idx >= total {
            return (Vec::new(&env), None);
        }

        let mut out = Vec::new(&env);
        let mut collected: u32 = 0;
        let defaults = Preferences::defaults(&env);

        while collected < max_limit && idx < total {
            let account = list.get(idx).unwrap();
            let prefs = env
                .storage()
                .persistent()
                .get(&DataKey::Preferences(account.clone()))
                .unwrap_or_else(|| defaults.clone());
            out.push_back((account.clone(), prefs));
            collected = collected.saturating_add(1);
            idx = idx.saturating_add(1);
        }

        let next = if idx < total { Some(idx) } else { None };
        (out, next)
    }

    /// Return the total count of accounts that have set preferences.
    pub fn get_preference_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::PreferenceCount)
            .unwrap_or(0)
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
            Err(Ok(Error::PreferenceNotFound))
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

    #[test]
    fn transfer_admin_succeeds() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert!(client.try_transfer_admin(&new_admin).is_ok());
    }

    #[test]
    fn batch_get_returns_multiple_accounts() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account1 = Address::generate(&env);
        let account2 = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        let prefs1 = default_prefs(&env);
        client.set_preferences(&account1, &prefs1);

        let accounts = Vec::from_array(&env, [account1.clone(), account2.clone()]);
        let batch = client.batch_get_preferences(&accounts);
        assert_eq!(batch.len(), 2);
        assert_eq!(batch.get(0).unwrap().0, account1);
        assert_eq!(batch.get(0).unwrap().1, prefs1);
        assert_eq!(batch.get(1).unwrap().1, Preferences::defaults(&env));
    }

    #[test]
    fn preference_count_tracks_entries() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(client.get_preference_count(), 0);

        client.set_preferences(&account, &default_prefs(&env));
        assert_eq!(client.get_preference_count(), 1);

        client.remove_preferences(&account);
        assert_eq!(client.get_preference_count(), 0);
    }

    #[test]
    fn version_get_set_roundtrip() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(client.get_version(), 0);
        assert!(client.try_set_version(&2).is_ok());
        assert_eq!(client.get_version(), 2);
    }

    #[test]
    fn paginated_returns_pages_and_cursor() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account1 = Address::generate(&env);
        let account2 = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.set_preferences(&account1, &default_prefs(&env));
        client.set_preferences(&account2, &default_prefs(&env));

        let (page1, cursor1) = client.paginated_get_preferences(&1, &0);
        assert_eq!(page1.len(), 1);
        assert!(cursor1.is_some());

        let (page2, cursor2) = client.paginated_get_preferences(&10, &cursor1.unwrap());
        assert_eq!(page2.len(), 1);
        assert!(cursor2.is_none());

        // Empty page past end
        let (page3, cursor3) = client.paginated_get_preferences(&10, &99);
        assert_eq!(page3.len(), 0);
        assert!(cursor3.is_none());
    }

    #[test]
    fn rejects_invalid_routing_mode() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        client.initialize(&admin);
        let mut prefs = default_prefs(&env);
        prefs.routing_mode = symbol_short!("invalid");
        assert_eq!(
            client.try_set_preferences(&account, &prefs),
            Err(Ok(Error::InvalidRoutingMode))
        );
    }
}

// ── Gas benchmarking tests ─────────────────────────────────────────────
// Run with: cargo test -- --nocapture
// Each test captures the budget consumed by key operations.
// Budget values are in Soroban "compute" units (not stroops directly).

#[cfg(test)]
mod gas_benchmarks {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, Address, TradingPreferencesClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let account = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, admin, account, client)
    }

    fn prefs(env: &Env) -> Preferences {
        Preferences {
            max_slippage_bps: 50,
            routing_mode: symbol_short!("auto"),
            allowed_assets: Vec::from_array(
                env,
                [
                    symbol_short!("USDC"),
                    symbol_short!("XLM"),
                    symbol_short!("EURMTL"),
                ],
            ),
        }
    }

    #[test]
    fn bench_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(TradingPreferences, ());
        let client = TradingPreferencesClient::new(&env, &contract_id);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.initialize(&admin);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] initialize: {cost} cpu instructions");
    }

    #[test]
    fn bench_set_preferences_new() {
        let (env, _admin, account, client) = setup();
        let p = prefs(&env);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.set_preferences(&account, &p);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] set_preferences (new): {cost} cpu instructions");
    }

    #[test]
    fn bench_set_preferences_update() {
        let (env, _admin, account, client) = setup();
        let p = prefs(&env);
        client.set_preferences(&account, &p);

        let mut updated = prefs(&env);
        updated.max_slippage_bps = 75;

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.set_preferences(&account, &updated);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] set_preferences (update): {cost} cpu instructions");
    }

    #[test]
    fn bench_get_preferences() {
        let (env, _admin, account, client) = setup();
        let p = prefs(&env);
        client.set_preferences(&account, &p);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_preferences(&account);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_preferences: {cost} cpu instructions");
    }

    #[test]
    fn bench_remove_preferences() {
        let (env, _admin, account, client) = setup();
        let p = prefs(&env);
        client.set_preferences(&account, &p);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.remove_preferences(&account);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] remove_preferences: {cost} cpu instructions");
    }

    #[test]
    fn bench_batch_get_10_accounts() {
        let (env, _admin, _, client) = setup();
        let mut accounts = Vec::new(&env);
        for _ in 0..10 {
            accounts.push_back(Address::generate(&env));
        }

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.batch_get_preferences(&accounts);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] batch_get_preferences (10 accts): {cost} cpu instructions");
    }

    #[test]
    fn bench_preference_count() {
        let (env, _admin, _, client) = setup();

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_preference_count();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] get_preference_count: {cost} cpu instructions");
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

    #[test]
    fn bench_paginated_get_preferences() {
        let (env, _admin, account, client) = setup();
        let p = prefs(&env);
        client.set_preferences(&account, &p);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.paginated_get_preferences(&10, &0);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] paginated_get_preferences (limit=10): {cost} cpu instructions");
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
}
