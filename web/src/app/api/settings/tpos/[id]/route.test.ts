import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

describe("/api/settings/tpos/[id] route", () => {
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

  it("PATCH は Laravel の tpo 更新 API へ転送する", async () => {
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
            tpo: { id: 4, name: "出張", sortOrder: 2, isActive: false, isPreset: false },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/settings/tpos/4", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        isActive: false,
        sortOrder: 2,
      }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: "4" }) });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/settings/tpos/4",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(res.status).toBe(200);
    expect(json.tpo.sortOrder).toBe(2);
  });
});
