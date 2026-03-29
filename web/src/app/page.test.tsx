import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchLaravelWithCookieMock = vi.fn();

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: fetchLaravelWithCookieMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/auth/logout-button", () => ({
  default: () => React.createElement("button", { type: "button" }, "logout"),
}));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("一覧APIの先頭ページ件数ではなく totalAll を表示する", async () => {
    fetchLaravelWithCookieMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "Large User",
          email: "large-user@example.com",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
          meta: { totalAll: 36 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: Array.from({ length: 12 }, (_, index) => ({
            id: index + 1,
          })),
          meta: { totalAll: 12 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          wearLogs: Array.from({ length: 12 }, (_, index) => ({
            id: index + 1,
          })),
          meta: { totalAll: 14 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          purchaseCandidates: Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
          })),
          meta: { totalAll: 8 },
        }),
      });

    const { default: Home } = await import("./page");
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain("ようこそ Large User さん");
    expect(markup).toContain(">36<");
    expect(markup).toContain(">12<");
    expect(markup).toContain(">14<");
    expect(markup).toContain(">8<");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(1, "/api/me");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(2, "/api/items");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(
      3,
      "/api/outfits",
    );
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(
      4,
      "/api/wear-logs",
    );
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(
      5,
      "/api/purchase-candidates",
    );
  });
});
