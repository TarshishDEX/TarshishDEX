import { useQuery } from "@tanstack/react-query";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { isValidPublicKey } from "@/lib/stellar/account";
import { assetToString } from "@/lib/stellar/asset";
import type { StellarAsset } from "@/lib/stellar/types";

/**
 * Fetch the balance of a specific asset on a Stellar account.
 * Returns the raw balance string or null if the asset isn't held.
 */
async function fetchTokenBalance(address: string, asset: StellarAsset): Promise<string | null> {
  const server = getHorizonServer();
  const account = await server.accounts().accountId(address).call();

  for (const record of account.balances) {
    if (record.asset_type === "liquidity_pool_shares") continue;

    if (asset.isNative || (asset.code === "XLM" && !asset.issuer)) {
      if (record.asset_type === "native") return record.balance;
    } else {
      if (
        record.asset_type !== "native" &&
        record.asset_code === asset.code &&
        record.asset_issuer === asset.issuer
      ) {
        return record.balance;
      }
    }
  }
  return null;
}

export function useTokenBalance(address: string, asset: StellarAsset | null) {
  return useQuery({
    queryKey: ["token-balance", address, asset ? assetToString(asset) : ""],
    queryFn: () => {
      if (!asset || !address || !isValidPublicKey(address)) return null;
      return fetchTokenBalance(address, asset);
    },
    enabled: Boolean(address && asset && isValidPublicKey(address)),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}
