import type { Horizon } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { toToken } from "@/lib/stellar/tokens";
import type { Token } from "@/lib/stellar/types";

/** A discovered asset with market metadata from Horizon's /assets endpoint. */
export interface AssetCatalogEntry {
  token: Token;
  supply: number;
  accounts: number;
  trustlines: number;
  flags: {
    authRequired: boolean;
    authRevocable: boolean;
    authImmutable: boolean;
  };
}

/** Asset account/balance shapes derived from the SDK's exported AssetRecord. */
type AssetAccounts = Horizon.ServerApi.AssetRecord["accounts"];
type AssetBalances = Horizon.ServerApi.AssetRecord["balances"];

function sumAccounts(accounts: AssetAccounts): number {
  return accounts.authorized + accounts.authorized_to_maintain_liabilities + accounts.unauthorized;
}

function sumBalances(balances: AssetBalances): number {
  return (
    Number(balances.authorized) +
    Number(balances.authorized_to_maintain_liabilities) +
    Number(balances.unauthorized)
  );
}

/** Fetch the top assets on the network, optionally filtered by code/issuer. */
export async function fetchAssetCatalog(
  limit = 24,
  code?: string,
  issuer?: string
): Promise<AssetCatalogEntry[]> {
  const server = getHorizonServer();
  let builder = server.assets().limit(limit);

  if (code) builder = builder.forCode(code);
  if (issuer) builder = builder.forIssuer(issuer);

  const response = await builder.call();

  return response.records.map((r) => {
    const accounts = sumAccounts(r.accounts);
    return {
      token: toToken(r.asset_code, r.asset_issuer),
      supply: sumBalances(r.balances),
      accounts,
      trustlines: accounts + r.num_claimable_balances + r.num_liquidity_pools,
      flags: {
        authRequired: r.flags.auth_required,
        authRevocable: r.flags.auth_revocable,
        authImmutable: r.flags.auth_immutable,
      },
    };
  });
}
