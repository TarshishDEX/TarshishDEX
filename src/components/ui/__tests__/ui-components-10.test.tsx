import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { WalletStatusBadge } from "@/components/wallet/wallet-status-badge";
import { KeyboardShortcutsDialog } from "@/components/features/keyboard-shortcuts-dialog";
import { QueryProvider } from "@/components/providers/query-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import {
  validateSwapAmount,
  isValidAccountId,
  isValidAssetCode,
} from "@/lib/utils/swap-validation";

// Mock the wallet-kit facade so WalletProvider's subscribeWalletEvents doesn't
// dynamically import the real stellar-wallets-kit, whose Freighter module
// (`@stellar/freighter-api` v6) fails to load under Vitest's ESM loader.
vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: () => Promise.resolve(() => {}),
  isWalletAvailable: vi.fn().mockResolvedValue(true),
}));

// =========================================================================
// swap-validation
// =========================================================================
describe("swap-validation", () => {
  it("validates valid amounts", () => {
    expect(validateSwapAmount("100")).toBe(100);
    expect(validateSwapAmount("0.5")).toBe(0.5);
    expect(validateSwapAmount(" 42 ")).toBe(42);
  });

  it("rejects empty and invalid inputs", () => {
    expect(validateSwapAmount("")).toBeNull();
    expect(validateSwapAmount("  ")).toBeNull();
    expect(validateSwapAmount(".")).toBeNull();
    expect(validateSwapAmount("abc")).toBeNull();
    expect(validateSwapAmount("-5")).toBeNull();
    expect(validateSwapAmount("0")).toBeNull();
  });

  it("rejects unreasonably large numbers", () => {
    expect(validateSwapAmount("1e16")).toBeNull();
    expect(validateSwapAmount("10000000000000000")).toBeNull();
  });

  it("isValidAccountId validates format", () => {
    expect(isValidAccountId("G".repeat(56))).toBe(true);
    expect(isValidAccountId("short")).toBe(false);
    expect(isValidAccountId("A".repeat(56))).toBe(false);
  });

  it("isValidAssetCode validates codes", () => {
    expect(isValidAssetCode("USDC")).toBe(true);
    expect(isValidAssetCode("x123")).toBe(true);
    expect(isValidAssetCode("TOOLONGASSETCODE")).toBe(false);
    expect(isValidAssetCode("has space")).toBe(false);
  });
});

// =========================================================================
// PagePlaceholder
// =========================================================================
describe("PagePlaceholder", () => {
  it("renders title and description", () => {
    render(<PagePlaceholder title="Analytics" description="Coming soon" phase="3" />);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders phase badge", () => {
    render(<PagePlaceholder title="Analytics" description="Desc" phase="2" />);
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
  });

  it("renders coming-soon message", () => {
    render(<PagePlaceholder title="Analytics" description="Desc" phase="1" />);
    expect(screen.getByText(/under active construction/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PagePlaceholder title="T" description="D" phase="1" className="custom-page" />
    );
    expect(container.firstChild).toHaveClass("custom-page");
  });
});

// =========================================================================
// WalletStatusBadge
// =========================================================================
describe("WalletStatusBadge", () => {
  it("shows Disconnected", () => {
    render(<WalletStatusBadge status="disconnected" />);
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows Connecting", () => {
    render(<WalletStatusBadge status="connecting" />);
    expect(screen.getByText("Connecting…")).toBeInTheDocument();
  });

  it("shows Connected", () => {
    render(<WalletStatusBadge status="connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<WalletStatusBadge status="connected" className="wallet-badge" />);
    expect(container.firstChild).toHaveClass("wallet-badge");
  });
});

// =========================================================================
// KeyboardShortcutsDialog
// =========================================================================
describe("KeyboardShortcutsDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<KeyboardShortcutsDialog />);
    expect(container.firstChild).toBeNull();
  });

  it("opens on ? keypress", () => {
    render(<KeyboardShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(document, { key: "?" });
    });
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText(/Open command palette/)).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<KeyboardShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(document, { key: "?" });
    });
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
  });

  it("closes on backdrop click", () => {
    render(<KeyboardShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(document, { key: "?" });
    });
    const backdrop = document.querySelector('[class*="fixed inset-0"]');
    expect(backdrop).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
  });

  it("closes via close button", () => {
    render(<KeyboardShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(document, { key: "?" });
    });
    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
  });

  it("ignores ? when typing in an input", () => {
    render(<KeyboardShortcutsDialog />);
    // Simulate keydown with target being an input
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      fireEvent.keyDown(input, { key: "?" });
    });
    expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    document.body.removeChild(input);
  });
});

// =========================================================================
// QueryProvider
// =========================================================================
describe("QueryProvider", () => {
  it("wraps children with QueryClientProvider", () => {
    render(
      <QueryProvider>
        <div data-testid="child">child</div>
      </QueryProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

// =========================================================================
// WalletProvider
// =========================================================================
describe("WalletProvider", () => {
  it("renders children", () => {
    render(
      <WalletProvider>
        <div data-testid="child">wallet child</div>
      </WalletProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
