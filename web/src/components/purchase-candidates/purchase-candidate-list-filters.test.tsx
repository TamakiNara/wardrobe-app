// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/purchase-candidates",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

const defaultProps = {
  keyword: "",
  status: "",
  priority: "",
  category: "",
  subcategory: "",
  brand: "",
  sort: "",
  itemCount: 2,
  totalCount: 10,
  categoryOptions: [
    { value: "outerwear", label: "ジャケット・アウター" },
    { value: "tops", label: "トップス" },
    { value: "bags", label: "バッグ" },
  ],
  brandOptions: [
    {
      id: 1,
      name: "UNIQLO",
      kana: "ゆにくろ",
      is_active: true,
      updated_at: "2026-04-17T10:00:00+09:00",
    },
  ],
};

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

describe("PurchaseCandidateListFilters", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    searchParamsValue = "";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("keyword はディレイ後に URL へ反映し、page を落とす", async () => {
    searchParamsValue = "keyword=old&page=3";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, {
          ...defaultProps,
          keyword: "old",
        }),
      );
      await waitForEffects();
    });

    const keywordInput = container.querySelector<HTMLInputElement>(
      "#purchase-candidate-keyword",
    );

    await act(async () => {
      setInputValue(keywordInput!, "coat");
      await waitForEffects();
    });

    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/purchase-candidates?keyword=coat",
      { scroll: false },
    );
  });

  it("brand はディレイ後に URL へ反映し、入力途中では更新しない", async () => {
    searchParamsValue = "page=2";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, defaultProps),
      );
      await waitForEffects();
    });

    const brandInput = container.querySelector<HTMLInputElement>(
      "#purchase-candidate-brand",
    );

    await act(async () => {
      setInputValue(brandInput!, "UNIQLO");
      await vi.advanceTimersByTimeAsync(299);
    });

    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/purchase-candidates?brand=UNIQLO",
      { scroll: false },
    );
  });

  it("select 系は即時に URL へ反映し、page を落とす", async () => {
    searchParamsValue = "page=4";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, defaultProps),
      );
      await waitForEffects();
    });

    const statusSelect = container.querySelector<HTMLSelectElement>(
      "#purchase-candidate-status",
    );

    await act(async () => {
      statusSelect!.value = "considering";
      statusSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/purchase-candidates?status=considering",
      { scroll: false },
    );
  });

  it("category 変更時は subcategory と page を落とす", async () => {
    searchParamsValue = "category=outerwear&subcategory=coat&page=3";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, {
          ...defaultProps,
          category: "outerwear",
          subcategory: "coat",
        }),
      );
      await waitForEffects();
    });

    const categorySelect = container.querySelector<HTMLSelectElement>(
      "#purchase-candidate-category",
    );

    await act(async () => {
      categorySelect!.value = "tops";
      categorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/purchase-candidates?category=tops",
      { scroll: false },
    );
  });

  it("subcategory は category 選択後だけ有効になり、current 値で URL に反映する", async () => {
    searchParamsValue = "category=bags&page=2";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, {
          ...defaultProps,
          category: "bags",
        }),
      );
      await waitForEffects();
    });

    const subcategorySelect = container.querySelector<HTMLSelectElement>(
      "#purchase-candidate-subcategory",
    );

    expect(subcategorySelect?.disabled).toBe(false);
    expect(
      Array.from(subcategorySelect?.options ?? []).map(
        (option) => option.value,
      ),
    ).toContain("rucksack");
    expect(
      subcategorySelect?.options[subcategorySelect.options.length - 1]?.value,
    ).toBe("other");

    await act(async () => {
      subcategorySelect!.value = "rucksack";
      subcategorySelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/purchase-candidates?category=bags&subcategory=rucksack",
      { scroll: false },
    );
  });

  it("個別解除と全解除は現在の URL に対して動作する", async () => {
    searchParamsValue = "brand=UNIQLO&page=2";
    const { default: PurchaseCandidateListFilters } =
      await import("./purchase-candidate-list-filters");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateListFilters, {
          ...defaultProps,
          brand: "UNIQLO",
        }),
      );
      await waitForEffects();
    });

    const brandClearButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent === "解除");

    await act(async () => {
      brandClearButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/purchase-candidates", {
      scroll: false,
    });

    replaceMock.mockClear();

    const clearAllButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent === "条件をクリア");

    await act(async () => {
      clearAllButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/purchase-candidates", {
      scroll: false,
    });
  });
});
