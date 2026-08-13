import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetBrowser } from "@/components/assets/asset-browser";

// Mock the catalog fetch
vi.mock("@/lib/stellar/catalog", () => ({
  fetchAssetCatalogPage: vi.fn(() =>
    Promise.resolve({
      assets: [
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
      nextCursor: null,
    })
  ),
}));

const MOCK_DATA = {
  pages: [
    {
      assets: [
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
      nextCursor: null,
    },
  ],
};

// Mock the query provider wrapper
vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: vi.fn(() => ({
    data: MOCK_DATA,
    isLoading: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
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

  it("shows loading state", async () => {
    const { useInfiniteQuery } = await import("@tanstack/react-query");
    vi.mocked(useInfiniteQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as never);

    const { container } = render(<AssetBrowser />);
    // Skeleton component renders div with animate-pulse class
    const skeletonDivs = container.querySelectorAll(".animate-pulse");
    expect(skeletonDivs.length).toBeGreaterThan(0);
  });

  it("shows error state", async () => {
    const reactQuery = await import("@tanstack/react-query");
    vi.mocked(reactQuery.useInfiniteQuery).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as never);

    render(<AssetBrowser />);
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });
});
