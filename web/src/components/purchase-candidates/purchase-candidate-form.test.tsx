// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
  replace: replaceMock,
};
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserBrandsMock = vi.fn();
const fetchMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/api/categories", () => ({
  fetchCategoryGroups: () => fetchCategoryGroupsMock(),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: () => fetchCategoryVisibilitySettingsMock(),
  fetchUserBrands: (...args: unknown[]) => fetchUserBrandsMock(...args),
}));

describe("PurchaseCandidateForm", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  async function openSizeDetails() {
    const toggleButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("実寸を入力"),
    );
    expect(toggleButton).not.toBeUndefined();

    await act(async () => {
      toggleButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
  }

  async function collapseSizeDetails() {
    const toggleButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("折りたたむ"),
    );
    expect(toggleButton).not.toBeUndefined();

    await act(async () => {
      toggleButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    searchParamsValue = "";
    window.sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.stubGlobal("fetch", fetchMock);

    fetchCategoryGroupsMock.mockResolvedValue([
      {
        id: "outerwear",
        name: "ジャケット・アウター",
        sortOrder: 10,
        categories: [
          {
            id: "outerwear_coat",
            groupId: "outerwear",
            name: "パンツ",
            sortOrder: 10,
          },
        ],
      },
      {
        id: "tops",
        name: "トップス",
        sortOrder: 20,
        categories: [
          {
            id: "tops_tshirt_cutsew",
            groupId: "tops",
            name: "Tシャツ・カットソー",
            sortOrder: 10,
          },
          {
            id: "tops_shirt_blouse",
            groupId: "tops",
            name: "シャツ・ブラウス",
            sortOrder: 20,
          },
          {
            id: "tops_polo_shirt",
            groupId: "tops",
            name: "ポロシャツ",
            sortOrder: 30,
          },
        ],
      },
      {
        id: "pants",
        name: "パンツ",
        sortOrder: 30,
        categories: [
          {
            id: "pants_pants",
            groupId: "pants",
            name: "パンツ",
            sortOrder: 10,
          },
          {
            id: "pants_short",
            groupId: "pants",
            name: "ショートパンツ",
            sortOrder: 20,
          },
        ],
      },
      {
        id: "skirts",
        name: "スカート",
        sortOrder: 35,
        categories: [
          {
            id: "skirts_skirt",
            groupId: "skirts",
            name: "スカート",
            sortOrder: 10,
          },
          {
            id: "skirts_other",
            groupId: "skirts",
            name: "その他スカート",
            sortOrder: 20,
          },
        ],
      },
      {
        id: "legwear",
        name: "レッグウェア",
        sortOrder: 40,
        categories: [
          {
            id: "legwear_socks",
            groupId: "legwear",
            name: "トップス",
            sortOrder: 10,
          },
        ],
      },
    ]);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: [
        "outerwear_coat",
        "tops_tshirt_cutsew",
        "tops_shirt_blouse",
        "tops_polo_shirt",
        "pants_pants",
        "pants_short",
        "skirts_skirt",
        "skirts_other",
        "legwear_socks",
      ],
    });
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  async function renderForm(props?: {
    mode?: "create" | "edit";
    candidateId?: string;
  }) {
    const { default: PurchaseCandidateForm } =
      await import("./purchase-candidate-form");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateForm, {
          mode: "create",
          ...props,
        }),
      );
    });

    await act(async () => {
      await Promise.resolve();
    });
  }

  function setNativeValue(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    value: string,
  ) {
    const prototype =
      element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getCategoryGroupSelect() {
    return container.querySelector("#category_group_id") as HTMLSelectElement;
  }

  function getCategorySelect() {
    return container.querySelector("#category_id") as HTMLSelectElement;
  }

  async function setCategorySelection(groupId: string, categoryId: string) {
    await act(async () => {
      setNativeValue(getCategoryGroupSelect(), groupId);
    });

    await act(async () => {
      setNativeValue(getCategorySelect(), categoryId);
    });
  }

  it("日本語ラベルと必須表示を描画できる", async () => {
    await renderForm();

    const sectionTitles = [
      "基本情報",
      "分類",
      "購入情報",
      "色",
      "利用条件・状態",
      "サイズ・実寸",
      "素材・混率",
      "補足情報",
      "画像",
    ];

    const renderedSectionTitles = Array.from(
      container.querySelectorAll(
        "form > section.rounded-2xl.border.border-gray-200.bg-white h2",
      ),
    ).map((heading) => heading.textContent);
    expect(renderedSectionTitles).toEqual(sectionTitles);

    expect(container.textContent).toContain("サイズ区分");
    expect(container.textContent).toContain("優先度");
    expect(container.textContent).toContain("サイズ区分");
    expect(container.textContent).toContain("必須");
    expect(container.textContent).not.toContain("size_gender");
    expect(container.textContent).not.toContain("priority");
    expect(container.textContent).toContain("色名（任意）");
    expect(container.textContent).not.toContain("選択中の色");
    expect(container.textContent).toContain("欲しい理由");
    expect(container.textContent).toContain("補足情報");
    expect(container.textContent).toContain("雨対応");
    const mainColorCustomLabelInput = container.querySelector<HTMLInputElement>(
      "#main_color_custom_label",
    );
    expect(mainColorCustomLabelInput).not.toBeNull();
    expect(mainColorCustomLabelInput?.placeholder).toBe(
      "例: 00 WHITE / 31 BEIGE / 64 BLUE",
    );

    const sectionCards = container.querySelectorAll(
      "form > section.rounded-2xl.border.border-gray-200.bg-white",
    );
    expect(sectionCards).toHaveLength(9);
  });

  it("購入情報を意味のまとまり順で表示する", async () => {
    await renderForm();

    const purchaseInfoSection = Array.from(
      container.querySelectorAll(
        "form > section.rounded-2xl.border.border-gray-200.bg-white",
      ),
    ).find((section) =>
      section.querySelector("h2")?.textContent?.includes("購入情報"),
    );

    expect(purchaseInfoSection).toBeDefined();

    const labels = Array.from(
      purchaseInfoSection!.querySelectorAll("label, span.text-sm.font-medium"),
    )
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean);

    expect(labels).toEqual([
      "想定価格",
      "セール価格",
      "セール終了日",
      "発売日",
      "販売終了日",
      "購入 URL",
      "欲しい理由",
    ]);

    const priceField = purchaseInfoSection!
      .querySelector('label[for="price"]')
      ?.closest("div");
    expect(priceField?.className).not.toContain("md:col-span-2");
  });

  it("カテゴリ未選択では種類を表示せず、カテゴリ選択後に表示する", async () => {
    await renderForm();

    expect(container.querySelector("#category_id")).toBeNull();

    await act(async () => {
      const categoryGroupSelect = getCategoryGroupSelect();
      categoryGroupSelect.value = "tops";
      categoryGroupSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector("#category_id")).not.toBeNull();
  });

  it("表示設定の取得に失敗してもカテゴリ一覧だけで初期化できる", async () => {
    fetchCategoryVisibilitySettingsMock.mockRejectedValueOnce(
      new Error("settings failed"),
    );

    await renderForm();

    expect(
      container.textContent?.includes(
        "購入検討フォームの初期化に失敗しました。",
      ),
    ).toBe(false);
    expect(getCategoryGroupSelect().options.length).toBeGreaterThan(1);
    expect(container.querySelector("#category_id")).toBeNull();

    await act(async () => {
      const categoryGroupSelect = getCategoryGroupSelect();
      categoryGroupSelect.value = "tops";
      categoryGroupSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(getCategorySelect().options.length).toBeGreaterThan(0);
  });

  it("tops では詳細属性の spec UI を表示し、shape UI は表示しない", async () => {
    await renderForm();

    await setCategorySelection("tops", "tops_tshirt_cutsew");

    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-tops-sleeve")).not.toBeNull();
    expect(container.querySelector("#spec-tops-length")).not.toBeNull();
    expect(container.querySelector("#spec-tops-neck")).not.toBeNull();
    expect(container.querySelector("#spec-bottoms-length-type")).toBeNull();
    expect(container.querySelector("#spec-legwear-coverage-type")).toBeNull();
  });

  it("tops では選択肢が1つしかない spec 項目を表示しない", async () => {
    await renderForm();

    await setCategorySelection("tops", "tops_polo_shirt");

    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-tops-sleeve")).not.toBeNull();
    expect(container.querySelector("#spec-tops-length")).not.toBeNull();
    expect(container.querySelector("#spec-tops-neck")).toBeNull();
    expect(container.querySelector("#spec-tops-design")).toBeNull();
    expect(container.querySelector("#spec-tops-fit")).toBeNull();
  });

  it("pants では spec UI を表示する", async () => {
    await renderForm();

    await setCategorySelection("pants", "pants_pants");

    expect(container.querySelector("#spec-bottoms-length-type")).not.toBeNull();
    expect(container.querySelector("#spec-bottoms-rise-type")).not.toBeNull();
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-legwear-coverage-type")).toBeNull();
  });

  it("skirts では spec UI を表示し、shape UI は表示しない", async () => {
    await renderForm();

    await setCategorySelection("skirts", "skirts_skirt");

    expect(container.querySelector("#spec-skirt-length-type")).not.toBeNull();
    expect(container.querySelector("#spec-skirt-material-type")).not.toBeNull();
    expect(container.querySelector("#spec-skirt-design-type")).not.toBeNull();
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-bottoms-length-type")).toBeNull();
    expect(container.querySelector("#spec-legwear-coverage-type")).toBeNull();
  });

  it("spec セクションをカテゴリ選択の直後に表示する", async () => {
    await renderForm();

    await setCategorySelection("pants", "pants_pants");

    await act(async () => {
      await Promise.resolve();
    });

    const classificationSection = container
      .querySelector("#category_id")
      ?.closest("section");
    const specField = container.querySelector("#spec-bottoms-length-type");
    const purchaseSection = container
      .querySelector("#price")
      ?.closest("section");
    const sizeSection = container
      .querySelector("#size_gender")
      ?.closest("section");

    expect(classificationSection).not.toBeNull();
    expect(specField).not.toBeNull();
    expect(purchaseSection).not.toBeNull();
    expect(sizeSection).not.toBeNull();
    expect(specField?.closest("section")).toBe(classificationSection);
    expect(
      classificationSection!.compareDocumentPosition(purchaseSection!),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(classificationSection!.compareDocumentPosition(sizeSection!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("pants_short でも spec UI を表示する", async () => {
    await renderForm();

    await setCategorySelection("pants", "pants_short");

    expect(container.querySelector("#spec-bottoms-length-type")).not.toBeNull();
    expect(container.querySelector("#spec-bottoms-rise-type")).not.toBeNull();
  });

  it("legwear socks では spec UI を表示する", async () => {
    await renderForm();

    await setCategorySelection("legwear", "legwear_socks");

    expect(
      container.querySelector("#spec-legwear-coverage-type"),
    ).not.toBeNull();
    expect(
      Array.from(
        (
          container.querySelector(
            "#spec-legwear-coverage-type",
          ) as HTMLSelectElement | null
        )?.options ?? [],
      ).some((option) => option.textContent === "ルーズソックス"),
    ).toBe(true);
    expect(
      Array.from(
        (
          container.querySelector(
            "#spec-legwear-coverage-type",
          ) as HTMLSelectElement | null
        )?.options ?? [],
      ).some((option) => option.textContent === "ニーハイソックス"),
    ).toBe(true);
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-bottoms-length-type")).toBeNull();
  });

  it("tops / other では shape UI を出さず、tops spec も表示しない", async () => {
    await renderForm();

    await setCategorySelection("tops", "tops_other");

    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(container.querySelector("#spec-tops-sleeve")).toBeNull();
    expect(container.querySelector("#spec-tops-length")).toBeNull();
    expect(container.querySelector("#spec-tops-neck")).toBeNull();
    expect(container.querySelector("#spec-tops-design")).toBeNull();
    expect(container.querySelector("#spec-tops-fit")).toBeNull();
  });

  it("初期状態では実寸本体を閉じ、開くと fallback を表示する", async () => {
    await renderForm();

    expect(container.textContent).toContain("実寸");
    expect(container.textContent).toContain("実寸を入力");
    expect(container.textContent).not.toContain("自由項目を追加");
    expect(container.textContent).not.toContain(
      "現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。",
    );

    await openSizeDetails();

    expect(container.textContent).toContain("自由項目を追加");
    expect(container.textContent).toContain(
      "現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。",
    );
  });

  it("purchase candidate spec は tops を含めて未入力許容の表示を維持する", async () => {
    await renderForm();

    await setCategorySelection("pants", "pants_pants");

    expect(
      container.querySelector('label[for="spec-bottoms-length-type"]')
        ?.textContent,
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="spec-bottoms-rise-type"]')
        ?.textContent,
    ).not.toContain("必須");

    await setCategorySelection("skirts", "skirts_skirt");

    expect(
      container.querySelector('label[for="spec-skirt-length-type"]')
        ?.textContent,
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="spec-skirt-material-type"]')
        ?.textContent,
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="spec-skirt-design-type"]')
        ?.textContent,
    ).not.toContain("必須");

    await setCategorySelection("legwear", "legwear_socks");

    expect(
      container.querySelector('label[for="spec-legwear-coverage-type"]')
        ?.textContent,
    ).not.toContain("必須");

    await setCategorySelection("tops", "tops_tshirt_cutsew");

    expect(
      container.querySelector('label[for="spec-tops-sleeve"]')?.textContent,
    ).not.toContain("必須");
    expect(
      container.querySelector('label[for="spec-tops-length"]')?.textContent,
    ).not.toContain("必須");
  });

  it("雨対応を利用条件・状態へ移動して表示する", async () => {
    await renderForm();

    const sectionCards = Array.from(
      container.querySelectorAll(
        "form > section.rounded-2xl.border.border-gray-200.bg-white",
      ),
    );
    const conditionsSection = sectionCards.find(
      (section) =>
        section.querySelector("h2")?.textContent === "利用条件・状態",
    );
    const sizeSection = container
      .querySelector("#size_gender")
      ?.closest("section");

    expect(conditionsSection?.textContent).toContain("雨対応");
    expect(sizeSection?.textContent).not.toContain("雨対応");
  });

  it("季節のオールを排他的に切り替える", async () => {
    await renderForm();

    const allButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "オール",
    );
    const springButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "春",
    );

    expect(allButton).toBeDefined();
    expect(springButton).toBeDefined();

    await act(async () => {
      allButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(allButton?.getAttribute("aria-pressed")).toBe("true");
    expect(springButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      springButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(allButton?.getAttribute("aria-pressed")).toBe("false");
    expect(springButton?.getAttribute("aria-pressed")).toBe("true");
  });

  it("ブランド候補を表示し、候補選択と自由入力を両立できる", async () => {
    fetchUserBrandsMock
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
      })
      .mockResolvedValueOnce({ brands: [] });

    await renderForm();

    const input = container.querySelector<HTMLInputElement>("#brand-name");
    expect(input).not.toBeNull();

    await act(async () => {
      input!.focus();
      setNativeValue(input!, "UNI");
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchUserBrandsMock.mock.calls).toContainEqual(["UNI", true]);
    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).toContain("ゆにくろ");
    expect(container.textContent).toContain("候補がなくても自由入力できます。");
    expect(container.textContent).toContain("ブランド候補にも追加する");

    const suggestionButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("UNIQLO"));
    expect(suggestionButton).not.toBeUndefined();

    await act(async () => {
      suggestionButton!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(input?.value).toBe("UNIQLO");

    await act(async () => {
      setNativeValue(input!, "NoBrand");
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchUserBrandsMock.mock.calls).toContainEqual(["NoBrand", true]);
    expect(input?.value).toBe("NoBrand");
    expect(container.textContent).toContain(
      "一致するブランド候補はありません。",
    );
  });

  it("ブランド候補にも追加するを送信 payload に含められる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 7,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const brandNameInput = container.querySelector(
      "#brand-name",
    ) as HTMLInputElement;
    const saveBrandCheckbox = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ).find((input) =>
      input.parentElement?.textContent?.includes("ブランド候補にも追加する"),
    );
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const form = container.querySelector("form") as HTMLFormElement;

    expect(saveBrandCheckbox).not.toBeUndefined();

    await act(async () => {
      setNativeValue(nameInput, "ブランド候補追加テスト");
      await setCategorySelection("outerwear", "outerwear_coat");
      setNativeValue(brandNameInput, "UNIQLO");
      saveBrandCheckbox!.click();
      customMainCheckbox.click();
    });

    const mainColorCodeInput = container.querySelector(
      'input[aria-label="メインカラーコード"]',
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.save_brand_as_candidate).toBe(true);
  });

  it("プリセット色からカスタムカラーへ切り替えると直前の色を引き継ぐ", async () => {
    await renderForm();

    const mainColorButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("メインカラーを選択")) as
      | HTMLButtonElement
      | undefined;
    expect(mainColorButton).not.toBeUndefined();

    await act(async () => {
      mainColorButton!.click();
    });

    const redButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("#E53935"),
    ) as HTMLButtonElement | undefined;
    expect(redButton).not.toBeUndefined();

    await act(async () => {
      redButton!.click();
    });

    const redHexMatches = container.textContent?.match(/#E53935/g) ?? [];
    expect(redHexMatches).toHaveLength(1);
    expect(container.textContent).not.toContain("選択中の色");

    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;

    await act(async () => {
      customMainCheckbox.click();
    });

    const mainColorCodeInput = container.querySelector(
      'input[aria-label="メインカラーコード"]',
    ) as HTMLInputElement;
    expect(mainColorCodeInput.value).toBe("#E53935");
  });

  it("カスタムカラーコードを送信 payload に含められる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 7,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const salePriceInput = container.querySelector(
      "#sale_price",
    ) as HTMLInputElement;
    const saleEndsAtDateInput = container.querySelector(
      "#sale_ends_at_date",
    ) as HTMLInputElement;
    const saleEndsAtTimeInput = container.querySelector(
      "#sale_ends_at_time",
    ) as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const sizeNoteInput = container.querySelector(
      "#size_note",
    ) as HTMLTextAreaElement;

    await act(async () => {
      setNativeValue(nameInput, "レインコート候補");
      await setCategorySelection("tops", "tops_tshirt_cutsew");
      const topsSleeveSelect = container.querySelector(
        "#spec-tops-sleeve",
      ) as HTMLSelectElement;
      const topsLengthSelect = container.querySelector(
        "#spec-tops-length",
      ) as HTMLSelectElement;
      const topsNeckSelect = container.querySelector(
        "#spec-tops-neck",
      ) as HTMLSelectElement;
      const topsFitSelect = container.querySelector(
        "#spec-tops-fit",
      ) as HTMLSelectElement;
      setNativeValue(topsSleeveSelect, "short");
      setNativeValue(topsLengthSelect, "normal");
      setNativeValue(topsNeckSelect, "crew");
      setNativeValue(topsFitSelect, "oversized");
      setNativeValue(salePriceInput, "12800");
      setNativeValue(saleEndsAtDateInput, "2026-03-31");
      setNativeValue(saleEndsAtTimeInput, "18:00");
      setNativeValue(sizeNoteInput, "厚手対応");
      customMainCheckbox.click();
    });

    await openSizeDetails();

    const shoulderWidthInput = container.querySelector(
      "#structured-size-shoulder_width",
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(shoulderWidthInput, "42.5");
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("自由項目を追加"),
    ) as HTMLButtonElement;

    await act(async () => {
      addButton.click();
    });

    const customLabelInput = container.querySelector(
      'input[placeholder="項目名"]',
    ) as HTMLInputElement;
    const customValueInput = container.querySelector(
      'input[placeholder="値"]',
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(customLabelInput, "裄丈");
      setNativeValue(customValueInput, "78");
    });

    const mainColorCodeInput = container.querySelector(
      'input[aria-label="メインカラーコード"]',
    ) as HTMLInputElement;
    const mainColorCustomLabelInput = container.querySelector(
      "#main_color_custom_label",
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
      setNativeValue(mainColorCustomLabelInput, "31 BEIGE");
    });

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.colors).toEqual([
      {
        role: "main",
        mode: "custom",
        value: "#112233",
        hex: "#112233",
        label: "カスタムカラー",
        custom_label: "31 BEIGE",
      },
    ]);
    expect(payload.size_note).toBe("厚手対応");
    expect(payload.size_details).toEqual({
      structured: {
        shoulder_width: 42.5,
      },
      custom_fields: [
        {
          label: "裄丈",
          value: 78,
          sort_order: 1,
        },
      ],
    });
    expect(payload.sale_price).toBe(12800);
    expect(payload.sale_ends_at).toBe("2026-03-31T18:00");
    expect(payload.spec).toEqual({
      tops: {
        sleeve: "short",
        length: "normal",
        neck: "crew",
        fit: "oversized",
      },
    });
  });

  it("sale_ends_at の日付だけの入力は時刻を 00:00 に補正する", async () => {
    const { resolveSaleEndsAtFromDateInput, resolveSaleEndsAtFromTimeInput } =
      await import("./purchase-candidate-form");

    expect(resolveSaleEndsAtFromDateInput("2026-03-31", "")).toBe(
      "2026-03-31T00:00",
    );
    expect(resolveSaleEndsAtFromTimeInput("18:00", "2026-03-31T00:00")).toBe(
      "2026-03-31T18:00",
    );
    expect(
      resolveSaleEndsAtFromDateInput("2026-04-30", "2026-03-31T18:00"),
    ).toBe("2026-04-30T18:00");
    expect(resolveSaleEndsAtFromDateInput("", "2026-03-31T18:00")).toBe("");
  });

  it("sale_ends_at のリセットで送信値を null に戻せる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 18,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const saleEndsAtDateInput = container.querySelector(
      "#sale_ends_at_date",
    ) as HTMLInputElement;
    const saleEndsAtTimeInput = container.querySelector(
      "#sale_ends_at_time",
    ) as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="\u30e1\u30a4\u30f3\u30ab\u30e9\u30fc\u3092\u30ab\u30e9\u30fc\u30b3\u30fc\u30c9\u3067\u5165\u529b"]',
    ) as HTMLInputElement;
    const resetButton = saleEndsAtDateInput
      .closest("div.grid")
      ?.previousElementSibling?.querySelector("button") as HTMLButtonElement;

    expect(resetButton.disabled).toBe(true);

    await act(async () => {
      setNativeValue(nameInput, "Sale reset candidate");
      await setCategorySelection("tops", "tops_tshirt_cutsew");
      setNativeValue(saleEndsAtDateInput, "2026-03-31");
      customMainCheckbox.click();
    });

    const mainColorCodeInput = container.querySelector(
      'input[aria-label="\u30e1\u30a4\u30f3\u30ab\u30e9\u30fc\u30b3\u30fc\u30c9"]',
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
    });

    expect(resetButton.disabled).toBe(false);

    await act(async () => {
      resetButton.click();
    });

    expect(saleEndsAtDateInput.value).toBe("");
    expect(saleEndsAtTimeInput.value).toBe("");

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.sale_ends_at).toBeNull();
  });

  it("素材・混率を送信 payload に含められる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 8,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const addMaterialButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) =>
      button.textContent?.includes("素材を追加"),
    ) as HTMLButtonElement;

    await act(async () => {
      setNativeValue(nameInput, "素材付き候補");
      await setCategorySelection("tops", "tops_tshirt_cutsew");
      customMainCheckbox.click();
      addMaterialButton.click();
    });

    const mainColorCodeInput = container.querySelector(
      'input[aria-label="メインカラーコード"]',
    ) as HTMLInputElement;

    const partInputs = Array.from(
      container.querySelectorAll('input[list="item-material-part-options"]'),
    ) as HTMLInputElement[];
    const materialInputs = Array.from(
      container.querySelectorAll('input[list="item-material-name-options"]'),
    ) as HTMLInputElement[];
    const ratioInputs = Array.from(
      container.querySelectorAll('input[id$="-ratio"]'),
    ) as HTMLInputElement[];

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
      setNativeValue(partInputs[0], "本体");
      setNativeValue(materialInputs[0], "綿");
      setNativeValue(ratioInputs[0], "80");
      setNativeValue(partInputs[1], "本体");
      setNativeValue(materialInputs[1], "ポリエステル");
      setNativeValue(ratioInputs[1], "20");
    });

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.materials).toEqual([
      {
        part_label: "本体",
        material_name: "綿",
        ratio: 80,
      },
      {
        part_label: "本体",
        material_name: "ポリエステル",
        ratio: 20,
      },
    ]);
  });

  it("サイズ実寸の重複は短い警告文で表示する", async () => {
    await renderForm();

    const categorySelect = container.querySelector(
      "#category_id",
    ) as HTMLSelectElement;

    await act(async () => {
      await setCategorySelection("tops", "tops_tshirt_cutsew");
    });

    await openSizeDetails();

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("自由項目を追加"),
    ) as HTMLButtonElement;

    await act(async () => {
      addButton.click();
    });

    const customLabelInput = container.querySelector(
      'input[placeholder="項目名"]',
    ) as HTMLInputElement;

    await act(async () => {
      setNativeValue(customLabelInput, "肩幅");
    });

    expect(container.textContent).toContain("同名の実寸項目があります。");
  });

  it("季節のオールを個別季節と排他的に切り替える", async () => {
    await renderForm();

    const seasonButtons = Array.from(
      container.querySelectorAll("button[aria-pressed]"),
    );
    const springButton = seasonButtons.find(
      (button) => button.textContent === "春",
    ) as HTMLButtonElement;
    const summerButton = seasonButtons.find(
      (button) => button.textContent === "夏",
    ) as HTMLButtonElement;
    const allSeasonButton = seasonButtons.find(
      (button) => button.textContent === "オール",
    ) as HTMLButtonElement;

    await act(async () => {
      springButton.click();
    });

    expect(springButton.getAttribute("aria-pressed")).toBe("true");
    expect(allSeasonButton.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      allSeasonButton.click();
    });

    expect(allSeasonButton.getAttribute("aria-pressed")).toBe("true");
    expect(springButton.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      summerButton.click();
    });

    expect(summerButton.getAttribute("aria-pressed")).toBe("true");
    expect(allSeasonButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("duplicate 初期値を読み込み、保存時に duplicate_images を送る", async () => {
    searchParamsValue = "source=duplicate";
    window.sessionStorage.setItem(
      "purchase-candidate-duplicate-payload",
      JSON.stringify({
        status: "considering",
        priority: "high",
        name: "春ブラウス",
        category_id: "tops_shirt_blouse",
        spec: {
          tops: {
            sleeve: "short",
            neck: "collar",
            fit: "oversized",
          },
        },
        brand_name: "Sample Brand",
        price: 14800,
        sale_price: 12800,
        sale_ends_at: null,
        purchase_url: "https://example.test/products/1",
        memo: "メモ",
        wanted_reason: "欲しい理由",
        size_gender: "women",
        size_label: "M",
        size_note: "",
        size_details: null,
        is_rain_ok: true,
        colors: [
          {
            role: "main",
            mode: "preset",
            value: "navy",
            hex: "#1F3A5F",
            label: "ネイビー",
            custom_label: "09 BLACK",
          },
        ],
        seasons: ["春"],
        tpos: ["休日"],
        materials: [],
        images: [
          {
            id: 7,
            source_image_id: 7,
            purchase_candidate_id: 10,
            disk: "public",
            path: "purchase-candidates/10/source.png",
            url: "/storage/purchase-candidates/10/source.png",
            original_filename: "source.png",
            mime_type: "image/png",
            file_size: 1234,
            sort_order: 1,
            is_primary: true,
          },
        ],
      }),
    );
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 12,
        },
      }),
    });

    await renderForm();

    expect(container.querySelector<HTMLInputElement>("#name")?.value).toBe(
      "春ブラウス（コピー）",
    );
    expect(getCategoryGroupSelect().value).toBe("tops");
    expect(getCategorySelect().value).toBe("tops_shirt_blouse");
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-sleeve")?.value,
    ).toBe("short");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-neck")?.value,
    ).toBe("collar");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-fit")?.value,
    ).toBe("oversized");
    expect(container.textContent).toContain(
      "複製元の内容を初期値として読み込みました。",
    );
    expect(container.textContent).toContain("source.png");
    expect(container.textContent).toContain(
      "購入検討から引き継ぐ画像です。保存すると新しい購入検討へ画像をコピーします。",
    );
    expect(replaceMock).toHaveBeenCalledWith("/purchase-candidates/new");

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.colors[0].custom_label).toBe("09 BLACK");
    expect(payload.spec).toEqual({
      tops: {
        sleeve: "short",
        neck: "collar",
        fit: "oversized",
      },
    });
    expect(payload.duplicate_images).toEqual([{ source_image_id: 7 }]);
  });

  it("tops の色違い追加ドラフトで tops spec を読み込める", async () => {
    searchParamsValue = "source=color-variant";
    window.sessionStorage.setItem(
      "purchase-candidate-duplicate-payload",
      JSON.stringify({
        status: "considering",
        priority: "high",
        name: "春ブラウス",
        category_id: "tops_shirt_blouse",
        variant_source_candidate_id: 10,
        spec: {
          tops: {
            sleeve: "short",
            neck: "collar",
            fit: "oversized",
          },
        },
        brand_name: "Sample Brand",
        price: 14800,
        sale_price: null,
        sale_ends_at: null,
        purchase_url: "https://example.test/products/1",
        memo: "メモ",
        wanted_reason: "新しい色が欲しい",
        size_gender: "women",
        size_label: "M",
        size_note: "",
        size_details: null,
        is_rain_ok: true,
        colors: [],
        seasons: [],
        tpos: [],
        materials: [],
        images: [],
      }),
    );

    await renderForm();

    expect(getCategoryGroupSelect().value).toBe("tops");
    expect(getCategorySelect().value).toBe("tops_shirt_blouse");
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-sleeve")?.value,
    ).toBe("short");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-neck")?.value,
    ).toBe("collar");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-tops-fit")?.value,
    ).toBe("oversized");
  });
  it("色違い追加の初期値を読み込み、保存時に source candidate id を送る", async () => {
    searchParamsValue = "source=color-variant";
    window.sessionStorage.setItem(
      "purchase-candidate-duplicate-payload",
      JSON.stringify({
        status: "considering",
        priority: "high",
        name: "春コート",
        category_id: "outerwear_coat",
        variant_source_candidate_id: 10,
        brand_name: "Sample Brand",
        price: 14800,
        sale_price: null,
        sale_ends_at: null,
        purchase_url: "https://example.test/products/1",
        memo: "メモ",
        wanted_reason: "欲しい理由",
        size_gender: "women",
        size_label: "M",
        size_note: "",
        size_details: null,
        is_rain_ok: true,
        colors: [
          {
            role: "main",
            mode: "custom",
            value: "#1F3A5F",
            hex: "#1F3A5F",
            label: "カスタムカラー",
            custom_label: "31 BEIGE",
          },
          {
            role: "sub",
            mode: "preset",
            value: "black",
            hex: "#111827",
            label: "ブラック",
          },
        ],
        seasons: [],
        tpos: [],
        materials: [],
        images: [],
      }),
    );
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 12,
        },
      }),
    });

    await renderForm();

    expect(container.querySelector<HTMLInputElement>("#name")?.value).toBe(
      "春コート",
    );
    expect(container.textContent).toContain(
      "色違いの初期値を読み込みました。保存前に色や画像を調整してください。",
    );
    expect(replaceMock).toHaveBeenCalledWith("/purchase-candidates/new");
    expect(
      container.querySelector<HTMLInputElement>("#main_color_custom_label")
        ?.value,
    ).toBe("");
    expect(
      container.querySelector<HTMLInputElement>(
        'input[aria-label="メインカラーコード"]',
      ),
    ).toBeNull();

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("購入済みの購入検討では編集可能項目だけ送信する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          purchaseCandidate: {
            id: 12,
            status: "purchased",
            priority: "medium",
            name: "購入済み候補",
            category_id: "outerwear_coat",
            category_name: "コート",
            brand_name: "Brand",
            price: 14800,
            sale_price: 12800,
            sale_ends_at: "2026-03-31T18:00:00+09:00",
            purchase_url: "https://example.test/products/1",
            memo: "既存メモ",
            wanted_reason: "既存理由",
            size_gender: "women",
            size_label: "M",
            size_note: "厚手対応",
            size_details: {
              structured: {
                shoulder_width: 42,
              },
              custom_fields: [
                {
                  label: "裄丈",
                  value: 78,
                  sort_order: 1,
                },
              ],
            },
            is_rain_ok: true,
            converted_item_id: 99,
            converted_at: "2026-03-25T10:00:00+09:00",
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "navy",
                hex: "#1F3A5F",
                label: "ネイビー",
              },
            ],
            seasons: ["春"],
            tpos: ["仕事"],
            materials: [
              {
                part_label: "本体",
                material_name: "綿",
                ratio: 80,
              },
              {
                part_label: "本体",
                material_name: "ポリエステル",
                ratio: 20,
              },
            ],
            images: [],
            created_at: "2026-03-24T10:00:00+09:00",
            updated_at: "2026-03-24T10:00:00+09:00",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          purchaseCandidate: {
            id: 12,
          },
        }),
      });

    await renderForm({ mode: "edit", candidateId: "12" });

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const categoryGroupSelect = getCategoryGroupSelect();
    const categorySelect = getCategorySelect();
    const priceInput = container.querySelector("#price") as HTMLInputElement;
    const salePriceInput = container.querySelector(
      "#sale_price",
    ) as HTMLInputElement;
    const saleEndsAtDateInput = container.querySelector(
      "#sale_ends_at_date",
    ) as HTMLInputElement;
    const saleEndsAtTimeInput = container.querySelector(
      "#sale_ends_at_time",
    ) as HTMLInputElement;
    const purchaseUrlInput = container.querySelector(
      "#purchase_url",
    ) as HTMLInputElement;
    const wantedReasonTextarea = container.querySelector(
      "#wanted_reason",
    ) as HTMLTextAreaElement;
    const memoTextarea = container.querySelector(
      "#memo",
    ) as HTMLTextAreaElement;

    expect(container.textContent).toContain(
      "購入済みの購入検討では、メモ・欲しい理由・優先度・発売日・販売期間情報・購入 URL・画像のみ更新できます。",
    );
    expect(nameInput.disabled).toBe(true);
    expect(categorySelect.disabled).toBe(true);
    expect(priceInput.disabled).toBe(true);
    expect(
      container.querySelector("#structured-size-shoulder_width"),
    ).toBeNull();
    expect(salePriceInput.disabled).toBe(false);
    expect(saleEndsAtDateInput.disabled).toBe(false);
    expect(saleEndsAtTimeInput.disabled).toBe(false);
    expect(saleEndsAtDateInput.value).toBe("2026-03-31");
    expect(saleEndsAtTimeInput.value).toBe("18:00");
    expect(purchaseUrlInput.disabled).toBe(false);
    expect(wantedReasonTextarea.disabled).toBe(false);
    expect(memoTextarea.disabled).toBe(false);

    await act(async () => {
      setNativeValue(salePriceInput, "9900");
      setNativeValue(saleEndsAtDateInput, "2026-04-30");
      setNativeValue(saleEndsAtTimeInput, "12:00");
      setNativeValue(purchaseUrlInput, "https://example.test/purchased");
      setNativeValue(memoTextarea, "更新メモ");
      setNativeValue(wantedReasonTextarea, "更新理由");
    });

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, requestInit] = fetchMock.mock.calls[1];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload).toEqual({
      priority: "medium",
      release_date: null,
      sale_price: 9900,
      sale_ends_at: "2026-04-30T12:00",
      discount_ends_at: null,
      purchase_url: "https://example.test/purchased",
      memo: "更新メモ",
      wanted_reason: "更新理由",
    });
    expect(payload.name).toBeUndefined();
    expect(payload.category_id).toBeUndefined();
    expect(payload.colors).toBeUndefined();
    expect(payload.materials).toBeUndefined();
  });

  it("サーバーエラーの raw message を保存エラーとして表示しない", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message:
          "SQLSTATE[42S22]: Column not found: 1054 Unknown column custom_label",
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setNativeValue(nameInput, "Sample Candidate");
      await setCategorySelection("outerwear", "outerwear_coat");
      checkboxes[1]?.click();
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain(
      "保存に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("422 validation error は field error として表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "The given data was invalid.",
        errors: { name: ["名前を入力してください。"] },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setNativeValue(nameInput, "Sample Candidate");
      await setCategorySelection("outerwear", "outerwear_coat");
      checkboxes[1]?.click();
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("入力内容を確認してください。");
    expect(container.textContent).toContain("名前を入力してください。");
  });

  it("画像エラーの raw message を表示しない", async () => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:image-preview"),
      revokeObjectURL: vi.fn(),
    });
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ purchaseCandidate: { id: 7 } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message:
            "SQLSTATE[HY000]: General error: 1364 Field image has no default value",
        }),
      });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const fileInput = container.querySelector("#images") as HTMLInputElement;
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setNativeValue(nameInput, "Image Candidate");
      await setCategorySelection("outerwear", "outerwear_coat");
      checkboxes[1]?.click();
      Object.defineProperty(fileInput, "files", {
        value: [new File(["image"], "sample.png", { type: "image/png" })],
        configurable: true,
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain(
      "画像の追加に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("画像エラーの raw message を表示しない", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          purchaseCandidate: {
            id: 12,
            status: "considering",
            priority: "medium",
            name: "Image Candidate",
            category_id: "outerwear_coat",
            brand_name: null,
            price: null,
            sale_price: null,
            sale_ends_at: null,
            purchase_url: null,
            memo: null,
            wanted_reason: null,
            size_gender: null,
            size_label: null,
            size_note: null,
            size_details: null,
            is_rain_ok: false,
            converted_item_id: null,
            converted_at: null,
            colors: [
              {
                role: "main",
                mode: "preset",
                value: "black",
                hex: "#111827",
                label: "Black",
                custom_label: null,
              },
            ],
            seasons: [],
            tpos: [],
            materials: [],
            images: [
              {
                id: 5,
                url: "/storage/sample.png",
                original_filename: "sample.png",
                file_size: 100,
                sort_order: 1,
                is_primary: true,
              },
            ],
            created_at: "2026-04-01T00:00:00+09:00",
            updated_at: "2026-04-01T00:00:00+09:00",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "SQLSTATE[HY000]: delete failed" }),
      });

    await renderForm({ mode: "edit", candidateId: "12" });

    const imageDeleteButton = container.querySelector("article button");
    expect(imageDeleteButton).not.toBeNull();

    await act(async () => {
      imageDeleteButton!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain(
      "画像の削除に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("shape 未解決では fallback を出し、分類解決後に structured fields を表示する", async () => {
    await renderForm();

    await openSizeDetails();

    expect(
      container.querySelector("#structured-size-shoulder_width"),
    ).toBeNull();
    expect(container.textContent).toContain(
      "現在のカテゴリと形に対応する固定実寸はありません。必要なら自由項目を追加してください。",
    );

    await setCategorySelection("tops", "tops_tshirt_cutsew");

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      ),
    ).not.toBeNull();
  });
  it("折りたたんでも structured 値を保持し、再展開すると再表示する", async () => {
    await renderForm();

    await setCategorySelection("tops", "tops_tshirt_cutsew");
    await openSizeDetails();

    const shoulderWidthInput = container.querySelector<HTMLInputElement>(
      "#structured-size-shoulder_width",
    );
    expect(shoulderWidthInput).not.toBeNull();

    await act(async () => {
      setNativeValue(shoulderWidthInput!, "42.5");
    });

    await collapseSizeDetails();
    expect(container.textContent).toContain("実寸を入力");
    expect(container.textContent).not.toContain("閉じる");

    await openSizeDetails();

    expect(
      container.querySelector<HTMLInputElement>(
        "#structured-size-shoulder_width",
      )?.value,
    ).toBe("42.5");
  });

  it("skirts spec は未入力でも保存でき、送信時は null のままにする", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 12,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setNativeValue(nameInput, "プリーツスカート候補");
      await setCategorySelection("skirts", "skirts_skirt");
      customMainCheckbox.click();
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.spec).toBeNull();
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
  });

  it("skirts spec を入力すると purchase candidate payload に含まれる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        purchaseCandidate: {
          id: 12,
        },
      }),
    });

    await renderForm();

    const nameInput = container.querySelector("#name") as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      setNativeValue(nameInput, "プリーツスカート候補");
      await setCategorySelection("skirts", "skirts_skirt");
      customMainCheckbox.click();
      setNativeValue(
        container.querySelector("#spec-skirt-length-type") as HTMLSelectElement,
        "midi",
      );
      setNativeValue(
        container.querySelector(
          "#spec-skirt-material-type",
        ) as HTMLSelectElement,
        "lace",
      );
      setNativeValue(
        container.querySelector("#spec-skirt-design-type") as HTMLSelectElement,
        "pleats",
      );
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.spec).toEqual({
      skirt: {
        length_type: "midi",
        material_type: "lace",
        design_type: "pleats",
      },
    });
  });

  it("skirts の複製ドラフトで skirts spec を読み込める", async () => {
    searchParamsValue = "source=duplicate";
    window.sessionStorage.setItem(
      "purchase-candidate-duplicate-payload",
      JSON.stringify({
        status: "considering",
        priority: "high",
        name: "プリーツスカート",
        category_id: "skirts_skirt",
        spec: {
          skirt: {
            length_type: "midi",
            material_type: "lace",
            design_type: "pleats",
          },
        },
        brand_name: "Sample Brand",
        price: 14800,
        sale_price: null,
        sale_ends_at: null,
        purchase_url: null,
        memo: "",
        wanted_reason: "",
        size_gender: "",
        size_label: "",
        size_note: "",
        size_details: null,
        is_rain_ok: false,
        colors: [],
        seasons: [],
        tpos: [],
        materials: [],
        images: [],
      }),
    );

    await renderForm();

    expect(getCategoryGroupSelect().value).toBe("skirts");
    expect(getCategorySelect().value).toBe("skirts_skirt");
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-length-type")
        ?.value,
    ).toBe("midi");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-material-type")
        ?.value,
    ).toBe("lace");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-design-type")
        ?.value,
    ).toBe("pleats");
  });

  it("skirts の色違い追加ドラフトで skirts spec を読み込める", async () => {
    searchParamsValue = "source=color-variant";
    window.sessionStorage.setItem(
      "purchase-candidate-duplicate-payload",
      JSON.stringify({
        status: "considering",
        priority: "high",
        name: "プリーツスカート",
        category_id: "skirts_skirt",
        variant_source_candidate_id: 10,
        spec: {
          skirt: {
            length_type: "midi",
            material_type: "lace",
            design_type: "pleats",
          },
        },
        brand_name: "Sample Brand",
        price: 14800,
        sale_price: null,
        sale_ends_at: null,
        purchase_url: null,
        memo: "",
        wanted_reason: "",
        size_gender: "",
        size_label: "",
        size_note: "",
        size_details: null,
        is_rain_ok: false,
        colors: [],
        seasons: [],
        tpos: [],
        materials: [],
        images: [],
      }),
    );

    await renderForm();

    expect(getCategoryGroupSelect().value).toBe("skirts");
    expect(getCategorySelect().value).toBe("skirts_skirt");
    expect(container.querySelector("#spec-tops-shape")).toBeNull();
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-length-type")
        ?.value,
    ).toBe("midi");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-material-type")
        ?.value,
    ).toBe("lace");
    expect(
      container.querySelector<HTMLSelectElement>("#spec-skirt-design-type")
        ?.value,
    ).toBe("pleats");
  });
});
