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
