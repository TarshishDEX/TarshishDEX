import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { PercentButtons } from "@/components/swap/percent-buttons";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Tag } from "@/components/ui/tag";
import { AssetIcon } from "@/components/ui/asset-icon";
import { NotificationCenter } from "@/components/features/notification-center";
import { AccessibleIcon } from "@/components/ui/accessible-icon";
import { BadgeCounter } from "@/components/ui/badge-counter";
import { InputHint } from "@/components/ui/input-hint";
import { InputErrorIcon } from "@/components/ui/input-error-icon";
import { SkeletonCircle } from "@/components/ui/skeleton-circle";
import {
  ResponsiveTable,
  TableHead,
  Th,
  TableBody,
  Tr,
  Td,
} from "@/components/ui/responsive-table";
import { TransitionHeight } from "@/components/ui/transition-height";
import { ScreenReaderAnnouncement } from "@/components/ui/screen-reader-announcement";
import type { Token } from "@/lib/stellar/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/swap"),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockToken: Token = {
  code: "USDC",
  issuer: "GA5ZSE...",
  isNative: false,
  name: "USD Coin",
  decimals: 7,
};

describe("PercentButtons", () => {
  it("renders all 4 preset buttons", () => {
    render(<PercentButtons onSelect={vi.fn()} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("MAX")).toBeInTheDocument();
  });

  it("disables buttons when no balance", () => {
    render(<PercentButtons onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("enables buttons when balance > 0", () => {
    render(<PercentButtons balance="100" onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it("calls onSelect with correct percent", () => {
    const onSelect = vi.fn();
    render(<PercentButtons balance="100" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("25%"));
    expect(onSelect).toHaveBeenCalledWith(25);
    fireEvent.click(screen.getByText("MAX"));
    expect(onSelect).toHaveBeenCalledWith(100);
  });

  it("shows tooltip amount on hover when balance provided", () => {
    render(<PercentButtons balance="100" onSelect={vi.fn()} />);
    expect(screen.getByTitle("25.0000000")).toBeInTheDocument();
    expect(screen.getByTitle("100.0000000")).toBeInTheDocument();
  });
});

describe("Tag", () => {
  it("renders label", () => {
    render(<Tag label="DeFi" />);
    expect(screen.getByText("DeFi")).toBeInTheDocument();
  });

  it("renders remove button when onRemove provided", () => {
    render(<Tag label="XLM" onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Remove XLM")).toBeInTheDocument();
  });

  it("calls onRemove when remove button clicked", () => {
    const onRemove = vi.fn();
    render(<Tag label="BTC" onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remove BTC"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render remove button without onRemove", () => {
    render(<Tag label="ETH" />);
    expect(screen.queryByLabelText("Remove ETH")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Tag label="Test" className="custom-class" />);
    expect(screen.getByText("Test").closest("span")).toHaveClass("custom-class");
  });
});

describe("AssetIcon", () => {
  it("renders with token code as aria-label", () => {
    render(<AssetIcon token={mockToken} />);
    expect(screen.getByLabelText("USDC")).toBeInTheDocument();
  });

  it("renders default icon for non-native token", () => {
    render(<AssetIcon token={mockToken} />);
    expect(screen.getByText("◈")).toBeInTheDocument();
  });

  it("renders native icon for XLM", () => {
    const xlmToken: Token = {
      code: "XLM",
      issuer: "",
      isNative: true,
      name: "Stellar Lumens",
      decimals: 7,
    };
    render(<AssetIcon token={xlmToken} />);
    expect(screen.getByText("⬡")).toBeInTheDocument();
  });

  it("renders custom icon when token.icon is provided", () => {
    const customToken: Token = {
      ...mockToken,
      icon: "🚀",
    };
    render(<AssetIcon token={customToken} />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("applies size variants", () => {
    const { container, rerender } = render(<AssetIcon token={mockToken} size="sm" />);
    expect(container.firstChild).toHaveClass("h-6", "w-6");

    rerender(<AssetIcon token={mockToken} size="lg" />);
    expect(container.firstChild).toHaveClass("h-12", "w-12");
  });
});

describe("AnimatedNumber", () => {
  it("renders formatted value", () => {
    render(<AnimatedNumber value={1.5} />);
    expect(screen.getByText("1.500000")).toBeInTheDocument();
  });

  it("uses custom format function", () => {
    render(<AnimatedNumber value={42} format={(v) => `${v} units`} />);
    expect(screen.getByText("42 units")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    render(<AnimatedNumber value={0} className="my-anim" />);
    expect(screen.getByText("0.000000")).toHaveClass("my-anim");
  });
});

describe("AccessibleIcon", () => {
  it("renders icon with aria-hidden and screen-reader label", () => {
    render(
      <AccessibleIcon label="Search">
        <svg data-testid="icon" />
      </AccessibleIcon>
    );
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("returns children as-is when not a valid element", () => {
    const { container } = render(
      <AccessibleIcon label="Fail">
        <>not an element</>
      </AccessibleIcon>
    );
    // The fragment renders the text content as-is
    expect(container.textContent).toContain("not an element");
  });
});

describe("BadgeCounter", () => {
  it("renders count", () => {
    render(<BadgeCounter count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows max+ when count exceeds max", () => {
    render(<BadgeCounter count={150} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("returns null when count is 0 or negative", () => {
    const { container } = render(<BadgeCounter count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with variant classes", () => {
    const { container } = render(<BadgeCounter count={3} variant="danger" />);
    expect(container.firstChild).toHaveClass("bg-danger");
  });
});

describe("InputHint", () => {
  it("renders children", () => {
    render(<InputHint>Must be at least 8 characters</InputHint>);
    expect(screen.getByText("Must be at least 8 characters")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<InputHint className="extra-hint">Tip</InputHint>);
    expect(screen.getByText("Tip")).toHaveClass("extra-hint");
  });
});

describe("InputErrorIcon", () => {
  it("renders error icon when hasError is true", () => {
    const { container } = render(<InputErrorIcon hasError />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("returns null when hasError is false", () => {
    const { container } = render(<InputErrorIcon hasError={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("SkeletonCircle", () => {
  it("renders with default size", () => {
    const { container } = render(<SkeletonCircle />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders with custom size", () => {
    const { container } = render(<SkeletonCircle size={24} />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("has aria-hidden", () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ScreenReaderAnnouncement", () => {
  it("renders aria-live region", () => {
    const { container } = render(<ScreenReaderAnnouncement message="Loaded" />);
    expect(container.firstChild).toHaveAttribute("aria-live", "polite");
  });

  it("uses assertive politeness when specified", () => {
    const { container } = render(
      <ScreenReaderAnnouncement message="Error!" politeness="assertive" />
    );
    expect(container.firstChild).toHaveAttribute("aria-live", "assertive");
  });
});

describe("ResponsiveTable", () => {
  it("renders table with wrapper", () => {
    const { container } = render(
      <ResponsiveTable>
        <tbody />
      </ResponsiveTable>
    );
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("renders TableHead with th children", () => {
    render(
      <table>
        <TableHead>
          <Th>Name</Th>
          <Th align="right">Value</Th>
        </TableHead>
      </table>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Value")).toHaveClass("text-right");
  });

  it("renders TableBody with Tr and Td", () => {
    render(
      <table>
        <TableBody>
          <Tr>
            <Td>Alice</Td>
            <Td align="right">100</Td>
          </Tr>
        </TableBody>
      </table>
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});

describe("TransitionHeight", () => {
  beforeEach(() => {
    // Mock scrollHeight
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      value: 200,
    });
  });

  it("renders children when show is true", () => {
    render(
      <TransitionHeight show>
        <div>Visible content</div>
      </TransitionHeight>
    );
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("hides content when show is false", async () => {
    const { container } = render(
      <TransitionHeight show={false} duration={50}>
        <div>Hidden content</div>
      </TransitionHeight>
    );
    // Initially null while mounted is false
    expect(container.firstChild).toBeNull();
  });

  it("applies custom duration via style", () => {
    const { container } = render(
      <TransitionHeight show duration={500}>
        <div>Content</div>
      </TransitionHeight>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transitionDuration).toBe("500ms");
  });
});

describe("NotificationCenter", () => {
  it("renders bell button", () => {
    render(<NotificationCenter />);
    expect(screen.getByLabelText("Notifications (0 unread)")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText("Notifications (0 unread)"));
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Mark read")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText("Notifications (0 unread)"));
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("closes dropdown on second click", () => {
    render(<NotificationCenter />);
    const btn = screen.getByLabelText("Notifications (0 unread)");
    fireEvent.click(btn);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});

describe("MobileMenu", () => {
  it("renders hamburger button", () => {
    render(<MobileMenu />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("opens menu on click", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByText("Markets")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("closes menu on backdrop click", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByText("Swap")).toBeInTheDocument();
    // Click backdrop (the div with aria-hidden="true")
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByText("Swap")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("has correct nav links with hrefs", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const swapLink = screen.getByText("Swap").closest("a");
    expect(swapLink).toHaveAttribute("href", "/swap");
    const marketsLink = screen.getByText("Markets").closest("a");
    expect(marketsLink).toHaveAttribute("href", "/markets");
  });

  it("highlights active page with aria-current", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const swapLink = screen.getByText("Swap").closest("a");
    expect(swapLink).toHaveAttribute("aria-current", "page");
  });
});
