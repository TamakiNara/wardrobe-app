// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("DeleteOutfitButton", () => {
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
    const { default: DeleteOutfitButton } =
      await import("./delete-outfit-button");

    await act(async () => {
      root.render(React.createElement(DeleteOutfitButton, { outfitId: 10 }));
      await waitForEffects();
    });
  }

  function findButtonByText(label: string): HTMLButtonElement | undefined {
    return Array.from(container.querySelectorAll("button")).find(
      (button): button is HTMLButtonElement => button.textContent === label,
    );
  }

  it("初期状態では確認UIを表示しない", async () => {
    await renderDeleteButton();

    expect(container.textContent).toContain("削除");
    expect(container.textContent).not.toContain(
      "コーディネートを削除しますか？",
    );
    expect(container.textContent).not.toContain("この操作は取り消せません。");
    expect(container.textContent).not.toContain("キャンセル");
  });

  it("削除ボタンを押すと確認UIが表示され、native confirmは使わない", async () => {
    const confirmMock = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("confirm", confirmMock);
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("コーディネートを削除しますか？");
    expect(container.textContent).toContain("この操作は取り消せません。");
    expect(container.textContent).toContain(
      "コーディネートに含まれるアイテム自体は削除されません。",
    );
    expect(container.textContent).toContain("キャンセル");
    expect(container.textContent).toContain("削除する");
  });

  it("キャンセルでDELETEしない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const cancelButton = findButtonByText("キャンセル");

    await act(async () => {
      cancelButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain(
      "コーディネートを削除しますか？",
    );
  });

  it("削除するでDELETEを呼び、成功時は一覧へ遷移する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "deleted" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText("削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/outfits/10", {
      method: "DELETE",
    });
    expect(pushMock).toHaveBeenCalledWith("/outfits");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("backend error message を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: "このコーディネートは削除できません。",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText("削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "このコーディネートは削除できません。",
    );
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

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText("削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "コーディネートの削除に失敗しました。時間をおいて再度お試しください。",
    );
  });

  it("delete の 500 raw message は表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message:
            "SQLSTATE[42S22]: Column not found: 1054 Unknown column debug",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText("削除");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText("削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "コーディネートの削除に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(container.textContent).not.toContain("Unknown column debug");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
