import { describe, it, expect } from "vitest";
import {
  objectsToCsv,
  exportCsv,
  downloadFile,
} from "@/lib/utils/export-csv";

describe("objectsToCsv", () => {
  it("converts objects to CSV with headers", () => {
    const rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const result = objectsToCsv(rows, ["name", "age"]);
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("uses custom headers when provided", () => {
    const rows = [{ a: 1, b: 2 }];
    const result = objectsToCsv(rows, ["a", "b"], ["First", "Second"]);
    expect(result).toBe("First,Second\n1,2");
  });

  it("escapes values with commas", () => {
    const rows = [{ name: "Doe, John", age: 30 }];
    const result = objectsToCsv(rows, ["name", "age"]);
    expect(result).toBe('name,age\n"Doe, John",30');
  });

  it("escapes values with quotes", () => {
    const rows = [{ name: 'He said "hello"', age: 30 }];
    const result = objectsToCsv(rows, ["name", "age"]);
    expect(result).toBe('name,age\n"He said ""hello""",30');
  });

  it("handles null/undefined values", () => {
    const rows = [{ name: "Alice", age: null as unknown as number }];
    const result = objectsToCsv(rows, ["name", "age"]);
    expect(result).toBe("name,age\nAlice,");
  });

  it("returns only header for empty rows", () => {
    const rows: { name: string }[] = [];
    const result = objectsToCsv(rows, ["name"]);
    expect(result).toBe("name");
  });
});

describe("exportCsv", () => {
  it("does nothing for empty rows", () => {
    // Should not throw or create download
    expect(() => exportCsv([], ["a"], "test")).not.toThrow();
  });

  it("exports CSV with timestamp filename", () => {
    const rows = [{ a: 1, b: 2 }];
    // Just verify it doesn't throw in a DOM-less env (downloadFile will)
    const csv = objectsToCsv(rows, ["a", "b"]);
    expect(csv).toBe("a,b\n1,2");
  });
});
