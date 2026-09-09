import { describe, it, expect, vi, afterEach } from "vitest";

// Issue #20 regression tests: the SSE route must never leak timers when a
// client disconnects, whether gracefully (stream cancel) or abruptly (abort).
describe("GET /api/events SSE cleanup", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function readInitialEvent(body: ReadableStream<Uint8Array>) {
    // Pull the stream's first chunk (the "connected" event).
    const reader = body.getReader();
    return reader.read().then(({ value }) => new TextDecoder().decode(value ?? new Uint8Array()));
  }

  it("emits a connected event and schedules heartbeat + max-duration timers", async () => {
    vi.useFakeTimers();
    const { GET } = await import("@/app/api/events/route");
    const controller = new AbortController();
    const request = new Request("http://localhost/api/events", { signal: controller.signal });
    const response = await GET(request);

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    await expect(readInitialEvent(response.body!)).resolves.toContain("event: connected");

    // Heartbeat (30s) + max duration (10 min) are scheduled.
    expect(vi.getTimerCount()).toBe(2);
  });

  it("clears every timer when the client aborts the connection", async () => {
    vi.useFakeTimers();
    const { GET } = await import("@/app/api/events/route");
    const controller = new AbortController();
    const request = new Request("http://localhost/api/events", { signal: controller.signal });
    await GET(request);

    expect(vi.getTimerCount()).toBe(2);
    controller.abort();
    // Abrupt disconnect must not leak the heartbeat interval or the
    // max-duration timeout.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears every timer when the stream is cancelled", async () => {
    vi.useFakeTimers();
    const { GET } = await import("@/app/api/events/route");
    const request = new Request("http://localhost/api/events");
    const response = await GET(request);

    const reader = response.body!.getReader();
    await reader.read(); // start the stream
    await reader.cancel();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops heartbeats after the stream ends (max duration)", async () => {
    vi.useFakeTimers();
    const { GET } = await import("@/app/api/events/route");
    const request = new Request("http://localhost/api/events");
    const response = await GET(request);

    // Advance past the max stream duration (10 minutes).
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(vi.getTimerCount()).toBe(0);

    // Drain the stream: heartbeats fired every 30s buffer ahead of the
    // stream-end chunk, so read until the stream closes and inspect all data.
    const reader = response.body!.getReader();
    let all = "";
    let chunk;
    while (!(chunk = await reader.read()).done) {
      all += new TextDecoder().decode(chunk.value ?? new Uint8Array());
    }
    expect(all).toContain("event: connected");
    expect(all).toContain(": heartbeat");
    expect(all).toContain("event: stream-end");
  });
});
