import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyStateIcon } from "@/components/ui/empty-state-icon";
import { InputErrorIcon } from "@/components/ui/input-error-icon";
import { InputGroup } from "@/components/ui/input-group";
import { InputLabel } from "@/components/ui/input-label";
import { InputSearch } from "@/components/ui/input-search";
import { LoadingDots } from "@/components/ui/loading-dots";
import { StatusMessage } from "@/components/ui/status-message";
import { ValidationSummary } from "@/components/ui/validation-summary";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { FocusTrap } from "@/components/ui/focus-trap";
import { StickyHeader } from "@/components/ui/sticky-header";
import { ChipList } from "@/components/ui/chip-list";
import { CommandPalette } from "@/components/ui/command-palette";

// Mock next/navigation for CommandPalette
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── DropdownMenu ───────────────────────────────────────────────────────

describe("DropdownMenu", () => {
  const items = [
    { id: "1", label: "Edit" },
    { id: "2", label: "Delete", danger: true },
  ];

  it("renders trigger", () => {
    render(<DropdownMenu trigger="Options" items={items} onSelect={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Options");
  });

  it("opens menu on click", () => {
    const onSelect = vi.fn();
    render(<DropdownMenu trigger="Menu" items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("calls onSelect when item clicked", () => {
    const onSelect = vi.fn();
    render(<DropdownMenu trigger="Menu" items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("has aria-haspopup and aria-expanded", () => {
    render(<DropdownMenu trigger="Menu" items={items} onSelect={vi.fn()} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-haspopup", "menu");
  });
});

// ── EmptyStateIcon ─────────────────────────────────────────────────────

describe("EmptyStateIcon", () => {
  it("renders icon", () => {
    render(<EmptyStateIcon icon="📭" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  it("is aria-hidden", () => {
    const { container } = render(<EmptyStateIcon icon="🔍" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

// ── InputErrorIcon ─────────────────────────────────────────────────────

describe("InputErrorIcon", () => {
  it("returns null when no error", () => {
    const { container } = render(<InputErrorIcon hasError={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders svg when hasError", () => {
    const { container } = render(<InputErrorIcon hasError={true} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// ── InputGroup ─────────────────────────────────────────────────────────

describe("InputGroup", () => {
  it("renders children", () => {
    render(
      <InputGroup>
        <input aria-label="test" />
      </InputGroup>
    );
    expect(screen.getByLabelText("test")).toBeInTheDocument();
  });

  it("renders prepend", () => {
    render(
      <InputGroup prepend={<span>$</span>}>
        <input />
      </InputGroup>
    );
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("renders append", () => {
    render(
      <InputGroup append={<span>XLM</span>}>
        <input />
      </InputGroup>
    );
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });
});

// ── InputLabel ─────────────────────────────────────────────────────────

describe("InputLabel", () => {
  it("renders text", () => {
    render(<InputLabel>Email</InputLabel>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    render(<InputLabel required>Password</InputLabel>);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("sets htmlFor", () => {
    render(<InputLabel htmlFor="field-1">Name</InputLabel>);
    expect(screen.getByText("Name")).toHaveAttribute("for", "field-1");
  });
});

// ── InputSearch ────────────────────────────────────────────────────────

describe("InputSearch", () => {
  it("renders input", () => {
    const onChange = vi.fn();
    render(<InputSearch value="" onChange={onChange} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls onChange", () => {
    const onChange = vi.fn();
    render(<InputSearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "XLM" } });
    expect(onChange).toHaveBeenCalledWith("XLM");
  });
});

// ── LoadingDots ────────────────────────────────────────────────────────

describe("LoadingDots", () => {
  it("renders status role", () => {
    render(<LoadingDots />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has loading label", () => {
    render(<LoadingDots />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});

// ── StatusMessage ──────────────────────────────────────────────────────

describe("StatusMessage", () => {
  it("renders message", () => {
    render(<StatusMessage message="Operation successful" variant="success" />);
    expect(screen.getByText("Operation successful")).toBeInTheDocument();
  });

  it("renders info by default", () => {
    render(<StatusMessage message="Note" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders error variant", () => {
    render(<StatusMessage message="Failed" variant="error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ── ValidationSummary ──────────────────────────────────────────────────

describe("ValidationSummary", () => {
  it("returns null for empty errors", () => {
    const { container } = render(<ValidationSummary errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error list", () => {
    render(<ValidationSummary errors={["Field required", "Invalid email"]} />);
    expect(screen.getByText("Field required")).toBeInTheDocument();
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByText(/2 errors/)).toBeInTheDocument();
  });

  it("renders singular error text", () => {
    render(<ValidationSummary errors={["Required"]} />);
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
  });
});

// ── ExpandableSection ──────────────────────────────────────────────────

describe("ExpandableSection", () => {
  it("renders title", () => {
    render(<ExpandableSection title="Advanced">Content</ExpandableSection>);
    expect(screen.getByText("Advanced")).toBeInTheDocument();
  });

  it("starts closed by default", () => {
    render(<ExpandableSection title="Details">Hidden content</ExpandableSection>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click", () => {
    render(<ExpandableSection title="Details">Content</ExpandableSection>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});

// ── FocusTrap ──────────────────────────────────────────────────────────

describe("FocusTrap", () => {
  it("renders children", () => {
    render(
      <FocusTrap>
        <button>Inside</button>
      </FocusTrap>
    );
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("does not trap when inactive", () => {
    render(
      <FocusTrap active={false}>
        <button>Free</button>
      </FocusTrap>
    );
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});

// ── StickyHeader ───────────────────────────────────────────────────────

describe("StickyHeader", () => {
  it("renders children", () => {
    render(
      <StickyHeader>
        <h2>Title</h2>
      </StickyHeader>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
  });
});

// ── ChipList ───────────────────────────────────────────────────────────

describe("ChipList", () => {
  it("renders children", () => {
    render(
      <ChipList>
        <span>Tag1</span>
        <span>Tag2</span>
      </ChipList>
    );
    expect(screen.getByText("Tag1")).toBeInTheDocument();
    expect(screen.getByText("Tag2")).toBeInTheDocument();
  });
});

// ── CommandPalette ─────────────────────────────────────────────────────

describe("CommandPalette", () => {
  it("returns null when closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container.firstChild).toBeNull();
  });
});
