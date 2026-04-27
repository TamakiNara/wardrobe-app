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
  "@/components/purchase-candidates/purchase-candidate-item-draft-action",
  () => ({
    default: ({
      candidateId,
      convertedItemId,
    }: {
      candidateId: number;
      convertedItemId: number | null;
    }) =>
      React.createElement(
        "button",
        {
          "data-testid": "item-draft-action",
          "data-candidate-id": candidateId,
        },
        convertedItemId === null
          ? "アイテムに追加する"
          : "アイテム初期値を再生成する",
      ),
  }),
);

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-color-variant-action",
  () => ({
    default: ({
      candidateId,
      buttonLabel = "色違いを追加",
    }: {
      candidateId: number;
      buttonLabel?: string;
    }) =>
      React.createElement(
        "button",
        {
          "data-testid": "color-variant-action",
          "data-candidate-id": candidateId,
        },
        buttonLabel,
      ),
  }),
);

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-duplicate-action",
  () => ({
    default: ({
      candidateId,
      buttonLabel = "複製",
    }: {
      candidateId: number;
      buttonLabel?: string;
    }) =>
      React.createElement(
        "button",
        { "data-testid": "duplicate-action", "data-candidate-id": candidateId },
        buttonLabel,
      ),
  }),
);

describe("購入検討詳細画面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("詳細表示と item-draft 導線を描画できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 10,
          status: "on_hold",
          priority: "medium",
          name: "ネイビーコート",
          category_id: "outerwear_coat",
          shape: "trench",
          category_name: "コート",
          brand_name: "Brand",
          price: 14800,
          release_date: "2026-03-01",
          sale_price: 12800,
          sale_ends_at: "2026-03-31T18:00:00+09:00",
          discount_ends_at: "2026-03-25T18:00:00+09:00",
          purchase_url: "https://example.test",
          memo: "メモ",
          wanted_reason: "理由",
          size_gender: "women",
          size_label: "M",
          sheerness: "slight",
          size_note: "厚手対応",
          size_details: {
            structured: {
              waist: 68,
              inseam: 67,
            },
            custom_fields: [
              {
                label: "総丈",
                value: 92,
                sort_order: 1,
              },
            ],
          },
          is_rain_ok: true,
          converted_item_id: null,
          converted_at: null,
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "navy",
              hex: "#1F3A5F",
              label: "ネイビー",
            },
          ],
          seasons: ["春"],
          tpos: ["仕事"],
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
          ],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "10" }),
      }),
    );
    const sectionTitles = Array.from(
      markup.matchAll(
        /<h2 class="text-lg font-semibold text-gray-900">([^<]+)<\/h2>/g,
      ),
    ).map((match) => match[1]);

    expect(markup).toContain("ネイビーコート");
    expect(markup).toContain("購入検討管理");
    expect(markup).toContain("一覧に戻る");
    expect(markup.indexOf("アイテムに追加する")).toBeLessThan(
      markup.indexOf(">編集<"),
    );
    expect(markup.indexOf(">編集<")).toBeLessThan(
      markup.indexOf(">色違いを追加<"),
    );
    expect(markup.indexOf(">色違いを追加<")).toBeLessThan(
      markup.indexOf(">複製<"),
    );
    expect(markup.indexOf(">複製<")).toBeLessThan(
      markup.indexOf(">一覧に戻る<"),
    );
    expect(sectionTitles).toEqual([
      "基本情報",
      "購入情報",
      "分類",
      "色 / 利用条件・特性",
      "サイズ・実寸",
      "素材・混率",
      "補足情報",
      "画像",
    ]);
    expect(markup).toContain("保留中");
    expect(markup).toContain("優先度: 中");
    expect(markup).not.toContain(
      '<dt class="text-sm font-medium text-gray-700">ステータス</dt>',
    );
    expect(markup).toContain(
      '<dt class="text-sm font-medium text-gray-700">優先度</dt>',
    );
    expect(markup).toContain("14,800円");
    expect(markup).toContain("12,800円");
    expect(markup).toContain("発売日");
    expect(markup).toContain("販売終了日");
    expect(markup).toContain("セール終了日");
    expect(markup.indexOf(">想定価格<")).toBeLessThan(
      markup.indexOf(">セール価格<"),
    );
    expect(markup.indexOf(">セール価格<")).toBeLessThan(
      markup.indexOf(">セール終了日<"),
    );
    expect(markup.indexOf(">セール終了日<")).toBeLessThan(
      markup.indexOf(">発売日<"),
    );
    expect(markup.indexOf(">発売日<")).toBeLessThan(
      markup.indexOf(">販売終了日<"),
    );
    expect(markup.indexOf(">販売終了日<")).toBeLessThan(
      markup.indexOf(">購入 URL<"),
    );
    expect(markup).toContain("example.test");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
    expect(markup).toContain('class="hidden md:block" aria-hidden="true"');
    expect(markup).toContain("コート");
    expect(markup).toContain("形");
    expect(markup).toContain("トレンチ");
    expect(markup).toContain("レディース");
    expect(markup).toContain("理由");
    expect(markup).toContain("厚手対応");
    expect(markup).toContain("素材・混率");
    expect(markup).toContain("本体");
    expect(markup).toContain("綿 80%、ポリエステル 20%");
    expect(markup).toContain("実寸");
    expect(markup).toContain("雨対応");
    expect(markup).toContain("透け感");
    expect(markup).toContain("ややあり");
    expect(markup).toContain("総丈");
    expect(markup).toContain("92cm");
    expect(markup).not.toContain("仕様・属性");
    expect(markup).toContain("アイテムに追加する");
    expect(markup).toContain("色違いを追加");
    expect(markup).toContain("複製");
    expect(markup).toContain(
      "現在の候補内容からアイテム作成画面の初期値を生成します。",
    );
    expect(markup).not.toContain("アイテム追加");
    expect(markup).toContain('href="/purchase-candidates"');
    expect(markup).toContain('href="/purchase-candidates/10/edit"');
    expect(markup).toContain(">編集<");
  });

  it("同じ group の候補ナビを上部に表示し、別候補へのリンクと状態を示す", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 12,
          status: "considering",
          priority: "medium",
          name: "色違い候補",
          category_id: "tops_tshirt",
          category_name: "Tシャツ・カットソー",
          brand_name: "Brand",
          price: 8800,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: "https://example.test",
          memo: null,
          wanted_reason: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          is_rain_ok: false,
          group_id: 5,
          group_order: 2,
          group_candidates: [
            {
              id: 11,
              status: "purchased",
              name: "赤の候補",
              price: 9800,
              sale_price: 7800,
              group_order: 1,
              is_current: false,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "red",
                  hex: "#DC2626",
                  label: "赤",
                },
              ],
            },
            {
              id: 12,
              status: "considering",
              name: "青の候補",
              price: 8800,
              sale_price: null,
              group_order: 2,
              is_current: true,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "blue",
                  hex: "#2563EB",
                  label: "青",
                  custom_label: "64 BLUE",
                },
              ],
            },
            {
              id: 13,
              status: "dropped",
              name: "緑の候補",
              price: null,
              sale_price: null,
              group_order: 3,
              is_current: false,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "green",
                  hex: "#16A34A",
                  label: "緑",
                },
              ],
            },
          ],
          converted_item_id: null,
          converted_at: null,
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "blue",
              hex: "#2563EB",
              label: "青",
              custom_label: "64 BLUE",
            },
          ],
          seasons: [],
          tpos: [],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "12" }),
      }),
    );

    expect(markup).toContain("同じ商品の色違い");
    expect(markup).toContain("色違い 3件");
    expect(markup).toContain("赤");
    expect(markup).toContain("64 BLUE");
    expect(markup).toContain("メイン: 64 BLUE");
    expect(markup).toContain('title="64 BLUE"');
    expect(markup).toContain("rounded-[5px]");
    expect(markup).toContain("緑");
    expect(markup).toContain("7,800円");
    expect(markup).toContain("9,800円");
    expect(markup).toContain("8,800円");
    expect(markup).toContain("購入済み");
    expect(markup).toContain("見送り");
    expect(markup).toContain("表示中");
    expect(markup).toContain('href="/purchase-candidates/11"');
    expect(markup).toContain('href="/purchase-candidates/13"');
    expect(markup).toContain('aria-current="page"');
  });

  it("購入済みの購入検討では item-draft 導線を出さず複製導線を維持する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 11,
          status: "purchased",
          priority: "medium",
          name: "購入済み候補",
          category_id: "outerwear_coat",
          category_name: "コート",
          brand_name: "Brand",
          price: 14800,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: "https://example.test",
          memo: "メモ",
          wanted_reason: "理由",
          size_gender: "women",
          size_label: "M",
          size_note: "厚手対応",
          size_details: null,
          is_rain_ok: true,
          converted_item_id: 55,
          converted_at: "2026-03-25T10:00:00+09:00",
          colors: [
            {
              role: "main",
              mode: "preset",
              value: "navy",
              hex: "#1F3A5F",
              label: "ネイビー",
            },
          ],
          seasons: ["春"],
          tpos: ["仕事"],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "11" }),
      }),
    );

    expect(markup).toContain("この購入検討はアイテム化済みの履歴です。");
    expect(markup).toContain("色違いを追加");
    expect(markup).toContain("複製");
    expect(markup).not.toContain("アイテムに追加する");
    expect(markup).not.toContain("アイテム追加");
  });

  it("tops spec がある場合は分類内に仕様・属性を表示し、spec.tops.shape は出さない", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 21,
          status: "considering",
          priority: "high",
          name: "白シャツ候補",
          category_id: "tops_shirt_blouse",
          category_name: "シャツ・ブラウス",
          brand_name: "Brand",
          price: 9800,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: "通勤用を探している",
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          spec: {
            tops: {
              sleeve: "long",
              length: "normal",
              neck: "collar",
              design: "raglan",
              fit: "normal",
            },
          },
          is_rain_ok: false,
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: ["春", "秋"],
          tpos: ["仕事"],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "21" }),
      }),
    );

    expect(markup).toContain("分類");
    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("カテゴリ");
    expect(markup).toContain("種類");
    expect(markup).toContain("形");
    expect(markup).toContain("袖");
    expect(markup).toContain("長袖");
    expect(markup).toContain("丈");
    expect(markup).toContain("標準");
    expect(markup).toContain("首回り");
    expect(markup).toContain("襟");
    expect(markup).toContain("デザイン");
    expect(markup).toContain("ラグラン");
    expect(markup).toContain("シルエット");
    expect(markup).toContain("標準");
    expect(markup).not.toContain("spec.tops.shape");
  });

  it("skirts spec がある場合は分類内に仕様・属性を表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 22,
          status: "considering",
          priority: "high",
          name: "プリーツスカート候補",
          category_id: "skirts_skirt",
          category_name: "スカート",
          brand_name: "Brand",
          price: 9800,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: "通勤用に使いたい",
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          spec: {
            skirt: {
              length_type: "midi",
              material_type: "lace",
              design_type: "pleats",
            },
          },
          is_rain_ok: false,
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: ["春", "秋"],
          tpos: ["通勤"],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "22" }),
      }),
    );

    expect(markup).toContain("分類");
    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("カテゴリ");
    expect(markup).toContain("種類");
    expect(markup).toContain("形");
    expect(markup).toContain("丈");
    expect(markup).toContain("ミディ丈");
    expect(markup).toContain("素材感");
    expect(markup).toContain("レース");
    expect(markup).toContain("デザイン");
    expect(markup).toContain("プリーツ");
  });
  it("legwear spec の詳細画面でルーズソックスを表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 23,
          status: "considering",
          priority: "medium",
          name: "ルーズソックス候補",
          category_id: "legwear_socks",
          category_name: "ソックス",
          brand_name: null,
          price: null,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          spec: {
            legwear: {
              coverage_type: "loose_socks",
            },
          },
          is_rain_ok: false,
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: [],
          tpos: [],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "23" }),
      }),
    );

    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("ルーズソックス");
  });
  it("legwear spec の詳細画面でニーハイソックスを表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 24,
          status: "considering",
          priority: "medium",
          name: "ニーハイソックス候補",
          category_id: "legwear_socks",
          category_name: "ソックス",
          brand_name: null,
          price: null,
          sale_price: null,
          sale_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
          spec: {
            legwear: {
              coverage_type: "thigh_high_socks",
            },
          },
          is_rain_ok: false,
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: [],
          tpos: [],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "24" }),
      }),
    );

    expect(markup).toContain("仕様・属性");
    expect(markup).toContain("ニーハイソックス");
  });
  it("hoodie の固定実寸を詳細画面で表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 25,
          status: "considering",
          priority: "medium",
          name: "Hoodie Candidate",
          category_id: "tops_hoodie",
          category_name: "パーカー・フーディー",
          brand_name: null,
          price: null,
          release_date: null,
          sale_price: null,
          sale_ends_at: null,
          discount_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: {
            structured: {
              shoulder_width: 48,
              body_length: 66,
            },
          },
          is_rain_ok: false,
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: [],
          tpos: [],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "25" }),
      }),
    );

    expect(markup).toContain("48cm");
    expect(markup).toContain("66cm");
  });
  it("bags の固定実寸を詳細画面で表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 26,
          status: "considering",
          priority: "medium",
          name: "Bag Candidate",
          category_id: "bags_tote",
          category_name: "トートバッグ",
          brand_name: null,
          price: null,
          release_date: null,
          sale_price: null,
          sale_ends_at: null,
          discount_ends_at: null,
          purchase_url: null,
          memo: null,
          wanted_reason: null,
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
          group_id: null,
          group_order: null,
          group_candidates: [],
          converted_item_id: null,
          converted_at: null,
          colors: [],
          seasons: [],
          tpos: [],
          materials: [],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({
        params: Promise.resolve({ id: "26" }),
      }),
    );

    expect(markup).toContain("高さ（H）");
    expect(markup).toContain("幅（W）");
    expect(markup).toContain("マチ（D）");
    expect(markup).toContain("21cm");
    expect(markup).toContain("28.5cm");
    expect(markup).toContain("12cm");
  });
});
