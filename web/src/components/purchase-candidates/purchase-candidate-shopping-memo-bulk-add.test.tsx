// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";

const fetchShoppingMemosMock = vi.fn();
const addItemsToShoppingMemoMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/api/shopping-memos", () => ({
  fetchShoppingMemos: (...args: unknown[]) => fetchShoppingMemosMock(...args),
  addItemsToShoppingMemo: (...args: unknown[]) =>
    addItemsToShoppingMemoMock(...args),
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
    updated_at: "2026-05-07T10:00:00+09:00",
    ...overrides,
  };
}

describe("PurchaseCandidateShoppingMemoBulkAdd", () => {
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

  async function renderComponent(candidates: PurchaseCandidateListItem[]) {
    const { default: PurchaseCandidateShoppingMemoBulkAdd } =
      await import("./purchase-candidate-shopping-memo-bulk-add");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateShoppingMemoBulkAdd, {
          groups: [
            {
              key: "group-1",
              candidates,
            },
          ],
        }),
      );
    });
  }

  it("選択モードで追加先メモの選択欄を表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([buildCandidate({ id: 1, name: "候補A" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("買い物メモへ追加");
    expect(
      container.querySelectorAll(
        '[data-testid="shopping-memo-bulk-add-heading"]',
      ),
    ).toHaveLength(1);
    expect(container.textContent).toContain("追加先");
    expect(container.textContent).toContain("追加する");
    expect(container.querySelector("select")).not.toBeNull();
    expect(container.textContent).not.toContain(
      "追加先の買い物メモ追加先の買い物メモ",
    );
  });

  it("追加先メモが未選択の間は追加ボタンを disabled にする", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([buildCandidate({ id: 2, name: "候補A" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("追加する"),
    ) as HTMLButtonElement | undefined;
    const select = container.querySelector(
      "select",
    ) as HTMLSelectElement | null;

    expect(select).not.toBeNull();
    expect(select?.value).toBe("");
    expect(addButton?.disabled).toBe(true);
    expect(container.textContent).toContain(
      "追加先の買い物メモを選択してください。",
    );
  });

  it("候補が未選択の間は追加ボタンを disabled にする", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([buildCandidate({ id: 3, name: "候補A" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const select = container.querySelector(
      "select",
    ) as HTMLSelectElement | null;

    await act(async () => {
      if (select) {
        select.value = "5";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("追加する"),
    ) as HTMLButtonElement | undefined;

    expect(addButton?.disabled).toBe(true);
    expect(container.textContent).toContain("追加する候補を選択してください。");
  });

  it("追加先メモと候補を選ぶと追加ボタンが enabled になる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([
      buildCandidate({ id: 4, name: "候補A" }),
      buildCandidate({ id: 5, name: "候補B", status: "on_hold" }),
    ]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const select = container.querySelector(
      "select",
    ) as HTMLSelectElement | null;

    await act(async () => {
      if (select) {
        select.value = "5";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-4"]',
        )
        ?.click();
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("追加する"),
    ) as HTMLButtonElement | undefined;

    expect(addButton?.disabled).toBe(false);
  });

  it("既存メモを選んで追加でき、追加後に選択を解除する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 7, name: "春夏セール候補", memo: null, status: "draft" },
        { id: 9, name: "終了メモ", memo: null, status: "closed" },
      ],
    });
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 2,
      skipped_count: 2,
      duplicate_count: 1,
      invalid_status_count: 1,
    });

    await renderComponent([
      buildCandidate({ id: 21, name: "候補A" }),
      buildCandidate({ id: 22, name: "候補B", status: "on_hold" }),
    ]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const select = container.querySelector(
      "select",
    ) as HTMLSelectElement | null;
    expect(select?.textContent).toContain("春夏セール候補");
    expect(select?.textContent).not.toContain("終了メモ");

    await act(async () => {
      if (select) {
        select.value = "7";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-21"]',
        )
        ?.click();
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-22"]',
        )
        ?.click();
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("追加する"),
    );

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(addItemsToShoppingMemoMock).toHaveBeenCalledWith(7, [21, 22]);
    expect(container.textContent).toContain("2件を買い物メモに追加しました。");
    expect(container.textContent).toContain("1件は追加済みでした。");
    expect(container.textContent).toContain("1件は対象外でした。");
    expect(container.textContent).toContain("選択して追加");
    expect(
      container.querySelector('[data-testid="purchase-candidate-checkbox-21"]'),
    ).toBeNull();
  });

  it("買い物メモがない場合は作成リンクを表示し、追加ボタンを無効にする", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [],
    });

    await renderComponent([buildCandidate({ id: 11, name: "候補A" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("追加する"),
    ) as HTMLButtonElement | undefined;

    expect(container.textContent).toContain(
      "追加先の買い物メモがありません。先に買い物メモを作成してください。",
    );
    expect(container.innerHTML).toContain('href="/shopping-memos/new"');
    expect(addButton?.disabled).toBe(true);
  });

  it("追加先メモ取得失敗時は取得エラーを表示する", async () => {
    fetchShoppingMemosMock.mockRejectedValue(new Error("network"));

    await renderComponent([buildCandidate({ id: 13, name: "候補A" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain(
      "追加先の買い物メモを読み込めませんでした。",
    );
  });

  it("複数候補では候補ごとの選択枠を表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([
      buildCandidate({ id: 31, name: "ブラック" }),
      buildCandidate({ id: 32, name: "ネイビー", group_order: 1 }),
    ]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      container.querySelector(
        '[data-testid="purchase-candidate-selection-controls"]',
      ),
    ).not.toBeNull();
  });

  it("単体候補では情報欄側の軽い選択UIを維持する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([buildCandidate({ id: 12, name: "単体候補" })]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      container.querySelector(
        '[data-testid="purchase-candidate-selection-controls"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="purchase-candidate-single-selection-toggle"]',
      ),
    ).not.toBeNull();
  });

  it("purchased は追加対象外のまま disabled で表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        { id: 5, name: "春夏セール候補", memo: null, status: "draft" },
      ],
    });

    await renderComponent([
      buildCandidate({ id: 41, name: "候補A" }),
      buildCandidate({ id: 42, name: "候補B", status: "purchased" }),
    ]);

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const disabledCheckbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-42"]',
    );

    expect(disabledCheckbox?.disabled).toBe(true);
    expect(container.textContent).toContain("対象外");
  });
});
