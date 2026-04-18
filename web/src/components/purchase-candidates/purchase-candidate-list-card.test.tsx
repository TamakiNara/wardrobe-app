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
    expect(
      container.querySelector('a[href="/purchase-candidates/1"]'),
    ).not.toBeNull();

    const blueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("ブルー"),
    ) as HTMLButtonElement | undefined;
    expect(blueButton).not.toBeUndefined();

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
            }),
          ],
        }),
      );
    });

    expect(container.textContent).toContain("単独グループ候補");
    expect(container.querySelector("button")).toBeNull();
  });
});
