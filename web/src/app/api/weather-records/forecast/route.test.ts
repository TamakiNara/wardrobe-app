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
              location_name: "川口",
              forecast_area_code: null,
              weather_code: "cloudy",
              raw_weather_code: 61,
              temperature_high: 22,
              temperature_low: 13,
              precipitation: 3.2,
              rain_sum: 3.2,
              snowfall_sum: 0,
              time_block_weather: {
                morning: "rain",
                daytime: "cloudy",
                night: "sunny",
              },
              has_rain_in_time_blocks: true,
              source_type: "forecast_api",
              source_name: "open_meteo_jma_forecast",
              source_fetched_at: "2026-05-01T10:00:00+09:00",
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
    expect(json.forecast.weather_code).toBe("cloudy");
    expect(json.forecast.raw_weather_code).toBe(61);
    expect(json.forecast.temperature_high).toBe(22);
    expect(json.forecast.temperature_low).toBe(13);
    expect(json.forecast.precipitation).toBe(3.2);
    expect(json.forecast.time_block_weather.morning).toBe("rain");
    expect(json.forecast.has_rain_in_time_blocks).toBe(true);
    expect(json.forecast.source_name).toBe("open_meteo_jma_forecast");
  });
});
