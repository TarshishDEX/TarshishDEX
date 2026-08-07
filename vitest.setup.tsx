import "@testing-library/jest-dom/vitest";
import { vi, beforeAll, afterAll } from "vitest";

beforeAll(() => {
  vi.mock("next/image", () => ({
    default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => {
      return { type: "img", props: { ...props, alt } };
    },
  }));
});

afterAll(() => {
  vi.clearAllMocks();
});
