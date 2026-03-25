// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
};
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/categories", () => ({
  fetchCategoryGroups: () => fetchCategoryGroupsMock(),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: () => fetchCategoryVisibilitySettingsMock(),
}));

describe("PurchaseCandidateForm", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.stubGlobal("fetch", fetchMock);

    fetchCategoryGroupsMock.mockResolvedValue([
      {
        id: "outer",
        name: "アウター",
        sortOrder: 10,
        categories: [{ id: "outer_coat", groupId: "outer", name: "コート", sortOrder: 10 }],
      },
      {
        id: "tops",
        name: "トップス",
        sortOrder: 20,
        categories: [{ id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 }],
      },
    ]);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["outer_coat", "tops_tshirt"],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  async function renderForm() {
    const { default: PurchaseCandidateForm } = await import("./purchase-candidate-form");

    await act(async () => {
      root.render(React.createElement(PurchaseCandidateForm, { mode: "create" }));
    });

    await act(async () => {
      await Promise.resolve();
    });
  }

  function setNativeValue(
    element: HTMLInputElement | HTMLSelectElement,
    value: string,
  ) {
    const prototype = element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  it("日本語ラベルと必須表示を描画できる", async () => {
    await renderForm();

    expect(container.textContent).toContain("ステータス");
    expect(container.textContent).toContain("優先度");
    expect(container.textContent).toContain("サイズ区分");
    expect(container.textContent).toContain("必須");
    expect(container.textContent).not.toContain("size_gender");
    expect(container.textContent).not.toContain("priority");
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
    const categorySelect = container.querySelector("#category_id") as HTMLSelectElement;
    const salePriceInput = container.querySelector("#sale_price") as HTMLInputElement;
    const saleEndsAtInput = container.querySelector("#sale_ends_at") as HTMLInputElement;
    const customMainCheckbox = container.querySelector('input[aria-label="メインカラーをカラーコードで入力"]') as HTMLInputElement;

    await act(async () => {
      setNativeValue(nameInput, "レインコート候補");
      setNativeValue(categorySelect, "outer_coat");
      setNativeValue(salePriceInput, "12800");
      setNativeValue(saleEndsAtInput, "2026-03-31T18:00");
      customMainCheckbox.click();
    });

    const mainColorCodeInput = container.querySelector('input[aria-label="メインカラーコード"]') as HTMLInputElement;

    await act(async () => {
      setNativeValue(mainColorCodeInput, "#112233");
    });

    const form = container.querySelector("form") as HTMLFormElement;

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
    expect(payload.sale_price).toBe(12800);
    expect(payload.sale_ends_at).toBe("2026-03-31T18:00");
  });

  it("季節のオールを個別季節と排他的に切り替える", async () => {
    await renderForm();

    const seasonButtons = Array.from(container.querySelectorAll('button[aria-pressed]'));
    const springButton = seasonButtons.find((button) => button.textContent === "春") as HTMLButtonElement;
    const summerButton = seasonButtons.find((button) => button.textContent === "夏") as HTMLButtonElement;
    const allSeasonButton = seasonButtons.find((button) => button.textContent === "オール") as HTMLButtonElement;

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
});
