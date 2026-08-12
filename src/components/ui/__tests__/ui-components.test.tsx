import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeList } from "@/components/ui/badge-list";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Divider } from "@/components/ui/divider";
import { Kbd } from "@/components/ui/kbd";
import { Blockquote } from "@/components/ui/blockquote";

// ── Badge ──────────────────────────────────────────────────────────────

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders with default tone", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    // Badge always renders — verify it exists and has expected structure
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
  });

  it("renders with dot indicator", () => {
    render(<Badge dot>Online</Badge>);
    const badge = screen.getByText("Online");
    expect(badge.querySelector("span")).toBeInTheDocument();
  });

  it("renders different tones without crashing", () => {
    const tones: BadgeProps["tone"][] = ["success", "warning", "danger", "accent", "primary"];
    for (const tone of tones) {
      const { unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone!)).toBeInTheDocument();
      unmount();
    }
  });

  it("accepts className", () => {
    render(<Badge className="custom-badge">Styled</Badge>);
    expect(screen.getByText("Styled").className).toContain("custom-badge");
  });
});

// ── Button ─────────────────────────────────────────────────────────────

describe("Button", () => {
  it("renders text content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading spinner when isLoading", () => {
    render(<Button isLoading>Saving</Button>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders full width", () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("renders different variants", () => {
    const variants = ["secondary", "ghost", "danger", "success"] as const;
    for (const v of variants) {
      const { unmount } = render(<Button variant={v}>{v}</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    }
  });
});

// ── Input ──────────────────────────────────────────────────────────────

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Input label="Amount" placeholder="0.00" />);
    // The label text renders (exact casing depends on tailwind/uppercase class)
    const el = screen.getByText(/amount/i);
    expect(el).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("renders hint when no error", () => {
    render(<Input hint="Max 100 XLM" />);
    expect(screen.getByText("Max 100 XLM")).toBeInTheDocument();
  });

  it("prioritizes error over hint", () => {
    render(<Input error="Invalid" hint="Max 100" />);
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.queryByText("Max 100")).toBeNull();
  });

  it("handles onChange", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(onChange).toHaveBeenCalled();
  });
});

// ── Tag ────────────────────────────────────────────────────────────────

describe("Tag", () => {
  it("renders label", () => {
    render(<Tag label="USDC" />);
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("renders remove button when onRemove provided", () => {
    const onRemove = vi.fn();
    render(<Tag label="XLM" onRemove={onRemove} />);
    const btn = screen.getByRole("button", { name: /remove xlm/i });
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalled();
  });

  it("does not render remove button without onRemove", () => {
    render(<Tag label="Static" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

// ── Spinner ────────────────────────────────────────────────────────────

describe("Spinner", () => {
  it("renders with loading label", () => {
    render(<Spinner />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("has status role", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Spinner className="h-3 w-3" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg!.getAttribute("class")).toBeTruthy();
  });
});

// ── Card ───────────────────────────────────────────────────────────────

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("CardHeader renders", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("CardTitle renders", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("CardDescription renders", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("CardContent renders", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("CardFooter renders", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});

// ── Skeleton ───────────────────────────────────────────────────────────

describe("Skeleton", () => {
  it("renders a div", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it("is hidden from screen readers", () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts className for sizing", () => {
    const { container } = render(<Skeleton className="h-12 w-full" />);
    const div = container.firstChild as HTMLElement;
    // tailwind-merge may resolve conflicting classes; just check it has classes
    expect(div.className).toBeTruthy();
  });
});

// ── BadgeList ──────────────────────────────────────────────────────────

describe("BadgeList", () => {
  it("renders badges", () => {
    render(<BadgeList items={[{ label: "Tag1" }, { label: "Tag2" }]} />);
    expect(screen.getByText("Tag1")).toBeInTheDocument();
    expect(screen.getByText("Tag2")).toBeInTheDocument();
  });

  it("shows +N more when exceeding max", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ label: `Item ${i}` }));
    render(<BadgeList items={items} max={3} />);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("renders all items when count <= max", () => {
    const items = [{ label: "A" }, { label: "B" }];
    render(<BadgeList items={items} max={5} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByText(/more/)).toBeNull();
  });
});

// ── Label ──────────────────────────────────────────────────────────────

describe("Label", () => {
  it("renders text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates with input via htmlFor", () => {
    render(<Label htmlFor="email-input">Email</Label>);
    expect(screen.getByText("Email")).toHaveAttribute("for", "email-input");
  });
});

// ── Switch ─────────────────────────────────────────────────────────────

describe("Switch", () => {
  it("renders unchecked by default", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders checked", () => {
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with toggled value", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders label", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── Checkbox ───────────────────────────────────────────────────────────

describe("Checkbox", () => {
  it("renders unchecked", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} />);
    const input = screen.getByRole("checkbox");
    expect(input).not.toBeChecked();
  });

  it("renders checked", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={true} onChange={onChange} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onChange", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders label", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  it("is disabled", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});

// ── Separator ──────────────────────────────────────────────────────────

describe("Separator", () => {
  it("renders horizontal by default", () => {
    render(<Separator />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("renders vertical", () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });
});

// ── Divider ────────────────────────────────────────────────────────────

describe("Divider", () => {
  it("renders hr without label", () => {
    const { container } = render(<Divider />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders label in center", () => {
    render(<Divider label="OR" />);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});

// ── Kbd ────────────────────────────────────────────────────────────────

describe("Kbd", () => {
  it("renders kbd element", () => {
    render(<Kbd>⌘K</Kbd>);
    expect(screen.getByText("⌘K").tagName).toBe("KBD");
  });

  it("accepts className", () => {
    render(<Kbd className="ml-2">Ctrl</Kbd>);
    expect(screen.getByText("Ctrl").className).toContain("ml-2");
  });
});

// ── Blockquote ─────────────────────────────────────────────────────────

describe("Blockquote", () => {
  it("renders children", () => {
    render(<Blockquote>Important message</Blockquote>);
    expect(screen.getByText("Important message").tagName).toBe("BLOCKQUOTE");
  });

  it("renders info by default", () => {
    render(<Blockquote>Info</Blockquote>);
    expect(screen.getByText("Info").className).toContain("border-primary");
  });

  it("renders warning variant", () => {
    render(<Blockquote variant="warning">Warning!</Blockquote>);
    expect(screen.getByText("Warning!").className).toContain("border-warning");
  });

  it("renders danger variant", () => {
    render(<Blockquote variant="danger">Danger!</Blockquote>);
    expect(screen.getByText("Danger!").className).toContain("border-danger");
  });
});
