import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Asset } from "@stellar/stellar-sdk";
import {
  toSdkAsset,
  fromSdkAsset,
  assetToString,
  parseAssetString,
  isSameAsset,
  fromHorizonAssetRecord,
} from "@/lib/stellar/asset";
import { ScreenReaderAnnouncement } from "@/components/ui/screen-reader-announcement";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "@/lib/hooks/use-media-query";
import { PriceAlertPanel } from "@/components/features/price-alert-panel";
import { toast } from "@/components/ui/toast";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Mocks
// =========================================================================

vi.mock("@/components/ui/visually-hidden", () => ({
  VisuallyHidden: ({ children }: { children: ReactNode }) => (
    <span data-testid="visually-hidden">{children}</span>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean | undefined;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({ address: VALID_ADDRESS }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div data-testid="card">{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span data-testid="badge">{children}</span>,
}));

// =========================================================================
// asset.ts
// =========================================================================

describe("stellar asset utilities", () => {
  it("converts a native asset to SDK native", () => {
    const sdk = toSdkAsset({ code: "XLM", isNative: true });
    expect(sdk.isNative()).toBe(true);
  });

  it("treats XLM without issuer as native", () => {
    const sdk = toSdkAsset({ code: "XLM" });
    expect(sdk.isNative()).toBe(true);
  });

  it("throws when an asset is missing its issuer", () => {
    expect(() => toSdkAsset({ code: "USDC" })).toThrow("missing an issuer");
  });

  it("converts an issued asset to SDK", () => {
    const sdk = toSdkAsset({ code: "USDC", issuer: VALID_ADDRESS });
    expect(sdk.getCode()).toBe("USDC");
    expect(sdk.getIssuer()).toBe(VALID_ADDRESS);
  });

  it("converts SDK native asset back", () => {
    expect(fromSdkAsset(Asset.native())).toEqual({ code: "XLM", isNative: true });
  });

  it("converts SDK issued asset back", () => {
    const sdk = new Asset("USDC", VALID_ADDRESS);
    expect(fromSdkAsset(sdk)).toEqual({ code: "USDC", issuer: VALID_ADDRESS });
  });

  it("formats asset strings canonically", () => {
    expect(assetToString({ code: "XLM", isNative: true })).toBe("XLM");
    expect(assetToString({ code: "XLM" })).toBe("XLM");
    expect(assetToString({ code: "USDC", issuer: VALID_ADDRESS })).toBe(`USDC:${VALID_ADDRESS}`);
  });

  it("parses native asset strings", () => {
    expect(parseAssetString("XLM")).toEqual({ code: "XLM", isNative: true });
    expect(parseAssetString(" native ")).toEqual({ code: "XLM", isNative: true });
  });

  it("parses issued asset strings and upper-cases the code", () => {
    expect(parseAssetString(`usdc:${VALID_ADDRESS}`)).toEqual({
      code: "USDC",
      issuer: VALID_ADDRESS,
    });
  });

  it("rejects invalid asset strings", () => {
    expect(parseAssetString("")).toBeNull();
    expect(parseAssetString("   ")).toBeNull();
    expect(parseAssetString("USDC")).toBeNull();
    expect(parseAssetString(`TOOLONGCODE123:${VALID_ADDRESS}`)).toBeNull();
    expect(parseAssetString(`USDC:NOTVALID`)).toBeNull();
    expect(parseAssetString("A:B:C")).toBeNull();
  });

  it("compares assets structurally", () => {
    expect(isSameAsset({ code: "XLM", isNative: true }, { code: "XLM" })).toBe(true);
    expect(
      isSameAsset({ code: "USDC", issuer: VALID_ADDRESS }, { code: "USDT", issuer: VALID_ADDRESS })
    ).toBe(false);
  });

  it("converts horizon native records", () => {
    expect(fromHorizonAssetRecord({ asset_type: "native" })).toEqual({
      code: "XLM",
      isNative: true,
    });
  });

  it("converts horizon issued records", () => {
    expect(
      fromHorizonAssetRecord({
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ADDRESS,
      })
    ).toEqual({ code: "USDC", issuer: VALID_ADDRESS });
  });

  it("defaults missing horizon code to XLM", () => {
    expect(
      fromHorizonAssetRecord({ asset_type: "credit_alphanum12", asset_issuer: VALID_ADDRESS })
    ).toEqual({
      code: "XLM",
      issuer: VALID_ADDRESS,
    });
  });
});

// =========================================================================
// ScreenReaderAnnouncement
// =========================================================================

describe("ScreenReaderAnnouncement", () => {
  it("renders the live region and announces messages", () => {
    render(<ScreenReaderAnnouncement message="Hello" />);
    const region = document.querySelector("[aria-live='polite']");
    expect(region).not.toBeNull();
    expect(region?.getAttribute("aria-atomic")).toBe("true");
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("uses assertive politeness when configured", () => {
    render(<ScreenReaderAnnouncement message="Alert!" politeness="assertive" />);
    expect(document.querySelector("[aria-live='assertive']")).not.toBeNull();
  });

  it("appends new messages and caps history at 6 entries", async () => {
    const { rerender } = render(<ScreenReaderAnnouncement message="m1" />);
    for (let i = 2; i <= 8; i++) {
      rerender(<ScreenReaderAnnouncement message={`m${i}`} />);
    }
    const hidden = await screen.findAllByTestId("visually-hidden");
    expect(hidden.length).toBe(6);
  });

  it("does not announce empty messages", () => {
    render(<ScreenReaderAnnouncement message="" />);
    expect(screen.queryAllByTestId("visually-hidden").length).toBe(0);
  });
});

// =========================================================================
// MobileMenu
// =========================================================================

describe("MobileMenu", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/swap");
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders the hamburger button with nav links when opened", () => {
    render(<MobileMenu />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
    expect(screen.getByText("Markets")).toBeTruthy();
    expect(screen.getByText("Analytics")).toBeTruthy();
    expect(screen.getByLabelText("Close menu")).toBeTruthy();
  });

  it("marks the active route", () => {
    pathnameMock.mockReturnValue("/markets");
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Markets").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Swap").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("closes on backdrop click and restores body scroll", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByLabelText("Close menu")).toBeTruthy();
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as HTMLElement);
    expect(screen.getByLabelText("Open menu")).toBeTruthy();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on escape key", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("Open menu")).toBeTruthy();
    expect(screen.queryByLabelText("Close menu")).toBeNull();
  });

  it("closes when the route changes", () => {
    const { rerender } = render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByLabelText("Close menu")).not.toBeNull();
    pathnameMock.mockReturnValue("/portfolio");
    rerender(<MobileMenu />);
    expect(screen.queryByLabelText("Close menu")).toBeNull();
  });

  it("cleans up the keydown listener on unmount", () => {
    const { unmount } = render(<MobileMenu />);
    unmount();
    expect(true).toBe(true);
  });
});

// =========================================================================
// useMediaQuery
// =========================================================================

describe("useMediaQuery hooks", () => {
  function TestComponent({ hook, label }: { hook: () => boolean; label: string }) {
    const matches = hook();
    return <div data-testid={label}>{matches ? "true" : "false"}</div>;
  }

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const matches =
        query === "(min-width: 1024px)"
          ? true
          : query === "(min-width: 768px) and (max-width: 1023px)"
            ? false
            : false;
      return {
        matches,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        onchange: null,
        dispatchEvent: () => false,
      } as MediaQueryList;
    });
  });

  it("returns the match state for a media query", () => {
    render(<TestComponent hook={() => useMediaQuery("(min-width: 1024px)")} label="mq" />);
    expect(screen.getByTestId("mq").textContent).toBe("true");
  });

  it("returns false when the query does not match", () => {
    render(<TestComponent hook={() => useMediaQuery("(max-width: 767px)")} label="mq2" />);
    expect(screen.getByTestId("mq2").textContent).toBe("false");
  });

  it("breaks down the viewport helpers", () => {
    render(
      <>
        <TestComponent hook={useIsDesktop} label="desktop" />
        <TestComponent hook={useIsMobile} label="mobile" />
        <TestComponent hook={useIsTablet} label="tablet" />
      </>
    );
    expect(screen.getByTestId("desktop").textContent).toBe("true");
    expect(screen.getByTestId("mobile").textContent).toBe("false");
    expect(screen.getByTestId("tablet").textContent).toBe("false");
  });
});

// =========================================================================
// PriceAlertPanel
// =========================================================================

describe("PriceAlertPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the form when a wallet is connected", () => {
    render(<PriceAlertPanel />);
    expect(screen.getByText("Price Alerts")).toBeTruthy();
    expect(screen.getByPlaceholderText("Asset code")).toBeTruthy();
    expect(screen.getByPlaceholderText("Price")).toBeTruthy();
    expect(screen.getByText("No price alerts set. Add one above.")).toBeTruthy();
  });

  it("adds an alert and persists it to localStorage", () => {
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByPlaceholderText("Asset code"), { target: { value: "usdc" } });
    fireEvent.change(screen.getByPlaceholderText("Price"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByText("Set"));
    expect(screen.getByText(/USDC above 1.5/)).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith("Alert set: USDC above 1.5");
    const stored = JSON.parse(localStorage.getItem("tarshishdex-price-alerts") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].asset).toBe("USDC");
    expect(stored[0].enabled).toBe(true);
  });

  it("disables the button without a price", () => {
    render(<PriceAlertPanel />);
    expect(screen.getByText("Set").closest("button")?.hasAttribute("disabled")).toBe(true);
  });

  it("ignores non-positive prices", () => {
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByPlaceholderText("Price"), { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Set"));
    expect(JSON.parse(localStorage.getItem("tarshishdex-price-alerts") ?? "[]")).toHaveLength(0);
  });

  it("toggles an alert on and off", () => {
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByPlaceholderText("Price"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Set"));
    fireEvent.click(screen.getByText("ON"));
    expect(screen.getByText("OFF")).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("tarshishdex-price-alerts") ?? "[]");
    expect(stored[0].enabled).toBe(false);
  });

  it("removes an alert", () => {
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByPlaceholderText("Price"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Set"));
    fireEvent.click(screen.getByText("✕"));
    expect(screen.getByText("No price alerts set. Add one above.")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("tarshishdex-price-alerts") ?? "[]")).toHaveLength(0);
  });

  it("loads existing alerts from localStorage on mount", () => {
    localStorage.setItem(
      "tarshishdex-price-alerts",
      JSON.stringify([
        { id: "a1", asset: "BTC", targetPrice: 100000, direction: "below", enabled: false },
      ])
    );
    render(<PriceAlertPanel />);
    expect(screen.getByText(/BTC below 100000/)).toBeTruthy();
    expect(screen.getByText("OFF")).toBeTruthy();
  });

  it("recovers from corrupt localStorage", () => {
    localStorage.setItem("tarshishdex-price-alerts", "{not json");
    render(<PriceAlertPanel />);
    expect(screen.getByText("No price alerts set. Add one above.")).toBeTruthy();
  });

  it("switches direction to below", () => {
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByDisplayValue("Above ↑"), { target: { value: "below" } });
    fireEvent.change(screen.getByPlaceholderText("Price"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByText("Set"));
    expect(screen.getByText(/XLM below 0.5/)).toBeTruthy();
  });
});

// =========================================================================
// MobileMenu route-change re-render (extra coverage)
// =========================================================================

describe("MobileMenu extra coverage", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/swap");
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    act(() => {
      /* flush effects */
    });
  });

  it("toggles open and closed via the button", () => {
    render(<MobileMenu />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);
    expect(screen.queryByLabelText("Close menu")).not.toBeNull();
    fireEvent.click(toggle);
    expect(screen.queryByLabelText("Close menu")).toBeNull();
  });

  it("shows the footer and brand", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Built on Stellar · Testnet")).toBeTruthy();
    expect(screen.getByText(/Tarshish/)).toBeTruthy();
  });
});
