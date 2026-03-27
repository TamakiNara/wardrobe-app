// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WearLogStatusAction from "./wear-log-status-action";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("WearLogStatusAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    pushMock.mockReset();
    refreshMock.mockReset();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("alert", vi.fn());
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

  it("planned から worn へ状態変更できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "updated",
        wearLog: {},
      }),
    } as Response);

    await act(async () => {
      root.render(
        React.createElement(WearLogStatusAction, {
          wearLog: {
            id: 1,
            status: "planned",
            event_date: "2026-03-27",
            display_order: 2,
            source_outfit_id: 3,
            source_outfit_name: "通勤コーデ",
            source_outfit_status: "active",
            memo: "メモ",
            created_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:00:00Z",
            items: [
              {
                id: 11,
                source_item_id: 101,
                item_name: "白シャツ",
                source_item_status: "active",
                source_item_care_status: null,
                sort_order: 1,
                item_source_type: "outfit",
              },
            ],
          },
        }),
      );
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("着用済みにする");

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/wear-logs/1", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "worn",
        event_date: "2026-03-27",
        display_order: 2,
        source_outfit_id: 3,
        memo: "メモ",
        items: [
          {
            source_item_id: 101,
            sort_order: 1,
            item_source_type: "outfit",
          },
        ],
      }),
    });
    expect(container.textContent).toContain("着用済みに更新しました。");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("元アイテム参照が欠ける場合は状態変更を無効化する", async () => {
    await act(async () => {
      root.render(
        React.createElement(WearLogStatusAction, {
          wearLog: {
            id: 2,
            status: "worn",
            event_date: "2026-03-27",
            display_order: 1,
            source_outfit_id: null,
            source_outfit_name: null,
            source_outfit_status: null,
            memo: null,
            created_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:00:00Z",
            items: [
              {
                id: 21,
                source_item_id: null,
                item_name: "名称未設定",
                source_item_status: null,
                source_item_care_status: null,
                sort_order: 1,
                item_source_type: "manual",
              },
            ],
          },
        }),
      );
    });

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
    expect(container.textContent).toContain("この画面からは状態変更できません");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
