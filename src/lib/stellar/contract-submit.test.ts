import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSign, mockSubmit } = vi.hoisted(() => ({
  mockSign: vi.fn(),
  mockSubmit: vi.fn(),
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  signTransactionXdr: mockSign,
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    submitTransaction: mockSubmit,
  }),
}));

// Mock TransactionBuilder to avoid XDR parsing of test strings
vi.mock("@stellar/stellar-sdk", () => ({
  TransactionBuilder: {
    fromXDR: (xdr: string, _passphrase: string) => ({
      _xdr: xdr,
      toXDR: () => xdr,
    }),
  },
}));

import { signAndSubmitContractTx } from "@/lib/stellar/contract-submit";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signAndSubmitContractTx", () => {
  it("signs and submits a transaction successfully", async () => {
    mockSign.mockResolvedValue("signed-xdr-base64");
    mockSubmit.mockResolvedValue({ hash: "tx-hash-abc123" });

    const result = await signAndSubmitContractTx(
      "unsigned-xdr",
      "GABC...",
      "Test SDF Network ; September 2015"
    );

    expect(result).toEqual({ success: true, hash: "tx-hash-abc123" });
    expect(mockSign).toHaveBeenCalledWith("unsigned-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
      address: "GABC...",
    });
    expect(mockSubmit).toHaveBeenCalled();
  });

  it("returns error on signing failure", async () => {
    mockSign.mockRejectedValue(new Error("User rejected"));

    const result = await signAndSubmitContractTx(
      "unsigned-xdr",
      "GABC...",
      "Test SDF Network ; September 2015"
    );

    expect(result).toEqual({ success: false, error: "User rejected" });
  });

  it("returns error on submission failure", async () => {
    mockSign.mockResolvedValue("signed-xdr-base64");
    mockSubmit.mockRejectedValue(new Error("op_underfunded"));

    const result = await signAndSubmitContractTx(
      "unsigned-xdr",
      "GABC...",
      "Test SDF Network ; September 2015"
    );

    expect(result).toEqual({ success: false, error: "op_underfunded" });
  });

  it("handles non-Error throwables", async () => {
    mockSign.mockRejectedValue("string error");

    const result = await signAndSubmitContractTx(
      "unsigned-xdr",
      "GABC...",
      "Test SDF Network ; September 2015"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Transaction failed");
  });
});
