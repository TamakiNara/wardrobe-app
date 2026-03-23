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
}

describe("OutfitRestoreAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let alertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    alertMock = vi.fn();
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

  it("restore 可能な invalid outfit では API を呼び、再取得する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "restored",
          outfit: {
            id: 10,
            status: "active",
          },
        }),
      }),
    );

    const { default: OutfitRestoreAction } = await import("./outfit-restore-action");

    await act(async () => {
      root.render(React.createElement(OutfitRestoreAction, { outfitId: 10, canRestore: true }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/outfits/10/restore", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(container.textContent).toContain("コーディネートを有効に戻しました。");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 550));
    });

    expect(refreshMock).toHaveBeenCalled();
  });

  it("disposed item を含む場合は disabled にし、理由を表示する", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { default: OutfitRestoreAction } = await import("./outfit-restore-action");

    await act(async () => {
      root.render(React.createElement(OutfitRestoreAction, { outfitId: 10, canRestore: false }));
      await waitForEffects();
    });

    const button = container.querySelector("button") as HTMLButtonElement | null;

    expect(button?.disabled).toBe(true);
    expect(container.textContent).toContain("手放し済みのアイテムが含まれているため、まだ戻せません。");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
