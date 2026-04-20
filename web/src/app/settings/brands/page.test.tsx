// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";

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

    expect(container.textContent).toContain("ブランド候補設定");
    expect(container.textContent).toContain(
      "アイテム入力で使うブランド候補を管理できます。既存 item のブランド名は自動更新しません。",
    );
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

    expect(container.textContent).toContain("ブランド候補設定");
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

    expect(container.textContent).toContain("ブランド候補設定");
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

  it("422 validation では具体的な項目エラーを表示する", async () => {
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
    createUserBrandMock.mockRejectedValue(
      new ApiClientError(422, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
        errors: {
          name: ["ブランド名を入力してください。"],
        },
      }),
    );

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    const nameInput =
      container.querySelector<HTMLInputElement>("#new-brand-name");
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "追加する");

    await act(async () => {
      setInputValue(nameInput!, "");
      addButton!.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("ブランド名を入力してください。");
    expect(container.textContent).not.toContain(
      "ブランド設定の保存に失敗しました。時間をおいて再度お試しください。",
    );
  });

  it("500 系の追加失敗でも raw message を表示しない", async () => {
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
    createUserBrandMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    const nameInput =
      container.querySelector<HTMLInputElement>("#new-brand-name");
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "追加する");

    await act(async () => {
      setInputValue(nameInput!, "UNIQLO");
      addButton!.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "ブランド設定の保存に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("一覧取得失敗でも raw message を表示しない", async () => {
    fetchUserBrandsMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "ブランド候補を読み込めませんでした。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("更新失敗でも raw message を表示しない", async () => {
    fetchUserBrandsMock.mockResolvedValue({ brands: [buildBrand()] });
    updateUserBrandMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsBrandsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsBrandsPage));
      await waitForEffects();
    });

    const editButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "編集");

    await act(async () => {
      editButton!.click();
      await waitForEffects();
    });

    const updateButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "更新する");

    await act(async () => {
      updateButton!.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "ブランド候補の更新に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});
