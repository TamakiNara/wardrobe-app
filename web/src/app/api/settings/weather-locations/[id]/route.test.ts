import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

describe("/api/settings/weather-locations/[id] route", () => {
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

  it("PATCH forwards to Laravel weather locations update API", async () => {
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
            message: "updated",
            location: {
              id: 3,
              name: "東京23区",
              is_default: true,
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/settings/weather-locations/3",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({
          is_default: true,
        }),
      },
    );

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "3" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/weather-locations/3",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(json.location.name).toBe("東京23区");
  });

  it("DELETE forwards to Laravel weather locations delete API", async () => {
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
        new Response(JSON.stringify({ message: "deleted" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/settings/weather-locations/3",
      {
        method: "DELETE",
        headers: {
          Cookie: "laravel-session=old_session",
        },
      },
    );

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "3" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/weather-locations/3",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
    expect(json.message).toBe("deleted");
  });
});
