import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchLaravelWithCookieMock = vi.fn();

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: fetchLaravelWithCookieMock,
}));

describe("server auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証時は user を返さず、認証済み扱いにしない", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { fetchAuthenticatedUser, hasAuthenticatedUser } =
      await import("./auth");

    await expect(fetchAuthenticatedUser()).resolves.toBeNull();
    await expect(hasAuthenticatedUser()).resolves.toBe(false);
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(1, "/api/me");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(2, "/api/me");
  });

  it("認証済み時は user を返し、認証済み扱いにする", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: "Tester",
        email: "tester@example.com",
      }),
    });

    const { fetchAuthenticatedUser, hasAuthenticatedUser } =
      await import("./auth");

    await expect(fetchAuthenticatedUser()).resolves.toEqual({
      id: 1,
      name: "Tester",
      email: "tester@example.com",
    });
    await expect(hasAuthenticatedUser()).resolves.toBe(true);
  });
});
