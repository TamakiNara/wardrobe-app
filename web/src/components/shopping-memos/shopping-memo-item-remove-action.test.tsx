// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import { removeItemFromShoppingMemo } from "@/lib/api/shopping-memos";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
    replace: replaceMock,
  }),
  usePathname: () => "/shopping-memos/5",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/shopping-memos", () => ({
  removeItemFromShoppingMemo: vi.fn(),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("ShoppingMemoItemRemoveAction", () => {
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

  it("確認UIを表示して候補を買い物メモから外して画面を更新する", async () => {
    vi.mocked(removeItemFromShoppingMemo).mockResolvedValueOnce({
      message: "deleted",
    });

    const { default: ShoppingMemoItemRemoveAction } =
      await import("./shopping-memo-item-remove-action");

    await act(async () => {
      root.render(
        <ShoppingMemoItemRemoveAction memoId={5} shoppingMemoItemId={18} />,
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");
    const buttonIcon = button?.querySelector("svg");

    expect(button?.getAttribute("aria-label")).toBe("買い物メモから外す");
    expect(button?.getAttribute("title")).toBe("買い物メモから外す");
    expect(button?.textContent).toBe("");
    expect(buttonIcon).not.toBeNull();
    expect(button?.firstElementChild?.tagName).toBe("svg");
    expect(container.textContent).not.toContain("買い物メモから外しますか？");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("買い物メモから外しますか？");
    expect(container.textContent).toContain(
      "この候補を買い物メモから外します。",
    );
    expect(container.textContent).toContain("購入検討一覧には残ります。");
    expect(container.textContent).toContain("キャンセル");
    expect(container.textContent).toContain("外す");

    const confirmButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent === "外す");

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(removeItemFromShoppingMemo).toHaveBeenCalledWith(5, 18);
    expect(replaceMock).toHaveBeenCalledWith(
      "/shopping-memos/5?message=removed",
      {
        scroll: false,
      },
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("キャンセルするとDELETEしない", async () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);
    const { default: ShoppingMemoItemRemoveAction } =
      await import("./shopping-memo-item-remove-action");

    await act(async () => {
      root.render(
        <ShoppingMemoItemRemoveAction memoId={5} shoppingMemoItemId={18} />,
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    const cancelButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent === "キャンセル");

    await act(async () => {
      cancelButton?.click();
      await waitForEffects();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(removeItemFromShoppingMemo).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("買い物メモから外しますか？");
  });

  it("削除失敗時にエラーメッセージを表示する", async () => {
    vi.mocked(removeItemFromShoppingMemo).mockRejectedValueOnce(
      new Error("server error"),
    );

    const { default: ShoppingMemoItemRemoveAction } =
      await import("./shopping-memo-item-remove-action");

    await act(async () => {
      root.render(
        <ShoppingMemoItemRemoveAction memoId={5} shoppingMemoItemId={18} />,
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    const confirmButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent === "外す");

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("買い物メモから外せませんでした。");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("backend error message を表示し raw DB error はそのまま出さない", async () => {
    vi.mocked(removeItemFromShoppingMemo)
      .mockRejectedValueOnce(
        new ApiClientError(422, {
          message: "The given data was invalid.",
          errors: {
            shopping_memo_item: ["この候補は外せません。"],
          },
        }),
      )
      .mockRejectedValueOnce(
        new ApiClientError(500, {
          message: "SQLSTATE[23000]: Integrity constraint violation",
        }),
      );

    const { default: ShoppingMemoItemRemoveAction } =
      await import("./shopping-memo-item-remove-action");

    await act(async () => {
      root.render(
        <ShoppingMemoItemRemoveAction memoId={5} shoppingMemoItemId={18} />,
      );
      await waitForEffects();
    });

    const triggerButton = container.querySelector("button");

    await act(async () => {
      triggerButton?.click();
      await waitForEffects();
    });

    let confirmButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent === "外す");

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("この候補は外せません。");

    await act(async () => {
      triggerButton?.click();
      await waitForEffects();
    });

    confirmButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent === "外す");

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("買い物メモから外せませんでした。");
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});
