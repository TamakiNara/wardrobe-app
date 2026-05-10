// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function findButtonByText(
  container: HTMLDivElement,
  label: string,
): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (button): button is HTMLButtonElement => button.textContent === label,
  );
}

describe("DeleteItemButton", () => {
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
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  async function renderDeleteButton() {
    const { default: DeleteItemButton } = await import("./delete-item-button");

    await act(async () => {
      root.render(React.createElement(DeleteItemButton, { itemId: 1 }));
      await waitForEffects();
    });
  }

  it("ボタン文言にアイテムを削除するを表示する", async () => {
    await renderDeleteButton();

    expect(container.textContent).toContain("アイテムを削除する");
  });

  it("初期状態では確認UIを表示しない", async () => {
    await renderDeleteButton();

    expect(container.textContent).not.toContain("アイテムを削除しますか？");
    expect(container.textContent).not.toContain("この操作は取り消せません。");
    expect(container.textContent).not.toContain("キャンセル");
  });

  it("削除ボタンを押すと確認UIが表示され、native confirmは使わない", async () => {
    const confirmMock = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("confirm", confirmMock);
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("アイテムを削除しますか？");
    expect(container.textContent).toContain("この操作は取り消せません。");
    expect(container.textContent).toContain(
      "実際に手放しただけの場合は「手放す」を使ってください。",
    );
    expect(container.textContent).toContain("登録画像も削除されます。");
    expect(container.textContent).toContain("キャンセル");
    expect(container.textContent).toContain("削除する");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("キャンセルした場合はDELETEしない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const cancelButton = findButtonByText(container, "キャンセル");

    await act(async () => {
      cancelButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("この操作は取り消せません。");
  });

  it("削除するを押すとDELETEを呼び、成功時は/itemsへ遷移する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "deleted" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/items/1", {
      method: "DELETE",
    });
    expect(pushMock).toHaveBeenCalledWith("/items");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("backendの422 messageをそのまま表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message:
            "このアイテムは参照中のため完全に削除できません。手放す操作を利用してください。",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "このアイテムは参照中のため完全に削除できません。手放す操作を利用してください。",
    );
  });

  it("messageがないerrorではfallback文言を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("アイテムを削除できませんでした。");
  });

  it("500系の削除失敗でも raw message を表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message: "SQLSTATE[42S22]: Unknown column custom_label",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "アイテムを削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("アイテムを削除できませんでした。");
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});
