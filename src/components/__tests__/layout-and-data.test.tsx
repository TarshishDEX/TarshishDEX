import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/ui/command-palette";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { CopyButton } from "@/components/ui/copy-button";
import { AddressDisplay } from "@/components/ui/address-display";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/swap"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock wallet components
vi.mock("@/components/wallet/connect-wallet-button", () => ({
  ConnectWalletButton: () => <button>Connect Wallet</button>,
}));

vi.mock("@/components/layout/mobile-menu", () => ({
  MobileMenu: () => <button>Menu</button>,
}));

vi.mock("@/components/ui/network-indicator", () => ({
  NetworkIndicator: () => <span>Testnet</span>,
}));

// ── Header ─────────────────────────────────────────────────────────────

describe("Header", () => {
  it("renders without crashing", () => {
    const { container } = render(<Header />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders navigation with multiple Swap links (desktop + mobile)", () => {
    render(<Header />);
    const links = screen.getAllByText("Swap");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("renders connect wallet button", () => {
    render(<Header />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });
});

// ── Footer ─────────────────────────────────────────────────────────────

describe("Footer", () => {
  it("renders resource links", () => {
    render(<Footer />);
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders with footer role", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });
});

// ── Pagination ─────────────────────────────────────────────────────────

describe("Pagination", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page buttons", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("calls onPageChange when clicking a page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Page 2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous on first page", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next on last page", () => {
    render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });
});

// ── DataTable ──────────────────────────────────────────────────────────

describe("DataTable", () => {
  it("renders children when not loading/empty/error", () => {
    render(
      <DataTable>
        <table><tbody><tr><td>data</td></tr></tbody></table>
      </DataTable>
    );
    expect(screen.getByText("data")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    const { container } = render(
      <DataTable loading loadingRows={3} loadingColumns={2}>
        <div>data</div>
      </DataTable>
    );
    expect(screen.queryByText("data")).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(<DataTable error="Failed to load">data</DataTable>);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <DataTable empty emptyTitle="Nothing here">
        data
      </DataTable>
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});

// ── DropdownMenu ───────────────────────────────────────────────────────

describe("DropdownMenu", () => {
  const items = [
    { id: "edit", label: "Edit" },
    { id: "delete", label: "Delete", danger: true },
  ];

  it("renders trigger button", () => {
    render(
      <DropdownMenu
        trigger="Options"
        items={items}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Options" })).toBeInTheDocument();
  });

  it("shows menu on click", () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu trigger="Menu" items={items} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("calls onSelect when item clicked", () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu trigger="Menu" items={items} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onSelect).toHaveBeenCalledWith("edit");
  });
});

// ── CommandPalette ─────────────────────────────────────────────────────

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container.firstChild).toBeNull();
  });
});

// ── PageHeader ─────────────────────────────────────────────────────────

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<PageHeader title="Swap" description="Trade tokens" />);
    expect(screen.getByText("Trade tokens")).toBeInTheDocument();
  });
});

// ── StatCard ──────────────────────────────────────────────────────────

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Volume 24h" value="$1.2M" />);
    expect(screen.getByText("Volume 24h")).toBeInTheDocument();
    expect(screen.getByText("$1.2M")).toBeInTheDocument();
  });
});

// ── CopyButton ────────────────────────────────────────────────────────

describe("CopyButton", () => {
  it("renders button", () => {
    render(<CopyButton text="copy-me" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

// ── AddressDisplay ────────────────────────────────────────────────────

describe("AddressDisplay", () => {
  it("renders truncated address", () => {
    render(<AddressDisplay address="GABC123DEF456GHI789JKL012MNO345PQR678STU" />);
    expect(screen.getByText(/GABC/)).toBeInTheDocument();
  });
});
