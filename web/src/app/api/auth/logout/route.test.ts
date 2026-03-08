import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
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

  it("logout成功時に 200 を返す", async () => {
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
            message: "logged_out",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie":
                "laravel-session=deleted; Path=/; HttpOnly; SameSite=Lax",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "laravel-session=test_session",
      },
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "logged_out",
    });

    expect(res.headers.get("set-cookie")).toContain("laravel-session");
  });

  it("csrf-cookie 取得失敗時に 502 を返す", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 500,
      }),
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json).toEqual({
      error: "Failed to get CSRF cookie from backend.",
    });
  });
});
