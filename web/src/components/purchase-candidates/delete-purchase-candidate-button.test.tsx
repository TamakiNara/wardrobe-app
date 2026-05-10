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

describe("DeletePurchaseCandidateButton", () => {
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
    const { default: DeletePurchaseCandidateButton } =
      await import("./delete-purchase-candidate-button");

    await act(async () => {
      root.render(
        React.createElement(DeletePurchaseCandidateButton, {
          candidateId: "10",
        }),
      );
      await waitForEffects();
    });
  }

  it("初期状態では確認UIを表示しない", async () => {
    await renderDeleteButton();

    expect(container.textContent).toContain("購入検討を削除する");
    expect(container.textContent).not.toContain("購入検討を削除しますか？");
    expect(container.textContent).not.toContain("この操作は取り消せません。");
    expect(container.textContent).not.toContain("キャンセル");
  });

  it("削除ボタンを押すと確認UIが表示され、native confirmは使わない", async () => {
    const confirmMock = vi.fn();
    vi.stubGlobal("confirm", confirmMock);
    vi.stubGlobal("fetch", vi.fn());

    await renderDeleteButton();

    const openButton = findButtonByText(container, "購入検討を削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("購入検討を削除しますか？");
    expect(container.textContent).toContain("この操作は取り消せません。");
    expect(container.textContent).toContain(
      "関連する表示や比較にも影響する場合があります。",
    );
    expect(container.textContent).toContain("キャンセル");
    expect(container.textContent).toContain("削除する");
  });

  it("キャンセルした場合はDELETEしない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "購入検討を削除する");

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
    expect(container.textContent).not.toContain("購入検討を削除しますか？");
  });

  it("削除するを押すとDELETEを呼び、成功時は一覧へ遷移する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "deleted" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderDeleteButton();

    const openButton = findButtonByText(container, "購入検討を削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/purchase-candidates/10", {
      method: "DELETE",
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/purchase-candidates?message=deleted",
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("backend error message をそのまま表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: "この購入検討は削除できません。",
        }),
      }),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "購入検討を削除する");

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const submitButton = findButtonByText(container, "削除する");

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("この購入検討は削除できません。");
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

    const openButton = findButtonByText(container, "購入検討を削除する");

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
      "削除に失敗しました。時間をおいて再度お試しください。",
    );
  });

  it("raw message を削除エラーとして表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message:
              "SQLSTATE[42S22]: Column not found: 1054 Unknown column custom_label",
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await renderDeleteButton();

    const openButton = findButtonByText(container, "購入検討を削除する");

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
      "削除に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
