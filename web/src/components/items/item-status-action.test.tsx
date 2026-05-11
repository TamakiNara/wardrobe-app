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

  it("active item では初期状態で確認UIを表示しない", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, { itemId: 1, status: "active" }),
      );
      await waitForEffects();
    });

    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("active item では手放す押下で確認UIを出し、キャンセルではAPIを呼ばない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, { itemId: 1, status: "active" }),
      );
      await waitForEffects();
    });

    const triggerButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "手放す",
    );

    await act(async () => {
      triggerButton?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("このアイテムを手放しますか？");
    expect(container.textContent).toContain(
      "アイテムは削除されず、手放した状態として残ります。",
    );
    expect(container.textContent).toContain(
      "着用履歴やコーディネートの記録は維持されます。",
    );

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "キャンセル",
    );

    await act(async () => {
      cancelButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("active item では確認UI内の手放すで dispose API を呼び、成功時に再取得する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "disposed",
        item: {
          id: 1,
          status: "disposed",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, { itemId: 1, status: "active" }),
      );
      await waitForEffects();
    });

    const triggerButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "手放す",
    );

    await act(async () => {
      triggerButton?.click();
      await waitForEffects();
    });

    const confirmButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((button) => button.textContent === "手放す");
    const confirmButton = confirmButtons[1] ?? null;

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/items/1/dispose", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain("アイテムを手放しました。");
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("disposed item ではクローゼットに戻すを直接実行し、確認UIを出さない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "reactivated",
        item: {
          id: 1,
          status: "active",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, {
          itemId: 1,
          status: "disposed",
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("クローゼットに戻す");

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/items/1/reactivate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain(
      "アイテムをクローゼットに戻しました。",
    );
  });

  it("safe な backend message はそのまま表示する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "このアイテムは現在更新できません。",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, {
          itemId: 1,
          status: "active",
        }),
      );
      await waitForEffects();
    });

    const triggerButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "手放す",
    );

    await act(async () => {
      triggerButton?.click();
      await waitForEffects();
    });

    const confirmButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((button) => button.textContent === "手放す");
    const confirmButton = confirmButtons[1] ?? null;

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "このアイテムは現在更新できません。",
    );
  });

  it("unsafe な raw message や message 不在では fallback を表示する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: "SQLSTATE[42S22]: Unknown column custom_label",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { default: ItemStatusAction } = await import("./item-status-action");

    await act(async () => {
      root.render(
        React.createElement(ItemStatusAction, {
          itemId: 1,
          status: "active",
        }),
      );
      await waitForEffects();
    });

    const runDisposeAttempt = async () => {
      const triggerButton = Array.from(
        container.querySelectorAll("button"),
      ).find((button) => button.textContent === "手放す");

      await act(async () => {
        triggerButton?.click();
        await waitForEffects();
      });

      const confirmButtons = Array.from(
        container.querySelectorAll("button"),
      ).filter((button) => button.textContent === "手放す");
      const confirmButton = confirmButtons[1] ?? null;

      await act(async () => {
        confirmButton?.click();
        await waitForEffects();
      });
    };

    await runDisposeAttempt();

    expect(container.textContent).toContain(
      "アイテム状態の更新に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");

    await runDisposeAttempt();

    expect(container.textContent).toContain(
      "アイテム状態の更新に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
