import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PortfolioExport,
  balancesToCsvRows,
  tradesToCsvRows,
} from "@/components/portfolio/portfolio-export";
import { downloadFile } from "@/lib/utils/export-csv";
import type { AccountBalance } from "@/lib/stellar/account";
import type { TradeHistoryEntry } from "@/lib/stellar/history";

vi.mock("@/lib/utils/export-csv", () => ({
  objectsToCsv: (rows: Record<string, unknown>[], columns: string[]) =>
    [columns.join(","), ...rows.map((r) => columns.map((c) => String(r[c] ?? "")).join(","))].join(
      "\n"
    ),
  downloadFile: vi.fn(),
}));

const BALANCES: AccountBalance[] = [
  {
    token: { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
    balance: 100,
    trustline: false,
    valueInXlm: 100,
  },
  {
    token: { code: "USDC", issuer: "GISSUER", name: "USD Coin", decimals: 7 },
    balance: 50,
    trustline: true,
    valueInXlm: 500,
  },
];

const ENTRIES: TradeHistoryEntry[] = [
  {
    id: "1",
    type: "swap",
    summary: "XLM/USDC",
    source: "G...",
    hash: "abc123",
    ledger: 12345,
    createdAt: "2026-01-01T12:00:00Z",
    status: "successful",
    fromAsset: { code: "XLM", isNative: true },
    toAsset: { code: "USDC", issuer: "GISSUER" },
    amount: "10",
  },
];

describe("PortfolioExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps balances to CSV rows", () => {
    const rows = balancesToCsvRows(BALANCES);
    expect(rows[0]).toMatchObject({
      asset: "XLM",
      issuer: "native",
      balance: "100",
      value_xlm: "100",
    });
    expect(rows[1]).toMatchObject({
      asset: "USDC:GISSUER",
      issuer: "GISSUER",
      balance: "50",
      value_xlm: "500",
    });
  });

  it("maps trade entries to CSV rows", () => {
    const rows = tradesToCsvRows(ENTRIES);
    expect(rows[0]).toMatchObject({
      type: "swap",
      summary: "XLM/USDC",
      ledger: "12345",
      hash: "abc123",
    });
  });

  it("renders an Export CSV trigger disabled without data", () => {
    render(<PortfolioExport balances={[]} entries={[]} />);
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
  });

  it("opens the export options menu and downloads balances", () => {
    render(<PortfolioExport balances={BALANCES} entries={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Balances only/ }));
    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [csv, filename] = vi.mocked(downloadFile).mock.calls[0] as [string, string];
    expect(filename).toMatch(/^balances-/);
    expect(csv).toContain("asset,issuer,balance,value_xlm");
    expect(csv).toContain("USDC:GISSUER,GISSUER,50,500");
  });

  it("exports trade history only", () => {
    render(<PortfolioExport balances={[]} entries={ENTRIES} />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Trade history only/ }));
    const [csv, filename] = vi.mocked(downloadFile).mock.calls[0] as [string, string];
    expect(filename).toMatch(/^trade-history-/);
    expect(csv).toContain("date,type,summary,ledger,status,hash");
    expect(csv).toContain("abc123");
  });

  it("exports both datasets when Both is selected", () => {
    render(<PortfolioExport balances={BALANCES} entries={ENTRIES} />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /^Both/ }));
    expect(downloadFile).toHaveBeenCalledTimes(2);
  });

  it("closes the menu after choosing an option", () => {
    render(<PortfolioExport balances={BALANCES} entries={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Balances only/ }));
    expect(screen.queryByRole("menu", { name: "Export options" })).toBeNull();
  });
});
