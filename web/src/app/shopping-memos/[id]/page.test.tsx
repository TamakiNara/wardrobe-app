import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const notFoundMock = vi.fn();
const fetchLaravelWithCookieMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
    replace: replaceMock,
  }),
  usePathname: () => "/shopping-memos/1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: (...args: unknown[]) =>
    fetchLaravelWithCookieMock(...args),
}));

describe("ShoppingMemoDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00+09:00"));
    notFoundMock.mockImplementation(() => {
      throw new Error("notFound");
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("買い物メモ詳細を表示できる", async () => {
    fetchLaravelWithCookieMock.mockImplementation(async (path: string) => {
      if (path === "/api/shopping-memos/1") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            shoppingMemo: {
              id: 1,
              name: "春夏セール候補",
              memo: "今月中に比較したい候補",
              status: "draft",
              item_count: 3,
              group_count: 2,
              subtotal: 18420,
              has_price_unset: true,
              nearest_deadline: "2026-05-07T23:59:00+09:00",
              created_at: "2026-05-01T10:00:00+09:00",
              updated_at: "2026-05-07T09:30:00+09:00",
              groups: [
                {
                  type: "domain",
                  key: "domain:zozo.jp",
                  display_name: "zozo.jp",
                  subtotal: 9800,
                  has_price_unset: false,
                  nearest_deadline: "2026-05-07T23:59:00+09:00",
                  items: [
                    {
                      shopping_memo_item_id: 11,
                      purchase_candidate_id: 101,
                      name: "リネンシャツ",
                      brand: "Sample Brand",
                      purchase_url: "https://zozo.jp/item/1",
                      status: "considering",
                      price: 12000,
                      sale_price: 9800,
                      unit_price: 9800,
                      quantity: 1,
                      line_total: 9800,
                      is_total_included: true,
                      sale_ends_at: "2026-05-07T23:59:00+09:00",
                      discount_ends_at: null,
                      memo: "店頭在庫も確認したい",
                      priority: "high",
                      sort_order: 1,
                    },
                  ],
                },
                {
                  type: "uncategorized",
                  key: "uncategorized",
                  display_name: "未分類",
                  subtotal: 8620,
                  has_price_unset: true,
                  nearest_deadline: null,
                  items: [
                    {
                      shopping_memo_item_id: 12,
                      purchase_candidate_id: 102,
                      name: "白Tシャツ",
                      brand: null,
                      purchase_url: null,
                      status: "on_hold",
                      price: null,
                      sale_price: null,
                      unit_price: null,
                      quantity: 2,
                      line_total: null,
                      is_total_included: true,
                      sale_ends_at: null,
                      discount_ends_at: null,
                      memo: null,
                      priority: null,
                      sort_order: 2,
                    },
                    {
                      shopping_memo_item_id: 13,
                      purchase_candidate_id: 103,
                      name: "デニムパンツ",
                      brand: "Another Brand",
                      purchase_url: null,
                      status: "purchased",
                      price: 8620,
                      sale_price: null,
                      unit_price: 8620,
                      quantity: 1,
                      line_total: null,
                      is_total_included: false,
                      sale_ends_at: null,
                      discount_ends_at: "2026-05-10T10:00:00+09:00",
                      memo: null,
                      priority: "low",
                      sort_order: 3,
                    },
                  ],
                },
              ],
            },
          }),
        };
      }

      if (path === "/api/purchase-candidates/101") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            purchaseCandidate: {
              images: [
                {
                  id: 1,
                  purchase_candidate_id: 101,
                  disk: "public",
                  path: "purchase-candidates/101.jpg",
                  url: "https://example.com/101.jpg",
                  original_filename: "101.jpg",
                  mime_type: "image/jpeg",
                  file_size: 1000,
                  sort_order: 1,
                  is_primary: true,
                },
              ],
            },
          }),
        };
      }

      if (path === "/api/purchase-candidates/102") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            purchaseCandidate: {
              images: [],
            },
          }),
        };
      }

      if (path === "/api/purchase-candidates/103") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            purchaseCandidate: {
              images: [
                {
                  id: 3,
                  purchase_candidate_id: 103,
                  disk: "public",
                  path: "purchase-candidates/103.jpg",
                  url: "https://example.com/103.jpg",
                  original_filename: "103.jpg",
                  mime_type: "image/jpeg",
                  file_size: 1000,
                  sort_order: 1,
                  is_primary: true,
                },
              ],
            },
          }),
        };
      }

      throw new Error(`unexpected path: ${path}`);
    });

    const { default: ShoppingMemoDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemoDetailPage({
        params: Promise.resolve({ id: "1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("春夏セール候補");
    expect(markup).toContain("検討中");
    expect(markup).toContain("今月中に比較したい候補");
    expect(markup).toContain("候補");
    expect(markup).toContain("3件");
    expect(markup).toContain("2件");
    expect(markup).toContain("18,420円");
    expect(markup).toContain("価格未設定あり");
    expect(markup).toContain("一番近い期限");
    expect(markup).toContain("2026/05/07 23:59");
    expect(markup).not.toContain("最短期限");
    expect(markup).toContain("zozo.jp");
    expect(markup).not.toContain(">サイト<");
    expect(markup).toContain("通常価格 12,000円");
    expect(markup).toContain("リネンシャツ");
    expect(markup).toContain("白Tシャツ");
    expect(markup).toContain("価格未設定");
    expect(markup).toContain("数量 2");
    expect(markup).not.toContain("小計 0円");
    expect(markup).toContain("購入済み");
    expect(markup).toContain("合計対象外");
    expect(markup).toContain("期限切れ");
    expect(markup).toContain("期限間近");
    expect(markup).not.toContain("割引終了:");
    expect(markup).not.toContain("数量: 1");
    expect(markup).not.toContain("行小計");
    expect(markup).not.toContain("1件の候補");
    expect(markup).not.toContain("小計 9,800円");
    expect(markup).not.toContain(
      '>期限</p><p class="mt-1 text-sm font-medium text-gray-900">2026/05/07 23:59',
    );
    expect(markup).toContain("Sample Brand");
    expect(markup).toContain("購入検討詳細を見る");
    expect(markup).toContain('aria-label="買い物メモから外す"');
    expect(markup).not.toContain(">外す<");
    expect(markup).toContain("商品ページ");
    expect(markup.indexOf("買い物メモから外す")).toBeGreaterThan(
      markup.indexOf("商品ページ"),
    );
    expect(markup).toContain("https://example.com/101.jpg");
    expect(markup).not.toContain("グループ小計");
    expect(markup).toContain("小計");
    expect(markup).toContain("8,620円");
    expect(markup).toContain("販売終了日:</span> 2026/05/07 23:59");
    expect(markup).toContain("セール終了日:</span> 2026/05/10 10:00");
    expect(markup).toContain(
      "min-w-[8rem] space-y-1.5 text-left md:justify-self-end md:self-start md:text-right",
    );
    expect(markup).toContain("grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4");
    expect(markup).toContain("lg:grid-cols-2");
    expect(markup).toContain("lg:[&amp;:has([role=alertdialog])]:col-span-2");
    expect(markup).toContain('href="/purchase-candidates"');
    expect(markup).toContain('href="/shopping-memos"');
    expect(markup).toContain(
      'href="/purchase-candidates/101?from_shopping_memo_id=1"',
    );
    expect(markup).toContain(
      'href="/purchase-candidates/103?from_shopping_memo_id=1"',
    );
  });

  it("期限切れの sale price を現在有効な価格として表示しない", async () => {
    vi.setSystemTime(new Date("2026-05-16T00:00:00+09:00"));
    fetchLaravelWithCookieMock.mockImplementation(async (path: string) => {
      if (path === "/api/shopping-memos/5") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            shoppingMemo: {
              id: 5,
              name: "期限切れセール確認",
              memo: null,
              status: "draft",
              item_count: 1,
              group_count: 1,
              subtotal: 2629,
              has_price_unset: false,
              nearest_deadline: null,
              created_at: "2026-05-01T10:00:00+09:00",
              updated_at: "2026-05-15T09:30:00+09:00",
              groups: [
                {
                  type: "domain",
                  key: "domain:example.com",
                  display_name: "example.com",
                  subtotal: 2629,
                  has_price_unset: false,
                  nearest_deadline: null,
                  items: [
                    {
                      shopping_memo_item_id: 51,
                      purchase_candidate_id: 201,
                      name: "期限切れセール候補",
                      brand: "Sample Brand",
                      purchase_url: "https://example.com/item/201",
                      status: "considering",
                      price: 2629,
                      sale_price: 2120,
                      unit_price: 2629,
                      quantity: 1,
                      line_total: 2629,
                      is_total_included: true,
                      sale_ends_at: null,
                      discount_ends_at: "2026-05-11T01:59:00+09:00",
                      memo: null,
                      priority: "medium",
                      sort_order: 1,
                    },
                  ],
                },
              ],
            },
          }),
        };
      }

      if (path === "/api/purchase-candidates/201") {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            purchaseCandidate: {
              images: [],
            },
          }),
        };
      }

      throw new Error(`unexpected path: ${path}`);
    });

    const { default: ShoppingMemoDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemoDetailPage({
        params: Promise.resolve({ id: "5" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("期限切れセール候補");
    expect(markup).not.toContain("セール中");
    expect(markup).not.toContain("通常価格");
    expect(markup).not.toContain("2,120");
    expect(markup).toContain("2,629");
    expect(markup).toContain("2,629円");
    expect(markup).toContain("セール終了日:</span> 2026/05/11 01:59");
  });

  it("item が空なら empty state を表示する", async () => {
    fetchLaravelWithCookieMock.mockImplementation(async (path: string) => {
      expect(path).toBe("/api/shopping-memos/2");

      return {
        status: 200,
        ok: true,
        json: async () => ({
          shoppingMemo: {
            id: 2,
            name: "旅行前候補",
            memo: null,
            status: "draft",
            item_count: 0,
            group_count: 0,
            subtotal: 0,
            has_price_unset: false,
            nearest_deadline: null,
            created_at: null,
            updated_at: null,
            groups: [],
          },
        }),
      };
    });

    const { default: ShoppingMemoDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemoDetailPage({
        params: Promise.resolve({ id: "2" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("この買い物メモには、まだ購入候補がありません。");
    expect(markup).toContain("購入検討一覧から候補を追加できます。");
    expect(markup).toContain('href="/purchase-candidates"');
  });

  it("候補削除後の成功メッセージを表示する", async () => {
    fetchLaravelWithCookieMock.mockImplementation(async (path: string) => {
      expect(path).toBe("/api/shopping-memos/2");

      return {
        status: 200,
        ok: true,
        json: async () => ({
          shoppingMemo: {
            id: 2,
            name: "春夏物",
            memo: null,
            status: "draft",
            item_count: 0,
            group_count: 0,
            subtotal: 0,
            has_price_unset: false,
            nearest_deadline: null,
            created_at: null,
            updated_at: null,
            groups: [],
          },
        }),
      };
    });

    const { default: ShoppingMemoDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ShoppingMemoDetailPage({
        params: Promise.resolve({ id: "2" }),
        searchParams: Promise.resolve({ message: "removed" }),
      }),
    );

    expect(markup).toContain("買い物メモから外しました。");
  });
});
