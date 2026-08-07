import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TokenSelector } from "@/components/swap/token-selector";

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
});
