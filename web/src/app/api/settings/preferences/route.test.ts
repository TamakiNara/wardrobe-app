import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

describe("/api/settings/preferences route", () => {
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

  it("GET は Laravel の preferences API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          preferences: {
            currentSeason: "spring",
            defaultWearLogStatus: "planned",
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

    const req = {
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/settings/preferences"),
    };
    const res = await GET(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/settings/preferences",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.preferences.currentSeason).toBe("spring");
  });

  it("PUT は Laravel の preferences 更新 API へ転送する", async () => {
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
            preferences: {
              currentSeason: "winter",
              defaultWearLogStatus: "worn",
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

    const req = new Request("http://localhost:3000/api/settings/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        currentSeason: "winter",
        defaultWearLogStatus: "worn",
      }),
    });

    const res = await PUT(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/preferences",
      expect.objectContaining({
        method: "PUT",
      }),
    );
    expect(res.status).toBe(200);
    expect(json.message).toBe("updated");
  });
});
