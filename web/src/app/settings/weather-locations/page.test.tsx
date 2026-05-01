// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const fetchUserWeatherLocationsMock = vi.fn();
const createUserWeatherLocationMock = vi.fn();
const updateUserWeatherLocationMock = vi.fn();
const deleteUserWeatherLocationMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserWeatherLocations: fetchUserWeatherLocationsMock,
  createUserWeatherLocation: createUserWeatherLocationMock,
  updateUserWeatherLocation: updateUserWeatherLocationMock,
  deleteUserWeatherLocation: deleteUserWeatherLocationMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setInputValue(element: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("SettingsWeatherLocationsPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [
        {
          id: 1,
          name: "川口",
          forecast_area_code: "110000",
          latitude: null,
          longitude: null,
          is_default: true,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
        {
          id: 2,
          name: "東京23区",
          forecast_area_code: "130010",
          latitude: null,
          longitude: null,
          is_default: false,
          display_order: 2,
          created_at: null,
          updated_at: null,
        },
      ],
    });
    createUserWeatherLocationMock.mockResolvedValue({});
    updateUserWeatherLocationMock.mockResolvedValue({});
    deleteUserWeatherLocationMock.mockResolvedValue({});
    pushMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("地域一覧を表示できる", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("天気の地域設定");
    expect(container.textContent).toContain("地域を追加");
    expect(container.textContent).toContain("デフォルト地域");
    expect(container.textContent).toContain("川口");
    expect(container.textContent).toContain("東京23区");
    expect(container.textContent).not.toContain("予報API用地域コード");
    expect(
      container.querySelector("#new-weather-location-area-code"),
    ).toBeNull();
  });

  it("地域を追加できる", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    const nameInput = container.querySelector<HTMLInputElement>(
      "#new-weather-location-name",
    );
    const defaultCheckbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("地域を追加"));

    await act(async () => {
      setInputValue(nameInput!, "秋田");
      defaultCheckbox!.click();
      await waitForEffects();
    });

    await act(async () => {
      addButton?.click();
      await waitForEffects();
    });

    expect(createUserWeatherLocationMock).toHaveBeenCalledWith({
      name: "秋田",
      is_default: true,
    });
    expect(container.textContent).toContain("地域を追加しました。");
  });

  it("地域設定を更新したときに通知ボックスへ成功メッセージを出す", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    const editButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("編集"));

    await act(async () => {
      editButton?.click();
      await waitForEffects();
    });

    const editNameInput = container.querySelector<HTMLInputElement>(
      "#edit-weather-location-name-1",
    );
    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("更新"));

    await act(async () => {
      setInputValue(editNameInput!, "川口駅前");
      await waitForEffects();
    });

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(updateUserWeatherLocationMock).toHaveBeenCalledWith(1, {
      name: "川口駅前",
      is_default: true,
    });
    expect(container.textContent).toContain("地域設定を更新しました。");
  });

  it("地域を削除したときに通知ボックスへ成功メッセージを出す", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    const deleteButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).filter((button) => button.textContent?.includes("削除"));

    await act(async () => {
      deleteButtons[0]?.click();
      await waitForEffects();
    });

    expect(deleteUserWeatherLocationMock).toHaveBeenCalledWith(1);
    expect(container.textContent).toContain("地域を削除しました。");

    confirmMock.mockRestore();
  });
});
