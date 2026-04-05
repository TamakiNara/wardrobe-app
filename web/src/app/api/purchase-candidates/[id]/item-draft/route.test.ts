import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/purchase-candidates/[id]/item-draft", () => {
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

  it("Laravel の item-draft API へ転送する", async () => {
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
            message: "item_draft_ready",
            item_draft: {
              source_category_id: "outerwear_coat",
              category: "outerwear",
              shape: "coat",
            },
            candidate_summary: { id: 1, name: "候補" },
            images: [],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/purchase-candidates/1/item-draft",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "laravel-session=old_session",
        },
        body: JSON.stringify({}),
      },
    );

    const res = await POST(req as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/purchase-candidates/1/item-draft",
      expect.objectContaining({ method: "POST" }),
    );
    expect(json.item_draft.category).toBe("outerwear");
  });
});
