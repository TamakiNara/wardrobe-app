import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const redirectMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-list-filters",
  () => ({
    default: ({
      keyword,
      status,
      priority,
      category,
      brand,
      sort,
      itemCount,
      totalCount,
    }: {
      keyword: string;
      status: string;
      priority: string;
      category: string;
      brand: string;
      sort: string;
      itemCount: number;
      totalCount: number;
    }) =>
      React.createElement(
        "section",
        { "data-testid": "purchase-candidate-list-filters" },
        React.createElement(
          "p",
          null,
          `表示件数: ${itemCount} / ${totalCount}`,
        ),
        React.createElement("span", null, "キーワード"),
        React.createElement("span", null, "状態"),
        React.createElement("span", null, "優先度"),
        React.createElement("span", null, "カテゴリ"),
        React.createElement("span", null, "ブランド"),
        React.createElement("span", null, "並び順"),
        React.createElement("input", {
          readOnly: true,
          placeholder: "名前・ブランド・メモで検索",
          value: keyword,
        }),
        React.createElement("input", {
          readOnly: true,
          placeholder: "ブランド名で絞り込み",
          value: brand,
        }),
        React.createElement("span", null, status),
        React.createElement("span", null, priority),
        React.createElement("span", null, category),
        React.createElement("span", null, sort),
      ),
  }),
);

describe("PurchaseCandidatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  function mockCategoryGroupsResponse() {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        groups: [
          {
            id: "outerwear",
            name: "ジャケット・アウター",
            sortOrder: 1,
            categories: [
              {
                id: "outerwear_coat",
                groupId: "outerwear",
                name: "コート",
                sortOrder: 1,
              },
            ],
          },
          {
            id: "tops",
            name: "トップス",
            sortOrder: 2,
            categories: [
              {
                id: "tops_tshirt_cutsew",
                groupId: "tops",
                name: "Tシャツ・カットソー",
                sortOrder: 1,
              },
            ],
          },
        ],
      }),
    });
  }

  function mockBrandOptionsResponse() {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        brands: [
          {
            id: 1,
            name: "在宅ブランド",
            kana: "ざいたくぶらんど",
            is_active: true,
            updated_at: "2026-03-24T10:00:00+09:00",
          },
        ],
      }),
    });
  }

  it("ブランド候補設定と既存購入検討ブランドを統合して候補を作れる", async () => {
    const { mergePurchaseCandidateBrandOptions } = await import("./page");

    const merged = mergePurchaseCandidateBrandOptions(
      [
        {
          id: 1,
          name: "在宅ブランド",
          kana: "ざいたくぶらんど",
          is_active: true,
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      ],
      [" 既存候補ブランド ", "在宅ブランド", ""],
    );

    expect(merged.map((brand) => brand.name)).toEqual([
      "既存候補ブランド",
      "在宅ブランド",
    ]);
  });

  it("空状態を表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [],
        availableBrands: [],
        meta: {
          total: 0,
          totalAll: 0,
          page: 1,
          lastPage: 1,
        },
      }),
    });
    mockCategoryGroupsResponse();
    mockBrandOptionsResponse();

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("購入検討管理");
    expect(markup).toContain("購入検討一覧");
    expect(markup).toContain(
      "検討中・保留中・購入済み・見送りの候補をまとめて確認します。",
    );
    expect(markup).toContain('href="/purchase-candidates/new"');
    expect(markup).toContain("購入検討を追加");
    expect(markup).toContain("購入検討がまだありません");
  });

  it("候補一覧を表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [
          {
            id: 1,
            status: "considering",
            priority: "high",
            name: "ネイビーコート",
            category_id: "outerwear_coat",
            category_name: "コート",
            brand_name: "在宅ブランド",
            price: 19800,
            sale_price: 14800,
            sale_ends_at: "2026-03-31T18:00:00+09:00",
            purchase_url: "https://example.test/products/coat",
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "ネイビー",
              },
              {
                role: "sub",
                mode: "preset",
                value: "white",
                hex: "#F9FAFB",
                label: "ホワイト",
              },
            ],
            converted_item_id: null,
            converted_at: null,
            primary_image: {
              id: 10,
              purchase_candidate_id: 1,
              disk: "public",
              path: "purchase-candidates/1/front.png",
              url: "http://localhost:8000/storage/purchase-candidates/1/front.png",
              original_filename: "front.png",
              mime_type: "image/png",
              file_size: 1024,
              sort_order: 1,
              is_primary: true,
            },
            updated_at: "2026-03-24T10:00:00+09:00",
          },
          {
            id: 2,
            status: "on_hold",
            priority: "low",
            name: "画像なし候補",
            category_id: "tops_tshirt_cutsew",
            category_name: "Tシャツ",
            brand_name: null,
            price: null,
            sale_price: null,
            sale_ends_at: null,
            purchase_url: null,
            colors: [],
            converted_item_id: null,
            converted_at: null,
            primary_image: null,
            updated_at: "2026-03-24T10:00:00+09:00",
          },
        ],
        availableBrands: ["在宅ブランド", "候補から生成したブランド"],
        meta: {
          total: 2,
          totalAll: 2,
          page: 1,
          lastPage: 1,
        },
      }),
    });
    mockCategoryGroupsResponse();
    mockBrandOptionsResponse();

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("ネイビーコート");
    expect(markup).toContain("コート");
    expect(markup).toContain("検討中");
    expect(markup).toContain("優先度: 高");
    expect(markup).toContain("価格");
    expect(markup).toContain("19,800円");
    expect(markup).toContain("14,800");
    expect(markup).toContain("セール中");
    expect(markup).toContain("セール終了予定");
    expect(markup).toContain("購入検討管理");
    expect(markup).toContain("購入検討一覧");
    expect(markup).toContain(
      "検討中・保留中・購入済み・見送りの候補をまとめて確認します。",
    );
    expect(markup).toContain('href="/purchase-candidates/new"');
    expect(markup).toContain("購入検討を追加");
    expect(markup).toContain("キーワード");
    expect(markup).toContain("状態");
    expect(markup).toContain("優先度");
    expect(markup).toContain("カテゴリ");
    expect(markup).toContain("ブランド");
    expect(markup).toContain("並び順");
    expect(markup).toContain("名前・ブランド・メモで検索");
    expect(markup).toContain("ブランド名で絞り込み");
    expect(markup).toContain('href="/purchase-candidates/1"');
    expect(markup).toContain(
      'src="http://localhost:8000/storage/purchase-candidates/1/front.png"',
    );
    expect(markup).toContain('style="background-color:#1F3A5F"');
    expect(markup).toContain("詳細を見る");
    expect(markup).toContain('href="https://example.test/products/coat"');
    expect(markup).toContain("商品ページ");
    expect(markup).toContain("画像なし");
    expect(markup).toContain("ブランド未設定");
    expect(markup).toContain("在宅ブランド");
    expect(markup).not.toContain("更新日");
    expect(markup).toContain("表示件数: 2 / 2");
    expect(markup).toContain("1 / 1ページ");
    expect(markup).not.toContain('href="/purchase-candidates/1/edit"');
  });

  it("ページング UI を表示し、クエリを維持して前後ページへ移動できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [
          {
            id: 13,
            status: "considering",
            priority: "medium",
            name: "在宅コート13",
            category_id: "outerwear_coat",
            category_name: "コート",
            brand_name: "在宅ブランド",
            price: 11800,
            sale_price: null,
            sale_ends_at: null,
            purchase_url: null,
            colors: [],
            converted_item_id: null,
            converted_at: null,
            primary_image: null,
            updated_at: "2026-03-24T10:00:00+09:00",
          },
        ],
        availableBrands: ["在宅ブランド"],
        meta: {
          total: 13,
          totalAll: 14,
          page: 2,
          lastPage: 3,
        },
      }),
    });
    mockCategoryGroupsResponse();
    mockBrandOptionsResponse();

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({
        searchParams: Promise.resolve({
          keyword: "在宅",
          status: "considering",
          priority: "high",
          category: "outerwear_coat",
          brand: "在宅ブランド",
          sort: "name_asc",
          page: "2",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/purchase-candidates?keyword=%E5%9C%A8%E5%AE%85&status=considering&priority=high&category=outerwear_coat&brand=%E5%9C%A8%E5%AE%85%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89&sort=name_asc&page=2",
      ),
      expect.any(Object),
    );
    expect(markup).toContain("表示件数: 1 / 13");
    expect(markup).toContain("2 / 3ページ");
    expect(markup).toContain("（全13件）");
    expect(markup).toContain(
      'href="/purchase-candidates?keyword=%E5%9C%A8%E5%AE%85&amp;status=considering&amp;priority=high&amp;category=outerwear_coat&amp;brand=%E5%9C%A8%E5%AE%85%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89&amp;sort=name_asc"',
    );
    expect(markup).toContain(
      'href="/purchase-candidates?keyword=%E5%9C%A8%E5%AE%85&amp;status=considering&amp;priority=high&amp;category=outerwear_coat&amp;brand=%E5%9C%A8%E5%AE%85%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89&amp;sort=name_asc&amp;page=3"',
    );
    expect(markup).toContain('value="在宅ブランド"');
  });

  it("条件一致0件時は絞り込み用の空状態を表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [],
        availableBrands: ["候補ブランド"],
        meta: {
          total: 0,
          totalAll: 3,
          page: 1,
          lastPage: 1,
        },
      }),
    });
    mockCategoryGroupsResponse();
    mockBrandOptionsResponse();

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({
        searchParams: Promise.resolve({
          brand: "候補ブランド",
        }),
      }),
    );

    expect(markup).toContain("条件に一致する購入検討がありません");
    expect(markup).toContain("条件を変えてお試しください。");
    expect(markup).toContain('value="候補ブランド"');
  });

  it("一覧 filter に現在の query 値を渡せる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [],
        availableBrands: ["在宅ブランド"],
        meta: {
          total: 0,
          totalAll: 3,
          page: 2,
          lastPage: 2,
        },
      }),
    });
    mockCategoryGroupsResponse();
    mockBrandOptionsResponse();

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({
        searchParams: Promise.resolve({
          keyword: "在宅",
          status: "considering",
          priority: "high",
          category: "outerwear_coat",
          brand: "在宅ブランド",
          sort: "name_asc",
          page: "2",
        }),
      }),
    );

    expect(markup).toContain('data-testid="purchase-candidate-list-filters"');
    expect(markup).toContain("在宅");
    expect(markup).toContain("considering");
    expect(markup).toContain("high");
    expect(markup).toContain("outerwear_coat");
    expect(markup).toContain('value="在宅ブランド"');
    expect(markup).toContain("name_asc");
  });
});
