import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/wear-logs/by-date route", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.LARAVEL_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.LARAVEL_BASE_URL = "http://localhost:8000";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.LARAVEL_BASE_URL = originalEnv;
  });

  it("GET は Laravel の wear log by-date API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event_date: "2026-03-05",
          wearLogs: [],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    ) as typeof fetch;

    const req = {
      headers: new Headers(),
      nextUrl: new URL(
        "http://localhost:3000/api/wear-logs/by-date?event_date=2026-03-05",
      ),
    };
    const res = await GET(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/wear-logs/by-date?event_date=2026-03-05",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.event_date).toBe("2026-03-05");
  });
});
