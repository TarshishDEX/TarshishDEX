import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyButton } from "@/components/ui/copy-button";
import { FocusTrap } from "@/components/ui/focus-trap";
import { FileInput } from "@/components/ui/file-input";
import { objectsToCsv, downloadFile, exportCsv } from "@/lib/utils/export-csv";
import { logger } from "@/lib/server/logger";

// =========================================================================
// CopyButton
// =========================================================================
describe("CopyButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default label", () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<CopyButton text="hello" label="Copy hash" />);
    expect(screen.getByText("Copy hash")).toBeInTheDocument();
  });

  it("copies text to clipboard and shows Copied", async () => {
    render(<CopyButton text="secret-token" />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("secret-token");
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("resets Copied state after 2 seconds", async () => {
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(screen.getByText("Copied")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("falls back to execCommand when clipboard fails", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    document.execCommand = vi.fn(() => true) as never;
    render(<CopyButton text="fallback-text" />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<CopyButton text="x" className="copy-custom" />);
    expect(screen.getByText("Copy").closest("button")).toHaveClass("copy-custom");
  });
});

// =========================================================================
// FocusTrap
// =========================================================================
describe("FocusTrap", () => {
  it("renders children", () => {
    render(
      <FocusTrap>
        <button>First</button>
      </FocusTrap>
    );
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("focuses first focusable element on mount", () => {
    render(
      <FocusTrap>
        <button data-testid="first-btn">First</button>
        <button>Second</button>
      </FocusTrap>
    );
    expect(screen.getByTestId("first-btn")).toHaveFocus();
  });

  it("cycles focus from first to last on Shift+Tab", () => {
    render(
      <FocusTrap>
        <button data-testid="first-btn">First</button>
        <button data-testid="last-btn">Last</button>
      </FocusTrap>
    );
    const firstBtn = screen.getByTestId("first-btn");
    firstBtn.focus();
    fireEvent.keyDown(firstBtn, { key: "Tab", shiftKey: true });
    expect(screen.getByTestId("last-btn")).toHaveFocus();
  });

  it("cycles focus from last to first on Tab", () => {
    render(
      <FocusTrap>
        <button data-testid="first-btn">First</button>
        <button data-testid="last-btn">Last</button>
      </FocusTrap>
    );
    const lastBtn = screen.getByTestId("last-btn");
    lastBtn.focus();
    fireEvent.keyDown(lastBtn, { key: "Tab", shiftKey: false });
    expect(screen.getByTestId("first-btn")).toHaveFocus();
  });

  it("does nothing when inactive", () => {
    render(
      <FocusTrap active={false}>
        <button data-testid="btn">First</button>
      </FocusTrap>
    );
    // No focus forced
    expect(screen.getByTestId("btn")).not.toHaveFocus();
  });

  it("does not trap when no focusable elements", () => {
    render(
      <FocusTrap>
        <div>No buttons here</div>
      </FocusTrap>
    );
    expect(screen.getByText("No buttons here")).toBeInTheDocument();
  });
});

// =========================================================================
// FileInput
// =========================================================================
describe("FileInput", () => {
  it("renders label", () => {
    render(<FileInput onChange={vi.fn()} />);
    expect(screen.getByText("Choose file")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<FileInput onChange={vi.fn()} label="Upload CSV" />);
    expect(screen.getByText("Upload CSV")).toBeInTheDocument();
  });

  it("shows selected file name", () => {
    render(<FileInput onChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(["content"], "data.csv", { type: "text/csv" });
    fireEvent.change(input!, { target: { files: [file] } });
    expect(screen.getByText("data.csv")).toBeInTheDocument();
  });

  it("calls onChange with selected file", () => {
    const onChange = vi.fn();
    render(<FileInput onChange={onChange} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(["content"], "report.csv", { type: "text/csv" });
    fireEvent.change(input!, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith(file);
  });

  it("calls onChange with null when no file", () => {
    const onChange = vi.fn();
    render(<FileInput onChange={onChange} />);
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [] } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

// =========================================================================
// export-csv
// =========================================================================
describe("export-csv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("objectsToCsv creates header row", () => {
    const csv = objectsToCsv([{ name: "Alice", age: 30 }], ["name", "age"]);
    expect(csv).toContain("name,age");
    expect(csv).toContain("Alice,30");
  });

  it("objectsToCsv uses custom headers", () => {
    const csv = objectsToCsv([{ name: "A" }], ["name"], ["Full Name"]);
    expect(csv).toContain("Full Name");
  });

  it("objectsToCsv escapes commas and quotes", () => {
    const csv = objectsToCsv([{ note: 'He said "hi", ok' }], ["note"]);
    expect(csv).toContain('"He said ""hi"", ok"');
  });

  it("objectsToCsv handles missing values as empty", () => {
    const csv = objectsToCsv([{ a: 1, b: undefined }], ["a", "b"]);
    expect(csv).toContain("1,");
  });

  it("downloadFile creates and clicks an anchor", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const blobSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    downloadFile("a,b", "data.csv");
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    revokeSpy.mockRestore();
    blobSpy.mockRestore();
  });

  it("exportCsv skips empty rows", () => {
    const downloadSpy = vi.spyOn(URL, "createObjectURL");
    exportCsv([], ["a"], "name");
    expect(downloadSpy).not.toHaveBeenCalled();
    downloadSpy.mockRestore();
  });

  it("exportCsv downloads with timestamped filename", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    exportCsv([{ a: 1 }], ["a"], "portfolio");
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});

// =========================================================================
// logger
// =========================================================================
describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("has all level methods", () => {
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("info logs JSON with level and message", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("hello world");
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0]?.[0] as string;
    expect(arg).toContain('"level":"info"');
    expect(arg).toContain('"message":"hello world"');
  });

  it("error logs with meta", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("boom", { code: 500 });
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0]?.[0] as string;
    expect(arg).toContain('"code":500');
  });
});
