// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";

const fetchShoppingMemosMock = vi.fn();
const fetchShoppingMemoDetailMock = vi.fn();
const addItemsToShoppingMemoMock = vi.fn();
const removeItemFromShoppingMemoMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/api/shopping-memos", () => ({
  fetchShoppingMemos: (...args: unknown[]) => fetchShoppingMemosMock(...args),
  fetchShoppingMemoDetail: (...args: unknown[]) =>
    fetchShoppingMemoDetailMock(...args),
  addItemsToShoppingMemo: (...args: unknown[]) =>
    addItemsToShoppingMemoMock(...args),
  removeItemFromShoppingMemo: (...args: unknown[]) =>
    removeItemFromShoppingMemoMock(...args),
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

function buildMemoDetailItem(candidateId: number, itemId: number) {
  return {
    shopping_memo_item_id: itemId,
    purchase_candidate_id: candidateId,
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

  async function openSelectionMode() {
    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  async function selectMemo(value: string) {
    const select = container.querySelector(
      "select",
    ) as HTMLSelectElement | null;

    await act(async () => {
      if (select) {
        select.value = value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  function findApplyButton() {
    return Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("変更を反映"),
    ) as HTMLButtonElement | undefined;
  }

  it("追加先メモを選ぶと detail を取得する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: { groups: [] },
    });

    await renderComponent([buildCandidate({ id: 1, name: "候補A" })]);
    await openSelectionMode();
    await selectMemo("5");

    expect(fetchShoppingMemoDetailMock).toHaveBeenCalledWith(5);
  });

  it("追加済みの単体候補は checked で表示され、disabled にはならない", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: {
        groups: [
          {
            items: [buildMemoDetailItem(12, 301)],
          },
        ],
      },
    });

    await renderComponent([buildCandidate({ id: 12, name: "単体候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-12"]',
    );

    expect(checkbox?.checked).toBe(true);
    expect(checkbox?.disabled).toBe(false);
    expect(container.textContent).toContain("追加済み");
  });

  it("追加済み候補のチェックを外すと解除予定になる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: {
        groups: [
          {
            items: [buildMemoDetailItem(21, 401)],
          },
        ],
      },
    });

    await renderComponent([buildCandidate({ id: 21, name: "追加済み候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-21"]',
        )
        ?.click();
    });

    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-21"]',
    );

    expect(checkbox?.checked).toBe(false);
    expect(container.textContent).toContain("解除予定");
    expect(container.textContent).toContain("追加 0件 / 解除 1件");
  });

  it("未追加候補をチェックすると追加予定になり、変更を反映が enabled になる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: { groups: [] },
    });

    await renderComponent([buildCandidate({ id: 31, name: "未追加候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-31"]',
        )
        ?.click();
    });

    expect(container.textContent).toContain("追加予定");
    expect(container.textContent).toContain("追加 1件 / 解除 0件");
    expect(findApplyButton()?.disabled).toBe(false);
  });

  it("変更がない場合は変更を反映が disabled になる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: {
        groups: [
          {
            items: [buildMemoDetailItem(41, 501)],
          },
        ],
      },
    });

    await renderComponent([buildCandidate({ id: 41, name: "追加済み候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    expect(findApplyButton()?.disabled).toBe(true);
    expect(container.textContent).toContain(
      "追加または解除する候補を選択してください。",
    );
  });

  it("追加予定がある場合は bulk add API を呼ぶ", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock
      .mockResolvedValueOnce({
        shoppingMemo: { groups: [] },
      })
      .mockResolvedValueOnce({
        shoppingMemo: {
          groups: [
            {
              items: [buildMemoDetailItem(51, 601)],
            },
          ],
        },
      });
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 1,
      skipped_count: 0,
      duplicate_count: 0,
      invalid_status_count: 0,
    });

    await renderComponent([buildCandidate({ id: 51, name: "追加候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-51"]',
        )
        ?.click();
    });

    await act(async () => {
      findApplyButton()?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(addItemsToShoppingMemoMock).toHaveBeenCalledWith(5, [51]);
    expect(container.textContent).toContain("1件を買い物メモに追加しました。");
    expect(container.textContent).toContain("選択して追加");
  });

  it("解除予定がある場合は DELETE API を呼ぶ", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock
      .mockResolvedValueOnce({
        shoppingMemo: {
          groups: [
            {
              items: [buildMemoDetailItem(61, 701)],
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        shoppingMemo: { groups: [] },
      });
    removeItemFromShoppingMemoMock.mockResolvedValue({ message: "deleted" });

    await renderComponent([buildCandidate({ id: 61, name: "解除候補" })]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-61"]',
        )
        ?.click();
    });

    await act(async () => {
      findApplyButton()?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(removeItemFromShoppingMemoMock).toHaveBeenCalledWith(5, 701);
    expect(container.textContent).toContain("1件を買い物メモから外しました。");
  });

  it("追加と解除の両方がある場合は両方の API を呼ぶ", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock
      .mockResolvedValueOnce({
        shoppingMemo: {
          groups: [
            {
              items: [buildMemoDetailItem(71, 801)],
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        shoppingMemo: {
          groups: [
            {
              items: [buildMemoDetailItem(72, 802)],
            },
          ],
        },
      });
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 1,
      skipped_count: 0,
      duplicate_count: 0,
      invalid_status_count: 0,
    });
    removeItemFromShoppingMemoMock.mockResolvedValue({ message: "deleted" });

    await renderComponent([
      buildCandidate({ id: 71, name: "既追加候補" }),
      buildCandidate({ id: 72, name: "新規追加候補" }),
    ]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-71"]',
        )
        ?.click();
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-72"]',
        )
        ?.click();
    });

    await act(async () => {
      findApplyButton()?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(addItemsToShoppingMemoMock).toHaveBeenCalledWith(5, [72]);
    expect(removeItemFromShoppingMemoMock).toHaveBeenCalledWith(5, 801);
    expect(container.textContent).toContain("買い物メモを更新しました。");
  });

  it("未追加の purchased は選択不可だが、追加済みの purchased は解除できる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue({
      shoppingMemo: {
        groups: [
          {
            items: [buildMemoDetailItem(82, 901)],
          },
        ],
      },
    });

    await renderComponent([
      buildCandidate({ id: 80, name: "通常候補", status: "considering" }),
      buildCandidate({ id: 81, name: "未追加購入済み", status: "purchased" }),
      buildCandidate({ id: 82, name: "追加済み購入済み", status: "purchased" }),
    ]);
    await openSelectionMode();
    await selectMemo("5");

    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const disabledCheckbox = checkboxes.find((checkbox) => checkbox.disabled);
    const removableCheckbox = checkboxes.find(
      (checkbox) => checkbox.checked && !checkbox.disabled,
    );

    const purchasedCheckbox = container.querySelector<HTMLInputElement>(
      '[data-testid="purchase-candidate-checkbox-81"]',
    );

    expect(purchasedCheckbox?.disabled).toBe(true);
    expect(removableCheckbox).toBeDefined();

    await act(async () => {
      removableCheckbox?.click();
    });

    expect(container.textContent).toContain("解除予定");
  });

  it("detail 取得失敗時も画面が壊れず、候補を選択できる", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [{ id: 5, name: "春夏物", memo: null, status: "draft" }],
    });
    fetchShoppingMemoDetailMock.mockRejectedValue(new Error("detail failed"));

    await renderComponent([buildCandidate({ id: 91, name: "候補A" })]);
    await openSelectionMode();
    await selectMemo("5");

    await act(async () => {
      container
        .querySelector<HTMLInputElement>(
          '[data-testid="purchase-candidate-checkbox-91"]',
        )
        ?.click();
    });

    expect(container.textContent).toContain("追加 1件 / 解除 0件");
    expect(container.textContent).not.toContain("追加済み");
  });
});
