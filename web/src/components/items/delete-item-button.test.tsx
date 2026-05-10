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

describe("DeleteItemButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let confirmMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    confirmMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirmMock);
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

  it("confirm文言がdelete policyどおり", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: "deleted" }),
      }),
    );

    await renderDeleteButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      [
        "このアイテムを削除しますか？",
        "この操作は取り消せません。実際に手放しただけの場合は「手放す」を使ってください。",
        "登録画像も削除されます。",
      ].join("\n"),
    );
  });

  it("confirmをキャンセルした場合はDELETEしない", async () => {
    confirmMock.mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("confirm後にDELETEを呼び、成功時は/itemsへ遷移する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "deleted" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
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

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
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

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
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

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(confirmMock).toHaveBeenCalled();
    expect(container.textContent).toContain("アイテムを削除できませんでした。");
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});
