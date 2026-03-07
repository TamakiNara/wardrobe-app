import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/auth/me", () => {
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

  it("認証済みユーザーを返す", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 10,
          name: "gqsw",
          email: "sample.user@gmail.com",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: {
        cookie: "laravel-session=test_session",
      },
    });

    const res = await GET(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
          Cookie: "laravel-session=test_session",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(json).toEqual({
      id: 10,
      name: "gqsw",
      email: "sample.user@gmail.com",
    });
  });

  it("未認証時は 401 を返す", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Unauthenticated.",
        }),
        {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
    });

    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({
      message: "Unauthenticated.",
    });
  });
});
