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
              {
                role: "main",
                mode: "preset",
                value: "white",
                hex: "#FFFFFF",
                label: "白",
              },
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
            outfit_items: [
              {
                id: 51,
                item_id: 101,
                sort_order: 1,
                item: {
                  id: 101,
                  name: "白シャツ",
                  category: "tops",
                  shape: "shirt",
                  colors: [
                    {
                      role: "main",
                      mode: "preset",
                      value: "white",
                      hex: "#FFFFFF",
                      label: "白",
                    },
                  ],
                },
              },
              {
                id: 52,
                item_id: 102,
                sort_order: 2,
                item: {
                  id: 102,
                  name: "ネイビーパンツ",
                  category: "pants",
                  shape: "wide",
                  colors: [
                    {
                      role: "main",
                      mode: "preset",
                      value: "navy",
                      hex: "#1F3A5F",
                      label: "ネイビー",
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
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

    expect(container.textContent).toContain(
      "「必須」が付いた項目は登録に必要です。",
    );
    expect(container.textContent).toContain("状態");
    expect(container.textContent).toContain("日付");
    expect(container.textContent).toContain("コーディネート / アイテム");
    expect(container.textContent).toContain("コーディネートを選択");
    expect(container.textContent).toContain("アイテムを選択");
    expect(container.textContent).toContain("振り返り");
    expect(container.textContent).toContain("よかったこと");
    expect(container.textContent).toContain("気になったこと");
    expect(container.textContent).toContain("TPO・見た目");
    expect(container.textContent).toContain("振り返りメモ");
    expect(container.textContent).toContain("寒暖差に対応できた");
    expect(container.textContent).toContain("合っていた");
    expect(container.textContent).toContain("ちょうどいい");
    expect(container.textContent).not.toContain("湿気で不快");
    expect(container.textContent).not.toMatch(/気になったこと\s*\d+件/);
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
    expect(container.textContent).toContain("通勤コーデ");
    expect(container.textContent).toContain("白シャツ / ネイビーパンツ");
    expect(container.textContent).toContain("トップス / Tシャツ/カットソー");
    expect(container.textContent).toContain("白");
    expect(container.innerHTML).toContain(
      'data-testid="outfit-color-thumbnail"',
    );
    expect(container.innerHTML).toContain(
      'href="/items/1?return_to=%2Fwear-logs%2Fnew&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
    expect(container.innerHTML).toContain(
      'href="/outfits/5?return_to=%2Fwear-logs%2Fnew&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );

    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "planned",
          event_date: "2026-03-24",
          display_order: 1,
          source_outfit_id: null,
          memo: "",
          outdoor_temperature_feel: "comfortable",
          indoor_temperature_feel: "comfortable",
          overall_rating: null,
          feedback_tags: null,
          feedback_memo: "",
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

  it("クリーニング中の item を含んでも警告のみで保存できる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白T",
            status: "active",
            care_status: "in_cleaning",
            category: "tops",
            shape: "tshirt",
            colors: [],
            seasons: ["春"],
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
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          message: "created",
          wearLog: { id: 10 },
        }),
      }),
    );

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
      await waitForEffects();
    });

    const checkbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const statusSelect = container.querySelector<HTMLSelectElement>("select");
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
    );

    await act(async () => {
      checkbox?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("クリーニング中");
    expect(container.textContent).toContain(
      "予定として保存はできますが、必要なら先に状態を確認してください。",
    );

    await act(async () => {
      const inputSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      inputSetter?.call(dateInput, "2026-03-24");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
      submitButton?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalled();

    await act(async () => {
      const selectSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      )?.set;
      selectSetter?.call(statusSelect, "worn");
      statusSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "着用済みとして登録する前に内容を確認してください。",
    );
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
      vi.fn().mockResolvedValueOnce({
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
            outdoor_temperature_feel: "cold",
            indoor_temperature_feel: "comfortable",
            overall_rating: "neutral",
            feedback_tags: ["morning_cold", "worked_for_tpo"],
            feedback_memo: "朝は少し寒かった",
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
      root.render(
        React.createElement(WearLogForm, { mode: "edit", wearLogId: "1" }),
      );
    });
    await act(async () => {
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "「必須」が付いた項目は更新に必要です。",
    );
    expect(container.textContent).toContain("コーディネート / アイテム");
    expect(container.textContent).toContain("振り返り");
    expect(container.textContent).toContain("振り返りメモ");
    expect(container.textContent?.match(/必須/g)?.length).toBe(4);
    expect(container.textContent).toContain(
      "現在は候補に使えないデータが含まれていますが、この記録の内容確認と更新は続けられます。",
    );
    expect(container.textContent).toContain(
      "元のコーディネートは現在利用できません。",
    );
    expect(container.textContent).toContain(
      "手放し済みのアイテムが含まれています。",
    );
    expect(container.textContent).toContain("手放し済みトップス");
    expect(container.textContent).toContain("構成アイテム未設定");
    expect(container.textContent).toContain("現在は利用不可");
    expect(container.innerHTML).toContain(
      'href="/outfits/5?return_to=%2Fwear-logs%2F1%2Fedit&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
    expect(container.innerHTML).toContain(
      'href="/items/7?return_to=%2Fwear-logs%2F1%2Fedit&amp;return_label=%E7%9D%80%E7%94%A8%E5%B1%A5%E6%AD%B4%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0"',
    );
    expect(
      container.querySelector<HTMLInputElement>(
        '[data-testid="outdoor-temperature-feel"] input[type="range"]',
      )?.value,
    ).toBe("0");
    expect(container.textContent).toContain("寒い");
    expect(
      container.querySelector(
        '[data-testid="overall-rating"] button[aria-pressed="true"]',
      )?.textContent,
    ).toContain("普通");
    expect(
      container.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="気になったことや、次回の参考にしたいことを残せます。"]',
      )?.value,
    ).toBe("朝は少し寒かった");
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
              {
                role: "main",
                mode: "preset",
                value: "white",
                hex: "#FFFFFF",
                label: "白",
              },
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
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "ネイビー",
              },
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
      vi.fn().mockResolvedValueOnce({
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

    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ).find((input) =>
      input.parentElement?.textContent?.includes("ネイビーパンツ"),
    );
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
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
          outdoor_temperature_feel: "comfortable",
          indoor_temperature_feel: "comfortable",
          overall_rating: null,
          feedback_tags: null,
          feedback_memo: "",
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

  it("同じ item id の候補が重複して返っても 1 件だけ表示する", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 276,
            name: "重複トップス",
            status: "active",
            category: "tops",
            shape: "tshirt",
            colors: [],
            seasons: ["春"],
            tpos: ["仕事"],
          },
          {
            id: 276,
            name: "重複トップス",
            status: "active",
            category: "tops",
            shape: "tshirt",
            colors: [],
            seasons: ["春"],
            tpos: ["仕事"],
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

    expect(container.textContent).toContain("重複トップス");
    expect(
      container.querySelectorAll('input[id="wear-log-item-276"]').length,
    ).toBe(1);
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
              {
                role: "main",
                mode: "preset",
                value: "white",
                hex: "#FFFFFF",
                label: "白",
              },
            ],
          },
          {
            id: 2,
            name: "ネイビーパンツ",
            status: "active",
            category: "bottoms",
            shape: "wide",
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "ネイビー",
              },
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

    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
    );

    await act(async () => {
      checkboxes[0]?.click();
      checkboxes[1]?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("1. 白T");
    expect(container.textContent).toContain("2. ネイビーパンツ");

    const moveUpButton = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.textContent === "上へ" &&
        button.parentElement?.parentElement?.textContent?.includes(
          "2. ネイビーパンツ",
        ),
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
          outdoor_temperature_feel: "comfortable",
          indoor_temperature_feel: "comfortable",
          overall_rating: null,
          feedback_tags: null,
          feedback_memo: "",
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

    const searchInput = container.querySelector<HTMLInputElement>(
      '[data-testid="wear-log-outfit-search"]',
    );
    const seasonSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-outfit-season-filter"]',
    );
    const tpoSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-outfit-tpo-filter"]',
    );

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
              {
                role: "main",
                mode: "preset",
                value: "white",
                hex: "#FFFFFF",
                label: "白",
              },
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
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "ネイビー",
              },
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

    const searchInput = container.querySelector<HTMLInputElement>(
      '[data-testid="wear-log-item-search"]',
    );
    const categorySelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-item-category-filter"]',
    );
    const seasonSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-item-season-filter"]',
    );
    const tpoSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-item-tpo-filter"]',
    );

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

    expect(container.textContent).toContain(
      "条件に一致するアイテム候補がありません。",
    );
  });

  it("アイテム候補のカスタムカラーは custom_label を優先表示する", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "レーヨンスキッパーブラウス",
            status: "active",
            category: "tops",
            shape: "shirt",
            colors: [
              {
                role: "main",
                mode: "custom",
                value: "custom-gray",
                hex: "#6B7280",
                label: "カスタムカラー",
                custom_label: "グレージュ",
              },
            ],
            seasons: ["春"],
            tpos: ["仕事"],
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

    expect(container.textContent).toContain("グレージュ");
    expect(container.textContent).not.toContain("カスタムカラー");
  });

  it("作成時の現在の季節絞り込みでもオール指定の候補はコーデ・アイテムともに表示される", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "通年カーディガン",
            status: "active",
            category: "tops",
            shape: "cardigan",
            colors: [],
            seasons: ["オール"],
            tpos: ["仕事"],
          },
          {
            id: 2,
            name: "夏パンツ",
            status: "active",
            category: "pants",
            shape: "wide",
            colors: [],
            seasons: ["夏"],
            tpos: ["仕事"],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 5,
            name: "通年コーデ",
            status: "active",
            seasons: ["オール"],
            tpos: ["仕事"],
            outfit_items: [{}],
          },
          {
            id: 6,
            name: "夏コーデ",
            status: "active",
            seasons: ["夏"],
            tpos: ["仕事"],
            outfit_items: [{}],
          },
        ],
      });

    vi.stubGlobal("fetch", vi.fn());

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(
        React.createElement(WearLogForm, {
          mode: "create",
          initialCurrentSeason: "春",
        }),
      );
    });
    await act(async () => {
      await waitForEffects();
    });

    const outfitSeasonSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-outfit-season-filter"]',
    );
    const itemSeasonSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-item-season-filter"]',
    );

    expect(outfitSeasonSelect?.value).toBe("春");
    expect(itemSeasonSelect?.value).toBe("春");
    expect(container.textContent).toContain("通年コーデ");
    expect(container.textContent).not.toContain("夏コーデ");
    expect(container.textContent).toContain("通年カーディガン");
    expect(container.textContent).not.toContain("夏パンツ");
  });

  it("underwear item は着用履歴の候補に表示しない", async () => {
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
            colors: [],
            seasons: [],
            tpos: [],
          },
          {
            id: 2,
            name: "黒ブラ",
            status: "active",
            category: "underwear",
            shape: "bra",
            colors: [],
            seasons: [],
            tpos: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    const { default: WearLogForm } = await import("./wear-log-form");

    await act(async () => {
      root.render(React.createElement(WearLogForm, { mode: "create" }));
    });
    await act(async () => {
      await waitForEffects();
    });

    const categorySelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="wear-log-item-category-filter"]',
    );

    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain("黒ブラ");
    expect(categorySelect?.innerHTML).not.toContain("アンダーウェア");
  });

  it("422 の field error を項目近くに表示し、items error は選択エラーとして見せる", async () => {
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
            colors: [],
            seasons: [],
            tpos: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          errors: {
            display_order: ["同じ日の表示順が重複しています。"],
            items: ["コーディネートまたはアイテムの内容を確認してください。"],
            memo: ["メモは1000文字以内で入力してください。"],
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

    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
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

    expect(container.textContent).toContain("同じ日の表示順が重複しています。");
    expect(container.textContent).toContain(
      "コーディネートまたはアイテムの内容を確認してください。",
    );
    expect(container.textContent).toContain(
      "メモは1000文字以内で入力してください。",
    );
    expect(container.textContent).toContain("入力内容を確認してください。");
    expect(container.textContent).not.toContain(
      "着用履歴を保存できませんでした。",
    );
  });
  it("フィードバック入力を保存 payload に含められる", async () => {
    fetchAllPaginatedCandidatesMock
      .mockResolvedValueOnce({
        status: 200,
        entries: [
          {
            id: 1,
            name: "白シャツ",
            status: "active",
            category: "tops",
            shape: "shirt",
            colors: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        entries: [],
      });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          message: "created",
          wearLog: { id: 20 },
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

    const dateInput =
      container.querySelector<HTMLInputElement>('input[type="date"]');
    const checkbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const outdoorSlider = container.querySelector<HTMLInputElement>(
      '[data-testid="outdoor-temperature-feel"] input[type="range"]',
    );
    const indoorSlider = container.querySelector<HTMLInputElement>(
      '[data-testid="indoor-temperature-feel"] input[type="range"]',
    );
    const ratingButtons = container.querySelector(
      '[data-testid="overall-rating"]',
    );
    const feedbackMemoField = container.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="気になったことや、次回の参考にしたいことを残せます。"]',
    );
    const form = container.querySelector("form");
    const positiveButtons = Array.from(
      container.querySelectorAll("section button[aria-pressed]"),
    );

    expect(container.textContent).toContain("振り返り");
    expect(container.textContent).toContain("よかったこと");
    expect(container.textContent).toContain("気になったこと");
    expect(container.textContent).toContain("TPO・見た目");
    expect(container.textContent).toContain("振り返りメモ");
    expect(container.textContent).toContain("寒暖差に対応できた");
    expect(container.textContent).toContain("合っていた");
    expect(container.textContent).not.toContain("湿気で不快");
    expect(container.textContent).not.toMatch(/気になったこと\s*\d+件/);

    await act(async () => {
      const dateSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      dateSetter?.call(dateInput, "2026-03-24");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
      checkbox?.click();
      dateSetter?.call(outdoorSlider, "1");
      outdoorSlider?.dispatchEvent(new Event("change", { bubbles: true }));
      dateSetter?.call(outdoorSlider, "2");
      outdoorSlider?.dispatchEvent(new Event("input", { bubbles: true }));
      dateSetter?.call(indoorSlider, "1");
      indoorSlider?.dispatchEvent(new Event("change", { bubbles: true }));
      ratingButtons
        ?.querySelectorAll("button")[0]
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      positiveButtons
        .find((button) => button.textContent?.includes("快適"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      positiveButtons
        .find((button) => button.textContent?.includes("雨"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("気になったこと"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("合っていた"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("微妙だった"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const memoSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      memoSetter?.call(feedbackMemoField, "冷房が少し強かったが全体的には快適");
      feedbackMemoField?.dispatchEvent(new Event("input", { bubbles: true }));
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
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
          outdoor_temperature_feel: "comfortable",
          indoor_temperature_feel: "slightly_cold",
          overall_rating: "good",
          feedback_tags: [
            "comfortable_all_day",
            "rain_ready",
            "worked_for_tpo",
            "color_mismatch",
          ],
          feedback_memo: "冷房が少し強かったが全体的には快適",
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
  });
});
