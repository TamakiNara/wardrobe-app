import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const fetchLaravelWithCookieMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: (...args: unknown[]) =>
    fetchLaravelWithCookieMock(...args),
}));

describe("ShoppingMemosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("買い物メモ一覧を表示できる", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        shoppingMemos: [
          {
            id: 1,
            name: "春夏セール候補",
            memo: "今月中に比較したい候補",
            status: "draft",
            item_count: 5,
            group_count: 3,
            subtotal: 18420,
            has_price_unset: true,
            nearest_deadline: "2026-05-07T23:59:00+09:00",
            created_at: "2026-05-01T10:00:00+09:00",
            updated_at: "2026-05-07T09:30:00+09:00",
          },
        ],
      }),
    });

    const { default: ShoppingMemosPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemosPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("買い物メモ一覧");
    expect(markup).toContain("春夏セール候補");
    expect(markup).toContain("5件 / 3グループ");
    expect(markup).toContain("18,420円");
    expect(markup).toContain("価格未設定あり");
    expect(markup).toContain("2026/05/07 23:59");
    expect(markup).toContain('href="/shopping-memos/1"');
    expect(markup).toContain('href="/shopping-memos/new"');
    expect(markup).toContain("検討中");
  });

  it("empty state を表示できる", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        shoppingMemos: [],
      }),
    });

    const { default: ShoppingMemosPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemosPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("買い物メモはまだありません。");
    expect(markup).toContain("購入を迷っている候補をまとめて比較できます。");
    expect(markup).toContain('href="/shopping-memos/new"');
  });

  it("作成後のメッセージを表示できる", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        shoppingMemos: [],
      }),
    });

    const { default: ShoppingMemosPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemosPage({
        searchParams: Promise.resolve({ message: "created" }),
      }),
    );

    expect(markup).toContain("買い物メモを作成しました。");
  });
});
