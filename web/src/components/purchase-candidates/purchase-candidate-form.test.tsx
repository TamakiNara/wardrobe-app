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
            name: "コート",
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
        ],
      },
    ]);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["outerwear_coat", "tops_tshirt_cutsew"],
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

  it("日本語ラベルと必須表示を描画できる", async () => {
    await renderForm();

    const sectionTitles = [
      "基本情報",
      "購入情報",
      "色 / 季節 / TPO",
      "サイズ・属性",
      "素材・混率",
      "メモ",
      "画像",
    ];

    const renderedSectionTitles = Array.from(
      container.querySelectorAll(
        "form > section.rounded-2xl.border.border-gray-200.bg-white h2",
      ),
    ).map((heading) => heading.textContent);
    expect(renderedSectionTitles).toEqual(sectionTitles);

    expect(container.textContent).toContain("ステータス");
    expect(container.textContent).toContain("優先度");
    expect(container.textContent).toContain("サイズ区分");
    expect(container.textContent).toContain("必須");
    expect(container.textContent).not.toContain("size_gender");
    expect(container.textContent).not.toContain("priority");

    const sectionCards = container.querySelectorAll(
      "form > section.rounded-2xl.border.border-gray-200.bg-white",
    );
    expect(sectionCards).toHaveLength(7);
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
    const categorySelect = container.querySelector(
      "#category_id",
    ) as HTMLSelectElement;
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
      setNativeValue(categorySelect, "outerwear_coat");
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
    const categorySelect = container.querySelector(
      "#category_id",
    ) as HTMLSelectElement;
    const salePriceInput = container.querySelector(
      "#sale_price",
    ) as HTMLInputElement;
    const saleEndsAtInput = container.querySelector(
      "#sale_ends_at",
    ) as HTMLInputElement;
    const customMainCheckbox = container.querySelector(
      'input[aria-label="メインカラーをカラーコードで入力"]',
    ) as HTMLInputElement;
    const sizeNoteInput = container.querySelector(
      "#size_note",
    ) as HTMLTextAreaElement;

    await act(async () => {
      setNativeValue(nameInput, "レインコート候補");
      setNativeValue(categorySelect, "tops_tshirt_cutsew");
      setNativeValue(salePriceInput, "12800");
      setNativeValue(saleEndsAtInput, "2026-03-31T00:00");
      setNativeValue(saleEndsAtInput, "2026-03-31T18:00");
      setNativeValue(sizeNoteInput, "厚手対応");
      customMainCheckbox.click();
    });

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

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
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
  });

  it("sale_ends_at の日付だけの入力は時刻を 00:00 に補正する", async () => {
    const { normalizeSaleEndsAtInputValue } =
      await import("./purchase-candidate-form");

    expect(normalizeSaleEndsAtInputValue("2026-03-31", "")).toBe(
      "2026-03-31T00:00",
    );
    expect(normalizeSaleEndsAtInputValue("2026-03-31T18:00", "")).toBe(
      "2026-03-31T00:00",
    );
    expect(
      normalizeSaleEndsAtInputValue("2026-03-31T18:00", "2026-03-31T00:00"),
    ).toBe("2026-03-31T18:00");
    expect(normalizeSaleEndsAtInputValue("", "2026-03-31T00:00")).toBe("");
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
    const categorySelect = container.querySelector(
      "#category_id",
    ) as HTMLSelectElement;
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
      setNativeValue(categorySelect, "tops_tshirt_cutsew");
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
      setNativeValue(categorySelect, "tops_tshirt_cutsew");
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
        name: "春コート（コピー）",
        category_id: "outerwear_coat",
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
      "春コート（コピー）",
    );
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

    expect(payload.duplicate_images).toEqual([{ source_image_id: 7 }]);
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
            mode: "preset",
            value: "navy",
            hex: "#1F3A5F",
            label: "春コート",
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

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.variant_source_candidate_id).toBe(10);
    expect(payload.name).toBe("春コート");
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
    const categorySelect = container.querySelector(
      "#category_id",
    ) as HTMLSelectElement;
    const priceInput = container.querySelector("#price") as HTMLInputElement;
    const salePriceInput = container.querySelector(
      "#sale_price",
    ) as HTMLInputElement;
    const saleEndsAtInput = container.querySelector(
      "#sale_ends_at",
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
      "購入済みの購入検討では、メモ・欲しい理由・優先度・セール情報・購入 URL・画像のみ更新できます。",
    );
    expect(nameInput.disabled).toBe(true);
    expect(categorySelect.disabled).toBe(true);
    expect(priceInput.disabled).toBe(true);
    expect(
      container.querySelector("#structured-size-shoulder_width"),
    ).toBeNull();
    expect(salePriceInput.disabled).toBe(false);
    expect(saleEndsAtInput.disabled).toBe(false);
    expect(saleEndsAtInput.value).toBe("2026-03-31T18:00");
    expect(purchaseUrlInput.disabled).toBe(false);
    expect(wantedReasonTextarea.disabled).toBe(false);
    expect(memoTextarea.disabled).toBe(false);

    await act(async () => {
      setNativeValue(salePriceInput, "9900");
      setNativeValue(saleEndsAtInput, "2026-04-30T12:00");
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
      sale_price: 9900,
      sale_ends_at: "2026-04-30T12:00",
      purchase_url: "https://example.test/purchased",
      memo: "更新メモ",
      wanted_reason: "更新理由",
    });
    expect(payload.name).toBeUndefined();
    expect(payload.category_id).toBeUndefined();
    expect(payload.colors).toBeUndefined();
    expect(payload.materials).toBeUndefined();
  });
});
