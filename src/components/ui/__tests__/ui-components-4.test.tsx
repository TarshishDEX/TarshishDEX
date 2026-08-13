import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import { FileInput } from "@/components/ui/file-input";
import { QRCode } from "@/components/ui/qr-code";
import { StatCard } from "@/components/ui/stat-card";
import { CopyButton } from "@/components/ui/copy-button";
import { RetryButton } from "@/components/ui/retry-button";
import { OnlineOfflineBadge } from "@/components/ui/online-offline-badge";
import { PriceImpactBadge } from "@/components/ui/price-impact-badge";
import { NetworkIndicator } from "@/components/ui/network-indicator";
import { TransactionStatusIcon } from "@/components/ui/transaction-status-icon";
import { IconButton } from "@/components/ui/icon-button";
import { AddressDisplay } from "@/components/ui/address-display";
import { PageHeader } from "@/components/ui/page-header";

// ── Tooltip ────────────────────────────────────────────────────────────

describe("Tooltip", () => {
  it("renders children", () => {
    render(
      <Tooltip content="Help text">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });
});

// ── Avatar ────────────────────────────────────────────────────────────

describe("Avatar", () => {
  it("renders initials fallback", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JO")).toBeInTheDocument();
  });

  it("renders with role img", () => {
    render(<Avatar alt="User" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders custom fallback", () => {
    render(<Avatar alt="John Doe" fallback="JD" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});

// ── FileInput ─────────────────────────────────────────────────────────

describe("FileInput", () => {
  it("renders label", () => {
    render(<FileInput onChange={vi.fn()} />);
    expect(screen.getByText("Choose file")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<FileInput onChange={vi.fn()} label="Upload CSV" />);
    expect(screen.getByText("Upload CSV")).toBeInTheDocument();
  });
});

// ── QRCode ────────────────────────────────────────────────────────────

describe("QRCode", () => {
  it("renders canvas", () => {
    const { container } = render(<QRCode value="GABCDEF123456" />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });
});

// ── StatCard ──────────────────────────────────────────────────────────

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Volume" value="$1.2M" />);
    // Label is uppercase via CSS
    expect(screen.getByText(/volume/i)).toBeInTheDocument();
    expect(screen.getByText("$1.2M")).toBeInTheDocument();
  });

  it("renders positive delta", () => {
    render(<StatCard label="Price" value="$10" delta={5.2} />);
    expect(screen.getByText("+5.20%")).toBeInTheDocument();
  });

  it("renders negative delta", () => {
    render(<StatCard label="Price" value="$10" delta={-3.1} />);
    expect(screen.getByText("-3.10%")).toBeInTheDocument();
  });

  it("renders hint text", () => {
    render(<StatCard label="TVL" value="$5M" hint="Updated 5s ago" />);
    expect(screen.getByText("Updated 5s ago")).toBeInTheDocument();
  });
});

// ── CopyButton ────────────────────────────────────────────────────────

describe("CopyButton", () => {
  it("renders with label", () => {
    render(<CopyButton text="copy-me" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});

// ── RetryButton ───────────────────────────────────────────────────────

describe("RetryButton", () => {
  it("renders retry with remaining count", () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByText(/3 retries remaining/i)).toBeInTheDocument();
  });

  it("calls onRetry", async () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ── OnlineOfflineBadge ────────────────────────────────────────────────

describe("OnlineOfflineBadge", () => {
  it("shows online", () => {
    render(<OnlineOfflineBadge online={true} />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows offline", () => {
    render(<OnlineOfflineBadge online={false} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("shows custom label", () => {
    render(<OnlineOfflineBadge online={true} label="Connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });
});

// ── PriceImpactBadge ──────────────────────────────────────────────────

describe("PriceImpactBadge", () => {
  it("shows low impact", () => {
    render(<PriceImpactBadge impactPct={0.1} />);
    expect(screen.getByText(/Low impact/)).toBeInTheDocument();
  });

  it("shows high impact", () => {
    render(<PriceImpactBadge impactPct={3} />);
    expect(screen.getByText(/High impact/)).toBeInTheDocument();
  });

  it("shows critical impact", () => {
    render(<PriceImpactBadge impactPct={10} />);
    expect(screen.getByText(/Critical/)).toBeInTheDocument();
  });
});

// ── NetworkIndicator ──────────────────────────────────────────────────

describe("NetworkIndicator", () => {
  it("renders without crashing", () => {
    const { container } = render(<NetworkIndicator />);
    expect(container.textContent).toBeTruthy();
  });
});

// ── TransactionStatusIcon ─────────────────────────────────────────────

describe("TransactionStatusIcon", () => {
  it("renders pending", () => {
    const { container } = render(<TransactionStatusIcon status="pending" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders success", () => {
    const { container } = render(<TransactionStatusIcon status="success" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders failed", () => {
    const { container } = render(<TransactionStatusIcon status="failed" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// ── IconButton ────────────────────────────────────────────────────────

describe("IconButton", () => {
  it("renders with label", () => {
    const onClick = vi.fn();
    render(
      <IconButton onClick={onClick} label="Settings">
        ⚙
      </IconButton>
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Settings");
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    render(
      <IconButton onClick={onClick} label="Close">
        ✕
      </IconButton>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});

// ── AddressDisplay ──────────────────────────────────────────────────────

describe("AddressDisplay", () => {
  const addr = "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  it("renders truncated address", () => {
    render(<AddressDisplay address={addr} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

// ── PageHeader ──────────────────────────────────────────────────────────

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<PageHeader title="Swap" description="Trade tokens" />);
    expect(screen.getByText("Trade tokens")).toBeInTheDocument();
  });

  it("renders actions", () => {
    render(<PageHeader title="Markets" actions={<button>Filter</button>} />);
    expect(screen.getByText("Filter")).toBeInTheDocument();
  });
});
