// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
const fetchUserBrandsMock = vi.fn();
const createUserBrandMock = vi.fn();
const updateUserBrandMock = vi.fn();

function buildBrand(
  overrides: Partial<{
    id: number;
    name: string;
    kana: string | null;
    is_active: boolean;
    updated_at: string;
  }> = {},
) {
  return {
    id: 1,
    name: "UNIQLO",
    kana: "ゆにくろ",
    is_active: true,
    updated_at: "2026-03-25T10:30:00+09:00",
    ...overrides,
  };
}

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/settings", () => ({
  createUserBrand: createUserBrandMock,
  fetchUserBrands: fetchUserBrandsMock,
  updateUserBrand: updateUserBrandMock,
}));

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

describe("SettingsBrandsPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("ブランド候補一覧を表示できる", async () => {
    fetchUserBrandsMock.mockResolvedValue({
      brands: [
        buildBrand({ id: 2, name: "GU", kana: "じーゆー", is_active: false }),
        buildBrand({
          id: 1,
          name: "UNIQLO",
          kana: "ゆにくろ",
          is_active: true,
        }),
      ],
    });

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("登録済みブランド候補");
    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).toContain("ゆにくろ");
    expect(container.textContent).not.toContain("GU");
    expect(container.textContent).toContain("更新日時:");
    expect(container.textContent).toContain("無効候補も表示する");
  });

  it("ブランド候補を追加できる", async () => {
    fetchUserBrandsMock
      .mockResolvedValueOnce({ brands: [] })
      .mockResolvedValueOnce({
        brands: [buildBrand()],
      });
    createUserBrandMock.mockResolvedValue({
      message: "created",
      brand: buildBrand(),
    });

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    const nameInput =
      container.querySelector<HTMLInputElement>("#new-brand-name");
    const kanaInput =
      container.querySelector<HTMLInputElement>("#new-brand-kana");
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "追加する");

    await act(async () => {
      setInputValue(nameInput!, "UNIQLO");
      setInputValue(kanaInput!, "ゆにくろ");
      addButton!.click();
      await waitForEffects();
    });

    expect(createUserBrandMock).toHaveBeenCalledWith({
      name: "UNIQLO",
      kana: "ゆにくろ",
      is_active: true,
    });
    expect(container.textContent).toContain("ブランド候補を追加しました。");
    expect(container.textContent).toContain("UNIQLO");
  });

  it("有効 / 無効を切り替えられる", async () => {
    fetchUserBrandsMock
      .mockResolvedValueOnce({
        brands: [buildBrand()],
      })
      .mockResolvedValueOnce({
        brands: [buildBrand({ is_active: false })],
      });
    updateUserBrandMock.mockResolvedValue({
      message: "updated",
      brand: buildBrand({ is_active: false }),
    });

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    const toggleButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "無効にする");

    await act(async () => {
      toggleButton!.click();
      await waitForEffects();
    });

    expect(updateUserBrandMock).toHaveBeenCalledWith(1, {
      is_active: false,
    });
    expect(container.textContent).toContain("ブランド候補を無効にしました。");
  });
});
