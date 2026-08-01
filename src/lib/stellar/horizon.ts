import { Horizon } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";

let server: Horizon.Server | null = null;

/**
 * Resolve the Horizon URL for the active network, honouring an optional
 * server-side `HORIZON_URL` override. Invalid overrides fall back to the
 * network default rather than failing at request time.
 */
export function getHorizonUrl(): string {
  const override = process.env.HORIZON_URL;
  if (override) {
    const trimmed = override.trim().replace(/\/+$/, "");
    if (/^https?:\/\//.test(trimmed)) return trimmed;
  }
  return getActiveNetwork().horizonUrl;
}

/** Lazily-created Horizon client for the active network. */
export function getHorizonServer(): Horizon.Server {
  if (!server) {
    server = new Horizon.Server(getHorizonUrl(), {
      allowHttp: process.env.NODE_ENV !== "production",
    });
  }
  return server;
}
