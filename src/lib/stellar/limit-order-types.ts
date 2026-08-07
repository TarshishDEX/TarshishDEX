import type { StellarAsset } from "@/lib/stellar/types";

/** Mirror of the on-chain Order struct. */
export interface LimitOrder {
  id: number;
  owner: string;
  base: string;
  counter: string;
  /** Price: amount of counter per 1 base (7-decimal fixed point). */
  price: number;
  /** Amount of base to trade (7-decimal fixed point). */
  amount: number;
  /** Ledger after which the order expires (0 = no expiry). */
  expiryLedger: number;
  side: "buy" | "sell";
  placedAt: number;
}

/** Input for placing a new limit order. */
export interface PlaceOrderInput {
  base: StellarAsset;
  counter: StellarAsset;
  price: number;
  amount: number;
  /** Ledger sequence for expiry, or 0 for no expiry. */
  expiryLedger: number;
  side: "buy" | "sell";
}

/** Paginated response from the limit order contract. */
export interface PaginatedOrders {
  orderIds: number[];
  nextCursor: number | null;
}
