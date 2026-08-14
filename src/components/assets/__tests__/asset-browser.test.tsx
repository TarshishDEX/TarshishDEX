import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetBrowser } from "@/components/assets/asset-browser";

// Mock the catalog fetch
vi.mock("@/lib/stellar/catalog", () => ({
  fetchAssetCatalog: vi.fn(() =>
    Promise.resolve([
      {
        token: { code: "USDC", issuer: "G...USDC", name: "USD Coin", decimals: 7 },
        trustlines: 5000,
        supply: 1000000,
        accounts: 3500,
        flags: { authRequired: false, authImmutable: false },
      },
      {
        token: { code: "EURMTL", issuer: "G...EURMTL", name: "EURMTL", decimals: 7 },
        trustlines: 3000,
        supply: 500000,
        accounts: 2000,
        flags: { authRequired: true, authImmutable: false },
      },
    ])
  ),
}));

// Mock the query provider wrapper
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: [
      {
        token: { code: "USDC", issuer: "G...USDC", name: "USD Coin", decimals: 7 },
        trustlines: 5000,
        supply: 1000000,
        accounts: 3500,
        flags: { authRequired: false, authImmutable: false },
      },
      {
        token: { code: "EURMTL", issuer: "G...EURMTL", name: "EURMTL", decimals: 7 },
        trustlines: 3000,
        supply: 500000,
        accounts: 2000,
        flags: { authRequired: true, authImmutable: false },
      },
    ],
    isLoading: false,
    isError: false,
  })),
}));

describe("AssetBrowser", () => {
  it("renders asset catalog title", () => {
    render(<AssetBrowser />);
    expect(screen.getByText("Asset Catalog")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<AssetBrowser />);
    expect(screen.getByPlaceholderText("Search code or issuer…")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AssetBrowser />);
    expect(screen.getByText("Asset")).toBeInTheDocument();
    expect(screen.getByText("Issuer")).toBeInTheDocument();
  });

  it("renders asset entries", () => {
    render(<AssetBrowser />);
    const usdcElements = screen.getAllByText("USDC");
    const eurmtlElements = screen.getAllByText("EURMTL");
    expect(usdcElements.length).toBeGreaterThan(0);
    expect(eurmtlElements.length).toBeGreaterThan(0);
  });

  it("renders flags column", () => {
    render(<AssetBrowser />);
    expect(screen.getByText("Flags")).toBeInTheDocument();
  });

  it("renders auth filter checkbox", () => {
    render(<AssetBrowser />);
    expect(screen.getByText("Auth required")).toBeInTheDocument();
  });

  it("filters assets case-insensitively by code", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: [
        {
          token: { code: "USDC", issuer: "G...USDC", name: "USD Coin", decimals: 7 },
          trustlines: 5000,
          supply: 1000000,
          accounts: 3500,
          flags: { authRequired: false, authImmutable: false },
        },
        {
          token: { code: "EURMTL", issuer: "G...EURMTL", name: "EURMTL", decimals: 7 },
          trustlines: 3000,
          supply: 500000,
          accounts: 2000,
          flags: { authRequired: true, authImmutable: false },
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    render(<AssetBrowser />);
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "usdc" } });
    expect(screen.getByText("USDC")).toBeTruthy();
    expect(screen.queryByText("EURMTL")).toBeNull();
  });

  it("filters assets case-insensitively by issuer", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: [
        {
          token: { code: "USDC", issuer: "GABC...ISSUER", name: "USD Coin", decimals: 7 },
          trustlines: 5000,
          supply: 1000000,
          accounts: 3500,
          flags: { authRequired: false, authImmutable: false },
        },
        {
          token: { code: "EURMTL", issuer: "GXYZ...ISSUER", name: "EURMTL", decimals: 7 },
          trustlines: 3000,
          supply: 500000,
          accounts: 2000,
          flags: { authRequired: true, authImmutable: false },
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    render(<AssetBrowser />);
    fireEvent.change(screen.getByLabelText("Search assets"), {
      target: { value: "gabc...issuer" },
    });
    expect(screen.getByText("USDC")).toBeTruthy();
    expect(screen.queryByText("EURMTL")).toBeNull();
  });

  it("shows loading state", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    const { container } = render(<AssetBrowser />);
    // Skeleton component renders div with animate-pulse class
    const skeletonDivs = container.querySelectorAll(".animate-pulse");
    expect(skeletonDivs.length).toBeGreaterThan(0);
  });

  it("shows error state", async () => {
    const reactQuery = await import("@tanstack/react-query");
    vi.mocked(reactQuery.useQuery).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never);

    render(<AssetBrowser />);
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });
});
