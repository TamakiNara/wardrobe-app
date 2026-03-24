// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchAllPaginatedCandidatesMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
};

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/wear-logs/candidates", () => ({
  fetchAllPaginatedCandidates: fetchAllPaginatedCandidatesMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("WearLogForm", () => {
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

  it("通常導線の新規登録で item のみを送信できる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白T",
            status: "active",
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            message: "created",
            wearLog: {
              id: 1,
            },
          }),
        }),
    );

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const submitButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("登録する"),
    );

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(dateInput, "2026-03-24");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/wear-logs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          status: "planned",
          event_date: "2026-03-24",
          display_order: 1,
          source_outfit_id: null,
          memo: "",
          items: [
            {
              source_item_id: 1,
              sort_order: 1,
              item_source_type: "manual",
            },
          ],
        }),
      }),
    );
    expect(container.textContent).toContain("キャンセル");
  });

  it("候補外データを含む既存レコードでも編集画面が壊れない", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            wearLog: {
              id: 1,
              status: "planned",
              event_date: "2026-03-24",
              display_order: 1,
              source_outfit_id: 5,
              source_outfit_name: "現在は無効",
              source_outfit_status: "invalid",
              memo: "memo",
              items: [
                {
                  id: 11,
                  source_item_id: 7,
                  item_name: "手放し済みトップス",
                  source_item_status: "disposed",
                  sort_order: 1,
                  item_source_type: "manual",
                },
              ],
              created_at: "2026-03-24T00:00:00Z",
              updated_at: "2026-03-24T00:00:00Z",
            },
          }),
        }),
    );

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "edit", wearLogId: "1" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "現在は候補に使えないデータが含まれていますが、この記録の内容確認と更新は続けられます。",
    );
    expect(container.textContent).toContain("元のコーディネートは現在利用できません。");
    expect(container.textContent).toContain("手放し済みのアイテムが含まれています。");
    expect(container.textContent).toContain("手放し済みトップス");
    expect(container.textContent).toContain("（現在は利用不可）");
  });

  it("複数ページの候補を読み込み、後続ページの item も選択できる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白T",
            status: "active",
          },
          {
            id: 2,
            name: "ネイビーパンツ",
            status: "active",
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            message: "created",
            wearLog: {
              id: 1,
            },
          }),
        }),
    );

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    expect(container.textContent).toContain("ネイビーパンツ");

    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
      .find((input) => input.parentElement?.textContent?.includes("ネイビーパンツ"));
    const submitButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("登録する"),
    );

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(dateInput, "2026-03-24");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/wear-logs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          status: "planned",
          event_date: "2026-03-24",
          display_order: 1,
          source_outfit_id: null,
          memo: "",
          items: [
            {
              source_item_id: 2,
              sort_order: 1,
              item_source_type: "manual",
            },
          ],
        }),
      }),
    );
  });
});
