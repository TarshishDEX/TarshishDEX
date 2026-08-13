import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// =========================================================================
// Pagination
// =========================================================================
vi.mock("@/components/ui/button", () => ({
  Button: (props: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      data-variant={props.variant}
      data-size={props.size}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  ),
}));

import { Pagination } from "@/components/ui/pagination";

describe("Pagination", () => {
  it("returns null when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all page numbers for small totals", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByLabelText(`Page ${n}`)).toBeTruthy();
    }
  });

  it("renders ellipses for large totals", () => {
    render(<Pagination page={5} totalPages={20} onPageChange={() => {}} />);
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Page 1")).toBeTruthy();
    expect(screen.getByLabelText("Page 20")).toBeTruthy();
  });

  it("disables prev on first page and next on last page", () => {
    const { rerender } = render(<Pagination page={1} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Previous page")).toHaveProperty("disabled", true);
    rerender(<Pagination page={10} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Next page")).toHaveProperty("disabled", true);
  });

  it("fires onPageChange when navigating", () => {
    const onChange = vi.fn();
    render(<Pagination page={5} totalPages={10} onPageChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onChange).toHaveBeenCalledWith(6);
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByLabelText("Page 4"));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

// =========================================================================
// AnimatedNumber
// =========================================================================
import { AnimatedNumber } from "@/components/ui/animated-number";

describe("AnimatedNumber", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the initial value", () => {
    render(<AnimatedNumber value={1.5} />);
    expect(screen.getByText("1.500000")).toBeTruthy();
  });

  it("uses a custom formatter", () => {
    render(<AnimatedNumber value={1000} format={(v) => `$${Math.round(v)}`} />);
    expect(screen.getByText("$1000")).toBeTruthy();
  });

  it("animates on value change", async () => {
    let time = 0;
    const frames: Array<(now: number) => void> = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(performance, "now").mockImplementation(() => time);
    const { rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={10} />);
    // Pump up to 10 rAF frames (durationMs = 400, eased to 1 after ~5 frames).
    for (let i = 0; i < 10; i++) {
      time += 100;
      const cb = frames.shift();
      cb?.(time);
      await Promise.resolve();
    }
    await waitFor(() => {
      expect(screen.getByText(/10\.000000/)).toBeTruthy();
    });
  });
});

// =========================================================================
// DropdownMenu
// =========================================================================
import { DropdownMenu } from "@/components/ui/dropdown-menu";

const ITEMS = [
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete", danger: true },
];

describe("DropdownMenu", () => {
  it("toggles open on trigger click and selects items", () => {
    const onSelect = vi.fn();
    render(<DropdownMenu trigger={<span>menu</span>} items={ITEMS} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Edit")).toBeTruthy();
    fireEvent.click(screen.getByText("Delete"));
    expect(onSelect).toHaveBeenCalledWith("delete");
    expect(screen.queryByText("Edit")).toBeNull();
  });

  it("closes on outside click and Escape", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={ITEMS} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Edit")).toBeNull();
  });

  it("supports keyboard navigation with Enter", () => {
    const onSelect = vi.fn();
    render(<DropdownMenu trigger={<span>menu</span>} items={ITEMS} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("edit");
  });

  it("applies right alignment class by default", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={ITEMS} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("right-0");
  });
});

// =========================================================================
// AddressDisplay
// =========================================================================
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/hooks/use-copy-to-clipboard", () => ({
  useCopyToClipboard: () => ({ copy: vi.fn(), copied: false }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  truncateAddress: (a: string, lead = 6, tail = 6) => `${a.slice(0, lead)}…${a.slice(-tail)}`,
}));

import { AddressDisplay } from "@/components/ui/address-display";

const FULL_ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("AddressDisplay", () => {
  it("truncates by default", () => {
    render(<AddressDisplay address={FULL_ADDR} />);
    expect(screen.getByText(/^GAAAAA/)).toBeTruthy();
    expect(screen.getByLabelText(`Copy address ${FULL_ADDR}`)).toBeTruthy();
  });

  it("shows the full address when truncate is false", () => {
    render(<AddressDisplay address={FULL_ADDR} truncate={false} />);
    expect(screen.getByText(FULL_ADDR)).toBeTruthy();
  });
});

// =========================================================================
// Avatar
// =========================================================================
import { Avatar } from "@/components/ui/avatar";

describe("Avatar", () => {
  it("renders initials from fallback", () => {
    render(<Avatar alt="user" fallback="Alice" />);
    expect(screen.getByLabelText("user")).toBeTruthy();
    expect(screen.getByText("AL")).toBeTruthy();
  });

  it("renders initials from alt when no fallback", () => {
    render(<Avatar alt="bob" />);
    expect(screen.getByText("BO")).toBeTruthy();
  });
});

// =========================================================================
// cors + analytics libs
// =========================================================================
import { OPTIONS, getAllowedOrigin, ALLOWED_ORIGINS } from "@/lib/api/cors";

describe("cors", () => {
  it("returns 204 with CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("DELETE");
  });

  it("allows known origins", () => {
    const req = new Request("http://localhost:3000/api/x", {
      headers: { origin: "https://tarshishdex.com" },
    }) as never;
    expect(getAllowedOrigin(req as never)).toBe("https://tarshishdex.com");
  });

  it("falls back to first allowed origin for unknown origins", () => {
    const req = new Request("http://localhost:3000/api/x", {
      headers: { origin: "https://evil.example.com" },
    }) as never;
    expect(getAllowedOrigin(req as never)).toBe(ALLOWED_ORIGINS[0]);
  });

  it("returns '*' for missing origin in development", () => {
    const original = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");
    const req = new Request("http://localhost:3000/api/x") as never;
    expect(getAllowedOrigin(req as never)).toBe("*");
    if (original !== undefined) vi.stubEnv("NODE_ENV", original);
    else vi.unstubAllEnvs();
  });
});

import { Analytics } from "@/lib/analytics";

describe("analytics", () => {
  it("renders nothing outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { container } = render(<Analytics />);
    expect(container.firstChild).toBeNull();
    vi.unstubAllEnvs();
  });
});

// =========================================================================
// hooks: use-token-balance, use-is-client, use-local-storage, use-portfolio-pnl
// =========================================================================
const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  QueryClient: class {
    constructor() {}
  },
  QueryClientProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/stellar/queries", () => ({
  useTokenBalance: (address: string, code: string) => useQueryMock(address, code),
}));

import { useTokenBalance } from "@/lib/hooks/use-token-balance";

describe("useTokenBalance", () => {
  it("returns balance from the query", () => {
    useQueryMock.mockReturnValue({ data: "123", isLoading: false });
    const { result } = renderHook(() =>
      useTokenBalance(VALID_ADDRESS, { code: "USDC", issuer: "GISSUER" })
    );
    expect(result.current).toEqual({ data: "123", isLoading: false });
  });

  it("passes null asset through", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    const { result } = renderHook(() => useTokenBalance(VALID_ADDRESS, null));
    expect(result.current.data).toBeNull();
  });
});

import { useIsClient } from "@/lib/hooks/use-is-client";

describe("useIsClient", () => {
  it("starts false then becomes true after mount", () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });
});

import { useLocalStorage } from "@/lib/hooks/use-local-storage";

describe("useLocalStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns default value when empty", () => {
    const { result } = renderHook(() => useLocalStorage("key-1", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("reads existing value and persists updates", () => {
    localStorage.setItem("key-2", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("key-2", "default"));
    expect(result.current[0]).toBe("stored");
    act(() => {
      result.current[1]("updated");
    });
    expect(JSON.parse(localStorage.getItem("key-2") ?? "null")).toBe("updated");
  });
});

import { usePortfolioPnL } from "@/lib/hooks/use-portfolio-pnl";

describe("usePortfolioPnL", () => {
  beforeEach(() => localStorage.clear());

  it("computes PnL without cost basis", () => {
    const { result } = renderHook(() =>
      usePortfolioPnL([
        {
          token: { code: "XLM", isNative: true },
          balance: "10",
          valueInXlm: 100,
        },
      ] as never)
    );
    expect(result.current.totalPnl).toBe(0);
    expect(result.current.pnlByAsset[0]?.pnl).toBeNull();
  });

  it("computes PnL with stored cost basis", () => {
    localStorage.setItem(
      "tarshishdex-cost-basis",
      JSON.stringify({ XLM: { totalCostXlm: 50, totalAmount: 10 } })
    );
    const { result } = renderHook(() =>
      usePortfolioPnL([
        {
          token: { code: "XLM", isNative: true },
          balance: "10",
          valueInXlm: 100,
        },
      ] as never)
    );
    expect(result.current.pnlByAsset[0]?.pnl).toBe(50);
  });

  it("setCostBasis persists to localStorage", () => {
    const { result } = renderHook(() => usePortfolioPnL([]));
    act(() => {
      result.current.setCostBasis("USDC", "GISSUER", 200, 100);
    });
    const stored = JSON.parse(localStorage.getItem("tarshishdex-cost-basis") ?? "{}");
    expect(stored["USDC:GISSUER"]).toEqual({ totalCostXlm: 200, totalAmount: 100 });
  });
});
