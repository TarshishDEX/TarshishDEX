import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  readSwapHistory,
  recordSwapHistory,
  updateSwapHistoryEntry,
  clearSwapHistory,
  useSwapHistory,
} from "@/lib/hooks/use-swap-history";

describe("swap history store", () => {
  beforeEach(() => {
    localStorage.clear();
    let counter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${counter++}`,
    });
  });

  it("starts empty", () => {
    expect(readSwapHistory()).toEqual([]);
  });

  it("records a swap entry with a default success status", () => {
    recordSwapHistory({
      inputAsset: "XLM",
      outputAsset: "USDC",
      inputAmount: "100",
      outputAmount: "90",
    });
    const history = readSwapHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      inputAsset: "XLM",
      outputAsset: "USDC",
      status: "success",
    });
  });

  it("keeps the most recent 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      recordSwapHistory({
        inputAsset: "XLM",
        outputAsset: "USDC",
        inputAmount: String(i),
        outputAmount: "1",
      });
    }
    expect(readSwapHistory()).toHaveLength(50);
    expect(readSwapHistory()[0]?.inputAmount).toBe("54");
  });

  it("updates an entry status and hash", () => {
    const entry = recordSwapHistory({
      inputAsset: "XLM",
      outputAsset: "USDC",
      inputAmount: "10",
      outputAmount: "9",
      status: "pending",
    });
    updateSwapHistoryEntry(entry.id, {
      status: "success",
      txHash: "tx-abc",
      explorerUrl: "https://explorer/tx-abc",
    });
    const updated = readSwapHistory()[0];
    expect(updated?.status).toBe("success");
    expect(updated?.txHash).toBe("tx-abc");
  });

  it("clears history", () => {
    recordSwapHistory({
      inputAsset: "XLM",
      outputAsset: "USDC",
      inputAmount: "1",
      outputAmount: "0.9",
    });
    clearSwapHistory();
    expect(readSwapHistory()).toEqual([]);
  });
});

describe("useSwapHistory", () => {
  beforeEach(() => {
    localStorage.clear();
    let counter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${counter++}`,
    });
  });

  it("returns entries and supports clearing", () => {
    const { result } = renderHook(() => useSwapHistory());
    expect(result.current.entries).toHaveLength(0);
    act(() =>
      result.current.addEntry({
        inputAsset: "XLM",
        outputAsset: "USDC",
        inputAmount: "5",
        outputAmount: "4.8",
      })
    );
    expect(result.current.entries).toHaveLength(1);
    act(() => result.current.clearHistory());
    expect(result.current.entries).toHaveLength(0);
  });
});
