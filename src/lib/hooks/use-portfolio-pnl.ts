"use client";

import { useMemo } from "react";
import type { AccountBalance } from "@/lib/stellar/account";

interface CostBasis {
  [assetKey: string]: { totalCostXlm: number; totalAmount: number };
}

const STORAGE_KEY = "tarshishdex-cost-basis";

/**
 * Track P&L (profit and loss) for a portfolio against user-entered cost basis.
 * Cost basis is stored in localStorage per asset key (CODE:ISSUER).
 * Each asset's P&L = currentValueXlm - costBasis * currentAmount.
 */
export function usePortfolioPnL(balances: AccountBalance[]) {
  const costBasis = useMemo<CostBasis>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      return {};
    }
  }, []);

  const pnlByAsset = useMemo(() => {
    return balances.map((b) => {
      const key = b.token.issuer ? `${b.token.code}:${b.token.issuer}` : b.token.code;
      const cost = costBasis[key];
      const currentValue = b.valueInXlm ?? 0;
      const pnl = cost ? currentValue - (cost.totalCostXlm / cost.totalAmount) * b.balance : null;
      return { token: b.token, currentValue, pnl, costBasis: cost ?? null };
    });
  }, [balances, costBasis]);

  const totalPnl = pnlByAsset.reduce((sum, entry) => sum + (entry.pnl ?? 0), 0);

  function setCostBasis(
    code: string,
    issuer: string | undefined,
    totalCostXlm: number,
    totalAmount: number
  ) {
    const key = issuer ? `${code}:${issuer}` : code;
    const updated = { ...costBasis, [key]: { totalCostXlm, totalAmount } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return { pnlByAsset, totalPnl, setCostBasis };
}
