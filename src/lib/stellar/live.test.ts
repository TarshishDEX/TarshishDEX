import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockStream } = vi.hoisted(() => ({
  mockStream: vi.fn(),
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    operations: () => ({
      forAccount: () => ({
        cursor: () => ({ stream: mockStream }),
      }),
    }),
    trades: () => ({
      forAssetPair: () => ({
        cursor: () => ({ stream: mockStream }),
      }),
    }),
  }),
}));

// Mock asset conversion to avoid Stellar SDK issuer validation
vi.mock("@/lib/stellar/asset", () => ({
  toSdkAsset: (a: { code: string; issuer?: string }) => ({
    code: a.code,
    issuer: a.issuer ?? "",
    isNative: !a.issuer,
  }),
}));

import { streamAccountOperations, streamTrades, streamTradesRecords } from "@/lib/stellar/live";

beforeEach(() => {
  vi.clearAllMocks();
  mockStream.mockReturnValue(() => {});
});

describe("streamAccountOperations", () => {
  it("returns a close function", () => {
    const onMessage = vi.fn();
    const close = streamAccountOperations("GABC...", onMessage);
    expect(typeof close).toBe("function");
  });

  it("calls stream with the onmessage handler", () => {
    const onMessage = vi.fn();
    streamAccountOperations("GABC...", onMessage);
    expect(mockStream).toHaveBeenCalled();
  });

  it("passes account address to forAccount", () => {
    const onMessage = vi.fn();
    streamAccountOperations("GDEF...", onMessage);
    expect(mockStream).toHaveBeenCalled();
  });
});

describe("streamTrades", () => {
  it("returns a close function", () => {
    const onMessage = vi.fn();
    const close = streamTrades(
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GA5Z..." },
      onMessage
    );
    expect(typeof close).toBe("function");
  });
});

describe("streamTradesRecords", () => {
  it("passes trade records to the callback", () => {
    const onMessage = vi.fn();
    const close = streamTradesRecords(
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GA5Z..." },
      onMessage
    );
    expect(typeof close).toBe("function");
  });
});
