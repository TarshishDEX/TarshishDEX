import { Asset } from "@stellar/stellar-sdk";
import type { StellarAsset } from "@/lib/stellar/types";

/** Convert a StellarAsset to the SDK Asset class. */
export function toSdkAsset(asset: StellarAsset): Asset {
  if (asset.isNative || (asset.code === "XLM" && !asset.issuer)) {
    return Asset.native();
  }
  if (!asset.issuer) {
    throw new Error(`Asset ${asset.code} is missing an issuer`);
  }
  return new Asset(asset.code, asset.issuer);
}

/** Convert an SDK Asset to our StellarAsset shape. */
export function fromSdkAsset(asset: Asset): StellarAsset {
  if (asset.isNative()) {
    return { code: "XLM", isNative: true };
  }
  return { code: asset.getCode(), issuer: asset.getIssuer() };
}

/** Canonical string form: "XLM" or "CODE:ISSUER". */
export function assetToString(asset: StellarAsset): string {
  if (asset.isNative || (asset.code === "XLM" && !asset.issuer)) return "XLM";
  return `${asset.code}:${asset.issuer}`;
}

/** Parse "CODE:ISSUER" or "XLM" into a StellarAsset, or null if invalid. */
export function parseAssetString(input: string): StellarAsset | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") {
    return { code: "XLM", isNative: true };
  }

  const parts = trimmed.split(":");
  if (parts.length !== 2) return null;
  const [code, issuer] = parts;
  if (!code || code.length < 1 || code.length > 12 || !/^[a-zA-Z0-9]+$/.test(code)) {
    return null;
  }
  if (!issuer || !/^G[A-Z2-7]{55}$/.test(issuer)) {
    return null;
  }
  return { code: code.toUpperCase(), issuer };
}

/** Structural equality between two assets. */
export function isSameAsset(a: StellarAsset, b: StellarAsset): boolean {
  return assetToString(a) === assetToString(b);
}

/** Convert a Horizon path/asset record (asset_code/asset_issuer/asset_type) to StellarAsset. */
export function fromHorizonAssetRecord(record: {
  asset_code?: string;
  asset_issuer?: string;
  asset_type: string;
}): StellarAsset {
  if (record.asset_type === "native") {
    return { code: "XLM", isNative: true };
  }
  return { code: record.asset_code ?? "XLM", issuer: record.asset_issuer };
}
