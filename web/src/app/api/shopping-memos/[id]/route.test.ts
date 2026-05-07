import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/shopping-memos/[id] route", () => {
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

  it("GET は Laravel の shopping memo detail API へ転送する", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          shoppingMemo: { id: 3, name: "春夏セール候補" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    const req = {
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/shopping-memos/3"),
    };

    const res = await GET(req as any, {
      params: Promise.resolve({ id: "3" }),
    });
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/shopping-memos/3",
      expect.objectContaining({ method: "GET" }),
    );
    expect(json.shoppingMemo.id).toBe(3);
  });
});
