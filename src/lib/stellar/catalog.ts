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

/** A single page of catalog entries plus the cursor for the next page. */
export interface AssetCatalogPage {
  assets: AssetCatalogEntry[];
  nextCursor: string | null;
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

function mapAssetRecord(r: Horizon.ServerApi.AssetRecord): AssetCatalogEntry {
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
}

/**
 * Fetch one page of the asset catalog, optionally filtered by code/issuer.
 * Returns the mapped entries plus a cursor for the next page, or null when
 * the last page has been reached.
 */
export async function fetchAssetCatalogPage(
  limit = 24,
  cursor?: string,
  code?: string,
  issuer?: string
): Promise<AssetCatalogPage> {
  const server = getHorizonServer();
  let builder = server.assets().limit(limit);

  if (cursor) builder = builder.cursor(cursor);
  if (code) builder = builder.forCode(code);
  if (issuer) builder = builder.forIssuer(issuer);

  const response = await builder.call();
  const records = response.records;

  return {
    assets: records.map(mapAssetRecord),
    nextCursor:
      records.length === limit ? (records[records.length - 1]?.paging_token ?? null) : null,
  };
}

/** Fetch the top assets on the network, optionally filtered by code/issuer. */
export async function fetchAssetCatalog(
  limit = 24,
  code?: string,
  issuer?: string
): Promise<AssetCatalogEntry[]> {
  const page = await fetchAssetCatalogPage(limit, undefined, code, issuer);
  return page.assets;
}
