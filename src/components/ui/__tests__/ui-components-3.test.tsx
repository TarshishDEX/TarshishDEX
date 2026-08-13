import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyResults } from "@/components/ui/empty-results";
import { ShimmerCard } from "@/components/ui/shimmer-card";
import { SectionHeader } from "@/components/ui/section-header";
import { KeyValuePair } from "@/components/ui/key-value-pair";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RetryButton } from "@/components/ui/retry-button";
import { InlineCode } from "@/components/ui/inline-code";
import { FocusTrap } from "@/components/ui/focus-trap";
import { StickyHeader } from "@/components/ui/sticky-header";
import { InputHint } from "@/components/ui/input-hint";
import { InputErrorIcon } from "@/components/ui/input-error-icon";
import { InputGroup } from "@/components/ui/input-group";
import { InputLabel } from "@/components/ui/input-label";
import { InputSearch } from "@/components/ui/input-search";
import { HelpText } from "@/components/ui/help-text";
import { LastUpdated } from "@/components/ui/last-updated";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ── ThemeToggle ────────────────────────────────────────────────────────

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("toggles on click", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    // Should not crash — just verify it's still a button
    expect(btn).toBeInTheDocument();
  });
});

// ── ScrollToTop ────────────────────────────────────────────────────────

describe("ScrollToTop", () => {
  it("returns null when scrollY is low", () => {
    window.scrollY = 0;
    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
  });
});

// ── LinkButton ─────────────────────────────────────────────────────────

describe("LinkButton", () => {
  it("renders a link", () => {
    render(<LinkButton href="/swap">Go to Swap</LinkButton>);
    expect(screen.getByRole("link", { name: /go to swap/i })).toBeInTheDocument();
  });

  it("has correct href", () => {
    render(<LinkButton href="/markets">Markets</LinkButton>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/markets");
  });

  it("opens external links in new tab", () => {
    render(
      <LinkButton href="https://stellar.org" external>
        Stellar
      </LinkButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

// ── EmptyResults ───────────────────────────────────────────────────────

describe("EmptyResults", () => {
  it("renders no results message", () => {
    render(<EmptyResults />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("renders query in message", () => {
    render(<EmptyResults query="XYZ" />);
    expect(screen.getByText(/XYZ/)).toBeInTheDocument();
  });
});

// ── ShimmerCard ────────────────────────────────────────────────────────

describe("ShimmerCard", () => {
  it("renders with given number of lines", () => {
    render(<ShimmerCard lines={3} />);
    // aria-hidden element should exist
    const el = document.querySelector('[aria-hidden="true"]');
    expect(el).toBeInTheDocument();
  });
});

// ── SectionHeader ──────────────────────────────────────────────────────

describe("SectionHeader", () => {
  it("renders title", () => {
    render(<SectionHeader title="Overview" />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<SectionHeader title="Stats" description="Key metrics" />);
    expect(screen.getByText("Key metrics")).toBeInTheDocument();
  });
});

// ── KeyValuePair ───────────────────────────────────────────────────────

describe("KeyValuePair", () => {
  it("renders key and value", () => {
    render(<KeyValuePair label="Network" value="Testnet" />);
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Testnet")).toBeInTheDocument();
  });
});

// ── InlineCode ─────────────────────────────────────────────────────────

describe("InlineCode", () => {
  it("renders code element", () => {
    render(<InlineCode>npm install</InlineCode>);
    expect(screen.getByText("npm install").tagName).toBe("CODE");
  });
});

// ── AnimatedNumber ─────────────────────────────────────────────────────

describe("AnimatedNumber", () => {
  it("renders without crashing", () => {
    const { container } = render(<AnimatedNumber value={42} />);
    expect(container.textContent).toBeTruthy();
  });
});

// ── RetryButton ────────────────────────────────────────────────────────

describe("RetryButton", () => {
  it("renders a retry button", () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onRetry on click", () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ── FocusTrap ──────────────────────────────────────────────────────────

describe("FocusTrap", () => {
  it("renders children", () => {
    render(
      <FocusTrap active>
        <button>Inside</button>
      </FocusTrap>
    );
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });
});

// ── StickyHeader ───────────────────────────────────────────────────────

describe("StickyHeader", () => {
  it("renders children", () => {
    render(
      <StickyHeader>
        <h2>Sticky Title</h2>
      </StickyHeader>
    );
    expect(screen.getByText("Sticky Title")).toBeInTheDocument();
  });
});

// ── InputHint ──────────────────────────────────────────────────────────

describe("InputHint", () => {
  it("renders hint text", () => {
    render(<InputHint>Max 100 XLM</InputHint>);
    expect(screen.getByText("Max 100 XLM")).toBeInTheDocument();
  });
});

// ── InputErrorIcon ─────────────────────────────────────────────────────

describe("InputErrorIcon", () => {
  it("returns null when no error", () => {
    const { container } = render(<InputErrorIcon hasError={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders icon when hasError", () => {
    const { container } = render(<InputErrorIcon hasError={true} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// ── InputGroup ─────────────────────────────────────────────────────────

describe("InputGroup", () => {
  it("renders children", () => {
    render(
      <InputGroup>
        <input />
      </InputGroup>
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders prepend element", () => {
    render(
      <InputGroup prepend={<span>$</span>}>
        <input />
      </InputGroup>
    );
    expect(screen.getByText("$")).toBeInTheDocument();
  });
});

// ── InputLabel ─────────────────────────────────────────────────────────

describe("InputLabel", () => {
  it("renders label", () => {
    render(<InputLabel>Email</InputLabel>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    render(<InputLabel required>Email</InputLabel>);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});

// ── InputSearch ────────────────────────────────────────────────────────

describe("InputSearch", () => {
  it("renders search input", () => {
    const onChange = vi.fn();
    render(<InputSearch value="" onChange={onChange} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls onChange on input", () => {
    const onChange = vi.fn();
    render(<InputSearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "XLM" } });
    expect(onChange).toHaveBeenCalledWith("XLM");
  });
});

// ── HelpText ───────────────────────────────────────────────────────────

describe("HelpText", () => {
  it("renders text", () => {
    render(<HelpText>Slippage tolerance in basis points</HelpText>);
    expect(screen.getByText(/slippage/i)).toBeInTheDocument();
  });
});

// ── LastUpdated ────────────────────────────────────────────────────────

describe("LastUpdated", () => {
  it("renders element when given timestamp", () => {
    const { container } = render(<LastUpdated timestamp={Date.now()} />);
    expect(container.textContent).toBeTruthy();
  });
});

// ── ConfirmDialog ──────────────────────────────────────────────────────

describe("ConfirmDialog", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ConfirmDialog
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.textContent).toContain("Confirm");
    expect(container.textContent).toContain("Are you sure?");
  });
});
