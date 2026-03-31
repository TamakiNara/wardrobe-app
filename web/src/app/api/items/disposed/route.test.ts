import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/items/disposed", () => {
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

  it("Laravel の disposed items API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: 1, status: "disposed" }],
          meta: { total: 1, totalAll: 1, page: 1, lastPage: 1 },
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
      nextUrl: new URL("http://localhost:3000/api/items/disposed?page=2"),
    } as any;

    const res = await GET(req);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/items/disposed?page=2",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: "laravel-session=test_session",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(json).toEqual({
      items: [{ id: 1, status: "disposed" }],
      meta: { total: 1, totalAll: 1, page: 1, lastPage: 1 },
    });
  });
});
