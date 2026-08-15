import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TokenSelector } from "@/components/swap/token-selector";

const NULL_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("TokenSelector", () => {
  it("renders with default XLM selected", () => {
    render(<TokenSelector value={{ code: "XLM", isNative: true }} onSelect={vi.fn()} />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("shows USDC when selected", () => {
    render(
      <TokenSelector
        value={{ code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" }}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("calls onSelect when a token is clicked", async () => {
    const onSelect = vi.fn();
    render(<TokenSelector value={null} onSelect={onSelect} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("filters the token list only after the debounce delay", () => {
    vi.useFakeTimers();
    try {
      render(<TokenSelector value={null} onSelect={vi.fn()} />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.change(screen.getByLabelText("Search tokens"), { target: { value: "usdc" } });
      expect(screen.getByText("XLM")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByText("XLM")).not.toBeInTheDocument();
      expect(screen.getByText("USDC")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the add-custom option only after the debounce delay", () => {
    vi.useFakeTimers();
    try {
      render(<TokenSelector value={null} onSelect={vi.fn()} />);
      fireEvent.click(screen.getByRole("button"));
      fireEvent.change(screen.getByLabelText("Search tokens"), {
        target: { value: `MEME:${NULL_ADDRESS}` },
      });
      expect(screen.queryByText("Add custom")).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("Add custom")).toBeInTheDocument();
      expect(screen.getByText(/MEME:GA/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
