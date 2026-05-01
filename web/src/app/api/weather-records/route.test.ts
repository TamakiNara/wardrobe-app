import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("/api/weather-records route", () => {
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

  it("GET forwards to Laravel weather records API", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          weatherRecords: [
            {
              id: 1,
              weather_date: "2026-05-01",
              location_name: "川口",
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
      nextUrl: new URL(
        "http://localhost:3000/api/weather-records?date=2026-05-01",
      ),
    };
    const res = await GET(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/weather-records?date=2026-05-01",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.weatherRecords[0].location_name).toBe("川口");
  });

  it("POST forwards to Laravel weather records create API", async () => {
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
            weatherRecord: {
              id: 10,
              weather_date: "2026-05-01",
              location_name: "川口",
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

    const req = new Request("http://localhost:3000/api/weather-records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        weather_date: "2026-05-01",
        location_id: 1,
        weather_condition: "sunny",
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/weather-records",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(json.weatherRecord.location_name).toBe("川口");
  });
});
