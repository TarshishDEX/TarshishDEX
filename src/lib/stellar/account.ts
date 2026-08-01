import { getHorizonServer } from "@/lib/stellar/horizon";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { toToken } from "@/lib/stellar/tokens";
import type { Token } from "@/lib/stellar/types";

/** A single balance on a Stellar account. */
export interface AccountBalance {
  token: Token;
  balance: number;
  trustline: boolean;
  valueInXlm: number | null;
}

/** Portfolio summary for an account. */
export interface PortfolioSummary {
  address: string;
  totalValueXlm: number;
  balances: AccountBalance[];
  assetCount: number;
}

const XLM_TOKEN: Token = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };

/**
 * Fetch the full balance set for a Stellar account and value each
 * balance against XLM using live orderbook mid prices.
 */
export async function fetchPortfolioSummary(address: string): Promise<PortfolioSummary> {
  const server = getHorizonServer();
  const account = await server.accounts().accountId(address).call();

  const balances: AccountBalance[] = [];

  for (const record of account.balances) {
    // Liquidity pool share balances are not tradeable tokens — skip them
    if (record.asset_type === "liquidity_pool_shares") continue;

    const token =
      record.asset_type === "native" ? XLM_TOKEN : toToken(record.asset_code, record.asset_issuer);
    const trustline = record.asset_type !== "native";

    const balance = Number(record.balance);
    if (balance <= 0) continue;

    let valueInXlm: number | null = null;
    if (token.isNative) {
      valueInXlm = balance;
    } else {
      try {
        const ob = await fetchOrderbook(token, XLM_TOKEN, 5);
        valueInXlm = ob.midPrice !== null ? balance * ob.midPrice : null;
      } catch {
        valueInXlm = null;
      }
    }

    balances.push({ token, balance, trustline, valueInXlm });
  }

  const totalValueXlm = balances.reduce((sum, b) => sum + (b.valueInXlm ?? 0), 0);

  return {
    address,
    totalValueXlm,
    balances: balances.sort((a, b) => (b.valueInXlm ?? 0) - (a.valueInXlm ?? 0)),
    assetCount: balances.length,
  };
}

/** Parse a Stellar address, returning true if it looks valid. */
export function isValidPublicKey(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address.trim());
}
