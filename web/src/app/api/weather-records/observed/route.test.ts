import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/weather-records/observed route", () => {
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

  it("POST で Laravel の実績取得 API に転送する", async () => {
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
            observed: {
              weather_date: "2026-05-02",
              location_id: 1,
              location_name: "川口",
              forecast_area_code: null,
              weather_code: "rain",
              raw_weather_code: 61,
              temperature_high: 22.1,
              temperature_low: 13.4,
              precipitation: 3.2,
              rain_sum: 3.2,
              snowfall_sum: 0,
              precipitation_hours: 4,
              source_type: "historical_api",
              source_name: "open_meteo_historical",
              source_fetched_at: "2026-05-03T10:00:00+09:00",
              raw_telop: null,
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
      "http://localhost:3000/api/weather-records/observed",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({
          weather_date: "2026-05-02",
          location_id: 1,
        }),
      },
    );

    const res = await POST(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/weather-records/observed",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(json.observed.weather_code).toBe("rain");
    expect(json.observed.raw_weather_code).toBe(61);
    expect(json.observed.precipitation).toBe(3.2);
    expect(json.observed.precipitation_hours).toBe(4);
    expect(json.observed.source_name).toBe("open_meteo_historical");
  });
});
