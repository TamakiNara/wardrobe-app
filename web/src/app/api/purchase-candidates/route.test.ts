import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("/api/purchase-candidates route", () => {
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

  it("GET は Laravel の purchase candidates API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          purchaseCandidates: [{ id: 1, name: "候補" }],
          meta: { total: 1, totalAll: 1, page: 1, lastPage: 1 },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    const req = {
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/purchase-candidates"),
    };

    const res = await GET(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/purchase-candidates",
      expect.objectContaining({ method: "GET" }),
    );
    expect(json.purchaseCandidates[0].id).toBe(1);
  });

  it("POST は Laravel の purchase candidate 作成 API へ転送する", async () => {
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
            purchaseCandidate: { id: 10 },
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/purchase-candidates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        name: "候補",
        category_id: "tops_tshirt",
        colors: [{ role: "main", mode: "preset", value: "white", hex: "#fff", label: "ホワイト" }],
      }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/purchase-candidates",
      expect.objectContaining({ method: "POST" }),
    );
    expect(json.message).toBe("created");
  });
});
