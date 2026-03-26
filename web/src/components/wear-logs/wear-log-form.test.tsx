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
            category: "tops",
            shape: "tshirt",
            colors: [
              { role: "main", mode: "preset", value: "white", hex: "#FFFFFF", label: "白" },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 5,
            name: "通勤コーデ",
            status: "active",
            seasons: ["春", "秋"],
            tpos: ["仕事"],
            outfit_items: [{}, {}],
          },
        ],
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

    expect(container.textContent).toContain("「必須」が付いた項目は登録に必要です。");
    expect(container.textContent).toContain("状態");
    expect(container.textContent).toContain("日付");
    expect(container.textContent).toContain("アイテム");
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
    expect(container.textContent).toContain("通勤コーデ");
    expect(container.textContent).toContain("構成アイテム 2 件");
    expect(container.textContent).toContain("季節: 春 / 秋");
    expect(container.textContent).toContain("TPO: 仕事");
    expect(container.textContent).toContain("トップス / Tシャツ/カットソー");
    expect(container.textContent).toContain("白");
    expect(container.innerHTML).toContain(
      'href="/items/1?return_to=%2Fwear-logs%2Fnew&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
    expect(container.innerHTML).toContain(
      'href="/outfits/5?return_to=%2Fwear-logs%2Fnew&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );

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

    expect(container.textContent).toContain("「必須」が付いた項目は更新に必要です。");
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
    expect(container.textContent).toContain(
      "現在は候補に使えないデータが含まれていますが、この記録の内容確認と更新は続けられます。",
    );
    expect(container.textContent).toContain("元のコーディネートは現在利用できません。");
    expect(container.textContent).toContain("手放し済みのアイテムが含まれています。");
    expect(container.textContent).toContain("手放し済みトップス");
    expect(container.textContent).toContain("構成アイテム 0 件");
    expect(container.textContent).toContain("現在は利用不可");
    expect(container.innerHTML).toContain(
      'href="/outfits/5?return_to=%2Fwear-logs%2F1%2Fedit&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
    expect(container.innerHTML).toContain(
      'href="/items/7?return_to=%2Fwear-logs%2F1%2Fedit&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
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
            category: "tops",
            shape: "tshirt",
            colors: [
              { role: "main", mode: "preset", value: "white", hex: "#FFFFFF", label: "白" },
            ],
            seasons: ["春"],
            tpos: ["仕事"],
          },
          {
            id: 2,
            name: "ネイビーパンツ",
            status: "active",
            category: "bottoms",
            shape: "wide",
            colors: [
              { role: "main", mode: "preset", value: "navy", hex: "#1F3A5F", label: "ネイビー" },
            ],
            seasons: ["秋"],
            tpos: ["休日"],
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

  it("selected item を上下移動して保存順を調整できる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白T",
            status: "active",
            category: "tops",
            shape: "tshirt",
            colors: [
              { role: "main", mode: "preset", value: "white", hex: "#FFFFFF", label: "白" },
            ],
          },
          {
            id: 2,
            name: "ネイビーパンツ",
            status: "active",
            category: "bottoms",
            shape: "wide",
            colors: [
              { role: "main", mode: "preset", value: "navy", hex: "#1F3A5F", label: "ネイビー" },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
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

    const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
    const submitButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("登録する"),
    );

    await act(async () => {
      checkboxes[0]?.click();
      checkboxes[1]?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("1. 白T");
    expect(container.textContent).toContain("2. ネイビーパンツ");

    const moveUpButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent === "上へ" && button.parentElement?.parentElement?.textContent?.includes("2. ネイビーパンツ"),
    );

    await act(async () => {
      moveUpButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("1. ネイビーパンツ");
    expect(container.textContent).toContain("2. 白T");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(dateInput, "2026-03-24");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
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
            {
              source_item_id: 1,
              sort_order: 2,
              item_source_type: "manual",
            },
          ],
        }),
      }),
    );
  });

  it("コーディネート候補を名前や季節・TPOで絞り込める", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 5,
            name: "通勤コーデ",
            status: "active",
            seasons: ["春"],
            tpos: ["仕事"],
            outfit_items: [{}, {}],
          },
          {
            id: 6,
            name: "休日コーデ",
            status: "active",
            seasons: ["夏"],
            tpos: ["休日"],
            outfit_items: [{}],
          },
        ],
      });

    vi.stubGlobal("fetch", vi.fn());

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    const searchInput = container.querySelector<HTMLInputElement>('[data-testid="wear-log-outfit-search"]');
    const seasonSelect = container.querySelector<HTMLSelectElement>('[data-testid="wear-log-outfit-season-filter"]');
    const tpoSelect = container.querySelector<HTMLSelectElement>('[data-testid="wear-log-outfit-tpo-filter"]');

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "休日");
      searchInput?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("休日コーデ");
    expect(container.textContent).not.toContain("通勤コーデ");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "");
      searchInput?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      )?.set;
      setter?.call(seasonSelect, "春");
      seasonSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      setter?.call(tpoSelect, "仕事");
      tpoSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("通勤コーデ");
    expect(container.textContent).not.toContain("休日コーデ");
  });

  it("アイテム候補を名前やカテゴリ・季節・TPOで絞り込めて、0件表示もできる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白T",
            status: "active",
            category: "tops",
            shape: "tshirt",
            colors: [
              { role: "main", mode: "preset", value: "white", hex: "#FFFFFF", label: "白" },
            ],
            seasons: ["春"],
            tpos: ["仕事"],
          },
          {
            id: 2,
            name: "ネイビーパンツ",
            status: "active",
            category: "bottoms",
            shape: "wide",
            colors: [
              { role: "main", mode: "preset", value: "navy", hex: "#1F3A5F", label: "ネイビー" },
            ],
            seasons: ["秋"],
            tpos: ["休日"],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal("fetch", vi.fn());

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    const searchInput = container.querySelector<HTMLInputElement>('[data-testid="wear-log-item-search"]');
    const categorySelect = container.querySelector<HTMLSelectElement>('[data-testid="wear-log-item-category-filter"]');
    const seasonSelect = container.querySelector<HTMLSelectElement>('[data-testid="wear-log-item-season-filter"]');
    const tpoSelect = container.querySelector<HTMLSelectElement>('[data-testid="wear-log-item-tpo-filter"]');

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "ボトムス");
      searchInput?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("ネイビーパンツ");
    expect(container.textContent).not.toContain("白T");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "");
      searchInput?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      )?.set;
      setter?.call(categorySelect, "tops");
      categorySelect?.dispatchEvent(new Event("change", { bubbles: true }));
      setter?.call(seasonSelect, "春");
      seasonSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      setter?.call(tpoSelect, "仕事");
      tpoSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain("ネイビーパンツ");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "該当なし");
      searchInput?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("条件に一致するアイテム候補がありません。");
  });
});
