import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/outfits/[id]/duplicate", () => {
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

  it("Laravel の duplicate API へ転送する", async () => {
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
            message: "duplicated_payload_ready",
            outfit: {
              name: "通勤コーデ（コピー）",
              memo: "memo",
              seasons: ["春"],
              tpos: ["仕事"],
              items: [
                {
                  item_id: 10,
                  sort_order: 1,
                  selectable: true,
                  note: null,
                },
              ],
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

    const req = new Request("http://localhost:3000/api/outfits/1/duplicate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/outfits/1/duplicate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "test_csrf_token",
          Cookie: expect.stringContaining("XSRF-TOKEN=test_csrf_token"),
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "duplicated_payload_ready",
      outfit: {
        name: "通勤コーデ（コピー）",
        memo: "memo",
        seasons: ["春"],
        tpos: ["仕事"],
        items: [
          {
            item_id: 10,
            sort_order: 1,
            selectable: true,
            note: null,
          },
        ],
      },
    });
  });
});
