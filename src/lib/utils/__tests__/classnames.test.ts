import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/classnames";

describe("cn (classnames utility)", () => {
  it("merges static class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("filters falsy values", () => {
    expect(cn("text-sm", false && "hidden", undefined, null, "font-bold")).toBe(
      "text-sm font-bold"
    );
  });

  it("handles conditional classes with object-like patterns", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("resolves Tailwind conflicts via tailwind-merge", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles single class", () => {
    expect(cn("container")).toBe("container");
  });

  it("merges multiple conditional and static classes", () => {
    expect(
      cn("base-class", "px-4", true && "visible", false && "hidden", "py-2", undefined, null, "")
    ).toBe("base-class px-4 visible py-2");
  });

  it("handles numeric string class names", () => {
    expect(cn("col-span-2", "col-span-4")).toBe("col-span-4");
  });

  it("handles arbitrary Tailwind values", () => {
    expect(cn("w-[100px]", "w-[200px]")).toBe("w-[200px]");
  });
});
