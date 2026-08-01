import { Horizon } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";

let server: Horizon.Server | null = null;

/** Lazily-created Horizon client for the active network. */
export function getHorizonServer(): Horizon.Server {
  if (!server) {
    server = new Horizon.Server(getActiveNetwork().horizonUrl, {
      allowHttp: process.env.NODE_ENV !== "production",
    });
  }
  return server;
}

/** Convenience: create a fresh Horizon client (useful for tests). */
export function createHorizonServer(url: string): Horizon.Server {
  return new Horizon.Server(url, { allowHttp: true });
}
