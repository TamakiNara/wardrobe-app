// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";
import type { ItemRecord } from "@/types/items";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
let searchParamsValue = "";
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const updateCategoryVisibilitySettingsMock = vi.fn();
const fetchItemsMock = vi.fn();
const fetchUserBrandsMock = vi.fn();
const createUserBrandMock = vi.fn();
const updateUserBrandMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/api/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/categories")>(
    "@/lib/api/categories",
  );

  return {
    ...actual,
    fetchCategoryGroups: fetchCategoryGroupsMock,
  };
});

vi.mock("@/lib/api/items", () => ({
  fetchItems: fetchItemsMock,
}));

vi.mock("@/lib/api/settings", () => ({
  createUserBrand: createUserBrandMock,
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
  fetchUserBrands: fetchUserBrandsMock,
  updateUserBrand: updateUserBrandMock,
  updateCategoryVisibilitySettings: updateCategoryVisibilitySettingsMock,
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 },
      { id: "tops_shirt", groupId: "tops", name: "シャツ / ブラウス", sortOrder: 20 },
    ],
  },
];

const sampleItems: ItemRecord[] = [
  {
    id: 1,
    name: "白T",
    status: "active",
    category: "tops",
    shape: "tshirt",
    colors: [],
    seasons: [],
    tpos: [],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function getSaveButtons(container: HTMLDivElement) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).filter(
    (button) =>
      button.textContent === "表示設定を保存" ||
      button.textContent === "保存してはじめる" ||
      button.textContent === "保存中..." ||
      button.textContent === "変更なし",
  );
}

describe("SettingsPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchItemsMock.mockResolvedValue(sampleItems);
    fetchUserBrandsMock.mockResolvedValue({ brands: [] });
    searchParamsValue = "";
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定の初期表示を描画できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("1 / 2");

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
    expect(updateCategoryVisibilitySettingsMock).not.toHaveBeenCalled();
  });

  it("未保存変更があると保存ボタンが有効になり、保存後に戻る", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(getSaveButtons(container)).toHaveLength(2);
    expect(getSaveButtons(container).every((button) => button.disabled)).toBe(true);

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    await act(async () => {
      (checkboxes[1] as HTMLInputElement).click();
      await waitForEffects();
    });

    expect(getSaveButtons(container).every((button) => !button.disabled)).toBe(true);

    await act(async () => {
      getSaveButtons(container)[0].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).toHaveBeenCalledWith({
      visibleCategoryIds: ["tops_shirt", "tops_tshirt"],
    });
    expect(getSaveButtons(container).every((button) => button.disabled)).toBe(true);
  });

  it("未保存変更があるとブラウザ離脱時に警告する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    await act(async () => {
      (checkboxes[1] as HTMLInputElement).click();
      await waitForEffects();
    });

    const event = new Event("beforeunload", { cancelable: true });
    let returnValue: string | undefined = undefined;
    Object.defineProperty(event, "returnValue", {
      get() {
        return returnValue;
      },
      set(value) {
        returnValue = value;
      },
      configurable: true,
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(returnValue).toBe("");
  });

  it("すべてOFFの前に件数付き確認ダイアログを表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const groupButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.border"),
    );
    expect(groupButtons).toHaveLength(2);

    await act(async () => {
      groupButtons[1].click();
      await waitForEffects();
    });

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock.mock.calls[0][0]).toContain("トップスをすべてOFFにしますか？");
    expect(confirmMock.mock.calls[0][0]).toContain("現在1アイテム");
    expect(confirmMock.mock.calls[0][0]).toContain("この大分類");
    expect(confirmMock.mock.calls[0][0]).toContain("非表示にしてもデータは削除されません。");
    expect(getSaveButtons(container).every((button) => !button.disabled)).toBe(true);

    confirmMock.mockRestore();
  });

  it("個別カテゴリをOFFにするときも件数付き確認ダイアログを表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt", "tops_shirt"],
    });

    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    await act(async () => {
      (checkboxes[0] as HTMLInputElement).click();
      await waitForEffects();
    });

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock.mock.calls[0][0]).toContain("TシャツをOFFにしますか？");
    expect(confirmMock.mock.calls[0][0]).toContain("現在1アイテム");
    expect(confirmMock.mock.calls[0][0]).toContain("このカテゴリ");
    expect(getSaveButtons(container).every((button) => !button.disabled)).toBe(true);

    confirmMock.mockRestore();
  });

  it("すべてONでは確認ダイアログを表示しない", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: [],
    });

    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const groupButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.border"),
    );

    await act(async () => {
      groupButtons[0].click();
      await waitForEffects();
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(getSaveButtons(container).every((button) => !button.disabled)).toBe(true);

    confirmMock.mockRestore();
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    const { ApiClientError } = await import("@/lib/api/client");

    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockRejectedValue(
      new ApiClientError(401, { message: "Unauthenticated." }),
    );

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("読み込み失敗時は再試行文言を表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockRejectedValue(new Error("network"));

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "カテゴリ設定を読み込めませんでした。時間をおいて再度お試しください。",
    );
  });

  it("保存失敗時は再試行文言を表示する", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    updateCategoryVisibilitySettingsMock.mockRejectedValue(new Error("network"));

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    await act(async () => {
      (checkboxes[1] as HTMLInputElement).click();
      await waitForEffects();
    });

    await act(async () => {
      getSaveButtons(container)[0].click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "設定を保存できませんでした。時間をおいて再度お試しください。",
    );
  });

  it("custom onboarding では初期状態で保存でき、保存後にホームへ進む", async () => {
    searchParamsValue = "mode=onboarding&preset=custom";
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_shirt", "tops_tshirt"],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);

    const saveButtons = getSaveButtons(container);
    expect(saveButtons).toHaveLength(2);
    expect(saveButtons.every((button) => !button.disabled)).toBe(true);
    expect(saveButtons[0].textContent).toBe("保存してはじめる");

    await act(async () => {
      saveButtons[0].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).toHaveBeenCalledWith({
      visibleCategoryIds: ["tops_shirt", "tops_tshirt"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("ブランド候補一覧を表示できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    fetchUserBrandsMock.mockResolvedValue({
      brands: [
        { id: 2, name: "GU", kana: "じーゆー", is_active: false },
        { id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true },
      ],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("ブランド候補設定");
    expect(container.textContent).toContain("UNIQLO");
    expect(container.textContent).toContain("ゆにくろ");
    expect(container.textContent).toContain("GU");
    expect(container.textContent).toContain("無効");
  });

  it("ブランド候補を追加できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    fetchUserBrandsMock
      .mockResolvedValueOnce({ brands: [] })
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
      });
    createUserBrandMock.mockResolvedValue({
      message: "created",
      brand: { id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true },
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const nameInput = container.querySelector<HTMLInputElement>("#new-brand-name");
    const kanaInput = container.querySelector<HTMLInputElement>("#new-brand-kana");
    const addButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "追加する",
    );

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

  it("ブランド名と読み仮名を更新できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    fetchUserBrandsMock
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
      })
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "GU", kana: "じーゆー", is_active: true }],
      });
    updateUserBrandMock.mockResolvedValue({
      message: "updated",
      brand: { id: 1, name: "GU", kana: "じーゆー", is_active: true },
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const editButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "編集する",
    );

    await act(async () => {
      editButton!.click();
      await waitForEffects();
    });

    const nameInput = container.querySelector<HTMLInputElement>("#brand-name-1");
    const kanaInput = container.querySelector<HTMLInputElement>("#brand-kana-1");
    const updateButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "更新する",
    );

    await act(async () => {
      setInputValue(nameInput!, "GU");
      setInputValue(kanaInput!, "じーゆー");
      updateButton!.click();
      await waitForEffects();
    });

    expect(updateUserBrandMock).toHaveBeenCalledWith(1, {
      name: "GU",
      kana: "じーゆー",
      is_active: true,
    });
    expect(container.textContent).toContain("ブランド候補を更新しました。");
  });

  it("有効 / 無効を切り替えられる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });
    fetchUserBrandsMock
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: true }],
      })
      .mockResolvedValueOnce({
        brands: [{ id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: false }],
      });
    updateUserBrandMock.mockResolvedValue({
      message: "updated",
      brand: { id: 1, name: "UNIQLO", kana: "ゆにくろ", is_active: false },
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const toggleButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "無効にする",
    );

    await act(async () => {
      toggleButton!.click();
      await waitForEffects();
    });

    expect(updateUserBrandMock).toHaveBeenCalledWith(1, {
      is_active: false,
    });
    expect(container.textContent).toContain("ブランド候補を無効にしました。");
    expect(container.textContent).toContain("無効");
  });

});
