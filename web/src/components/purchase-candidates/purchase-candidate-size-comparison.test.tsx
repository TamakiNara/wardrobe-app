// @vitest-environment jsdom

import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PurchaseCandidateSizeComparison from "@/components/purchase-candidates/purchase-candidate-size-comparison";
import type { ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";

function createItem(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    id: 1,
    name: "比較用アイテム",
    status: "active",
    category: "skirts",
    subcategory: "skirt",
    shape: "narrow",
    size_label: "M",
    size_note: null,
    size_details: {
      structured: {
        waist: { value: 64 },
        hip: { value: 103 },
        skirt_length: { value: 83.5 },
      },
    },
    colors: [
      {
        role: "main",
        mode: "preset",
        value: "black",
        hex: "#111111",
        label: "ブラック",
        custom_label: null,
      },
    ],
    seasons: [],
    tpos: [],
    ...overrides,
  };
}

function createCandidate(
  overrides: Partial<PurchaseCandidateRecord> = {},
): PurchaseCandidateRecord {
  return {
    id: 10,
    status: "considering",
    priority: "medium",
    name: "購入検討アイテム",
    category_id: "skirts_skirt",
    shape: "narrow",
    category_name: "スカート",
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
    size_label: "M",
    size_note: null,
    size_details: {
      structured: {
        waist: { value: 66 },
        hip: { value: 107 },
        skirt_length: { value: 84.5 },
      },
    },
    alternate_size_label: null,
    alternate_size_note: null,
    alternate_size_details: null,
    spec: null,
    is_rain_ok: false,
    sheerness: null,
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
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("PurchaseCandidateSizeComparison", () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    container?.remove();
  });

  function setup(element: React.ReactElement) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    act(() => {
      root.render(element);
    });
  }

  it("購入検討に実寸がない場合は empty state を表示する", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({ size_details: null })}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[createItem()]}
      />,
    );

    expect(container.textContent).toContain(
      "購入検討に実寸を入力すると、手持ちアイテムと比較できます。",
    );
  });

  it("比較候補がない場合は empty state を表示する", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate()}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[]}
      />,
    );

    expect(container.textContent).toContain(
      "比較できる手持ちアイテムがまだありません。",
    );
  });

  it("固定実寸と自由実寸を表に表示し、候補 item を切り替えられる", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({
          size_note: "ややゆったり",
          size_details: {
            structured: {
              waist: { value: 66 },
              hip: { value: 107 },
              skirt_length: { value: 84.5 },
            },
            custom_fields: [
              { label: "裾スリット", value: 26, note: "後ろ約", sort_order: 1 },
            ],
          },
        })}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[
          createItem({
            id: 1,
            name: "手持ちA",
            size_label: "M",
            size_note: "ちょうどよい",
            size_details: {
              structured: {
                waist: { value: 64 },
                hip: { value: 103 },
                skirt_length: { value: 83.5 },
              },
            },
            colors: [
              {
                role: "main",
                mode: "custom",
                value: "#000000",
                hex: "#000000",
                label: "カスタムカラー",
                custom_label: "ブラック",
              },
            ],
          }),
          createItem({
            id: 2,
            name: "手持ちB",
            size_label: "L",
            size_note: "丈がやや長い",
            subcategory: "other",
            shape: "",
            size_details: {
              custom_fields: [
                { label: "裾スリット", value: 24, sort_order: 1 },
              ],
            },
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "ivory",
                hex: "#f6f1e7",
                label: "アイボリー",
                custom_label: null,
              },
            ],
          }),
          createItem({
            id: 3,
            name: "別カテゴリアイテム",
            category: "tops",
            subcategory: "blouse",
            shape: "shirt",
            size_label: "M",
            size_details: {
              structured: {
                shoulder_width: { value: 38 },
              },
            },
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#223355",
                label: "ネイビー",
                custom_label: null,
              },
            ],
          }),
        ]}
      />,
    );

    expect(container.textContent).toContain("ウエスト");
    expect(container.textContent).toContain("66cm");
    expect(container.textContent).toContain("64cm");
    expect(container.textContent).toContain("裾スリット");
    expect(container.textContent).toContain("後ろ約 26cm");
    expect(container.textContent).toContain("未設定");
    expect(container.textContent).not.toContain("差分");
    expect(container.textContent).toContain("手持ち（M）");
    expect(container.textContent).toContain("購入検討側 M のサイズ感メモ");
    expect(container.textContent).toContain("ややゆったり");
    expect(container.textContent).toContain(
      "手持ちアイテム 手持ちA（M）のサイズ感メモ",
    );
    expect(container.textContent).toContain("ちょうどよい");

    const select = container.querySelector<HTMLSelectElement>(
      "#purchase-candidate-size-comparison-item",
    );
    expect(select).not.toBeNull();
    expect(select?.options[0]?.textContent).toBe("手持ちA（ブラック）");
    expect(select?.options[1]?.textContent).toBe("手持ちB（アイボリー）");
    expect(select?.options[2]?.textContent).toBe(
      "別カテゴリアイテム（ネイビー）",
    );

    act(() => {
      if (!select) {
        return;
      }

      select.value = "2";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("手持ち（L）");
    expect(container.textContent).toContain("24cm");
    expect(container.textContent).toContain("丈がやや長い");
    expect(container.textContent).toContain(
      "手持ちアイテム 手持ちB（L）のサイズ感メモ",
    );
  });

  it("複数サイズ候補がある場合は両方のサイズ列を並べて表示する", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({
          size_label: "M",
          size_details: {
            structured: {
              waist: { value: 66 },
            },
          },
          alternate_size_label: "L",
          alternate_size_details: {
            structured: {
              waist: { value: 70 },
            },
          },
        })}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[createItem()]}
      />,
    );

    expect(container.textContent).toContain("M");
    expect(container.textContent).toContain("L");
    expect(container.textContent).toContain("手持ち（M）");
    expect(container.textContent).toContain("66cm");
    expect(container.textContent).toContain("70cm");
  });

  it("両方にサイズ感メモがない場合はメモ欄を表示しない", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate()}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[createItem()]}
      />,
    );

    expect(container.textContent).not.toContain("サイズ感メモ");
  });
});
