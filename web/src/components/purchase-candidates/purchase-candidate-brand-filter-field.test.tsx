// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserBrandRecord } from "@/types/settings";

describe("PurchaseCandidateBrandFilterField", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  const brands: UserBrandRecord[] = [
    {
      id: 1,
      name: "UNIQLO",
      kana: "ゆにくろ",
      is_active: true,
      updated_at: "2026-04-03T10:00:00+09:00",
    },
    {
      id: 2,
      name: "GLOBAL WORK",
      kana: "ぐろーばるわーく",
      is_active: true,
      updated_at: "2026-04-03T10:00:00+09:00",
    },
  ];

  beforeEach(() => {
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
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  async function renderField(defaultValue = "") {
    const { default: PurchaseCandidateBrandFilterField } =
      await import("./purchase-candidate-brand-filter-field");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateBrandFilterField, {
          inputId: "brand",
          name: "brand",
          defaultValue,
          brands,
        }),
      );
    });
  }

  function setInputValue(input: HTMLInputElement, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  it("フォーカス時にブランド候補を表示できる", async () => {
    await renderField();

    const input = container.querySelector<HTMLInputElement>("#brand");
    expect(input).not.toBeNull();

    await act(async () => {
      input!.focus();
    });

    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).toContain("GLOBAL WORK");
  });

  it("候補選択と自由入力を両立できる", async () => {
    await renderField();

    const input = container.querySelector<HTMLInputElement>("#brand");

    await act(async () => {
      input!.focus();
      setInputValue(input!, "UNI");
    });

    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).not.toContain("GLOBAL WORK");

    const suggestionButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("UNIQLO"));
    expect(suggestionButton).not.toBeUndefined();

    await act(async () => {
      suggestionButton!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });

    expect(
      (container.querySelector("#brand") as HTMLInputElement | null)?.value,
    ).toBe("UNIQLO");

    await act(async () => {
      setInputValue(input!, "NoBrand");
    });

    expect(input?.value).toBe("NoBrand");
    expect(container.textContent).toContain(
      "一致するブランド候補はありません。",
    );
  });

  it("defaultValue を初期値として表示できる", async () => {
    await renderField("UNIQLO");

    const input = container.querySelector<HTMLInputElement>("#brand");
    expect(input?.value).toBe("UNIQLO");
  });

  it("入力変更と候補選択を親へ通知できる", async () => {
    const onValueChange = vi.fn();
    const { default: PurchaseCandidateBrandFilterField } =
      await import("./purchase-candidate-brand-filter-field");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateBrandFilterField, {
          inputId: "brand",
          name: "brand",
          brands,
          onValueChange,
        }),
      );
    });

    const input = container.querySelector<HTMLInputElement>("#brand");

    await act(async () => {
      setInputValue(input!, "UNI");
    });

    expect(onValueChange).toHaveBeenCalledWith("UNI");

    const suggestionButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("UNIQLO"));

    await act(async () => {
      suggestionButton!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });

    expect(onValueChange).toHaveBeenLastCalledWith("UNIQLO");
  });
});
