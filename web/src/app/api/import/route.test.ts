import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/import", () => {
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

  it("Laravel の import API へ JSON を中継する", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=test_csrf_token; Path=/; SameSite=Lax, laravel-session=test_session; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "imported",
            counts: {
              items: 1,
              purchase_candidates: 2,
              outfits: 3,
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        version: 1,
        exported_at: "2026-04-24T00:00:00+09:00",
        owner: {
          user_id: 1,
        },
        items: [],
        purchase_candidates: [],
        outfits: [],
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/import",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          version: 1,
          exported_at: "2026-04-24T00:00:00+09:00",
          owner: {
            user_id: 1,
          },
          items: [],
          purchase_candidates: [],
          outfits: [],
        }),
      }),
    );
    expect(json).toEqual({
      message: "imported",
      counts: {
        items: 1,
        purchase_candidates: 2,
        outfits: 3,
      },
    });
  });
});
