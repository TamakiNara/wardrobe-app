import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forwardGetWithCookie,
  forwardDeleteWithCookie,
  forwardPatchWithCsrfAndCookie,
  forwardPutWithCsrfAndCookie,
} from "./laravel";

describe("BFF CSRF forwarding", () => {
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

  it("retries PUT once with refreshed csrf and session cookies after 419", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "CSRF token mismatch.",
          }),
          {
            status: 419,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=fresh_token; Path=/; SameSite=Lax, laravel-session=fresh_session; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "updated",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie":
                "laravel-session=new_session; Path=/; HttpOnly; SameSite=Lax",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/settings/categories", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session; XSRF-TOKEN=stale_token",
      },
      body: JSON.stringify({
        visibleCategoryIds: ["tops_tshirt"],
      }),
    });

    const res = await forwardPutWithCsrfAndCookie(
      req as any,
      "/api/settings/categories",
      {
        visibleCategoryIds: ["tops_tshirt"],
      },
    );
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/settings/categories",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "stale_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=stale_token"),
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/csrf-cookie",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: expect.stringContaining("laravel-session=old_session"),
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/settings/categories",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "fresh_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=fresh_token"),
        }),
      }),
    );
    expect((global.fetch as any).mock.calls[2][1].headers.Cookie).toContain(
      "laravel-session=fresh_session",
    );
    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "updated",
    });
    expect(res.headers.get("set-cookie")).toContain(
      "laravel-session=new_session",
    );
  });

  it("forwards upstream set-cookie headers on GET requests", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 1,
          name: "tester",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie":
              "laravel-session=rotated_session; Path=/; HttpOnly; SameSite=Lax",
          },
        },
      ),
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: "laravel-session=old_session",
      },
    });
    (req as any).nextUrl = new URL(req.url);

    const res = await forwardGetWithCookie(req as any, "/api/me");
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
          Cookie: "laravel-session=old_session",
        }),
        cache: "no-store",
      }),
    );
    expect(res.headers.get("set-cookie")).toContain(
      "laravel-session=rotated_session",
    );
    expect(json).toEqual({
      id: 1,
      name: "tester",
    });
  });

  it("adds csrf and refreshed session cookies to DELETE requests", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=delete_token; Path=/; SameSite=Lax, laravel-session=delete_session; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "deleted",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/items/1", {
      method: "DELETE",
      headers: {
        Cookie: "laravel-session=old_session",
      },
    });

    const res = await forwardDeleteWithCookie(req as any, "/api/items/1");
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/csrf-cookie",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/items/1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "delete_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=delete_token"),
        }),
      }),
    );
    expect((global.fetch as any).mock.calls[1][1].headers.Cookie).toContain(
      "laravel-session=delete_session",
    );
    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "deleted",
    });
  });

  it("retries PATCH once with refreshed csrf and session cookies after 419", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "CSRF token mismatch." }), {
          status: 419,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {
            "set-cookie":
              "XSRF-TOKEN=patch_token; Path=/; SameSite=Lax, laravel-session=patch_session; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "updated" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/settings/brands/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session; XSRF-TOKEN=stale_token",
      },
      body: JSON.stringify({ is_active: false }),
    });

    const res = await forwardPatchWithCsrfAndCookie(
      req as any,
      "/api/settings/brands/1",
      {
        is_active: false,
      },
    );

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/settings/brands/1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "patch_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=patch_token"),
        }),
      }),
    );
    expect(res.status).toBe(200);
  });
});
