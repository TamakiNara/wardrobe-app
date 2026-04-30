// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserPreferencesMock = vi.fn();
const fetchUserTposMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
  fetchUserPreferences: fetchUserPreferencesMock,
  fetchUserTpos: fetchUserTposMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function changeInputValue(
  element: HTMLInputElement | HTMLSelectElement | null,
  value: string,
) {
  if (!element) {
    return;
  }

  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLSelectElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("EditOutfitPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchCategoryVisibilitySettingsMock.mockRejectedValue(new Error("network"));
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: null,
      },
    });
    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 0,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
              {
                id: 2,
                name: "青シャツ",
                status: "active",
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定の取得に失敗しても編集候補は表示する", async () => {
    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("白T");
    expect(container.textContent).toContain("青シャツ");
    expect(container.textContent).not.toContain(
      "登録済みアイテムがありません。",
    );
    expect(container.textContent).toContain("コーディネート管理");
    expect(container.textContent).toContain("コーディネート編集");
    expect(container.textContent).toContain(
      "登録済みのコーディネート内容を見直して更新します。",
    );
    expect(container.innerHTML).toContain('href="/outfits/10"');
    expect(container.textContent).toContain("詳細に戻る");
    expect(container.textContent).toContain(
      "「必須」が付いた項目は更新に必要です。",
    );
    expect(container.textContent).toContain("アイテム選択");
    expect(container.textContent?.match(/必須/g)?.length).toBe(2);
  }, 20000);

  it("2ページ目にあるアイテムもコーディネート編集の候補に表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 0,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
            meta: {
              lastPage: 2,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 276,
                name: "イージーケアコーデュロイシャツ",
                status: "active",
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: ["春"],
                tpos: [],
                tpo_ids: [],
              },
            ],
            meta: {
              lastPage: 2,
            },
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("イージーケアコーデュロイシャツ");
  });

  it("既存構成の disposed item は表示しつつ、このままでは保存できないことを案内する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 99,
                  sort_order: 1,
                  item: {
                    id: 99,
                    name: "旧トップス",
                    status: "disposed",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 2,
                name: "青シャツ",
                status: "active",
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("旧トップス");
    expect(container.textContent).toContain("手放し済み");
    expect(container.textContent).toContain(
      "このアイテムは現在の候補には使えません",
    );
    expect(container.textContent).toContain(
      "手放し済みのアイテムを含むため、このままでは保存できません。",
    );
    expect(container.textContent).toContain("青シャツ");

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("更新する"),
    );
    expect(submitButton?.hasAttribute("disabled")).toBe(true);
  });

  it("422 の field error を項目近くに表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 1,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({
            errors: {
              memo: ["メモは1000文字以内で入力してください。"],
              seasons: ["季節の指定を見直してください。"],
            },
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("更新する"),
    );

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "メモは1000文字以内で入力してください。",
    );
    expect(container.textContent).toContain("季節の指定を見直してください。");
    expect(container.textContent).not.toContain("更新に失敗しました。");
  });

  it("500 応答の raw message は編集画面に表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 1,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            message:
              "SQLSTATE[42S22]: Column not found: 1054 Unknown column debug",
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "コーディネートの更新に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(container.textContent).not.toContain("Unknown column debug");
  });
  it("候補の絞り込みを変えても選択済みアイテムは編集中の順序一覧に残る", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "Office Outfit",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 2,
                  sort_order: 1,
                  item: {
                    id: 2,
                    name: "Office Shirt",
                    status: "active",
                    brand_name: "Acme",
                    memo: "weekday",
                    category: "tops",
                    subcategory: "shirt_blouse",
                    shape: "shirt",
                    colors: [],
                    seasons: ["夏"],
                    tpos: ["仕事"],
                    tpo_ids: [],
                  },
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "Logo Tee",
                status: "active",
                brand_name: "Acme",
                memo: "spring favorite",
                category: "tops",
                subcategory: "tshirt_cutsew",
                shape: "tshirt",
                colors: [],
                seasons: ["春"],
                tpos: ["休日"],
                tpo_ids: [],
              },
              {
                id: 2,
                name: "Office Shirt",
                status: "active",
                brand_name: "Acme",
                memo: "weekday",
                category: "tops",
                subcategory: "shirt_blouse",
                shape: "shirt",
                colors: [],
                seasons: ["夏"],
                tpos: ["仕事"],
                tpo_ids: [],
              },
              {
                id: 3,
                name: "Wide Pants",
                status: "active",
                brand_name: "Other",
                memo: "weekend",
                category: "pants",
                subcategory: "pants",
                shape: "wide",
                colors: [],
                seasons: ["冬"],
                tpos: ["休日"],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const keywordInput = container.querySelector<HTMLInputElement>(
      "#outfit-item-filter-keyword",
    );
    const categorySelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-category",
    );
    const subcategorySelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-subcategory",
    );

    expect(container.textContent).toContain("1. Office Shirt");

    await act(async () => {
      changeInputValue(keywordInput, "Wide");
      await waitForEffects();
    });

    const filteredLabels = Array.from(
      container.querySelectorAll("label"),
    ).filter((label) => label.querySelector('input[type="checkbox"]'));

    expect(
      filteredLabels.some((label) => label.textContent?.includes("Wide Pants")),
    ).toBe(true);
    expect(
      filteredLabels.some((label) => label.textContent?.includes("Logo Tee")),
    ).toBe(false);
    expect(container.textContent).toContain("1. Office Shirt");

    await act(async () => {
      changeInputValue(categorySelect, "tops");
      await waitForEffects();
    });

    expect(subcategorySelect?.disabled).toBe(false);

    await act(async () => {
      changeInputValue(subcategorySelect, "shirt_blouse");
      await waitForEffects();
    });

    expect(container.textContent).not.toContain("Wide Pants");
    expect(container.textContent).toContain("Office Shirt");

    await act(async () => {
      changeInputValue(categorySelect, "pants");
      await waitForEffects();
    });

    expect(subcategorySelect?.value).toBe("");
    expect(container.textContent).toContain("Wide Pants");
    expect(container.textContent).toContain("1. Office Shirt");
  });

  it("編集画面でも現在の季節設定をアイテム絞り込み初期値に反映する", async () => {
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: "spring",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "Spring Outfit",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "Spring Knit",
                status: "active",
                category: "tops",
                subcategory: "knit_sweater",
                shape: "knit",
                colors: [],
                seasons: ["春"],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const seasonSelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-season",
    );

    expect(seasonSelect?.value).toBe("春");
  });

  it("現在の季節の候補 item がなくても編集画面の item フィルタ季節初期値は表示される", async () => {
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: "spring",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "Spring Outfit",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "Summer Dress",
                status: "active",
                category: "onepiece_dress",
                subcategory: "onepiece_dress",
                shape: "onepiece",
                colors: [],
                seasons: ["夏"],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const seasonSelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-season",
    );
    const seasonOptionValues = Array.from(seasonSelect?.options ?? []).map(
      (option) => option.value,
    );

    expect(seasonSelect?.value).toBe("春");
    expect(seasonOptionValues).toContain("春");
  });

  it("現在の季節絞り込み中でもオールの item は候補に含める", async () => {
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: "spring",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "Spring Outfit",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "All Season Cardigan",
                status: "active",
                category: "tops",
                subcategory: "cardigan",
                shape: "cardigan",
                colors: [],
                seasons: ["オール"],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("All Season Cardigan");
  });
  it("カスタムカラーでは custom_label を優先表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              tpo_ids: [],
              outfitItems: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 276,
                name: "イージーケアコーデュロイシャツ",
                status: "active",
                category: "tops",
                subcategory: "shirt_blouse",
                shape: "shirt",
                colors: [
                  {
                    label: "カスタムカラー",
                    custom_label: "ラベンダー90",
                    hex: "#c8b3d0",
                  },
                ],
                seasons: ["春"],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("ラベンダー90");
    expect(container.textContent).not.toContain("カスタムカラー");
  });
});
