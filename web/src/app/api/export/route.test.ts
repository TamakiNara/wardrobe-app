import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/export", () => {
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

  it("Laravel の export API へ中継する", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          version: 1,
          exported_at: "2026-04-24T00:00:00+09:00",
          owner: {
            user_id: 1,
          },
          items: [],
          purchase_candidates: [],
          outfits: [],
          wear_logs: [],
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
      headers: new Headers({
        Cookie: "laravel-session=test_session",
      }),
      nextUrl: new URL("http://localhost:3000/api/export"),
    } as any;

    const res = await GET(req);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/export",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: "laravel-session=test_session",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(json).toEqual({
      version: 1,
      exported_at: "2026-04-24T00:00:00+09:00",
      owner: {
        user_id: 1,
      },
      items: [],
      purchase_candidates: [],
      outfits: [],
      wear_logs: [],
    });
  });
});
