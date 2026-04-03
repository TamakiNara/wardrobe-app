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
  default: () =>
    React.createElement(
      "button",
      { type: "button" },
      React.createElement("svg", { "data-icon": "LogOut" }),
      "ログアウト",
    ),
}));

vi.mock("lucide-react", () => {
  const icon =
    (name: string) =>
    ({ className }: { className?: string }) =>
      React.createElement("svg", {
        "data-icon": name,
        className,
      });

  return {
    CalendarDays: icon("CalendarDays"),
    Settings: icon("Settings"),
    Shirt: icon("Shirt"),
    ShoppingBag: icon("ShoppingBag"),
    Sparkles: icon("Sparkles"),
    User: icon("User"),
  };
});

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

    expect(markup).toContain("現在の登録状況");
    expect(markup).toContain(
      "登録済みのアイテムやコーディネート、着用履歴などをここから確認できます。",
    );
    expect(markup).toContain("Large User");
    expect(markup).not.toContain("Large User さん");
    expect(markup).toContain("アイテムを追加");
    expect(markup).toContain("コーディネートを追加");
    expect(markup).toContain("着用履歴を追加");
    expect(markup).toContain("購入検討を追加");
    expect(markup).toContain("設定を開く");
    expect(markup).not.toContain("クイック操作");
    expect(markup).not.toContain("設定へ");
    expect(markup).not.toContain("一覧を見る");
    expect(markup).toContain(">36<");
    expect(markup).toContain(">12<");
    expect(markup).toContain(">14<");
    expect(markup).toContain(">8<");
    expect(markup).toContain('data-icon="User"');
    expect(markup).toContain('data-icon="Shirt"');
    expect(markup).toContain('data-icon="Sparkles"');
    expect(markup).toContain('data-icon="CalendarDays"');
    expect(markup).toContain('data-icon="ShoppingBag"');
    expect(markup).toContain('data-icon="Settings"');
    expect(markup).toContain('data-icon="LogOut"');
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(1, "/api/me");
    expect(fetchLaravelWithCookieMock).toHaveBeenNthCalledWith(
      2,
      "/api/home/summary",
    );
  });

  it("未ログイン時はログインと新規登録中心の案内だけを表示する", async () => {
    fetchLaravelWithCookieMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const { default: Home } = await import("./page");
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain("服やコーディネートをまとめて管理できます。");
    expect(markup).toContain('href="/login"');
    expect(markup).toContain('href="/register"');
    expect(markup).not.toContain("Wardrobe App");
    expect(markup).not.toContain("現在の登録状況");
    expect(markup).not.toContain("アイテムを追加");
    expect(fetchLaravelWithCookieMock).toHaveBeenCalledTimes(1);
    expect(fetchLaravelWithCookieMock).toHaveBeenCalledWith("/api/me");
  });
});
