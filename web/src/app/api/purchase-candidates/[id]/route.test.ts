import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";

describe("/api/purchase-candidates/[id] route", () => {
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

  it("GET は Laravel の purchase candidate 詳細 API へ転送する", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ purchaseCandidate: { id: 1, name: "候補" } }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ) as typeof fetch;

    const req = {
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/purchase-candidates/1"),
    };

    const res = await GET(req as any, { params: Promise.resolve({ id: "1" }) });
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/purchase-candidates/1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(json.purchaseCandidate.id).toBe(1);
  });

  it("PUT は Laravel の purchase candidate 更新 API へ転送する", async () => {
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
          JSON.stringify({ message: "updated", purchaseCandidate: { id: 1 } }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ) as typeof fetch;

    const req = new Request("http://localhost:3000/api/purchase-candidates/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "laravel-session=old_session",
      },
      body: JSON.stringify({
        name: "更新候補",
        category_id: "tops_tshirt",
        colors: [
          {
            role: "main",
            mode: "preset",
            value: "white",
            hex: "#fff",
            label: "ホワイト",
          },
        ],
      }),
    });

    const res = await PUT(req as any, { params: Promise.resolve({ id: "1" }) });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/purchase-candidates/1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(json.message).toBe("updated");
  });

  it("DELETE は Laravel の purchase candidate 削除 API へ転送する", async () => {
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

    const req = new Request("http://localhost:3000/api/purchase-candidates/1", {
      method: "DELETE",
      headers: { Cookie: "laravel-session=old_session" },
    });

    const res = await DELETE(req as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/purchase-candidates/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(json.message).toBe("deleted");
  });
});
