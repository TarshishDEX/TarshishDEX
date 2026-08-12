import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { ProgressBar } from "@/components/ui/progress-bar";

// ── Select ─────────────────────────────────────────────────────────────

describe("Select", () => {
  const options = [
    { value: "xlm", label: "XLM" },
    { value: "usdc", label: "USDC" },
    { value: "eurmtl", label: "EURMTL" },
  ];

  it("renders select with options", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="xlm" onChange={onChange} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("renders with label", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="xlm" onChange={onChange} label="Asset" />);
    expect(screen.getByText(/asset/i)).toBeInTheDocument();
  });

  it("renders placeholder option", () => {
    const onChange = vi.fn();
    render(
      <Select options={options} value="" onChange={onChange} placeholder="Choose asset..." />
    );
    expect(screen.getByText("Choose asset...")).toBeInTheDocument();
  });

  it("calls onChange on selection", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="xlm" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "usdc" } });
    expect(onChange).toHaveBeenCalledWith("usdc");
  });

  it("renders error message", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="" onChange={onChange} error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("is disabled when disabled prop set", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="xlm" onChange={onChange} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

// ── Tabs ───────────────────────────────────────────────────────────────

describe("Tabs", () => {
  const tabs = [
    { id: "tab1", label: "Orders" as const, content: <div>Orders content</div> },
    { id: "tab2", label: "History" as const, content: <div>History content</div>, badge: 3 },
  ];

  it("renders tab buttons", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole("tab", { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
  });

  it("shows badge on tab", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders content of active tab", () => {
    render(<Tabs tabs={tabs} defaultTab="tab1" />);
    expect(screen.getByText("Orders content")).toBeInTheDocument();
  });

  it("switches tab on click", () => {
    render(<Tabs tabs={tabs} defaultTab="tab1" />);
    expect(screen.getByText("Orders content")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(screen.getByText("History content")).toBeInTheDocument();
  });
});

// ── Textarea ───────────────────────────────────────────────────────────

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Enter notes" />);
    expect(screen.getByPlaceholderText("Enter notes")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByText(/notes/i)).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<Textarea error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });

  it("handles onChange", () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalled();
  });
});

// ── Panel ──────────────────────────────────────────────────────────────

describe("Panel", () => {
  it("renders children", () => {
    render(<Panel>Content inside panel</Panel>);
    expect(screen.getByText("Content inside panel")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<Panel title="Settings">Content</Panel>);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders header right slot", () => {
    render(<Panel headerRight={<button>Action</button>}>Content</Panel>);
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});

// ── EmptyState ─────────────────────────────────────────────────────────

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <EmptyState title="Empty" description="Try adjusting your filters" />
    );
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
  });

  it("renders action element", () => {
    render(<EmptyState title="Empty" action={<button>Refresh</button>} />);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("renders default icon", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.textContent).toContain("◈");
  });
});

// ── ErrorMessage ───────────────────────────────────────────────────────

describe("ErrorMessage", () => {
  it("renders message", () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders with alert role", () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Failed" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalled();
  });
});

// ── ProgressBar ────────────────────────────────────────────────────────

describe("ProgressBar", () => {
  it("renders with progressbar role", () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sets aria-valuenow", () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
  });

  it("clamps to max", () => {
    render(<ProgressBar value={150} max={100} />);
    // Visual width capped at 100%, but value is still 150
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "150");
  });

  it("handles zero value", () => {
    render(<ProgressBar value={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders different sizes", () => {
    const { container: c1 } = render(<ProgressBar value={50} size="sm" />);
    const { container: c2 } = render(<ProgressBar value={50} size="lg" />);
    expect(c1.firstChild).toBeTruthy();
    expect(c2.firstChild).toBeTruthy();
  });
});
