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

describe("ItemCareStatusAction", () => {
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

  it("未設定 item では in_cleaning を付与できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "updated",
          item: {
            id: 1,
            care_status: "in_cleaning",
          },
        }),
      }),
    );

    const { default: ItemCareStatusAction } = await import("./item-care-status-action");

    await act(async () => {
      root.render(React.createElement(ItemCareStatusAction, { itemId: 1, careStatus: null }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/items/1/care-status", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        care_status: "in_cleaning",
      }),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain("クリーニング中に設定しました。");
  });

  it("in_cleaning item では解除できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: "updated",
          item: {
            id: 1,
            care_status: null,
          },
        }),
      }),
    );

    const { default: ItemCareStatusAction } = await import("./item-care-status-action");

    await act(async () => {
      root.render(React.createElement(ItemCareStatusAction, { itemId: 1, careStatus: "in_cleaning" }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/items/1/care-status", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        care_status: null,
      }),
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(container.textContent).toContain("クリーニング状態を解除しました。");
  });
});
