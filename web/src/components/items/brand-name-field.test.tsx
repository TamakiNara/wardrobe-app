// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchUserBrandsMock = vi.fn();

vi.mock("@/lib/api/settings", () => ({
  fetchUserBrands: fetchUserBrandsMock,
}));

describe("BrandNameField", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let brandName = "";
  let saveAsCandidate = false;

  function renderField() {
    return import("./brand-name-field").then(({ default: BrandNameField }) => {
      const rerender = () => {
        root.render(
          React.createElement(BrandNameField, {
            inputId: "brand-name",
            value: brandName,
            onChange: (next: string) => {
              brandName = next;
              rerender();
            },
            saveAsCandidate,
            onSaveAsCandidateChange: (next: boolean) => {
              saveAsCandidate = next;
              rerender();
            },
          }),
        );
      };

      rerender();
    });
  }

  async function waitForEffects() {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
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

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    brandName = "";
    saveAsCandidate = false;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("name 検索で候補を表示し、選択時にブランド名を入れる", async () => {
    fetchUserBrandsMock.mockResolvedValue({
      brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
    });

    await act(async () => {
      await renderField();
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>("#brand-name");
    expect(input).not.toBeNull();

    await act(async () => {
      input!.focus();
      setInputValue(input!, "UNI");
      await waitForEffects();
    });

    expect(fetchUserBrandsMock.mock.calls).toContainEqual(["UNI", true]);
    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).toContain("ゆにくろ");

    const suggestionButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("UNIQLO"));
    expect(suggestionButton).not.toBeUndefined();

    await act(async () => {
      suggestionButton!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      (container.querySelector("#brand-name") as HTMLInputElement | null)
        ?.value,
    ).toBe("UNIQLO");
  });

  it("kana 検索でも候補に当たり、候補がなくても自由入力を妨げない", async () => {
    fetchUserBrandsMock.mockResolvedValueOnce({
      brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
    });
    fetchUserBrandsMock.mockResolvedValueOnce({ brands: [] });

    await act(async () => {
      await renderField();
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>("#brand-name");

    await act(async () => {
      input!.focus();
      setInputValue(input!, "ゆに");
      await waitForEffects();
    });

    expect(fetchUserBrandsMock.mock.calls).toContainEqual(["ゆに", true]);
    expect(container.textContent).toContain("UNIQLO");

    await act(async () => {
      setInputValue(input!, "NoBrand");
      await waitForEffects();
    });

    expect(fetchUserBrandsMock.mock.calls).toContainEqual(["NoBrand", true]);
    expect(
      (container.querySelector("#brand-name") as HTMLInputElement | null)
        ?.value,
    ).toBe("NoBrand");
    expect(container.textContent).toContain(
      "一致するブランド候補はありません。",
    );
  });
});
