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

  it("ホーム件数専用APIの summary を表示する", async () => {
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
          summary: {
            itemsCount: 36,
            outfitsCount: 12,
            wearLogsCount: 14,
            purchaseCandidatesCount: 8,
          },
        }),
      });

    const { default: Home } = await import("./page");
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain("ホーム");
    expect(markup).toContain("ようこそ Large User さん");
    expect(markup).toContain(
      "登録済みアイテムやコーディネートをここから確認できます。",
    );
    expect(markup).toContain("アイテム一覧を見る");
    expect(markup).toContain("コーディネート一覧を見る");
    expect(markup).toContain("設定を開く");
    expect(markup).toContain(">36<");
    expect(markup).toContain(">12<");
    expect(markup).toContain(">14<");
    expect(markup).toContain(">8<");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(1, "/api/me");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(
      2,
      "/api/home/summary",
    );
  });
});
