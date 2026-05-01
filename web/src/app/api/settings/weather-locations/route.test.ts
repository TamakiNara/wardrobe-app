import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("/api/settings/weather-locations route", () => {
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

  it("GET forwards to Laravel weather locations API", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          locations: [
            {
              id: 1,
              name: "川口",
              is_default: true,
            },
          ],
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
      nextUrl: new URL("http://localhost:3000/api/settings/weather-locations"),
    };
    const res = await GET(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/settings/weather-locations",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.locations[0].name).toBe("川口");
  });

  it("POST forwards to Laravel weather locations API", async () => {
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
            message: "created",
            location: {
              id: 1,
              name: "川口",
              is_default: true,
            },
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/settings/weather-locations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({
          name: "川口",
        }),
      },
    );

    const res = await POST(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/weather-locations",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(res.status).toBe(201);
    expect(json.location.name).toBe("川口");
  });
});
