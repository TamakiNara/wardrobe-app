// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

function buildCandidate(
  overrides: Partial<PurchaseCandidateListItem>,
): PurchaseCandidateListItem {
  return {
    id: 1,
    status: "considering",
    priority: "medium",
    name: "候補",
    category_id: "outerwear_coat",
    category_name: "コート",
    brand_name: "サンプルブランド",
    price: 10000,
    release_date: null,
    sale_price: null,
    sale_ends_at: null,
    discount_ends_at: null,
    purchase_url: null,
    group_id: null,
    group_order: null,
    colors: [],
    converted_item_id: null,
    converted_at: null,
    primary_image: null,
    images: [],
    updated_at: "2026-04-18T10:00:00+09:00",
    ...overrides,
  };
}

describe("PurchaseCandidateListCard", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("group_order の先頭候補を表示し、スウォッチ切り替えで候補を切り替えられる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 2,
              name: "ブルー候補",
              brand_name: "ブルーブランド",
              price: 12000,
              group_id: 10,
              group_order: 2,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "blue",
                  hex: "#0077D9",
                  label: "ブルー",
                  custom_label: "64 BLUE",
                },
              ],
            }),
            buildCandidate({
              id: 1,
              name: "レッド候補",
              brand_name: "レッドブランド",
              price: 9800,
              sale_price: 7800,
              group_id: 10,
              group_order: 1,
              purchase_url: "https://example.test/red",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "red",
                  hex: "#E53935",
                  label: "レッド",
                  custom_label: "09 RED",
                },
              ],
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("レッド候補");
    expect(container.textContent).toContain("レッドブランド");
    expect(container.textContent).toContain("7,800");
    expect(
      container.querySelector('a[href="/purchase-candidates/1"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('a[href="https://example.test/red"]')
        ?.textContent,
    ).toContain("商品ページ");

    const blueButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="64 BLUEを表示"]',
    );
    expect(blueButton).not.toBeNull();

    await act(async () => {
      blueButton!.click();
    });

    expect(container.textContent).toContain("ブルー候補");
    expect(container.textContent).toContain("ブルーブランド");
    expect(container.textContent).toContain("12,000");
    expect(
      container.querySelector('a[href="/purchase-candidates/2"]'),
    ).not.toBeNull();
  });

  it("単体候補では通常時にバリアントスウォッチを表示しない", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 3,
              name: "単体候補",
              group_id: 20,
              group_order: 1,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "brown",
                  hex: "#8A5A38",
                  label: "ブラウン",
                },
              ],
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("単体候補");
    expect(container.querySelector("button")).toBeNull();
    expect(
      container.querySelectorAll('[data-testid="candidate-color-swatch"]'),
    ).toHaveLength(1);
  });

  it("複数画像がある場合に画像切り替えボタンで次の画像へ進める", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 4,
              name: "画像候補",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "navy",
                  hex: "#1F3A5F",
                  label: "ネイビー",
                },
              ],
              images: [
                {
                  id: 11,
                  purchase_candidate_id: 4,
                  disk: "public",
                  path: "purchase-candidates/4/front.png",
                  url: "https://example.test/front.png",
                  original_filename: "front.png",
                  mime_type: "image/png",
                  file_size: 1024,
                  sort_order: 1,
                  is_primary: true,
                },
                {
                  id: 12,
                  purchase_candidate_id: 4,
                  disk: "public",
                  path: "purchase-candidates/4/side.png",
                  url: "https://example.test/side.png",
                  original_filename: "side.png",
                  mime_type: "image/png",
                  file_size: 2048,
                  sort_order: 2,
                  is_primary: false,
                },
              ],
            }),
          ],
        }),
      );
    });

    expect(
      container.querySelector('img[src="https://example.test/front.png"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("1/2");

    const nextButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="次の画像を表示"]',
    );
    expect(nextButton).not.toBeNull();

    await act(async () => {
      nextButton!.click();
    });

    expect(
      container.querySelector('img[src="https://example.test/side.png"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("2/2");
  });

  it("画像読み込み失敗時は単体候補でフォールバック表示に切り替わる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 30,
              name: "画像失敗候補",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "brown",
                  hex: "#8A5A38",
                  label: "ブラウン",
                  custom_label: "33 BROWN",
                },
              ],
              images: [
                {
                  id: 31,
                  purchase_candidate_id: 30,
                  disk: "public",
                  path: "purchase-candidates/30/broken.png",
                  url: "https://example.test/broken.png",
                  original_filename: "broken.png",
                  mime_type: "image/png",
                  file_size: 1024,
                  sort_order: 1,
                  is_primary: true,
                },
                {
                  id: 32,
                  purchase_candidate_id: 30,
                  disk: "public",
                  path: "purchase-candidates/30/ok.png",
                  url: "https://example.test/ok.png",
                  original_filename: "ok.png",
                  mime_type: "image/png",
                  file_size: 2048,
                  sort_order: 2,
                  is_primary: false,
                },
              ],
            }),
          ],
        }),
      );
    });

    const brokenImage = container.querySelector<HTMLImageElement>(
      'img[src="https://example.test/broken.png"]',
    );
    expect(brokenImage).not.toBeNull();

    await act(async () => {
      brokenImage!.dispatchEvent(new Event("error"));
    });

    expect(container.textContent).toContain("画像なし");
    expect(
      container.querySelector('img[src="https://example.test/broken.png"]'),
    ).toBeNull();
    expect(
      container.querySelectorAll('[data-testid="candidate-color-swatch"]'),
    ).toHaveLength(1);
    expect(container.textContent).toContain("33 BROWN");
  });

  it("複数候補ではフォールバック表示でもバリアントスウォッチを維持する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 40,
              name: "レッド候補",
              group_id: 44,
              group_order: 1,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "red",
                  hex: "#E53935",
                  label: "レッド",
                },
              ],
              images: [
                {
                  id: 41,
                  purchase_candidate_id: 40,
                  disk: "public",
                  path: "purchase-candidates/40/broken.png",
                  url: "https://example.test/red-broken.png",
                  original_filename: "red-broken.png",
                  mime_type: "image/png",
                  file_size: 1024,
                  sort_order: 1,
                  is_primary: true,
                },
              ],
            }),
            buildCandidate({
              id: 45,
              name: "ブルー候補",
              group_id: 44,
              group_order: 2,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "blue",
                  hex: "#0077D9",
                  label: "ブルー",
                },
              ],
              images: [
                {
                  id: 46,
                  purchase_candidate_id: 45,
                  disk: "public",
                  path: "purchase-candidates/45/front.png",
                  url: "https://example.test/blue-front.png",
                  original_filename: "blue-front.png",
                  mime_type: "image/png",
                  file_size: 1024,
                  sort_order: 1,
                  is_primary: true,
                },
              ],
            }),
          ],
        }),
      );
    });

    const brokenImage = container.querySelector<HTMLImageElement>(
      'img[src="https://example.test/red-broken.png"]',
    );
    expect(brokenImage).not.toBeNull();

    await act(async () => {
      brokenImage!.dispatchEvent(new Event("error"));
    });

    expect(container.textContent).toContain("画像なし");
    expect(
      container.querySelectorAll('[data-testid="variant-swatch"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-testid="candidate-color-swatch"]'),
    ).toHaveLength(0);
  });

  it("shape があるカテゴリでは分類表示に shape を含める", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 50,
              category_id: "skirts_skirt",
              category_name: "スカート",
              shape: "narrow",
              name: "ナロースカート候補",
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("スカート / ナロー");
  });

  it("セール終了日時を日本時間で表示する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 60,
              sale_price: 7800,
              discount_ends_at: "2026-05-07T23:59",
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("05/07 23:59");
  });

  it("selection mode では単体候補に軽い選択行だけを表示する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 70,
              name: "単体候補",
            }),
          ],
          selectionMode: true,
          selectedCandidateIds: [70],
          onToggleCandidate: vi.fn(),
          isCandidateSelectable: () => true,
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="purchase-candidate-selection-controls"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="purchase-candidate-checkbox-70"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("買い物メモに追加");
    expect(
      container.querySelector('a[href="/purchase-candidates/70"]'),
    ).not.toBeNull();
  });

  it("selection mode では単体候補が追加済みでも checked のまま操作できる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 73,
              name: "追加済み単体候補",
            }),
          ],
          selectionMode: true,
          selectedCandidateIds: [],
          alreadyAddedCandidateIds: [73],
          onToggleCandidate: vi.fn(),
          isCandidateSelectable: () => true,
        }),
      );
    });

    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-73"]',
    );

    expect(checkbox?.checked).toBe(true);
    expect(checkbox?.disabled).toBe(false);
    expect(container.textContent).toContain("追加済み");
  });

  it("selection mode では複数候補に候補選択枠を表示する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 71,
              name: "レッド候補",
              group_id: 80,
              group_order: 1,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "red",
                  hex: "#E53935",
                  label: "レッド",
                },
              ],
            }),
            buildCandidate({
              id: 72,
              name: "ブルー候補",
              group_id: 80,
              group_order: 2,
              status: "purchased",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "blue",
                  hex: "#0077D9",
                  label: "ブルー",
                },
              ],
            }),
          ],
          selectionMode: true,
          selectedCandidateIds: [],
          onToggleCandidate: vi.fn(),
          isCandidateSelectable: (candidate) =>
            candidate.status !== "purchased",
        }),
      );
    });

    expect(
      container.querySelector(
        '[data-testid="purchase-candidate-selection-controls"]',
      ),
    ).not.toBeNull();
    expect(container.textContent).toContain("買い物メモに追加する候補");
    expect(
      container.querySelector<HTMLInputElement>(
        '[data-testid="purchase-candidate-checkbox-72"]',
      )?.disabled,
    ).toBe(true);
  });

  it("selection mode では複数候補の追加済み候補を checked のまま操作できる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 81,
              name: "ブラック候補",
              group_id: 90,
              group_order: 1,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "black",
                  hex: "#111111",
                  label: "ブラック",
                },
              ],
            }),
            buildCandidate({
              id: 82,
              name: "ネイビー候補",
              group_id: 90,
              group_order: 2,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "navy",
                  hex: "#1F3A5F",
                  label: "ネイビー",
                },
              ],
            }),
          ],
          selectionMode: true,
          selectedCandidateIds: [],
          alreadyAddedCandidateIds: [81],
          onToggleCandidate: vi.fn(),
          isCandidateSelectable: () => true,
        }),
      );
    });

    const addedCheckbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-81"]',
    );
    const selectableCheckbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-82"]',
    );

    expect(addedCheckbox?.checked).toBe(true);
    expect(addedCheckbox?.disabled).toBe(false);
    expect(selectableCheckbox?.checked).toBe(false);
    expect(container.textContent).toContain("追加済み");
  });

  it("selection mode では追加済み候補のチェックを外すと解除予定を表示する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    const onToggleCandidate = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 91,
              name: "単体候補",
            }),
          ],
          selectionMode: true,
          selectedCandidateIds: [],
          alreadyAddedCandidateIds: [91],
          pendingRemoveCandidateIds: [91],
          onToggleCandidate,
          isCandidateSelectable: () => true,
        }),
      );
    });

    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-91"]',
    );

    expect(checkbox?.checked).toBe(false);
    expect(checkbox?.disabled).toBe(false);
    expect(container.textContent).toContain("解除予定");
  });
});
