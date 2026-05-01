import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/weather-records/forecast route", () => {
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

  it("POST で Laravel の天気予報取得 API に転送する", async () => {
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
            message: "fetched",
            forecast: {
              weather_date: "2026-05-01",
              location_id: 1,
              weather_code: "cloudy_then_rain",
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
      "http://localhost:3000/api/weather-records/forecast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({
          weather_date: "2026-05-01",
          location_id: 1,
        }),
      },
    );

    const res = await POST(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/weather-records/forecast",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(json.forecast.weather_code).toBe("cloudy_then_rain");
  });
});
