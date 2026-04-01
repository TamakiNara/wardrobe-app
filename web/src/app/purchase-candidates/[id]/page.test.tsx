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
    default: ({ candidateId }: { candidateId: number }) =>
      React.createElement(
        "div",
        {
          "data-testid": "item-draft-action",
          "data-candidate-id": candidateId,
        },
        "item-draft-action",
      ),
  }),
);

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-duplicate-action",
  () => ({
    default: ({ candidateId }: { candidateId: number }) =>
      React.createElement(
        "div",
        { "data-testid": "duplicate-action", "data-candidate-id": candidateId },
        "duplicate-action",
      ),
  }),
);

describe("PurchaseCandidateDetailPage", () => {
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
          category_id: "outer_coat",
          category_name: "コート",
          brand_name: "Brand",
          price: 14800,
          sale_price: 12800,
          sale_ends_at: "2026-03-31T18:00:00+09:00",
          purchase_url: "https://example.test",
          memo: "メモ",
          wanted_reason: "理由",
          size_gender: "women",
          size_label: "M",
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
    expect(markup).toContain("一覧へ戻る");
    expect(markup).toContain("アイテム追加");
    expect(sectionTitles).toEqual([
      "アイテム追加",
      "基本情報",
      "購入情報",
      "色 / 季節 / TPO",
      "サイズ・属性",
      "素材・混率",
      "メモ",
      "画像",
    ]);
    expect(markup).toContain("保留中");
    expect(markup).toContain("優先度: 中");
    expect(markup).not.toContain(
      '<dt class="text-sm font-medium text-gray-700">ステータス</dt>',
    );
    expect(markup).not.toContain(
      '<dt class="text-sm font-medium text-gray-700">優先度</dt>',
    );
    expect(markup).toContain("14,800円");
    expect(markup).toContain("12,800円");
    expect(markup).toContain("セール終了予定");
    expect(markup).toContain("レディース");
    expect(markup).toContain("理由");
    expect(markup).toContain("厚手対応");
    expect(markup).toContain("素材・混率");
    expect(markup).toContain("本体");
    expect(markup).toContain("綿 80%、ポリエステル 20%");
    expect(markup).toContain("実寸");
    expect(markup).toContain("総丈");
    expect(markup).toContain("92cm");
    expect(markup).toContain("item-draft-action");
    expect(markup).toContain("duplicate-action");
    expect(markup).toContain('href="/purchase-candidates"');
    expect(markup).toContain('href="/purchase-candidates/10/edit"');
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
          category_id: "outer_coat",
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
    expect(markup).toContain("duplicate-action");
    expect(markup).not.toContain("item-draft-action");
  });
});
