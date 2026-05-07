// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";

const pushMock = vi.fn();
const createShoppingMemoMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/api/shopping-memos", () => ({
  createShoppingMemo: (...args: unknown[]) => createShoppingMemoMock(...args),
}));

function setInputValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ShoppingMemoCreateForm", () => {
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

  async function renderForm() {
    const { default: ShoppingMemoCreateForm } =
      await import("./shopping-memo-create-form");

    await act(async () => {
      root.render(
        React.createElement(ShoppingMemoCreateForm, {
          cancelHref: "/shopping-memos",
        }),
      );
    });
  }

  it("メモ名入力欄とメモ入力欄を表示する", async () => {
    await renderForm();

    expect(
      container.querySelector<HTMLInputElement>("#shopping-memo-name"),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLTextAreaElement>("#shopping-memo-memo"),
    ).not.toBeNull();
    expect(container.textContent).toContain("作成する");
  });

  it("メモ名が未入力ならエラーを表示する", async () => {
    await renderForm();

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(container.textContent).toContain("入力内容を確認してください。");
    expect(container.textContent).toContain("メモ名を入力してください。");
    expect(createShoppingMemoMock).not.toHaveBeenCalled();
  });

  it("作成 API を呼び出して一覧へ遷移する", async () => {
    createShoppingMemoMock.mockResolvedValue({
      message: "created",
      shoppingMemo: {
        id: 11,
        name: "今月買う候補",
      },
    });

    await renderForm();

    const nameInput = container.querySelector<HTMLInputElement>(
      "#shopping-memo-name",
    )!;
    const memoInput = container.querySelector<HTMLTextAreaElement>(
      "#shopping-memo-memo",
    )!;
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setInputValue(nameInput, "今月買う候補");
      setInputValue(memoInput, "セール終了前に比較");
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(createShoppingMemoMock).toHaveBeenCalledWith({
      name: "今月買う候補",
      memo: "セール終了前に比較",
    });
    expect(pushMock).toHaveBeenCalledWith("/shopping-memos?message=created");
  });

  it("backend 422 の field error を表示する", async () => {
    createShoppingMemoMock.mockRejectedValue(
      new ApiClientError(422, {
        message: "The given data was invalid.",
        errors: {
          name: ["メモ名は必須です。"],
        },
      }),
    );

    await renderForm();

    const nameInput = container.querySelector<HTMLInputElement>(
      "#shopping-memo-name",
    )!;
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setInputValue(nameInput, "春夏セール候補");
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("入力内容を確認してください。");
    expect(container.textContent).toContain("メモ名は必須です。");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
