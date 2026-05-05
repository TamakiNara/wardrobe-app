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

vi.mock("@/components/items/item-duplicate-actions", () => ({
  default: () =>
    React.createElement(
      "div",
      null,
      React.createElement("a", { href: "/items/1/edit" }, "編集"),
      React.createElement("span", null, "duplicate-actions"),
      React.createElement("a", { href: "/items" }, "一覧へ戻る"),
    ),
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

    expect(markup).toContain("アイテム詳細");
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
    expect(markup).toContain("画像");
    expect(markup).toContain("プレビュー");
    expect(markup).not.toContain("代表画像プレビュー");
    expect(markup).not.toContain("代表画像を確認できます。");
    expect(markup).toContain("基本情報");
    expect(markup).toContain("分類");
    expect(markup).toContain("色 / 利用条件・特性");
    expect(markup).not.toContain(">カラー<");
    expect(markup).toContain("サイズ・実寸");
    expect(markup).toContain("購入情報");
    expect(markup).toContain("補足情報");
    expect(markup).toContain("状態管理");
    expect(markup).toContain("所持状態");
    expect(markup).toContain("ケア状態");
    expect(markup).toContain("透け感");
    expect(markup).toContain("ややあり");
    expect(markup).toContain("example.test");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
    expect(markup).toContain("duplicate-actions");
    expect(markup).toContain("status-action");
    expect(markup).toContain("care-status-action");
    expect(markup).toContain(
      "所持しなくなった場合は「手放す」を使います。必要になった時は「クローゼットに戻す」で通常状態へ戻せます。",
    );
    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("クロップド丈");
    expect(markup).toContain("タイツ");
    expect(markup).toContain("素材・混率");
    expect(markup).toContain("本体: 綿 80%、ポリエステル 20%");
    expect(markup).toContain("裏地: ポリエステル 100%");
    expect(markup).not.toContain("購入・サイズ情報");
    expect(markup).toContain("coat.png");
    expect(markup.match(/>プレビュー</g)?.length ?? 0).toBe(1);
    expect(markup.indexOf(">duplicate-actions<")).toBeLessThan(
      markup.indexOf(">status-action<"),
    );
    expect(markup.indexOf("coat.png")).toBeLessThan(
      markup.indexOf(">status-action<"),
    );
    expect(markup.indexOf(">編集<")).toBeLessThan(
      markup.indexOf(">一覧へ戻る<"),
    );
  });

  it("同じ商品の色違いナビを詳細画面に表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 31,
            group_id: 9,
            group_order: 1,
            name: "ネイビーTシャツ",
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
                label: "ネイビー",
              },
            ],
            seasons: [],
            tpos: [],
            spec: null,
            images: [],
            materials: [],
            group_items: [
              {
                id: 31,
                group_order: 1,
                name: "ネイビーTシャツ",
                status: "active",
                category: "tops",
                subcategory: "tshirt_cutsew",
                shape: "tshirt",
                colors: [
                  {
                    role: "main",
                    mode: "preset",
                    value: "navy",
                    hex: "#1F3A5F",
                    label: "ネイビー",
                  },
                ],
                images: [],
                is_current: true,
              },
              {
                id: 32,
                group_order: 2,
                name: "ホワイトTシャツ",
                status: "disposed",
                category: "tops",
                subcategory: "tshirt_cutsew",
                shape: "tshirt",
                colors: [
                  {
                    role: "main",
                    mode: "preset",
                    value: "white",
                    hex: "#F8FAFC",
                    label: "ホワイト",
                  },
                ],
                images: [
                  {
                    id: 5,
                    item_id: 32,
                    disk: "public",
                    path: "items/32/white.png",
                    url: "https://example.test/storage/items/32/white.png",
                    original_filename: "white.png",
                    mime_type: "image/png",
                    file_size: 1200,
                    sort_order: 1,
                    is_primary: true,
                  },
                ],
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
        params: Promise.resolve({ id: "31" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("色違いの候補");
    expect(markup).toContain("アイテムを選ぶと別の詳細へ移動します。");
    expect(markup).toContain("色違い 2件");
    expect(markup).toContain("ネイビーTシャツ");
    expect(markup).not.toContain("ホワイトTシャツ");
    expect(markup).toContain("表示中");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain("ネイビー");
    expect(markup).toContain("ホワイト");
    expect(markup).toContain('href="/items/32"');
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
    expect(markup).toContain("一覧へ戻る");
    expect(markup).toContain('href="/items/1/edit"');
    expect(markup).toContain("編集");
    expect(markup.indexOf(">編集<")).toBeLessThan(
      markup.indexOf(">一覧へ戻る<"),
    );
    expect(markup).toContain("カテゴリ");
    expect(markup).toContain("コート");
    expect(markup).toContain("トレンチコート");
    expect(markup).not.toContain("詳細・特性");
  });

  it("active な underwear item はアンダーウェア一覧へ戻る", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 11,
            name: "黒ブラ",
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
            category: "underwear",
            subcategory: "bra",
            shape: "bra",
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
        params: Promise.resolve({ id: "11" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('href="/items/underwear"');
    expect(markup).toContain("アンダーウェア一覧");
  });

  it("disposed な underwear item は手放したアンダーウェア一覧へ戻る", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 12,
            name: "黒ショーツ",
            status: "disposed",
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
            category: "underwear",
            subcategory: "shorts",
            shape: "shorts",
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
        params: Promise.resolve({ id: "12" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('href="/items/underwear/disposed"');
    expect(markup).toContain("手放したアンダーウェア一覧");
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

    expect(markup).toContain("64 BLUE");
    expect(markup).not.toContain("カスタムカラー");
    expect(markup).toContain("メインカラー");
    expect(markup).not.toContain("サブカラー");
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
  it("bags の固定実寸を詳細画面で表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 24,
            name: "トートバッグ詳細",
            status: "active",
            care_status: null,
            sheerness: null,
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
                height: 21,
                width: 28.5,
                depth: 12,
              },
            },
            is_rain_ok: false,
            category: "bags",
            subcategory: "tote",
            shape: "tote",
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
        params: Promise.resolve({ id: "24" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("高さ（H）");
    expect(markup).toContain("幅（W）");
    expect(markup).toContain("マチ（D）");
    expect(markup).toContain("21cm");
    expect(markup).toContain("28.5cm");
    expect(markup).toContain("12cm");
  });

  it("underwear の bra 固定実寸を詳細画面で表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 25,
            name: "ブラ詳細",
            status: "active",
            care_status: null,
            sheerness: null,
            brand_name: null,
            price: null,
            purchase_url: null,
            memo: null,
            purchased_at: null,
            size_gender: null,
            size_label: "C70",
            size_note: null,
            size_details: {
              structured: {
                underbust: 68,
                top_bust: 83.5,
              },
            },
            is_rain_ok: false,
            category: "underwear",
            subcategory: "bra",
            shape: "bra",
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
        params: Promise.resolve({ id: "25" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("アンダーバスト");
    expect(markup).toContain("トップバスト");
    expect(markup).toContain("68cm");
    expect(markup).toContain("83.5cm");
  });
});
