import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

describe("/api/weather-records/[id] route", () => {
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

  it("PATCH forwards to Laravel weather records update API", async () => {
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
            weatherRecord: {
              id: 10,
              weather_date: "2026-05-01",
              location_name: "川口",
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

    const req = new Request("http://localhost:3000/api/weather-records/10", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        weather_condition: "cloudy",
      }),
    });

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: "10" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/weather-records/10",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(json.weatherRecord.location_name).toBe("川口");
  });

  it("DELETE forwards to Laravel weather records delete API", async () => {
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

    const req = new Request("http://localhost:3000/api/weather-records/10", {
      method: "DELETE",
      headers: {
        Cookie: "laravel-session=old_session",
      },
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "10" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/weather-records/10",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
    expect(json.message).toBe("deleted");
  });
});
