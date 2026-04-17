import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/purchase-candidates/[id]/color-variant", () => {
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

  it("Laravel の購入検討色違い追加 API へ転送する", async () => {
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
            message: "color_variant_payload_ready",
            purchaseCandidate: { name: "候補", variant_source_candidate_id: 1 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ) as typeof fetch;

    const req = new Request(
      "http://localhost:3000/api/purchase-candidates/1/color-variant",
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
      "http://localhost:8000/api/purchase-candidates/1/color-variant",
      expect.objectContaining({ method: "POST" }),
    );
    expect(json.purchaseCandidate.variant_source_candidate_id).toBe(1);
  });
});
