import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { FieldError } from "@/components/ui/field-error";
import { FormField } from "@/components/ui/form-field";
import { ListItem } from "@/components/ui/list-item";
import { Meter } from "@/components/ui/meter";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup } from "@/components/ui/radio-group";
import { ScreenReaderAnnouncement } from "@/components/ui/screen-reader-announcement";
import { ShareLink } from "@/components/ui/share-link";
import { SkipLink } from "@/components/ui/skip-link";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { AccessibleIcon } from "@/components/ui/accessible-icon";
import { BadgeCounter } from "@/components/ui/badge-counter";
import { SkeletonGroup } from "@/components/ui/skeleton-group";
import { SkeletonCircle } from "@/components/ui/skeleton-circle";

// ── CheckboxCard ───────────────────────────────────────────────────────

describe("CheckboxCard", () => {
  it("renders title", () => {
    const onChange = vi.fn();
    render(<CheckboxCard checked={false} onChange={onChange} title="Enable trading" />);
    expect(screen.getByText("Enable trading")).toBeInTheDocument();
  });

  it("renders description", () => {
    const onChange = vi.fn();
    render(
      <CheckboxCard
        checked={false}
        onChange={onChange}
        title="Notifications"
        description="Receive price alerts"
      />
    );
    expect(screen.getByText("Receive price alerts")).toBeInTheDocument();
  });

  it("calls onChange when clicked", () => {
    const onChange = vi.fn();
    render(<CheckboxCard checked={false} onChange={onChange} title="Option" />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ── FieldError ─────────────────────────────────────────────────────────

describe("FieldError", () => {
  it("renders error message", () => {
    render(<FieldError error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("returns null when no error", () => {
    const { container } = render(<FieldError />);
    expect(container.firstChild).toBeNull();
  });
});

// ── FormField ──────────────────────────────────────────────────────────

describe("FormField", () => {
  it("renders label and children", () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>
    );
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders error over hint", () => {
    render(
      <FormField label="Name" error="Invalid" hint="Max 50 chars">
        <input />
      </FormField>
    );
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.queryByText("Max 50 chars")).toBeNull();
  });

  it("renders hint when no error", () => {
    render(
      <FormField label="Name" hint="Max 50 chars">
        <input />
      </FormField>
    );
    expect(screen.getByText("Max 50 chars")).toBeInTheDocument();
  });
});

// ── ListItem ───────────────────────────────────────────────────────────

describe("ListItem", () => {
  it("renders primary text", () => {
    render(<ListItem primary="USDC Token" />);
    expect(screen.getByText("USDC Token")).toBeInTheDocument();
  });

  it("renders secondary text", () => {
    render(<ListItem primary="XLM" secondary="Stellar Lumens" />);
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
  });

  it("renders icon and action", () => {
    render(<ListItem icon={<span>🪙</span>} primary="Asset" action={<button>Select</button>} />);
    expect(screen.getByText("🪙")).toBeInTheDocument();
    expect(screen.getByText("Select")).toBeInTheDocument();
  });
});

// ── Meter ──────────────────────────────────────────────────────────────

describe("Meter", () => {
  it("renders with meter role", () => {
    render(<Meter value={50} />);
    expect(screen.getByRole("meter")).toBeInTheDocument();
  });

  it("sets aria-valuenow", () => {
    render(<Meter value={75} min={0} max={100} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "75");
  });

  it("renders label", () => {
    render(<Meter value={30} label="Gas used" />);
    expect(screen.getByText("Gas used")).toBeInTheDocument();
  });

  it("colors success when value meets optimum", () => {
    const { container } = render(<Meter value={90} optimum={80} />);
    expect(container.querySelector(".bg-success")).toBeTruthy();
  });

  it("colors warning when below optimum but above the default low", () => {
    const { container } = render(<Meter value={40} optimum={80} />);
    expect(container.querySelector(".bg-warning")).toBeTruthy();
  });

  it("colors warning when below optimum but above an explicit low", () => {
    const { container } = render(<Meter value={40} optimum={80} low={20} />);
    expect(container.querySelector(".bg-warning")).toBeTruthy();
  });

  it("colors danger when below optimum and below low", () => {
    const { container } = render(<Meter value={10} optimum={80} low={20} />);
    expect(container.querySelector(".bg-danger")).toBeTruthy();
  });

  it("colors danger above the default high without optimum", () => {
    const { container } = render(<Meter value={90} />);
    expect(container.querySelector(".bg-danger")).toBeTruthy();
  });

  it("colors danger above an explicit high without optimum", () => {
    const { container } = render(<Meter value={90} high={80} />);
    expect(container.querySelector(".bg-danger")).toBeTruthy();
  });

  it("colors warning between low and high without optimum", () => {
    const { container } = render(<Meter value={60} low={40} high={80} />);
    expect(container.querySelector(".bg-warning")).toBeTruthy();
  });

  it("colors success below the default low without optimum", () => {
    const { container } = render(<Meter value={20} />);
    expect(container.querySelector(".bg-success")).toBeTruthy();
  });
});

// ── NumberInput ────────────────────────────────────────────────────────

describe("NumberInput", () => {
  it("renders input", () => {
    const onChange = vi.fn();
    render(<NumberInput value="10" onChange={onChange} />);
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("renders label", () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} label="Amount" />);
    expect(screen.getByText(/amount/i)).toBeInTheDocument();
  });

  it("handles onChange", () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith("42");
  });

  it("shows error", () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} error="Invalid number" />);
    expect(screen.getByText("Invalid number")).toBeInTheDocument();
  });
});

// ── RadioGroup ─────────────────────────────────────────────────────────

describe("RadioGroup", () => {
  const options = [
    { value: "auto", label: "Auto", description: "Best route" },
    { value: "direct", label: "Direct", description: "Single hop" },
  ];

  it("renders options", () => {
    const onChange = vi.fn();
    render(<RadioGroup options={options} value="auto" onChange={onChange} name="route" />);
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
  });

  it("calls onChange on selection", () => {
    const onChange = vi.fn();
    render(<RadioGroup options={options} value="auto" onChange={onChange} name="route" />);
    // Click the Direct radio input
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalled();
  });
});

// ── ScreenReaderAnnouncement ───────────────────────────────────────────

describe("ScreenReaderAnnouncement", () => {
  it("renders aria-live region", () => {
    const { container } = render(<ScreenReaderAnnouncement message="Loaded" />);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});

// ── ShareLink ──────────────────────────────────────────────────────────

describe("ShareLink", () => {
  it("renders share button", () => {
    render(<ShareLink url="https://example.com" title="Check this" />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });
});

// ── SkipLink ───────────────────────────────────────────────────────────

describe("SkipLink", () => {
  it("renders a link", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
  });

  it("accepts custom href and label", () => {
    render(<SkipLink href="#nav" label="Skip to navigation" />);
    expect(screen.getByText("Skip to navigation")).toBeInTheDocument();
  });
});

// ── VisuallyHidden ─────────────────────────────────────────────────────

describe("VisuallyHidden", () => {
  it("renders children", () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    expect(screen.getByText("Hidden text")).toBeInTheDocument();
  });

  it("renders as div when specified", () => {
    render(<VisuallyHidden as="div">Block</VisuallyHidden>);
    expect(screen.getByText("Block").tagName).toBe("DIV");
  });
});

// ── AccessibleIcon ─────────────────────────────────────────────────────

describe("AccessibleIcon", () => {
  it("renders children and screen-reader label", () => {
    render(
      <AccessibleIcon label="Settings">
        <svg data-testid="icon" />
      </AccessibleIcon>
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});

// ── BadgeCounter ───────────────────────────────────────────────────────

describe("BadgeCounter", () => {
  it("renders count", () => {
    render(<BadgeCounter count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows max+ when over limit", () => {
    render(<BadgeCounter count={150} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("returns null for zero", () => {
    const { container } = render(<BadgeCounter count={0} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── SkeletonGroup ──────────────────────────────────────────────────────

describe("SkeletonGroup", () => {
  it("renders without crashing", () => {
    const { container } = render(<SkeletonGroup count={3} />);
    // SkeletonGroup renders multiple skeleton elements
    expect(container.firstChild).toBeTruthy();
  });
});

// ── SkeletonCircle ─────────────────────────────────────────────────────

describe("SkeletonCircle", () => {
  it("renders a div", () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});
