import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

describe("DELETE /api/items/[id]/images/[imageId]", () => {
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

  it("Laravel の item image delete API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "deleted" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/items/10/images/3", {
      method: "DELETE",
      headers: {
        Cookie: "laravel-session=test_session; XSRF-TOKEN=test_csrf_token",
      },
    });

    const res = await DELETE(req as any, {
      params: Promise.resolve({ id: "10", imageId: "3" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/items/10/images/3",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
    expect(json.message).toBe("deleted");
  });
});
