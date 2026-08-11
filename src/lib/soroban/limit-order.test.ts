import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/soroban/config", () => ({
  getLimitOrderContractId: () => "CLIMIT...",
  getSorobanRpcServer: () => ({ simulateTransaction: vi.fn() }),
}));

vi.mock("server-only", () => ({}));

import { queryOrderCount } from "@/lib/soroban/limit-order";

describe("limit-order client", () => {
  it("queryOrderCount is callable", () => {
    expect(typeof queryOrderCount).toBe("function");
  });

  it("queryOrderCount returns a promise", () => {
    const result = queryOrderCount();
    expect(result).toBeInstanceOf(Promise);
  });
});
