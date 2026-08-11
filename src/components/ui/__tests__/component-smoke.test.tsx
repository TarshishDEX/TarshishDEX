import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Button ──────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });
});

// ── Badge ───────────────────────────────────────────────────────────────
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeDefined();
  });
});

// ── Card ────────────────────────────────────────────────────────────────
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeDefined();
  });
});

// ── Input ───────────────────────────────────────────────────────────────
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeDefined();
  });
});

// ── Label ───────────────────────────────────────────────────────────────
import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeDefined();
  });
});

// ── Separator ───────────────────────────────────────────────────────────
import { Separator } from "@/components/ui/separator";

describe("Separator", () => {
  it("renders without crashing", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── Divider ─────────────────────────────────────────────────────────────
import { Divider } from "@/components/ui/divider";

describe("Divider", () => {
  it("renders without crashing", () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── Spinner ─────────────────────────────────────────────────────────────
import { Spinner } from "@/components/ui/spinner";

describe("Spinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── Switch ──────────────────────────────────────────────────────────────
import { Switch } from "@/components/ui/switch";

describe("Switch", () => {
  it("renders without crashing", () => {
    const { container } = render(<Switch />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── Checkbox ────────────────────────────────────────────────────────────
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("renders without crashing", () => {
    const { container } = render(<Checkbox />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── ProgressBar ─────────────────────────────────────────────────────────
import { ProgressBar } from "@/components/ui/progress-bar";

describe("ProgressBar", () => {
  it("renders with value", () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── Skeleton ────────────────────────────────────────────────────────────
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeDefined();
  });
});

// ── LoadingDots ─────────────────────────────────────────────────────────
import { LoadingDots } from "@/components/ui/loading-dots";

describe("LoadingDots", () => {
  it("renders without crashing", () => {
    const { container } = render(<LoadingDots />);
    expect(container.firstChild).toBeDefined();
  });
});
