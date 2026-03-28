import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("/api/settings/tpos route", () => {
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

  it("GET は Laravel の tpos API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tpos: [
            { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
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
      nextUrl: new URL("http://localhost:3000/api/settings/tpos?active_only=1"),
    };
    const res = await GET(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/settings/tpos?active_only=1",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(json.tpos[0].name).toBe("仕事");
  });

  it("POST は Laravel の tpos 作成 API へ転送する", async () => {
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
            tpo: { id: 4, name: "出張", sortOrder: 4, isActive: true, isPreset: false },
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/settings/tpos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        name: "出張",
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/tpos",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(res.status).toBe(201);
    expect(json.tpo.name).toBe("出張");
  });
});
