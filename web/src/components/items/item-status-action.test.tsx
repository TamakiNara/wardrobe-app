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

describe("ItemStatusAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let confirmMock: ReturnType<typeof vi.fn>;
  let alertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    confirmMock = vi.fn().mockReturnValue(true);
    alertMock = vi.fn();
    vi.stubGlobal("confirm", confirmMock);
    vi.stubGlobal("alert", alertMock);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("active item では確認後に dispose API を呼び、再取得を促す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "disposed",
          item: {
            id: 1,
            status: "disposed",
          },
        }),
      }),
    );

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(React.createElement(ItemStatusAction, { itemId: 1, status: "active" }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      expect.stringContaining("通常一覧やコーディネート候補、着用履歴の登録候補から除外されます。"),
    );
    expect(confirmMock).toHaveBeenCalledWith(
      expect.stringContaining("このアイテムを含むコーディネートは無効になります。"),
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/items/1/dispose", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain("アイテムを手放しました。");
  });

  it("disposed item では reactivate API を呼び、確認ダイアログは出さない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "reactivated",
          item: {
            id: 1,
            status: "active",
          },
        }),
      }),
    );

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(React.createElement(ItemStatusAction, { itemId: 1, status: "disposed" }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("所持品に戻す");

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("/api/items/1/reactivate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain("アイテムを所持品に戻しました。");
  });
});
