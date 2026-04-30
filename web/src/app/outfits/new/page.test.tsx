// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OutfitDuplicatePayload } from "@/types/outfits";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserPreferencesMock = vi.fn();
const fetchUserTposMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
  replace: replaceMock,
};
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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

describe("NewOutfitPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    searchParamsValue = "";
    window.sessionStorage.clear();
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
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "白T",
              category: "tops",
              shape: "tshirt",
              colors: [],
              seasons: [],
              tpos: [],
            },
            {
              id: 3,
              name: "黒パンツ",
              category: "bottoms",
              shape: "pants",
              colors: [],
              seasons: [],
              tpos: [],
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

  it("カテゴリ表示設定の取得に失敗してもアイテム候補は表示する", async () => {
    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain(
      "登録済みアイテムがありません。",
    );
    expect(container.textContent).toContain("コーディネート管理");
    expect(container.textContent).toContain("コーディネート登録");
    expect(container.textContent).toContain(
      "組み合わせるアイテムや季節・TPOを選んで、新しいコーディネートを登録します。",
    );
    expect(container.innerHTML).toContain('href="/outfits"');
    expect(container.textContent).toContain("一覧に戻る");
    expect(container.textContent).toContain(
      "「必須」が付いた項目は登録に必要です。",
    );
    expect(container.textContent).toContain("アイテム選択");
    expect(container.textContent?.match(/必須/g)?.length).toBe(2);
  });

  it("2ページ目にあるアイテムもコーディネートのアイテム候補に表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                category: "tops",
                shape: "tshirt",
                colors: [
                  {
                    label: "カスタムカラー",
                    custom_label: "ラベンダー90",
                    hex: "#c8b3d0",
                  },
                ],
                seasons: [],
                tpos: [],
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
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: ["春"],
                tpos: [],
              },
            ],
            meta: {
              lastPage: 2,
            },
          }),
        }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("イージーケアコーデュロイシャツ");
  });

  it("active outfit 由来の duplicate 初期値を反映する", async () => {
    searchParamsValue = "source=duplicate";
    const payload: OutfitDuplicatePayload = {
      name: "通勤コーデ（コピー）",
      memo: "朝会用",
      seasons: ["春"],
      tpos: ["仕事"],
      tpo_ids: [1],
      items: [
        {
          item_id: 1,
          sort_order: 1,
          selectable: true,
          note: null,
        },
      ],
    };
    window.sessionStorage.setItem(
      "outfit-duplicate-payload",
      JSON.stringify(payload),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.querySelector<HTMLInputElement>("#name")?.value).toBe(
      "通勤コーデ（コピー）",
    );
    expect(container.querySelector<HTMLTextAreaElement>("#memo")?.value).toBe(
      "朝会用",
    );
    expect(container.textContent).toContain(
      "複製元の内容を初期値として読み込みました。",
    );
    expect(container.textContent).toContain("選択中 1 件");
    expect(container.textContent).toContain(
      "1. 白T (トップス / Tシャツ/カットソー)",
    );
    expect(replaceMock).toHaveBeenCalledWith("/outfits/new");
  });

  it("invalid outfit 由来で selectable=false の item は初期選択せず、note を表示する", async () => {
    searchParamsValue = "source=duplicate";
    const payload: OutfitDuplicatePayload = {
      name: "休日コーデ（コピー）",
      memo: null,
      seasons: ["夏"],
      tpos: ["休日"],
      tpo_ids: [2],
      items: [
        {
          item_id: 1,
          sort_order: 1,
          selectable: true,
          note: null,
        },
        {
          item_id: 2,
          sort_order: 2,
          selectable: false,
          note: "手放したアイテムのため初期選択から除外",
        },
      ],
    };
    window.sessionStorage.setItem(
      "outfit-duplicate-payload",
      JSON.stringify(payload),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("選択中 1 件");
    expect(container.textContent).toContain(
      "元のコーディネートで使われていた一部アイテムは現在利用できないため、初期選択から外しました。",
    );
    expect(container.textContent).toContain(
      "2番目のアイテム: 手放したアイテムのため初期選択から除外",
    );
    expect(container.textContent).toContain(
      "1. 白T (トップス / Tシャツ/カットソー)",
    );
  });

  it("duplicate 初期値が見つからない場合はエラーを表示し、通常新規作成として続けられる", async () => {
    searchParamsValue = "source=duplicate";

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "複製の初期値を読み込めませんでした。通常の新規作成として続けてください。",
    );
    expect(container.textContent).toContain("白T");
  });

  it("successful submit does not render debug preview", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "Sample top",
              category: "tops",
              shape: "tshirt",
              colors: [],
              seasons: [],
              tpos: [],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 10, debug: "raw response body" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const checkbox = checkboxes[checkboxes.length - 1] ?? null;
    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    await act(async () => {
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          url === "/api/outfits" &&
          (init as RequestInit | undefined)?.method === "POST",
      ),
    ).toBe(true);
    expect(container.textContent).not.toContain("raw response body");
    expect(container.querySelector("pre")).toBeNull();
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
            items: [
              {
                id: 1,
                name: "白T",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({
            errors: {
              name: ["名前は255文字以内で入力してください。"],
              tpo_ids: ["TPO を選び直してください。"],
            },
          }),
        }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const checkbox = checkboxes[checkboxes.length - 1] ?? null;
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
    );

    await act(async () => {
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "名前は255文字以内で入力してください。",
    );
    expect(container.textContent).toContain("TPO を選び直してください。");
    expect(container.textContent).not.toContain(
      "コーディネートの登録に失敗しました。",
    );
  });

  it("500 応答の raw message は登録画面に表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 1,
                name: "白T",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
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

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const checkbox = checkboxes[checkboxes.length - 1] ?? null;
    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    await act(async () => {
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "コーディネートの登録に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
    expect(container.textContent).not.toContain("Unknown column debug");
  });
  it("アイテム候補の絞り込みを変更しても選択済みアイテムは順序一覧に残る", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "Logo Tee",
              brand_name: "Acme",
              memo: "spring favorite",
              category: "tops",
              subcategory: "tshirt_cutsew",
              shape: "tshirt",
              colors: [],
              seasons: ["春"],
              tpos: ["仕事"],
            },
            {
              id: 2,
              name: "Office Shirt",
              brand_name: "Acme",
              memo: "weekday",
              category: "tops",
              subcategory: "shirt_blouse",
              shape: "shirt",
              colors: [],
              seasons: ["夏"],
              tpos: ["仕事"],
            },
            {
              id: 3,
              name: "Wide Pants",
              brand_name: "Other",
              memo: "weekend",
              category: "pants",
              subcategory: "pants",
              shape: "wide",
              colors: [],
              seasons: ["冬"],
              tpos: ["休日"],
            },
          ],
        }),
      }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const categorySelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-category",
    );
    const subcategorySelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-subcategory",
    );
    const seasonSelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-season",
    );

    expect(subcategorySelect?.disabled).toBe(true);

    await act(async () => {
      changeInputValue(categorySelect, "tops");
      await waitForEffects();
    });

    expect(subcategorySelect?.disabled).toBe(false);
    expect(
      Array.from(subcategorySelect?.options ?? []).map(
        (option) => option.value,
      ),
    ).toContain("shirt_blouse");

    await act(async () => {
      changeInputValue(subcategorySelect, "shirt_blouse");
      await waitForEffects();
    });

    expect(container.textContent).toContain("Office Shirt");
    expect(container.textContent).not.toContain("Wide Pants");

    const officeShirtLabel = Array.from(
      container.querySelectorAll("label"),
    ).find((label) => label.textContent?.includes("Office Shirt"));
    const officeShirtCheckbox =
      officeShirtLabel?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      ) ?? null;

    await act(async () => {
      officeShirtCheckbox?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("選択中の順序");
    expect(container.textContent).toContain("1. Office Shirt");

    await act(async () => {
      changeInputValue(categorySelect, "pants");
      await waitForEffects();
    });

    expect(subcategorySelect?.value).toBe("");

    await act(async () => {
      changeInputValue(seasonSelect, "冬");
      await waitForEffects();
    });

    const candidateLabels = Array.from(
      container.querySelectorAll("label"),
    ).filter((label) => label.querySelector('input[type="checkbox"]'));

    expect(
      candidateLabels.some((label) =>
        label.textContent?.includes("Wide Pants"),
      ),
    ).toBe(true);
    expect(
      candidateLabels.some((label) =>
        label.textContent?.includes("Office Shirt"),
      ),
    ).toBe(false);
    expect(container.textContent).toContain("1. Office Shirt");
  });

  it("現在の季節設定がある場合はアイテム絞り込みの季節初期値に反映する", async () => {
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: "spring",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "Spring Knit",
              category: "tops",
              subcategory: "knit_sweater",
              shape: "knit",
              colors: [],
              seasons: ["春"],
              tpos: [],
            },
          ],
        }),
      }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const seasonSelect = container.querySelector<HTMLSelectElement>(
      "#outfit-item-filter-season",
    );

    expect(seasonSelect?.value).toBe("春");
  });

  it("現在の季節の候補 item がなくても item フィルタの季節初期値は表示される", async () => {
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: "spring",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "Summer Dress",
              category: "onepiece_dress",
              subcategory: "onepiece_dress",
              shape: "onepiece",
              colors: [],
              seasons: ["夏"],
              tpos: [],
            },
          ],
        }),
      }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
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
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "All Season Cardigan",
              category: "tops",
              subcategory: "cardigan",
              shape: "cardigan",
              colors: [],
              seasons: ["オール"],
              tpos: [],
            },
          ],
        }),
      }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("All Season Cardigan");
  });
  it("カスタムカラーでは custom_label を優先表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 276,
              name: "イージーケアコーデュロイシャツ",
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
            },
          ],
        }),
      }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("ラベンダー90");
    expect(container.textContent).not.toContain("カスタムカラー");
  });
});
