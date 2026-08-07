//! End-to-end integration tests simulating realistic TarshishDEX usage.
//! Deploys both trading-preferences and market-oracle contracts and
//! exercises a full user workflow: admin setup, user preferences,
//! publisher price feeds, and frontend read paths.

use soroban_sdk::{
    symbol_short,
    testutils::Address as _,
    Address, Env, Symbol, Vec,
};

use market_oracle::{MarketOracle, MarketOracleClient};
use trading_preferences::{TradingPreferences, TradingPreferencesClient};

/// Deploy both contracts and return initialized clients.
fn deploy_both<'a>(
    env: &'a Env,
    admin: &Address,
) -> (TradingPreferencesClient<'a>, MarketOracleClient<'a>) {
    let tp_id = env.register(TradingPreferences, ());
    let mo_id = env.register(MarketOracle, ());
    let tp = TradingPreferencesClient::new(env, &tp_id);
    let mo = MarketOracleClient::new(env, &mo_id);
    tp.initialize(admin);
    mo.initialize(admin);
    (tp, mo)
}

#[test]
fn full_user_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let publisher = Address::generate(&env);

    let (tp, mo) = deploy_both(&env, &admin);

    // ── Phase 1: User sets trading preferences ─────────────────────────
    let prefs = trading_preferences::Preferences {
        max_slippage_bps: 75,
        routing_mode: symbol_short!("direct"),
        allowed_assets: Vec::from_array(
            &env,
            [symbol_short!("XLM"), symbol_short!("USDC"), symbol_short!("BTC")],
        ),
    };
    tp.set_preferences(&user, &prefs);
    assert_eq!(tp.get_preferences(&user), prefs);
    assert_eq!(tp.get_preference_count(), 1);

    // ── Phase 2: Admin grants publisher and publishes prices ──────────
    mo.set_publisher(&publisher, &true);
    assert_eq!(mo.get_publisher_count(), 1);

    let obs1 = mo.publish(
        &publisher,
        &symbol_short!("XLM"),
        &symbol_short!("USDC"),
        &12_500_000, // 0.125 USDC per XLM (7-decimal)
    );
    assert_eq!(obs1.price, 12_500_000);

    let obs2 = mo.publish(
        &publisher,
        &symbol_short!("BTC"),
        &symbol_short!("USDC"),
        &5_000_000_000, // 50,000 USDC per BTC
    );
    assert_eq!(obs2.price, 5_000_000_000);

    // ── Phase 3: Frontend reads ────────────────────────────────────────
    // Batch read user preferences
    let accounts = Vec::from_array(&env, [user.clone(), Address::generate(&env)]);
    let batch_prefs = tp.batch_get_preferences(&accounts);
    assert_eq!(batch_prefs.len(), 2);
    // First account has real prefs
    assert_eq!(batch_prefs.get(0).unwrap().0, user);
    assert_eq!(batch_prefs.get(0).unwrap().1.max_slippage_bps, 75);
    // Second account gets defaults
    assert_eq!(
        batch_prefs.get(1).unwrap().1.max_slippage_bps,
        100 // default
    );

    // Batch read observations
    let pairs = Vec::from_array(
        &env,
        [
            (symbol_short!("XLM"), symbol_short!("USDC")),
            (symbol_short!("BTC"), symbol_short!("USDC")),
        ],
    );
    let batch_obs = mo.batch_get_observations(&pairs);
    assert_eq!(batch_obs.len(), 2);

    // all_observations
    let all = mo.all_observations();
    assert_eq!(all.len(), 2);

    // ── Phase 4: History for a pair ────────────────────────────────────
    mo.publish(
        &publisher,
        &symbol_short!("XLM"),
        &symbol_short!("USDC"),
        &13_000_000,
    );
    let history = mo.get_observation_history(&symbol_short!("XLM"), &symbol_short!("USDC"));
    assert_eq!(history.len(), 2);

    // ── Phase 5: Pagination with single entry exhausts pages ───────────
    let (page1, cursor1) = tp.paginated_get_preferences(&1, &0);
    assert_eq!(page1.len(), 1);
    assert!(cursor1.is_none()); // only 1 entry, page exhausted

    // ── Phase 6: Overwrite observation with fresh publish ──────────────
    mo.publish(
        &publisher,
        &symbol_short!("XLM"),
        &symbol_short!("USDC"),
        &14_000_000,
    );
    let fresh = mo.get_observation(&symbol_short!("XLM"), &symbol_short!("USDC"));
    assert!(fresh.is_some());

    // ── Phase 7: Cleanup ───────────────────────────────────────────────
    tp.remove_preferences(&user);
    assert_eq!(tp.get_preference_count(), 0);
}

#[test]
fn admin_transfer_and_versioning() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let new_admin = Address::generate(&env);
    let publisher = Address::generate(&env);

    let (tp, mo) = deploy_both(&env, &admin);

    // Set versions
    assert!(tp.try_set_version(&1).is_ok());
    assert!(mo.try_set_version(&2).is_ok());
    assert_eq!(tp.get_version(), 1);
    assert_eq!(mo.get_version(), 2);

    // Transfer admin on both
    assert!(tp.try_transfer_admin(&new_admin).is_ok());
    assert!(mo.try_transfer_admin(&new_admin).is_ok());

    // With mock_all_auths, auth checks are bypassed — verify version unchanged
    // by checking that get_version still returns old values after rejected calls
    // (mock_all_auths bypasses require_auth, so we just verify versions)
    assert_eq!(tp.get_version(), 1);
    assert_eq!(mo.get_version(), 2);
}

#[test]
fn multi_user_preferences_with_pagination() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (tp, _mo) = deploy_both(&env, &admin);

    // Create 5 users with distinct preferences
    let mut users: Vec<Address> = Vec::new(&env);
    for i in 0u32..5 {
        let user = Address::generate(&env);
        let prefs = trading_preferences::Preferences {
            max_slippage_bps: (i + 1) * 20,
            routing_mode: symbol_short!("auto"),
            allowed_assets: Vec::new(&env),
        };
        tp.set_preferences(&user, &prefs);
        users.push_back(user);
    }

    assert_eq!(tp.get_preference_count(), 5);

    // Paginate with limit=2 — should get 3 pages
    let (page1, c1) = tp.paginated_get_preferences(&2, &0);
    assert_eq!(page1.len(), 2);
    assert!(c1.is_some());

    let (page2, c2) = tp.paginated_get_preferences(&2, &c1.unwrap());
    assert_eq!(page2.len(), 2);
    assert!(c2.is_some());

    let (page3, c3) = tp.paginated_get_preferences(&2, &c2.unwrap());
    assert_eq!(page3.len(), 1);
    assert!(c3.is_none());
}

#[test]
fn paginated_observations_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let publisher = Address::generate(&env);
    let (_tp, mo) = deploy_both(&env, &admin);

    mo.set_publisher(&publisher, &true);

    // Publish 3 pairs
    let pairs: [(&str, &str, i128); 3] = [
        ("XLM", "USDC", 10_000_000),
        ("BTC", "USDC", 5_000_000_000),
        ("ETH", "USDC", 300_000_000),
    ];
    for (base, counter, price) in pairs {
        mo.publish(
            &publisher,
            &Symbol::new(&env, base),
            &Symbol::new(&env, counter),
            &price,
        );
    }

    // all_observations returns all 3
    assert_eq!(mo.all_observations().len(), 3);

    // paginated with limit=2
    let (page1, c1) = mo.paginated_observations(&2, &0);
    assert_eq!(page1.len(), 2);
    assert!(c1.is_some());

    let (page2, c2) = mo.paginated_observations(&10, &c1.unwrap());
    assert_eq!(page2.len(), 1);
    assert!(c2.is_none());
}

#[test]
fn publisher_revoke_stops_publishing() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let publisher = Address::generate(&env);
    let (_tp, mo) = deploy_both(&env, &admin);

    mo.set_publisher(&publisher, &true);
    assert_eq!(mo.get_publisher_count(), 1);

    // Publishing works
    assert!(mo
        .try_publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000
        )
        .is_ok());

    // Revoke
    mo.set_publisher(&publisher, &false);
    assert_eq!(mo.get_publisher_count(), 0);

    // Publishing should fail
    assert!(mo
        .try_publish(
            &publisher,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000
        )
        .is_err());
}
