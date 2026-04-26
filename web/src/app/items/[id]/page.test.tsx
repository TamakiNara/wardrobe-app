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

vi.mock("@/components/items/item-status-action", () => ({
  default: () => React.createElement("div", null, "status-action"),
}));

vi.mock("@/components/items/item-care-status-action", () => ({
  default: () => React.createElement("div", null, "care-status-action"),
}));

vi.mock("@/components/items/item-preview-card", () => ({
  default: () => React.createElement("div", null, "preview-card"),
}));

describe("アイテム詳細画面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("purchase candidate 由来の追加項目と画像を表示できる", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 1,
            name: "レインコート",
            status: "active",
            care_status: "in_cleaning",
            sheerness: "slight",
            brand_name: "Sample Brand",
            price: 19800,
            purchase_url: "https://example.test/items/1",
            memo: "購入後メモ",
            purchased_at: "2026-03-24T00:00:00.000000Z",
            size_gender: "women",
            size_label: "M",
            size_note: "厚手ニット込み",
            size_details: {
              custom_fields: [
                {
                  label: "裄丈",
                  value: 78,
                  sort_order: 1,
                },
              ],
            },
            is_rain_ok: true,
            category: "legwear",
            shape: "tights",
            colors: [],
            seasons: ["春"],
            tpos: ["仕事"],
            spec: {
              bottoms: {
                length_type: "cropped",
              },
              legwear: {
                coverage_type: "tights",
              },
            },
            materials: [
              {
                part_label: "本体",
                material_name: "綿",
                ratio: 80,
              },
              {
                part_label: "本体",
                material_name: "ポリエステル",
                ratio: 20,
              },
              {
                part_label: "裏地",
                material_name: "ポリエステル",
                ratio: 100,
              },
            ],
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
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

    expect(markup).toContain("アイテム管理");
    expect(markup).toContain("レインコート");
    expect(markup).toContain("Sample Brand");
    expect(markup).toContain("19,800円");
    expect(markup).toContain("レディース");
    expect(markup).toContain("厚手ニット込み");
    expect(markup).toContain("裄丈");
    expect(markup).toContain("78cm");
    expect(markup).toContain("購入後メモ");
    expect(markup).toContain("対応");
    expect(markup).toContain("クリーニング中");
    expect(markup).toContain("画像 / プレビュー");
    expect(markup).toContain("基本情報");
    expect(markup).toContain("分類");
    expect(markup).toContain("色 / 利用条件・特性");
    expect(markup).toContain("サイズ・実寸");
    expect(markup).toContain("購入情報");
    expect(markup).toContain("補足情報");
    expect(markup).toContain("状態操作");
    expect(markup).toContain("所持状態");
    expect(markup).toContain("ケア状態");
    expect(markup).toContain("透け感");
    expect(markup).toContain("ややあり");
    expect(markup).toContain("status-action");
    expect(markup).toContain("care-status-action");
    expect(markup).toContain(
      "所持しなくなった場合は「手放す」を使います。必要になった時は「クローゼットに戻す」で通常状態へ戻せます。",
    );
    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("クロップド丈");
    expect(markup).toContain("タイツ");
    expect(markup).toContain("素材・混率");
    expect(markup).toContain("本体： 綿 80%、ポリエステル 20%");
    expect(markup).toContain("裏地： ポリエステル 100%");
    expect(markup).not.toContain("購入・サイズ情報");
    expect(markup).toContain("coat.png");
    expect(markup.indexOf(">編集<")).toBeLessThan(
      markup.indexOf(">一覧に戻る<"),
    );
  });

  it("return_to があるときだけ着用履歴フォームへの戻りリンクを表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
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
            subcategory: "coat",
            shape: "trench",
            colors: [],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
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
    expect(markup).toContain('href="/items/1/edit"');
    expect(markup).toContain("編集");
    expect(markup.indexOf(">編集<")).toBeLessThan(
      markup.indexOf(">着用履歴フォームへ戻る<"),
    );
    expect(markup).toContain("カテゴリ");
    expect(markup).toContain("コート");
    expect(markup).toContain("トレンチコート");
    expect(markup).not.toContain("仕様・属性");
  });

  it("skirts の素材とデザイン spec を詳細画面で表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 2,
            name: "素材ありスカート",
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
            category: "skirts",
            subcategory: "skirt",
            shape: "narrow",
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#123456",
                label: "ネイビー",
              },
            ],
            seasons: [],
            tpos: [],
            spec: {
              skirt: {
                length_type: "mid_calf",
                material_type: "tulle",
                design_type: "pleats",
              },
            },
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "2" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("チュール");
    expect(markup).toContain("プリーツ");
  });

  it("legwear のルーズソックスと outerwear のブレザーを正しいラベルで表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 3,
            name: "ルーズソックス",
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
            category: "legwear",
            subcategory: "socks",
            shape: "socks",
            colors: [],
            seasons: [],
            tpos: [],
            spec: {
              legwear: {
                coverage_type: "loose_socks",
              },
            },
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 4,
            name: "紺ブレザー",
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
            category: "outerwear",
            subcategory: "jacket",
            shape: "blazer",
            colors: [],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");

    const legwearMarkup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "3" }),
        searchParams: Promise.resolve({}),
      }),
    );
    const blazerMarkup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "4" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(legwearMarkup).toContain("ルーズソックス");
    expect(blazerMarkup).toContain("ブレザー");
  });

  it("legwear のニーハイソックスを正しいラベルで表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 5,
            name: "ニーハイソックス",
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
            category: "legwear",
            subcategory: "socks",
            shape: "socks",
            colors: [],
            seasons: [],
            tpos: [],
            spec: {
              legwear: {
                coverage_type: "thigh_high_socks",
              },
            },
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "5" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("ニーハイソックス");
  });
  it("詳細画面でメインカラーの custom_label を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 6,
            name: "繝阪う繝薙・繝九ャ繝・",
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
            category: "tops",
            subcategory: "tshirt_cutsew",
            shape: "tshirt",
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "繝阪う繝薙・",
                custom_label: "64 BLUE",
              },
            ],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "6" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("色名");
    expect(markup).toContain("64 BLUE");
  });

  it("dress の固定実寸を詳細画面で表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 7,
            name: "Dress Item",
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
            size_details: {
              structured: {
                shoulder_width: 39,
                total_length: 118,
              },
            },
            is_rain_ok: false,
            category: "onepiece_dress",
            subcategory: "dress",
            shape: "dress",
            colors: [],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "7" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("39cm");
    expect(markup).toContain("118cm");
  });

  it("skirts / other の詳細では shape を表示せず、spec は表示できる", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 22,
            name: "その他スカート詳細",
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
            category: "skirts",
            subcategory: "other",
            shape: "other",
            colors: [],
            seasons: [],
            tpos: [],
            spec: {
              skirt: {
                length_type: "midi",
                material_type: "lace",
              },
            },
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "22" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("その他スカート");
    expect(markup).toContain("ミディ");
    expect(markup).toContain("レース");
    expect(markup).not.toContain(">形<");
  });

  it("skirts の narrow は詳細でナローとして表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 23,
            name: "ナロースカート詳細",
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
            category: "skirts",
            subcategory: "skirt",
            shape: "narrow",
            colors: [],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
            materials: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: ItemPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemPage({
        params: Promise.resolve({ id: "23" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("ナロー");
  });
});
