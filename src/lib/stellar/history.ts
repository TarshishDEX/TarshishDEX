import { getHorizonServer } from "@/lib/stellar/horizon";
import { fromHorizonAssetRecord } from "@/lib/stellar/asset";
import type { StellarAsset } from "@/lib/stellar/types";

export type TradeType = "swap" | "offer" | "trustline";

/** A normalized trade-history entry for a Stellar account. */
export interface TradeHistoryEntry {
  id: string;
  type: TradeType;
  status: "successful";
  createdAt: string;
  source: string;
  /** Human description, e.g. "10.5 XLM → 3.2 USDC" */
  summary: string;
  fromAsset: StellarAsset;
  toAsset: StellarAsset;
  amount: string;
  path?: StellarAsset[];
  hash?: string;
  ledger: number;
}

/** One page of trade history plus the cursor for the next page. */
export interface TradeHistoryPage {
  entries: TradeHistoryEntry[];
  /** Horizon paging token to continue from, or null when exhausted. */
  nextCursor: string | null;
}

/**
 * Fetch a page of trade-relevant operations for an account.
 *
 * Pass the `nextCursor` from the previous page to advance; a `null`
 * `nextCursor` means there are no more records. A page is considered
 * exhausted when Horizon returns fewer records than the requested limit.
 */
export async function fetchTradeHistoryPage(
  address: string,
  limit = 40,
  cursor?: string
): Promise<TradeHistoryPage> {
  const server = getHorizonServer();
  let request = server.operations().forAccount(address).order("desc").limit(limit);
  if (cursor) request = request.cursor(cursor);
  const response = await request.call();

  const entries: TradeHistoryEntry[] = [];

  for (const op of response.records) {
    const entry = normalizeOperation(op);
    if (entry) entries.push(entry);
  }

  const lastRecord = response.records[response.records.length - 1];
  const nextCursor =
    lastRecord && response.records.length >= limit ? lastRecord.paging_token : null;

  return { entries, nextCursor };
}

/** Fetch the most recent trade-relevant operations for an account (single page). */
export async function fetchTradeHistory(address: string, limit = 40): Promise<TradeHistoryEntry[]> {
  const { entries } = await fetchTradeHistoryPage(address, limit);
  return entries;
}

/**
 * Normalize a raw Horizon operation record into a display-oriented
 * `TradeHistoryEntry`. Handles payments, path payments, and managed offers;
 * returns `null` for operation types that are not trade-relevant.
 *
 * The Horizon record is deliberately typed as `any` — the operation payload
 * shape varies widely by type and is not worth modelling exhaustively.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeOperation(op: any): TradeHistoryEntry | null {
  const base = {
    id: op.id,
    source: op.source_account ?? op.account ?? "",
    createdAt: op.created_at ?? "",
    ledger: op.ledger ?? 0,
  };

  switch (op.type) {
    case "path_payment":
    case "path_payment_strict_send":
    case "path_payment_strict_receive":
      return {
        ...base,
        type: "swap",
        status: "successful",
        summary: formatSwapSummary(op),
        fromAsset: fromHorizonAssetRecord({
          asset_type: op.source_asset_type,
          asset_code: op.source_asset_code,
          asset_issuer: op.source_asset_issuer,
        }),
        toAsset: fromHorizonAssetRecord({
          asset_type: op.asset_type,
          asset_code: op.asset_code,
          asset_issuer: op.asset_issuer,
        }),
        amount: op.amount ?? "",
        path: (op.path ?? []).map(
          (p: { asset_type: string; asset_code?: string; asset_issuer?: string }) =>
            fromHorizonAssetRecord(p)
        ),
        hash: op.transaction_hash,
      };
    case "manage_buy_offer":
    case "manage_sell_offer":
      return {
        ...base,
        type: "offer",
        status: "successful",
        summary: `${op.amount ?? "—"} ${op.selling?.asset_code ?? "XLM"} → offer`,
        fromAsset: fromHorizonAssetRecord(op.selling ?? { asset_type: "native" }),
        toAsset: fromHorizonAssetRecord(op.buying ?? { asset_type: "native" }),
        amount: op.amount ?? "",
        hash: op.transaction_hash,
      };
    case "create_account":
      return {
        ...base,
        type: "trustline",
        status: "successful",
        summary: `Account created · starting balance ${op.starting_balance ?? "—"} XLM`,
        fromAsset: { code: "XLM", isNative: true },
        toAsset: { code: "XLM", isNative: true },
        amount: op.starting_balance ?? "",
        hash: op.transaction_hash,
      };
    default:
      return null;
  }
}

/**
 * Build a compact "{amount} {code} → {amount} {code}" summary of a swap
 * operation for list rows and notifications. Unknown asset types fall back
 * to `XLM` for native or `?` when the code is missing.
 */
export function formatSwapSummary(op: {
  source_amount?: string;
  source_asset_code?: string;
  source_asset_type?: string;
  amount?: string;
  asset_code?: string;
  asset_type?: string;
}): string {
  const fromCode = op.source_asset_code ?? (op.source_asset_type === "native" ? "XLM" : "?");
  const toCode = op.asset_code ?? (op.asset_type === "native" ? "XLM" : "?");
  return `${op.source_amount ?? "—"} ${fromCode} → ${op.amount ?? "—"} ${toCode}`;
}
