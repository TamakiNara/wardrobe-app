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
    brand_name: "Sample Brand",
    price: 10000,
    sale_price: null,
    sale_ends_at: null,
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

  it("group_order が最小の候補を初期表示し、色チップで表示対象を切り替えられる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 2,
              name: "ブルーコート",
              brand_name: "Blue Brand",
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
              name: "レッドコート",
              brand_name: "Red Brand",
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

    expect(container.textContent).toContain("レッドコート");
    expect(container.textContent).toContain("Red Brand");
    expect(container.textContent).toContain("7,800");
    expect(container.textContent).not.toContain("色違い 2件");
    const variantSwatches = container.querySelectorAll(
      '[data-testid="variant-swatch"]',
    );
    expect(variantSwatches).toHaveLength(2);
    expect(variantSwatches[0].className).toContain("rounded-md");
    expect(variantSwatches[0].className).not.toContain("rounded-full");
    expect(
      container.querySelector('a[href="/purchase-candidates/1"]'),
    ).not.toBeNull();

    const blueButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="64 BLUEを表示"]',
    );
    expect(blueButton).not.toBeNull();

    await act(async () => {
      blueButton!.click();
    });

    expect(container.textContent).toContain("ブルーコート");
    expect(container.textContent).toContain("Blue Brand");
    expect(container.textContent).toContain("12,000");
    expect(
      container.querySelector('a[href="/purchase-candidates/2"]'),
    ).not.toBeNull();
  });

  it("group が 1 件だけなら通常カード相当に表示する", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 3,
              name: "単独グループ候補",
              group_id: 20,
              group_order: 1,
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "brown",
                  hex: "#8A5A38",
                  label: "Brown",
                },
              ],
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("単独グループ候補");
    expect(container.querySelector("button")).toBeNull();
    expect(
      container.querySelectorAll('[data-testid="candidate-color-swatch"]'),
    ).toHaveLength(1);
  });

  it("複数画像がある候補はカード内で画像だけを切り替えられる", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 4,
              name: "画像切替候補",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "navy",
                  hex: "#1F3A5F",
                  label: "Navy",
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
    expect(
      container.querySelectorAll('[data-testid="candidate-color-swatch"]'),
    ).toHaveLength(0);

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

  it("色違い候補を切り替えると画像表示を先頭に戻す", async () => {
    const { default: PurchaseCandidateListCard } =
      await import("./purchase-candidate-list-card");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListCard, {
          candidates: [
            buildCandidate({
              id: 1,
              name: "レッドコート",
              group_id: 10,
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
                  id: 21,
                  purchase_candidate_id: 1,
                  disk: "public",
                  path: "purchase-candidates/1/front.png",
                  url: "https://example.test/red-front.png",
                  original_filename: "red-front.png",
                  mime_type: "image/png",
                  file_size: 1024,
                  sort_order: 1,
                  is_primary: true,
                },
                {
                  id: 22,
                  purchase_candidate_id: 1,
                  disk: "public",
                  path: "purchase-candidates/1/side.png",
                  url: "https://example.test/red-side.png",
                  original_filename: "red-side.png",
                  mime_type: "image/png",
                  file_size: 2048,
                  sort_order: 2,
                  is_primary: false,
                },
              ],
            }),
            buildCandidate({
              id: 2,
              name: "ブルーコート",
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
              images: [
                {
                  id: 23,
                  purchase_candidate_id: 2,
                  disk: "public",
                  path: "purchase-candidates/2/front.png",
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

    const nextButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="次の画像を表示"]',
    );
    expect(nextButton).not.toBeNull();

    await act(async () => {
      nextButton!.click();
    });
    expect(
      container.querySelector('img[src="https://example.test/red-side.png"]'),
    ).not.toBeNull();

    const blueButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="64 BLUEを表示"]',
    );
    expect(blueButton).not.toBeNull();

    await act(async () => {
      blueButton!.click();
    });

    expect(
      container.querySelector('img[src="https://example.test/blue-front.png"]'),
    ).not.toBeNull();
  });

  it("複数画像の読み込み失敗を画像ごとに扱える", async () => {
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

    const nextButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="次の画像を表示"]',
    );
    expect(nextButton).not.toBeNull();

    await act(async () => {
      nextButton!.click();
    });

    expect(
      container.querySelector('img[src="https://example.test/ok.png"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("2/2");
  });

  it("色違い切り替え時に画像失敗状態を引きずらない", async () => {
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

    const blueButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="ブルーを表示"]',
    );
    expect(blueButton).not.toBeNull();

    await act(async () => {
      blueButton!.click();
    });

    expect(
      container.querySelector('img[src="https://example.test/blue-front.png"]'),
    ).not.toBeNull();
  });
});
