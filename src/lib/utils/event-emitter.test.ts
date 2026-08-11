import { describe, it, expect, vi } from "vitest";
import { appEvents } from "@/lib/utils/event-emitter";

describe("TypedEventEmitter", () => {
  it("emits events to subscribed listeners", () => {
    const listener = vi.fn();
    const unsub = appEvents.on("swap:completed", listener);

    appEvents.emit("swap:completed", { txHash: "abc123" });

    expect(listener).toHaveBeenCalledWith({ txHash: "abc123" });
    unsub();
  });

  it("allows unsubscribing", () => {
    const listener = vi.fn();
    const unsub = appEvents.on("wallet:connected", listener);
    unsub();

    appEvents.emit("wallet:connected", { address: "GABC..." });
    expect(listener).not.toHaveBeenCalled();
  });

  it("handles multiple listeners for same event", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsub1 = appEvents.on("swap:completed", listener1);
    const unsub2 = appEvents.on("swap:completed", listener2);

    appEvents.emit("swap:completed", { txHash: "def456" });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("no-ops when emitting to event with no listeners", () => {
    expect(() =>
      appEvents.emit("wallet:disconnected", undefined as void)
    ).not.toThrow();
  });

  it("clear removes all listeners", () => {
    const listener = vi.fn();
    appEvents.on("price:alert", listener);
    appEvents.clear();

    appEvents.emit("price:alert", { asset: "XLM", price: 0.5 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("off removes specific listener without affecting others", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    appEvents.on("swap:completed", listener1);
    appEvents.on("swap:completed", listener2);

    appEvents.off("swap:completed", listener1);
    appEvents.emit("swap:completed", { txHash: "ghi789" });

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);

    appEvents.off("swap:completed", listener2);
  });
});
