import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const buildContractCallMock = vi.hoisted(() => vi.fn());
const getHealthMock = vi.hoisted(() => vi.fn());
const getSorobanRpcServerMock = vi.hoisted(() => vi.fn());
const getLimitOrderContractIdMock = vi.hoisted(() => vi.fn());
const getActiveNetworkMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: getActiveNetworkMock,
}));

vi.mock("@/lib/soroban/config", () => ({
  getSorobanRpcServer: getSorobanRpcServerMock,
  getLimitOrderContractId: getLimitOrderContractIdMock,
}));

vi.mock("@stellar/stellar-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@stellar/stellar-sdk")>();
  return {
    ...actual,
    contract: {
      AssembledTransaction: {
        build: buildContractCallMock,
      },
    },
  };
});

import {
  probeHorizon,
  probeSorobanRpc,
  probeContract,
  overallStatus,
  runHealthChecks,
} from "@/lib/server/health";

const TESTNET = {
  name: "testnet",
  label: "Testnet",
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  passphrase: "Test SDF Network ; September 2015",
  explorerUrl: "https://stellar.expert/explorer/testnet",
};

const CONTRACT_ID = "CATBY2SG26N6E7P34BEL4SWWQVI5LDQT7W26O3TS4HVPL2FZ6LIWPJNM";

beforeEach(() => {
  getActiveNetworkMock.mockReturnValue(TESTNET);
  getSorobanRpcServerMock.mockReturnValue({ getHealth: getHealthMock });
  getLimitOrderContractIdMock.mockReturnValue(CONTRACT_ID);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("probeHorizon", () => {
  it("returns ok for a reachable Horizon endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const result = await probeHorizon();
    expect(result.status).toBe("ok");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it("returns degraded for a non-2xx Horizon response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const result = await probeHorizon();
    expect(result.status).toBe("degraded");
    expect(result.detail).toBe("HTTP 503");
  });

  it("returns down when Horizon is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const result = await probeHorizon();
    expect(result.status).toBe("down");
    expect(result.error).toContain("fetch failed");
  });
});

describe("probeSorobanRpc", () => {
  it("returns ok for a healthy RPC endpoint", async () => {
    getHealthMock.mockResolvedValue({ status: "healthy" });
    const result = await probeSorobanRpc();
    expect(result.status).toBe("ok");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("returns degraded for an unhealthy RPC response", async () => {
    getHealthMock.mockResolvedValue({ status: "unhealthy" });
    const result = await probeSorobanRpc();
    expect(result.status).toBe("degraded");
    expect(result.detail).toBe("status=unhealthy");
  });

  it("returns down when the RPC request fails", async () => {
    getHealthMock.mockRejectedValue(new Error("connection refused"));
    const result = await probeSorobanRpc();
    expect(result.status).toBe("down");
    expect(result.error).toContain("connection refused");
  });
});

describe("probeContract", () => {
  it("returns not_configured when no contract ID is set", async () => {
    getLimitOrderContractIdMock.mockReturnValue(null);
    const result = await probeContract();
    expect(result.status).toBe("not_configured");
    expect(result.detail).toContain("NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID");
  });

  it("returns ok with the contract version when get_version succeeds", async () => {
    buildContractCallMock.mockResolvedValue({
      simulate: vi.fn().mockResolvedValue({ result: 3 }),
    });
    const result = await probeContract();
    expect(result.status).toBe("ok");
    expect(result.detail).toBe("version=3");
    expect(buildContractCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: CONTRACT_ID,
        method: "get_version",
        networkPassphrase: TESTNET.passphrase,
        rpcUrl: TESTNET.rpcUrl,
      })
    );
  });

  it("returns down when the get_version simulation fails", async () => {
    buildContractCallMock.mockRejectedValue(new Error("contract not found"));
    const result = await probeContract();
    expect(result.status).toBe("down");
    expect(result.error).toContain("contract not found");
  });
});

describe("overallStatus", () => {
  const ok = { status: "ok" as const };
  const degraded = { status: "degraded" as const };
  const down = { status: "down" as const };
  const notConfigured = { status: "not_configured" as const };

  it("returns ok when every check is ok or not_configured", () => {
    expect(overallStatus([ok, ok, notConfigured])).toBe("ok");
  });

  it("returns degraded when any check is degraded", () => {
    expect(overallStatus([ok, degraded, ok])).toBe("degraded");
  });

  it("returns down when any check is down", () => {
    expect(overallStatus([ok, down, degraded])).toBe("down");
  });
});

describe("runHealthChecks", () => {
  it("runs all probes and reports ok with per-check detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    getHealthMock.mockResolvedValue({ status: "healthy" });
    buildContractCallMock.mockResolvedValue({
      simulate: vi.fn().mockResolvedValue({ result: 3 }),
    });

    const { status, checks } = await runHealthChecks();

    expect(status).toBe("ok");
    expect(Object.keys(checks).sort()).toEqual(["horizon", "limit_order_contract", "soroban_rpc"]);
    expect(checks.horizon.status).toBe("ok");
    expect(checks.soroban_rpc.status).toBe("ok");
    expect(checks.limit_order_contract.status).toBe("ok");
    expect(checks.limit_order_contract.detail).toBe("version=3");
  });

  it("reports down when a probe fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    getHealthMock.mockResolvedValue({ status: "healthy" });
    buildContractCallMock.mockResolvedValue({
      simulate: vi.fn().mockResolvedValue({ result: 3 }),
    });

    const { status, checks } = await runHealthChecks();
    expect(status).toBe("down");
    expect(checks.horizon.status).toBe("down");
    expect(checks.soroban_rpc.status).toBe("ok");
  });

  it("stays ok when the contract is not configured", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    getHealthMock.mockResolvedValue({ status: "healthy" });
    getLimitOrderContractIdMock.mockReturnValue(null);

    const { status, checks } = await runHealthChecks();
    expect(status).toBe("ok");
    expect(checks.limit_order_contract.status).toBe("not_configured");
  });
});
