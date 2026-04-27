// @vitest-environment jsdom
import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import PurchaseCandidateSizeComparison from "@/components/purchase-candidates/purchase-candidate-size-comparison";
import type { ItemRecord } from "@/types/items";
import type { PurchaseCandidateRecord } from "@/types/purchase-candidates";

function createItem(overrides: Partial<ItemRecord>): ItemRecord {
  return {
    id: 1,
    name: "比較アイテム",
    status: "active",
    category: "skirts",
    subcategory: "skirt",
    shape: "narrow",
    size_details: {
      structured: {
        waist: { value: 64 },
        hip: { value: 103 },
        skirt_length: { value: 83.5 },
      },
    },
    colors: [],
    seasons: [],
    tpos: [],
    ...overrides,
  };
}

function createCustomOnlyItem(overrides: Partial<ItemRecord>): ItemRecord {
  return createItem({
    size_details: {
      custom_fields: [{ label: "裾スリット", value: 24, sort_order: 1 }],
    },
    ...overrides,
  });
}

function createCandidate(
  overrides: Partial<PurchaseCandidateRecord>,
): PurchaseCandidateRecord {
  return {
    id: 10,
    status: "considering",
    priority: "medium",
    name: "候補アイテム",
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
    size_label: null,
    size_note: null,
    size_details: {
      structured: {
        waist: { value: 66 },
        hip: { value: 107 },
        skirt_length: { value: 84.5 },
      },
    },
    spec: null,
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
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("PurchaseCandidateSizeComparison", () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

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

  it("購入検討に固定・自由どちらの実寸もない場合は empty state を出す", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({ size_details: null })}
        resolvedCategory="skirts"
        resolvedSubcategory="skirt"
        resolvedShape="narrow"
        items={[createItem({})]}
      />,
    );

    expect(container.textContent).toContain(
      "購入検討に実寸を入力すると、手持ちアイテムと比較できます。",
    );
  });

  it("比較候補がない場合は empty state を出す", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({})}
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

  it("差分列を出さず、固定実寸と自由実寸を表示する", () => {
    setup(
      <PurchaseCandidateSizeComparison
        candidate={createCandidate({
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
            size_details: {
              structured: {
                waist: { value: 64 },
                hip: { value: 103 },
                skirt_length: { value: 83.5 },
              },
            },
          }),
          createCustomOnlyItem({
            id: 2,
            name: "手持ちB",
            subcategory: "other",
            shape: "",
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

    const select = container.querySelector("select");
    expect(select).not.toBeNull();
    expect(select?.textContent).toContain("手持ちA");
    expect(select?.textContent).toContain("手持ちB");

    act(() => {
      if (!select) {
        return;
      }

      select.value = "2";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("24cm");
  });
});
