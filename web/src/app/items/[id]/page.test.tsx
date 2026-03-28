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

vi.mock("@/components/items/delete-item-button", () => ({
  default: () => React.createElement("button", null, "delete"),
}));

vi.mock("@/components/items/item-status-action", () => ({
  default: () => React.createElement("div", null, "status-action"),
}));

vi.mock("@/components/items/item-care-status-action", () => ({
  default: () => React.createElement("div", null, "care-status-action"),
}));

vi.mock("@/components/items/item-preview-card", () => ({
  default: () => React.createElement("div", null, "preview-card"),
}));

describe("ItemPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("purchase candidate 由来の追加項目と画像を表示できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        item: {
          id: 1,
          name: "レインコート",
          status: "active",
          care_status: "in_cleaning",
          brand_name: "Sample Brand",
          price: 19800,
          purchase_url: "https://example.test/items/1",
          memo: "購入後メモ",
          purchased_at: "2026-03-24T00:00:00.000000Z",
          size_gender: "women",
          size_label: "M",
          size_note: "厚手ニット込み",
          size_details: {
            note: "裄丈 78cm",
          },
          is_rain_ok: true,
          category: "legwear",
          shape: "tights",
          colors: [],
          seasons: ["春"],
          tpos: ["仕事"],
          spec: {
            bottoms: {
              length_type: "midi",
            },
            legwear: {
              coverage_type: "tights",
            },
          },
          images: [
            {
              id: 1,
              item_id: 1,
              disk: "public",
              path: "items/1/coat.png",
              url: "https://example.test/storage/items/1/coat.png",
              original_filename: "coat.png",
              mime_type: "image/png",
              file_size: 1000,
              sort_order: 1,
              is_primary: true,
            },
          ],
        },
      }),
    });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Sample Brand");
    expect(markup).toContain("19,800円");
    expect(markup).toContain("レディース");
    expect(markup).toContain("厚手ニット込み");
    expect(markup).toContain("裄丈 78cm");
    expect(markup).toContain("購入後メモ");
    expect(markup).toContain("対応");
    expect(markup).toContain("クリーニング中");
    expect(markup).toContain("ボトムス丈： ミディ丈");
    expect(markup).toContain("レッグウェア： タイツ");
    expect(markup).toContain("画像");
    expect(markup).toContain("coat.png");
  });

  it("return_to があるときだけ着用履歴フォームへの戻りリンクを表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        item: {
          id: 1,
          name: "レインコート",
          status: "active",
          care_status: null,
          brand_name: null,
          price: null,
          purchase_url: null,
          memo: null,
          purchased_at: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          is_rain_ok: false,
          category: "outer",
          shape: "trench",
          colors: [],
          seasons: [],
          tpos: [],
          spec: null,
          images: [],
        },
      }),
    });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "1" }),
        searchParams: Promise.resolve({
          return_to: "/wear-logs/new",
          return_label: "着用履歴フォーム",
        }),
      }),
    );

    expect(markup).toContain('href="/wear-logs/new"');
    expect(markup).toContain("着用履歴フォームへ戻る");
  });
});
