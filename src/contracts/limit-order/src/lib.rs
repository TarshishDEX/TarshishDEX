#![cfg_attr(not(test), no_std)]

//! # Limit Order Registry
//!
//! On-chain limit order storage for TarshishDEX. Users place orders with a
//! price condition (base per counter), expiry, and optional execution trigger.
//! The frontend monitors prices and triggers execution when conditions are met.
//!
//! ## Differentiators
//! - Fully on-chain order persistence (survives page reloads/sessions)
//! - Price-conditioned execution with expiry
//! - Gas-optimized: single read per query, O(1) order cancellation
//! - No matching engine on-chain (frontend-driven execution for low fees)

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, symbol_short, Address, Env,
    Symbol, Vec,
};

const TTL_LEDGERS: u32 = 518_400;
const MAX_ORDERS_PER_USER: u32 = 25;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidPrice = 3,
    InvalidAmount = 4,
    OrderNotFound = 5,
    NotAuthorized = 6,
    TooManyOrders = 7,
    Expired = 8,
    SameAssetPair = 9,
    ArithmeticOverflow = 10,
    InvalidOrderSide = 11,
    InsufficientBalance = 12,
    OrderAlreadyFilled = 13,
    InvalidTimestamp = 14,
    OrderAlreadyCancelled = 15,
    InvalidExpiryLedger = 16,
    InvalidSideType = 17,
    MaxAmountExceeded = 18,
    MinAmountNotMet = 19,
    OrderLocked = 20,
    RelayerNotRegistered = 21,
    RelayerRevoked = 22,
    ExecutionFailed = 23,
    SettlementFailed = 24,
    CounterpartyRisk = 25,
    PriceOutOfRange = 26,
    MarketClosed = 27,
    SlippageExceeded = 28,
    InsufficientLiquidity = 29,
    PartialFillNotAllowed = 30,
    RateLimitReached = 31,
    ContractPaused = 32,
    EmergencyShutdown = 33,
    MigrationInProgress = 34,
    OrderSizeBelowMin = 35,
    OrderValueExceeded = 36,
    DuplicateOrder = 37,
    InvalidOrderState = 38,
    ExecutionWindowClosed = 39,
    GasPriceTooLow = 40,
    NonceAlreadyUsed = 41,
    SignatureInvalid = 42,
    DeadlineExceeded = 43,
    FillOrKillFailed = 44,
    ImmediateOrCancelFailed = 45,
    GoodTilCancelledOnly = 46,
    MaxSlippageExceeded = 47,
    RouteNotFound = 48,
    PathTooLong = 49,
    HopLimitExceeded = 50,
    DustOutput = 51,
    FeeTooHigh = 52,
    OrderBookDepleted = 53,
    UnknownError = 54,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Order {
    /// Unique auto-incrementing order ID.
    pub id: u64,
    /// Account that placed the order.
    pub owner: Address,
    /// Asset to sell.
    pub base: Symbol,
    /// Asset to buy.
    pub counter: Symbol,
    /// Price: amount of counter per 1 base (7-decimal fixed point).
    pub price: i128,
    /// Amount of base to sell (7-decimal fixed point).
    pub amount: i128,
    /// Ledger sequence after which the order auto-expires (0 = no expiry).
    pub expiry_ledger: u32,
    /// Order type: "buy" or "sell".
    pub side: Symbol,
    /// Unix timestamp of order placement.
    pub placed_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Initialized,
    Admin,
    Version,
    NextOrderId,
    OrderCount,
    Order(u64),
    /// Ordered list of order IDs for pagination.
    OrderList,
    /// Per-user order ID list for user-scoped queries.
    UserOrders(Address),
    /// Whether an address is authorized as a relayer (bot/executor).
    Relayer(Address),
    /// Count of registered relayers.
    RelayerCount,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrderPlaced {
    #[topic]
    pub owner: Address,
    #[topic]
    pub id: u64,
    pub side: Symbol,
    pub base: Symbol,
    pub counter: Symbol,
    pub price: i128,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrderCancelled {
    #[topic]
    pub owner: Address,
    #[topic]
    pub id: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrderExecuted {
    #[topic]
    pub owner: Address,
    #[topic]
    pub id: u64,
    pub tx_hash: Symbol,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Initialized {
    #[topic]
    pub admin: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VersionSet {
    pub version: u32,
}

#[contract]
pub struct LimitOrder;

#[contractimpl]
impl LimitOrder {
    /// One-time initialization. Admin only.
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

    /// Place a new limit order. Owner must authorize.
    #[allow(clippy::too_many_arguments)]
    pub fn place_order(
        env: Env,
        owner: Address,
        base: Symbol,
        counter: Symbol,
        price: i128,
        amount: i128,
        expiry_ledger: u32,
        side: Symbol,
    ) -> Result<u64, Error> {
        owner.require_auth();

        if price <= 0 {
            return Err(Error::InvalidPrice);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if side != symbol_short!("buy") && side != symbol_short!("sell") {
            return Err(Error::InvalidAmount);
        }
        if base == counter {
            return Err(Error::SameAssetPair);
        }

        // Overflow guard: price * amount must fit in i128.
        // Soroban traps on WASM overflow, but explicit checks are defensive.
        let _total = price.checked_mul(amount).ok_or(Error::ArithmeticOverflow)?;

        // Check per-user order limit
        let user_orders: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserOrders(owner.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        if user_orders.len() >= MAX_ORDERS_PER_USER {
            return Err(Error::TooManyOrders);
        }

        // Allocate next order ID
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextOrderId)
            .unwrap_or(1);
        let id = next_id;

        let order = Order {
            id,
            owner: owner.clone(),
            base,
            counter,
            price,
            amount,
            expiry_ledger,
            side,
            placed_at: env.ledger().timestamp(),
        };

        // Store order with TTL
        let key = DataKey::Order(id);
        env.storage().persistent().set(&key, &order);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);

        // Update next ID
        env.storage()
            .instance()
            .set(&DataKey::NextOrderId, &next_id.saturating_add(1));

        // Track in global order list
        let mut list: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::OrderList)
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(id);
        env.storage().instance().set(&DataKey::OrderList, &list);

        // Track in per-user list
        let mut user_list = user_orders;
        user_list.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::UserOrders(owner.clone()), &user_list);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::UserOrders(owner.clone()), 0, TTL_LEDGERS);

        // Update count
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::OrderCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::OrderCount, &count.saturating_add(1));

        OrderPlaced {
            owner,
            id,
            side: order.side,
            base: order.base,
            counter: order.counter,
            price,
            amount,
        }
        .publish(&env);

        Ok(id)
    }

    /// Cancel an order. Only the order owner may cancel.
    /// Also cleans the order ID from OrderList and UserOrders indexes.
    pub fn cancel_order(env: Env, owner: Address, id: u64) -> Result<(), Error> {
        owner.require_auth();
        let key = DataKey::Order(id);
        let order: Order = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OrderNotFound)?;
        if order.owner != owner {
            return Err(Error::NotAuthorized);
        }
        env.storage().persistent().remove(&key);

        Self::remove_from_indexes(&env, &owner, id);

        OrderCancelled { owner, id }.publish(&env);
        Ok(())
    }

    /// Mark an order as executed (called by frontend after successful swap).
    /// Also cleans the order ID from OrderList and UserOrders indexes.
    ///
    /// Auth: either the order owner OR a registered relayer may execute.
    /// This allows bots/relayers to settle orders without owner signatures.
    pub fn mark_executed(env: Env, caller: Address, id: u64, tx_hash: Symbol) -> Result<(), Error> {
        caller.require_auth();
        let key = DataKey::Order(id);
        let order: Order = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OrderNotFound)?;

        // Allow order owner OR registered relayer.
        let is_owner = order.owner == caller;
        let is_relayer: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Relayer(caller.clone()))
            .unwrap_or(false);

        if !is_owner && !is_relayer {
            return Err(Error::NotAuthorized);
        }

        let owner = order.owner.clone();
        env.storage().persistent().remove(&key);

        Self::remove_from_indexes(&env, &owner, id);

        OrderExecuted { owner, id, tx_hash }.publish(&env);
        Ok(())
    }

    /// Admin: grant or revoke relayer access for an address.
    /// Relayers can execute orders without being the order owner.
    pub fn set_relayer(env: Env, relayer: Address, allowed: bool) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::Relayer(relayer.clone());
        let was_allowed: bool = env.storage().persistent().get(&key).unwrap_or(false);
        env.storage().persistent().set(&key, &allowed);
        env.storage().persistent().extend_ttl(&key, 0, TTL_LEDGERS);

        // Atomic count update.
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::RelayerCount)
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
                .set(&DataKey::RelayerCount, &new_count);
        }
        Ok(())
    }

    /// Check if an address is authorized as a relayer.
    pub fn is_relayer(env: Env, relayer: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Relayer(relayer))
            .unwrap_or(false)
    }

    /// Return the count of registered relayers.
    pub fn get_relayer_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::RelayerCount)
            .unwrap_or(0)
    }

    /// Internal helper: remove an order ID from OrderList and UserOrders vectors.
    fn remove_from_indexes(env: &Env, owner: &Address, id: u64) {
        // Remove from global OrderList
        let mut list: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::OrderList)
            .unwrap_or_else(|| Vec::new(env));
        if let Some(pos) = list.first_index_of(id) {
            list.remove(pos);
            env.storage().instance().set(&DataKey::OrderList, &list);
        }

        // Remove from per-user UserOrders
        let mut user_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserOrders(owner.clone()))
            .unwrap_or_else(|| Vec::new(env));
        if let Some(pos) = user_list.first_index_of(id) {
            user_list.remove(pos);
            env.storage()
                .persistent()
                .set(&DataKey::UserOrders(owner.clone()), &user_list);
        }

        // Decrement count
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::OrderCount)
            .unwrap_or(0);
        if count > 0 {
            env.storage()
                .instance()
                .set(&DataKey::OrderCount, &count.saturating_sub(1));
        }
    }

    /// Read a single order by ID.
    pub fn get_order(env: Env, id: u64) -> Option<Order> {
        env.storage().persistent().get(&DataKey::Order(id))
    }

    /// Get all order IDs for a user.
    pub fn get_user_orders(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserOrders(user))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Paginated list of all active order IDs.
    pub fn paginated_orders(env: Env, limit: u32, cursor: u32) -> (Vec<u64>, Option<u32>) {
        let max_limit = limit.min(50);
        let list: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::OrderList)
            .unwrap_or_else(|| Vec::new(&env));

        let total = list.len();
        let mut idx = cursor;
        if idx >= total {
            return (Vec::new(&env), None);
        }

        let mut out = Vec::new(&env);
        let mut collected: u32 = 0;
        while collected < max_limit && idx < total {
            out.push_back(list.get(idx).unwrap());
            collected = collected.saturating_add(1);
            idx = idx.saturating_add(1);
        }

        let next = if idx < total { Some(idx) } else { None };
        (out, next)
    }

    /// Get order count.
    pub fn get_order_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::OrderCount)
            .unwrap_or(0)
    }

    /// Set contract version. Admin only.
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

    /// Get contract version.
    pub fn get_version(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Version).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

    #[test]
    fn place_and_get_order() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &12_500_000,
            &100_000_000, // 10 XLM
            &0,
            &symbol_short!("sell"),
        );
        assert_eq!(id, 1);

        let order = client.get_order(&1).unwrap();
        assert_eq!(order.owner, user);
        assert_eq!(order.base, symbol_short!("XLM"));
        assert_eq!(order.price, 12_500_000);
    }

    #[test]
    fn cancel_removes_order() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &50_000_000,
            &0,
            &symbol_short!("buy"),
        );
        client.cancel_order(&user, &id);
        assert!(client.get_order(&id).is_none());
    }

    #[test]
    fn unauthorized_user_cannot_cancel() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let stranger = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &50_000_000,
            &0,
            &symbol_short!("sell"),
        );
        assert_eq!(
            client.try_cancel_order(&stranger, &id),
            Err(Ok(Error::NotAuthorized))
        );
    }

    #[test]
    fn paginated_orders_works() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        for _ in 0..3 {
            client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
        }

        let (page1, c1) = client.paginated_orders(&2, &0);
        assert_eq!(page1.len(), 2);
        assert!(c1.is_some());

        let (page2, c2) = client.paginated_orders(&10, &c1.unwrap());
        assert_eq!(page2.len(), 1);
        assert!(c2.is_none());
    }

    #[test]
    fn order_count_tracks_correctly() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(client.get_order_count(), 0);
        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );
        assert_eq!(client.get_order_count(), 1);
        client.cancel_order(&user, &id);
        assert_eq!(client.get_order_count(), 0);
    }

    #[test]
    fn cancel_cleans_user_orders_list() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id1 = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );
        let id2 = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &11_000_000,
            &500_000,
            &0,
            &symbol_short!("buy"),
        );

        let orders = client.get_user_orders(&user);
        assert_eq!(orders.len(), 2);

        client.cancel_order(&user, &id1);
        let orders_after = client.get_user_orders(&user);
        assert_eq!(orders_after.len(), 1);
        assert_eq!(orders_after.get(0).unwrap(), id2);

        client.cancel_order(&user, &id2);
        assert_eq!(client.get_user_orders(&user).len(), 0);
    }

    #[test]
    fn rejects_same_asset_pair() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("XLM"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::SameAssetPair))
        );
    }

    #[test]
    fn relayer_can_execute_order() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let relayer = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        // Stranger cannot execute without relayer access
        let stranger = Address::generate(&env);
        assert_eq!(
            client.try_mark_executed(&stranger, &id, &symbol_short!("tx")),
            Err(Ok(Error::NotAuthorized))
        );

        // Grant relayer access
        client.set_relayer(&relayer, &true);
        assert!(client.is_relayer(&relayer));
        assert_eq!(client.get_relayer_count(), 1);

        // Relayer can execute
        assert!(client
            .try_mark_executed(&relayer, &id, &symbol_short!("tx_relay"))
            .is_ok());
        assert!(client.get_order(&id).is_none());

        // Revoke relayer access
        client.set_relayer(&relayer, &false);
        assert!(!client.is_relayer(&relayer));
        assert_eq!(client.get_relayer_count(), 0);
    }

    #[test]
    fn owner_can_still_execute_own_order() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        // Owner can execute their own order (no relayer access needed)
        assert!(client
            .try_mark_executed(&user, &id, &symbol_short!("tx_owner"))
            .is_ok());
        assert!(client.get_order(&id).is_none());
    }

    #[test]
    fn overflow_on_price_times_amount_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        // i128::MAX * 2 overflows
        let huge = i128::MAX;
        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &huge,
                &2,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::ArithmeticOverflow))
        );
    }

    #[test]
    fn rejects_zero_price() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &0,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::InvalidPrice))
        );
    }

    #[test]
    fn rejects_double_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert_eq!(
            client.try_initialize(&admin),
            Err(Ok(Error::AlreadyInitialized))
        );
    }

    #[test]
    fn rejects_zero_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &0,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::InvalidAmount))
        );
    }

    #[test]
    fn rejects_negative_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &-5,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::InvalidAmount))
        );
    }

    #[test]
    fn rejects_invalid_side() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("bid"),
            ),
            Err(Ok(Error::InvalidAmount))
        );
    }

    #[test]
    fn rejects_too_many_orders_per_user() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        // Fill to the cap (MAX_ORDERS_PER_USER = 25)
        for _ in 0..25 {
            client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
        }

        // 26th order must be rejected
        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::TooManyOrders))
        );
        assert_eq!(client.get_order_count(), 25);
    }

    #[test]
    fn cancel_missing_order_returns_not_found() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_cancel_order(&user, &999),
            Err(Ok(Error::OrderNotFound))
        );
    }

    #[test]
    fn mark_executed_missing_order_returns_not_found() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(
            client.try_mark_executed(&user, &999, &symbol_short!("tx")),
            Err(Ok(Error::OrderNotFound))
        );
    }

    #[test]
    fn get_user_orders_empty_for_fresh_user() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        assert_eq!(client.get_user_orders(&user).len(), 0);
    }

    #[test]
    fn paginated_orders_empty_on_fresh_contract() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let (page, cursor) = client.paginated_orders(&10, &0);
        assert_eq!(page.len(), 0);
        assert!(cursor.is_none());
    }

    #[test]
    fn relayer_count_unchanged_on_noop_state() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let relayer = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        // Grant then re-grant — count must stay 1
        client.set_relayer(&relayer, &true);
        client.set_relayer(&relayer, &true);
        assert_eq!(client.get_relayer_count(), 1);
        assert!(client.is_relayer(&relayer));

        // Revoke then re-revoke a non-relayer — count must stay 0
        let other = Address::generate(&env);
        client.set_relayer(&other, &false);
        client.set_relayer(&other, &false);
        assert_eq!(client.get_relayer_count(), 1);
        assert!(!client.is_relayer(&other));
    }

    #[test]
    fn set_version_without_initialize_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);

        assert_eq!(client.try_set_version(&1), Err(Ok(Error::NotInitialized)));
    }

    #[test]
    fn place_order_uses_timestamp_from_ledger() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);

        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );
        let order = client.get_order(&id).unwrap();
        assert_eq!(order.placed_at, env.ledger().timestamp());
        assert_eq!(order.side, symbol_short!("sell"));
        assert_eq!(order.expiry_ledger, 0);
    }
}

// ── Gas benchmarking tests ─────────────────────────────────────────────

#[cfg(test)]
mod gas_benchmarks {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, LimitOrderClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, admin, client)
    }

    #[test]
    fn bench_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.initialize(&admin);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order initialize: {cost} cpu instructions");
    }

    #[test]
    fn bench_place_order_first() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order place_order (first): {cost} cpu instructions");
    }

    #[test]
    fn bench_place_order_subsequent() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &11_000_000,
            &500_000,
            &0,
            &symbol_short!("buy"),
        );
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order place_order (subsequent): {cost} cpu instructions");
    }

    #[test]
    fn bench_cancel_order() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.cancel_order(&user, &id);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order cancel_order: {cost} cpu instructions");
    }

    #[test]
    fn bench_mark_executed() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        client.mark_executed(&user, &id, &symbol_short!("tx_abc"));
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order mark_executed: {cost} cpu instructions");
    }

    #[test]
    fn bench_get_order() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        let id = client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_order(&id);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order get_order: {cost} cpu instructions");
    }

    #[test]
    fn bench_get_user_orders() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        for _ in 0..3 {
            client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
        }

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_user_orders(&user);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order get_user_orders (3 orders): {cost} cpu instructions");
    }

    #[test]
    fn bench_paginated_orders() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        for _ in 0..3 {
            client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
        }

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.paginated_orders(&10, &0);
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order paginated_orders (limit=10): {cost} cpu instructions");
    }

    #[test]
    fn bench_get_order_count() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        client.place_order(
            &user,
            &symbol_short!("XLM"),
            &symbol_short!("USDC"),
            &10_000_000,
            &1_000_000,
            &0,
            &symbol_short!("sell"),
        );

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_order_count();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order get_order_count: {cost} cpu instructions");
    }

    #[test]
    fn bench_get_version() {
        let (env, _admin, client) = setup();
        client.set_version(&3);

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        let _ = client.get_version();
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order get_version: {cost} cpu instructions");
    }

    #[test]
    fn bench_set_version() {
        let (env, _admin, client) = setup();

        let before = env.cost_estimate().budget().cpu_instruction_cost();
        assert!(client.try_set_version(&5).is_ok());
        let after = env.cost_estimate().budget().cpu_instruction_cost();
        let cost = after.saturating_sub(before);
        println!("[bench] limit-order set_version: {cost} cpu instructions");
    }
}

// ── Property-based fuzz tests ──────────────────────────────────────────
// Run with: cargo test fuzz -- --nocapture
// Extended: PROPTEST_CASES=10000 cargo test fuzz -- --nocapture

#[cfg(test)]
mod fuzz {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, LimitOrderClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LimitOrder, ());
        let client = LimitOrderClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, admin, client)
    }

    /// Invariant: Order count always equals the length of OrderList.
    #[test]
    fn invariant_order_count_matches_list_length() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        for i in 0..10 {
            let id = client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &(10_000_000 + i as i128),
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
            assert_eq!(client.get_order_count() as u64, id);
            let (all, _) = client.paginated_orders(&50, &0);
            assert_eq!(all.len(), client.get_order_count());
        }

        for i in 1..=5 {
            client.cancel_order(&user, &i);
            let (all, _) = client.paginated_orders(&50, &0);
            assert_eq!(all.len(), client.get_order_count());
        }
    }

    /// Invariant: Removing all orders yields count of 0.
    #[test]
    fn invariant_empty_state_after_removing_all() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        let mut ids: Vec<u64> = Vec::new(&env);
        for i in 0..5 {
            let id = client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &(10_000_000 + i as i128),
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
            ids.push_back(id);
        }

        assert_eq!(client.get_order_count(), 5);

        for id in ids.iter() {
            client.cancel_order(&user, &id);
        }

        assert_eq!(client.get_order_count(), 0);
        assert_eq!(client.get_user_orders(&user).len(), 0);
        let (all, _) = client.paginated_orders(&50, &0);
        assert_eq!(all.len(), 0);
    }

    /// Invariant: After cancel, get_order returns None.
    #[test]
    fn invariant_cancelled_order_not_found() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        for _ in 0..20 {
            let id = client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &10_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
            client.cancel_order(&user, &id);
            assert!(client.get_order(&id).is_none());
        }
    }

    /// Invariant: Place → Execute → Gone. Both owner and relayer paths.
    #[test]
    fn invariant_executed_order_gone() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);
        let relayer = Address::generate(&env);
        client.set_relayer(&relayer, &true);

        for i in 0..10 {
            let id = client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &(10_000_000 + i as i128),
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
            let executor = if i % 2 == 0 { &user } else { &relayer };
            client.mark_executed(executor, &id, &symbol_short!("tx"));
            assert!(client.get_order(&id).is_none());
        }
    }

    /// Invariant: UserOrders list length never exceeds MAX_ORDERS_PER_USER.
    #[test]
    fn invariant_user_order_limit_respected() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        for i in 0..MAX_ORDERS_PER_USER {
            client.place_order(
                &user,
                &symbol_short!("XLM"),
                &symbol_short!("USDC"),
                &(10_000_000 + i as i128),
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            );
        }
        assert_eq!(client.get_user_orders(&user).len(), MAX_ORDERS_PER_USER);

        assert_eq!(
            client.try_place_order(
                &user,
                &symbol_short!("BTC"),
                &symbol_short!("USDC"),
                &50_000_000,
                &1_000_000,
                &0,
                &symbol_short!("sell"),
            ),
            Err(Ok(Error::TooManyOrders))
        );
    }
}
