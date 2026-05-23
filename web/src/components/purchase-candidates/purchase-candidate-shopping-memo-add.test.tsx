// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import type { PurchaseCandidateStatus } from "@/types/purchase-candidates";

const fetchShoppingMemosMock = vi.fn();
const fetchShoppingMemoDetailMock = vi.fn();
const addItemsToShoppingMemoMock = vi.fn();

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
}));

function buildMemo(overrides: { id: number; name: string; status: string }) {
  return {
    memo: null,
    item_count: 0,
    group_count: 0,
    subtotal: 0,
    has_price_unset: false,
    nearest_deadline: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function buildMemoDetail(candidateIds: number[]) {
  return {
    shoppingMemo: {
      groups: [
        {
          items: candidateIds.map((candidateId, index) => ({
            shopping_memo_item_id: index + 1,
            purchase_candidate_id: candidateId,
          })),
        },
      ],
    },
  };
}

describe("PurchaseCandidateShoppingMemoAdd", () => {
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

  async function renderComponent(
    status: PurchaseCandidateStatus = "considering",
  ) {
    const { default: PurchaseCandidateShoppingMemoAdd } =
      await import("./purchase-candidate-shopping-memo-add");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateShoppingMemoAdd, {
          candidateId: 123,
          candidateStatus: status,
        }),
      );
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

  function findAddButton() {
    return Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("追加する"),
    ) as HTMLButtonElement | undefined;
  }

  it("draft memo だけを追加先候補として表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 1, name: "春の買い物", status: "draft" }),
        buildMemo({ id: 2, name: "完了した買い物", status: "closed" }),
      ],
    });

    await renderComponent();

    expect(fetchShoppingMemosMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("買い物メモに追加");
    expect(container.textContent).toContain("春の買い物");
    expect(container.textContent).not.toContain("完了した買い物");
  });

  it("draft memo がない場合は empty message を表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 2, name: "完了した買い物", status: "closed" }),
      ],
    });

    await renderComponent();

    expect(container.textContent).toContain(
      "追加先にできる買い物メモがありません。",
    );
    expect(container.innerHTML).toContain('href="/shopping-memos/new"');
  });

  it("memo 選択後に detail を取得し、追加すると candidate id 1件だけを送る", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock
      .mockResolvedValueOnce(buildMemoDetail([]))
      .mockResolvedValueOnce(buildMemoDetail([123]));
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 1,
      skipped_count: 0,
      duplicate_count: 0,
      invalid_status_count: 0,
    });

    await renderComponent();
    await selectMemo("5");

    await act(async () => {
      findAddButton()?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchShoppingMemoDetailMock).toHaveBeenCalledWith(5);
    expect(addItemsToShoppingMemoMock).toHaveBeenCalledWith(5, [123]);
    expect(container.textContent).toContain("買い物メモに追加しました。");
    expect(container.textContent).not.toContain(
      "この買い物メモには追加済みです。",
    );
    expect(container.textContent).toContain("買い物メモを見る");
    expect(container.innerHTML).toContain('href="/shopping-memos/5"');
  });

  it("すでに追加済みの memo では追加済み表示になり button を disabled にする", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue(buildMemoDetail([123]));

    await renderComponent();
    await selectMemo("5");

    expect(container.textContent).toContain("この買い物メモには追加済みです。");
    expect(container.textContent).toContain("買い物メモを見る");
    expect(container.innerHTML).toContain('href="/shopping-memos/5"');
    expect(findAddButton()?.disabled).toBe(true);
  });

  it("追加成功後に memo を選び直すと選択先 memo の追加済み判定へ戻る", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
        buildMemo({ id: 6, name: "夏の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock
      .mockResolvedValueOnce(buildMemoDetail([]))
      .mockResolvedValueOnce(buildMemoDetail([]));
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 1,
      skipped_count: 0,
      duplicate_count: 0,
      invalid_status_count: 0,
    });

    await renderComponent();
    await selectMemo("5");

    await act(async () => {
      findAddButton()?.click();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("買い物メモに追加しました。");
    expect(container.textContent).not.toContain(
      "この買い物メモには追加済みです。",
    );
    expect(container.innerHTML).toContain('href="/shopping-memos/5"');

    await selectMemo("6");

    expect(container.textContent).not.toContain("買い物メモに追加しました。");
    expect(container.textContent).not.toContain(
      "この買い物メモには追加済みです。",
    );
    expect(container.innerHTML).not.toContain('href="/shopping-memos/5"');
    expect(container.innerHTML).not.toContain('href="/shopping-memos/6"');
    expect(findAddButton()?.disabled).toBe(false);
  });

  it("duplicate_count が返った場合も追加済みとして表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue(buildMemoDetail([]));
    addItemsToShoppingMemoMock.mockResolvedValue({
      added_count: 0,
      skipped_count: 1,
      duplicate_count: 1,
      invalid_status_count: 0,
    });

    await renderComponent();
    await selectMemo("5");

    await act(async () => {
      findAddButton()?.click();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("この買い物メモには追加済みです。");
    expect(container.textContent).toContain("買い物メモを見る");
    expect(container.innerHTML).toContain('href="/shopping-memos/5"');
    expect(findAddButton()?.disabled).toBe(true);
  });

  it("追加できない status では invalid status message を表示し button を disabled にする", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue(buildMemoDetail([]));

    await renderComponent("purchased");
    await selectMemo("5");

    expect(container.textContent).toContain(
      "この購入検討は現在の状態では買い物メモに追加できません。",
    );
    expect(findAddButton()?.disabled).toBe(true);
  });

  it("API error は画面内に表示する", async () => {
    fetchShoppingMemosMock.mockResolvedValue({
      shoppingMemos: [
        buildMemo({ id: 5, name: "春の買い物", status: "draft" }),
      ],
    });
    fetchShoppingMemoDetailMock.mockResolvedValue(buildMemoDetail([]));
    addItemsToShoppingMemoMock.mockRejectedValue(
      new ApiClientError(422, { message: "追加できません。" }),
    );

    await renderComponent();
    await selectMemo("5");

    await act(async () => {
      findAddButton()?.click();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("追加できません。");
  });
});
