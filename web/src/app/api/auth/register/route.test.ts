import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/register", () => {
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

  it("register成功時に 201 と user を返す", async () => {
    global.fetch = vi
      .fn()
      // 1回目: /csrf-cookie
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=test_csrf_token; Path=/; SameSite=Lax, laravel-session=test_session; Path=/; HttpOnly; SameSite=Lax",
          },
        })
      )
      // 2回目: /api/register
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "registered",
            user: {
              id: 1,
              name: "Test User",
              email: "sample.user@gmail.com",
            },
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
              "set-cookie":
                "laravel-session=new_session; Path=/; HttpOnly; SameSite=Lax",
            },
          }
        )
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "sample.user@gmail.com",
        password: "password123",
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(2);

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/csrf-cookie",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      })
    );

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": "test_csrf_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=test_csrf_token"),
        }),
        body: JSON.stringify({
          name: "Test User",
          email: "sample.user@gmail.com",
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(201);
    expect(json).toEqual({
      message: "registered",
      user: {
        id: 1,
        name: "Test User",
        email: "sample.user@gmail.com",
      },
    });

    expect(res.headers.get("set-cookie")).toContain("laravel-session");
  });

  it("Content-Type が application/json でないと 400 を返す", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: "not json",
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: "Content-Type must be application/json",
    });
  });

  it("JSON が壊れていると 400 を返す", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{invalid-json",
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: "Invalid JSON body (or empty body). Send JSON via POST.",
    });
  });

  it("csrf-cookie 取得失敗時に 502 を返す", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 500,
      })
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "sample.user@gmail.com",
        password: "password123",
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json).toEqual({
      error: "Failed to get CSRF cookie from backend.",
    });
  });

  it("XSRF-TOKEN が読めないと 502 を返す", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 204,
        headers: {
          "set-cookie": "laravel-session=test_session; Path=/; HttpOnly",
        },
      })
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "sample.user@gmail.com",
        password: "password123",
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json).toEqual({
      error: "Failed to read XSRF-TOKEN from backend response.",
    });
  });

  it("Laravel が 422 を返したら 422 をそのまま返す", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=test_csrf_token; Path=/; SameSite=Lax, laravel-session=test_session; Path=/; HttpOnly; SameSite=Lax",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "The given data was invalid.",
            errors: {
              email: ["The email has already been taken."],
            },
          }),
          {
            status: 422,
            headers: {
              "content-type": "application/json",
            },
          }
        )
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "sample.user@gmail.com",
        password: "password123",
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json).toEqual({
      message: "The given data was invalid.",
      errors: {
        email: ["The email has already been taken."],
      },
    });
  });
});