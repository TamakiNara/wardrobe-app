import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLaravelWithCookie } from "./laravel";

const { headersMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

describe("fetchLaravelWithCookie", () => {
  const originalFetch = global.fetch;
  const originalLaravelApiBaseUrl = process.env.LARAVEL_API_BASE_URL;
  const originalLaravelBaseUrl = process.env.LARAVEL_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    process.env.LARAVEL_API_BASE_URL = "http://127.0.0.1:8000";
    process.env.LARAVEL_BASE_URL = "http://localhost:8000";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.LARAVEL_API_BASE_URL = originalLaravelApiBaseUrl;
    process.env.LARAVEL_BASE_URL = originalLaravelBaseUrl;
  });

  it("cookie を付けて Laravel API に GET する", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;

    await fetchLaravelWithCookie("/api/items?keyword=shirt");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/items?keyword=shirt",
      {
        method: "GET",
        headers: {
          cookie: "session=test",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  });

  it("LARAVEL_API_BASE_URL がなければ LARAVEL_BASE_URL を使う", async () => {
    process.env.LARAVEL_API_BASE_URL = "";
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;

    await fetchLaravelWithCookie("/api/me");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/me",
      expect.any(Object),
    );
  });
});
