import { describe, it, expect, afterEach } from "vitest";
import {
  getTradingPreferencesContractId,
  getMarketOracleContractId,
  getLimitOrderContractId,
  getSorobanRpcServer,
} from "@/lib/soroban/config";

describe("Soroban config", () => {
  afterEach(() => {
    // Clear the cached RPC server between tests
    delete (process.env as Record<string, string>).NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID;
    delete (process.env as Record<string, string>).NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID;
    delete (process.env as Record<string, string>).NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID;
  });

  it("returns null when contract ID env vars are not set", () => {
    expect(getTradingPreferencesContractId()).toBeNull();
    expect(getMarketOracleContractId()).toBeNull();
    expect(getLimitOrderContractId()).toBeNull();
  });

  it("returns contract IDs when env vars are set", () => {
    process.env.NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID = "C123";
    process.env.NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID = "C456";
    process.env.NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID = "C789";

    expect(getTradingPreferencesContractId()).toBe("C123");
    expect(getMarketOracleContractId()).toBe("C456");
    expect(getLimitOrderContractId()).toBe("C789");
  });

  it("getSorobanRpcServer returns a server instance", () => {
    const server = getSorobanRpcServer();
    expect(server).toBeDefined();
  });

  it("getSorobanRpcServer returns cached instance", () => {
    const a = getSorobanRpcServer();
    const b = getSorobanRpcServer();
    expect(a).toBe(b);
  });
});
