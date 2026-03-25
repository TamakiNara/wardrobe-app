import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/items/[id]/images", () => {
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

  it("Laravel の item image upload API へ multipart を転送する", async () => {
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
            image: { id: 1, item_id: 10 },
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        ),
      ) as typeof fetch;

    const formData = new FormData();
    formData.set("image", new File(["image"], "item.png", { type: "image/png" }));

    const req = new Request("http://localhost:3000/api/items/10/images", {
      method: "POST",
      headers: {
        Cookie: "laravel-session=old_session",
      },
      body: formData,
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "10" }) });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/items/10/images",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(json.message).toBe("created");
  });
});
