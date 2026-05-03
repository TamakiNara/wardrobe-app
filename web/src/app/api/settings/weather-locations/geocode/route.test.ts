import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/settings/weather-locations/geocode route", () => {
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

  it("GET で Laravel の geocoding API に転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              name: "川口市",
              admin1: "埼玉県",
              country: "日本",
              latitude: 35.8077,
              longitude: 139.7241,
              timezone: "Asia/Tokyo",
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
        "http://localhost:3000/api/settings/weather-locations/geocode?query=%E5%B7%9D%E5%8F%A3",
      ),
    };
    const res = await GET(req as never);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/weather-locations/geocode?query=%E5%B7%9D%E5%8F%A3",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.results[0].name).toBe("川口市");
    expect(json.results[0].timezone).toBe("Asia/Tokyo");
  });
});
