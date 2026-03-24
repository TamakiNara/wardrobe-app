// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("OutfitDuplicateAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const originalAlert = window.alert;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.alert = vi.fn();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    window.alert = originalAlert;
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("duplicate 成功時は初期値 payload を保存して新規作成画面へ遷移する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "duplicated_payload_ready",
            outfit: {
              name: "通勤コーデ（コピー）",
              memo: "朝会用",
              seasons: ["春"],
              tpos: ["仕事"],
              items: [
                {
                  item_id: 1,
                  sort_order: 1,
                  selectable: true,
                  note: null,
                },
              ],
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ),
    );

    const { default: OutfitDuplicateAction } = await import("./outfit-duplicate-action");

    await act(async () => {
      root.render(React.createElement(OutfitDuplicateAction, { outfitId: 10 }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/outfits/10/duplicate",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(window.sessionStorage.getItem("outfit-duplicate-payload")).toContain(
      "通勤コーデ（コピー）",
    );
    expect(pushMock).toHaveBeenCalledWith("/outfits/new?source=duplicate");
  });

  it("duplicate 失敗時はエラーを表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "対象のコーディネートが見つかりませんでした。",
          }),
          {
            status: 404,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ),
    );

    const { default: OutfitDuplicateAction } = await import("./outfit-duplicate-action");

    await act(async () => {
      root.render(React.createElement(OutfitDuplicateAction, { outfitId: 999 }));
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("対象のコーディネートが見つかりませんでした。");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
