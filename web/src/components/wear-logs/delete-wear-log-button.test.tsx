// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
    replace: replaceMock,
  }),
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

describe("DeleteWearLogButton", () => {
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
    const { default: DeleteWearLogButton } =
      await import("./delete-wear-log-button");

    await act(async () => {
      root.render(React.createElement(DeleteWearLogButton, { wearLogId: "1" }));
      await waitForEffects();
    });
  }

  it("初期状態では確認 UI を表示しない", async () => {
    await renderDeleteButton();

    expect(container.textContent).toContain("削除");
    expect(container.textContent).not.toContain("着用履歴を削除しますか？");
    expect(container.textContent).not.toContain("この操作は取り消せません。");
    expect(container.textContent).not.toContain("キャンセル");
  });

  it("削除ボタンを押すと確認 UI が表示され、native confirm は使わない", async () => {
    const confirmMock = vi.fn();
    vi.stubGlobal("confirm", confirmMock);
    vi.stubGlobal("fetch", vi.fn());

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("着用履歴を削除しますか？");
    expect(container.textContent).toContain("この操作は取り消せません。");
    expect(container.textContent).toContain(
      "着用履歴に含まれるアイテムやコーディネート自体は削除されません。",
    );
    expect(container.textContent).toContain("キャンセル");
    expect(container.textContent).toContain("削除する");
  });

  it("キャンセルで DELETE しない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

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
    expect(container.textContent).not.toContain("着用履歴を削除しますか？");
  });

  it("削除するで DELETE を呼び、成功時は一覧へ戻る", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "deleted",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/wear-logs/1", {
      method: "DELETE",
    });
    expect(pushMock).toHaveBeenCalledWith("/wear-logs?message=deleted");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("401 では native alert を出さず、login 通知付きで replace する", async () => {
    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "unauthorized" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(alertMock).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login?message=session_expired");
    expect(pushMock).not.toHaveBeenCalledWith("/login");
  });

  it("backend error message を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: "この着用履歴は削除できません。",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("この着用履歴は削除できません。");
  });

  it("message がない error では fallback を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

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
      "着用履歴を削除できませんでした。時間をおいて再度お試しください。",
    );
  });

  it("raw DB error はそのまま表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message:
            "SQLSTATE[42S22]: Column not found: 1054 Unknown column debug_label",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "削除");

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
      "着用履歴を削除できませんでした。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(container.textContent).not.toContain("debug_label");
  });
});
