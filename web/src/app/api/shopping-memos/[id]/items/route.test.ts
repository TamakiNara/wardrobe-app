import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/shopping-memos/[id]/items route", () => {
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

  it("POST は Laravel の買い物メモ追加 API へ転送する", async () => {
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
            added_count: 2,
            skipped_count: 1,
            duplicate_count: 1,
            invalid_status_count: 0,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/shopping-memos/3/items",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({
          purchase_candidate_ids: [1, 2, 3],
        }),
      },
    );

    const res = await POST(req as any, {
      params: Promise.resolve({ id: "3" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/shopping-memos/3/items",
      expect.objectContaining({ method: "POST" }),
    );
    expect(json.added_count).toBe(2);
    expect(json.duplicate_count).toBe(1);
  });
});
