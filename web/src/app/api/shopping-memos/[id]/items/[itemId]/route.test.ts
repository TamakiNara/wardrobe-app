import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

describe("/api/shopping-memos/[id]/items/[itemId] route", () => {
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

  it("DELETE は Laravel の買い物メモ候補削除 API へ転送する", async () => {
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
        new Response(JSON.stringify({ message: "deleted" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/shopping-memos/3/items/18",
      {
        method: "DELETE",
        headers: {
          Cookie: "laravel-session=old_session",
        },
      },
    );

    const res = await DELETE(req as any, {
      params: Promise.resolve({ id: "3", itemId: "18" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/shopping-memos/3/items/18",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(json.message).toBe("deleted");
  });
});
