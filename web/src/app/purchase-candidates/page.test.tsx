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

describe("PurchaseCandidatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("空状態を表示できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [],
        meta: {
          total: 0,
          totalAll: 0,
          page: 1,
          lastPage: 1,
        },
      }),
    });

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("購入検討がまだありません");
  });

  it("候補一覧を表示できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [
          {
            id: 1,
            status: "considering",
            priority: "high",
            name: "ネイビーコート",
            category_id: "outer_coat",
            category_name: "コート",
            price: 19800,
            sale_price: 14800,
            sale_ends_at: "2026-03-31T18:00:00+09:00",
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
            category_id: "tops_tshirt",
            category_name: "Tシャツ",
            price: null,
            sale_price: null,
            sale_ends_at: null,
            converted_item_id: null,
            converted_at: null,
            primary_image: null,
            updated_at: "2026-03-24T10:00:00+09:00",
          },
        ],
        meta: {
          total: 2,
          totalAll: 2,
          page: 1,
          lastPage: 1,
        },
      }),
    });

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("ネイビーコート");
    expect(markup).toContain("コート");
    expect(markup).toContain("検討中");
    expect(markup).toContain("優先度: 高");
    expect(markup).toContain("19,800円");
    expect(markup).toContain("14,800円");
    expect(markup).toContain("セール価格");
    expect(markup).toContain("購入検討一覧");
    expect(markup).toContain('href="/purchase-candidates/1"');
    expect(markup).toContain(
      'src="http://localhost:8000/storage/purchase-candidates/1/front.png"',
    );
    expect(markup).toContain("詳細を見る");
    expect(markup).toContain("画像なし");
    expect(markup).not.toContain('href="/purchase-candidates/1/edit"');
  });
});
