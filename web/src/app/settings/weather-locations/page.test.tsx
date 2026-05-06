// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";

const pushMock = vi.fn();
const fetchUserWeatherLocationsMock = vi.fn();
const searchWeatherLocationGeocodeMock = vi.fn();
const createUserWeatherLocationMock = vi.fn();
const updateUserWeatherLocationMock = vi.fn();
const deleteUserWeatherLocationMock = vi.fn();
const reorderUserWeatherLocationsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserWeatherLocations: fetchUserWeatherLocationsMock,
  searchWeatherLocationGeocode: searchWeatherLocationGeocodeMock,
  createUserWeatherLocation: createUserWeatherLocationMock,
  updateUserWeatherLocation: updateUserWeatherLocationMock,
  deleteUserWeatherLocation: deleteUserWeatherLocationMock,
  reorderUserWeatherLocations: reorderUserWeatherLocationsMock,
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

function setSelectValue(element: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  )?.set;
  setter?.call(element, value);
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
          forecast_area_code: "110010",
          jma_forecast_region_code: "110010",
          jma_forecast_office_code: "110000",
          latitude: 35.8617,
          longitude: 139.6455,
          timezone: "Asia/Tokyo",
          is_default: true,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
        {
          id: 2,
          name: "東京23区",
          forecast_area_code: "130010",
          jma_forecast_region_code: null,
          jma_forecast_office_code: null,
          latitude: null,
          longitude: null,
          timezone: null,
          is_default: false,
          display_order: 2,
          created_at: null,
          updated_at: null,
        },
      ],
    });
    searchWeatherLocationGeocodeMock.mockResolvedValue({
      results: [
        {
          name: "川口市",
          admin1: "埼玉県",
          admin2: null,
          country: "日本",
          latitude: 35.8077,
          longitude: 139.7241,
          timezone: "Asia/Tokyo",
        },
      ],
    });
    createUserWeatherLocationMock.mockResolvedValue({});
    updateUserWeatherLocationMock.mockResolvedValue({});
    deleteUserWeatherLocationMock.mockResolvedValue({});
    reorderUserWeatherLocationsMock.mockResolvedValue({
      message: "reordered",
      locations: [
        {
          id: 1,
          name: "川口",
          forecast_area_code: "110010",
          jma_forecast_region_code: "110010",
          jma_forecast_office_code: "110000",
          latitude: 35.8617,
          longitude: 139.6455,
          timezone: "Asia/Tokyo",
          is_default: true,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
        {
          id: 2,
          name: "東京23区",
          forecast_area_code: "130010",
          jma_forecast_region_code: null,
          jma_forecast_office_code: null,
          latitude: null,
          longitude: null,
          timezone: null,
          is_default: false,
          display_order: 2,
          created_at: null,
          updated_at: null,
        },
      ],
    });
    pushMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("位置情報を主表示しつつ補助コードを控えめに表示できる", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("天気の地域設定");
    expect(container.textContent).toContain("Open-Meteo 用の位置情報");
    expect(container.textContent).toContain("地域を検索");
    expect(
      container.querySelector("#new-weather-location-geocode-query"),
    ).not.toBeNull();
    expect(
      container.querySelector("#new-weather-location-latitude"),
    ).not.toBeNull();
    expect(
      container.querySelector("#new-weather-location-longitude"),
    ).not.toBeNull();
    expect(
      container.querySelector("#new-weather-location-timezone"),
    ).not.toBeNull();
    expect(
      container.querySelector("#new-weather-location-forecast-area"),
    ).toBeNull();
    expect(
      container.querySelector("#new-weather-location-jma-region"),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="new-weather-location-legacy-toggle"]',
      ),
    ).toBeNull();
    expect(container.textContent).not.toContain(
      "補助コード（旧API・fallback用）",
    );
  });

  it("一覧カードの補助コード詳細を開閉できる", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    expect(
      container.querySelector(
        '[data-testid="weather-location-legacy-details-2"]',
      ),
    ).toBeNull();

    const toggleButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="weather-location-legacy-toggle-2"]',
    );

    await act(async () => {
      toggleButton?.click();
      await waitForEffects();
    });

    expect(
      container.querySelector(
        '[data-testid="weather-location-legacy-details-2"]',
      ),
    ).not.toBeNull();
    expect(container.textContent).toContain("補助コードが保存されています");
    expect(container.textContent).toContain("旧予報コード: 130010");
  });

  it("検索結果を選ぶと緯度・経度・タイムゾーンを反映できる", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    await act(async () => {
      setInputValue(
        container.querySelector<HTMLInputElement>(
          "#new-weather-location-geocode-query",
        )!,
        "川口",
      );
      await waitForEffects();
    });

    const searchButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("検索"));

    await act(async () => {
      searchButton?.click();
      await waitForEffects();
    });

    expect(searchWeatherLocationGeocodeMock).toHaveBeenCalledWith("川口");
    expect(container.textContent).toContain("川口市 / 埼玉県 / 日本");

    const applyButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("この地点を使う"));

    await act(async () => {
      applyButton?.click();
      await waitForEffects();
    });

    expect(
      container.querySelector<HTMLInputElement>("#new-weather-location-name")
        ?.value,
    ).toBe("川口市");
    expect(
      container.querySelector<HTMLInputElement>(
        "#new-weather-location-latitude",
      )?.value,
    ).toBe("35.8077");
    expect(
      container.querySelector<HTMLInputElement>(
        "#new-weather-location-longitude",
      )?.value,
    ).toBe("139.7241");
    expect(
      container.querySelector<HTMLInputElement>(
        "#new-weather-location-timezone",
      )?.value,
    ).toBe("Asia/Tokyo");
    expect(container.textContent).toContain("選択済み");
    expect(container.textContent).toContain("選択中");
    expect(container.textContent).toContain(
      "川口市 / 埼玉県 / 日本 を位置情報に反映しました。緯度・経度・タイムゾーンを更新しています。",
    );
  });

  it("地域名が入力済みなら候補選択で上書きしない", async () => {
    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    await act(async () => {
      setInputValue(
        container.querySelector<HTMLInputElement>(
          "#new-weather-location-name",
        )!,
        "職場",
      );
      setInputValue(
        container.querySelector<HTMLInputElement>(
          "#new-weather-location-geocode-query",
        )!,
        "川口",
      );
      await waitForEffects();
    });

    const searchButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("検索"));

    await act(async () => {
      searchButton?.click();
      await waitForEffects();
    });

    const applyButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("この地点を使う"));

    await act(async () => {
      applyButton?.click();
      await waitForEffects();
    });

    expect(
      container.querySelector<HTMLInputElement>("#new-weather-location-name")
        ?.value,
    ).toBe("職場");
    expect(
      container.querySelector<HTMLInputElement>(
        "#new-weather-location-latitude",
      )?.value,
    ).toBe("35.8077");
    expect(container.textContent).toContain("選択済み");
    expect(container.textContent).toContain(
      "川口市 / 埼玉県 / 日本 を位置情報に反映しました。緯度・経度・タイムゾーンを更新しています。",
    );
  });

  it("検索結果が空なら案内を表示する", async () => {
    searchWeatherLocationGeocodeMock.mockResolvedValueOnce({
      results: [],
    });

    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    await act(async () => {
      setInputValue(
        container.querySelector<HTMLInputElement>(
          "#new-weather-location-geocode-query",
        )!,
        "zzzz",
      );
      await waitForEffects();
    });

    const searchButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("検索"));

    await act(async () => {
      searchButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("候補が見つかりませんでした。");
  });

  it("検索 API 失敗時もフォームを壊さない", async () => {
    searchWeatherLocationGeocodeMock.mockRejectedValueOnce({
      status: 502,
      data: {
        message:
          "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
      },
    });

    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    await act(async () => {
      setInputValue(
        container.querySelector<HTMLInputElement>(
          "#new-weather-location-geocode-query",
        )!,
        "川口",
      );
      await waitForEffects();
    });

    const searchButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("検索"));

    await act(async () => {
      searchButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "地域候補の検索に失敗しました。時間をおいて再度お試しください。",
    );
    expect(
      container.querySelector<HTMLInputElement>("#new-weather-location-name")
        ?.value,
    ).toBe("");
  });

  it("JMA予報区域と座標を選んで地域を追加できる", async () => {
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
    const latitudeInput = container.querySelector<HTMLInputElement>(
      "#new-weather-location-latitude",
    );
    const longitudeInput = container.querySelector<HTMLInputElement>(
      "#new-weather-location-longitude",
    );
    const timezoneInput = container.querySelector<HTMLInputElement>(
      "#new-weather-location-timezone",
    );
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("地域を追加"));
    await act(async () => {
      setInputValue(nameInput!, "新宿");
      setInputValue(latitudeInput!, "35.6895");
      setInputValue(longitudeInput!, "139.6917");
      setInputValue(timezoneInput!, "Asia/Tokyo");
      defaultCheckbox!.click();
      await waitForEffects();
    });

    await act(async () => {
      addButton?.click();
      await waitForEffects();
    });

    expect(createUserWeatherLocationMock).toHaveBeenCalledWith({
      name: "新宿",
      jma_forecast_region_code: null,
      jma_forecast_office_code: null,
      latitude: 35.6895,
      longitude: 139.6917,
      timezone: "Asia/Tokyo",
      is_default: true,
    });
  });

  it("既存の座標とタイムゾーンを復元して編集できる", async () => {
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

    expect(container.textContent).toContain("補助コードが保存されています");
    expect(
      container.querySelector(
        '[data-testid="edit-weather-location-legacy-fields-1"]',
      ),
    ).toBeNull();

    const editNameInput = container.querySelector<HTMLInputElement>(
      "#edit-weather-location-name-1",
    );
    const editLatitudeInput = container.querySelector<HTMLInputElement>(
      "#edit-weather-location-latitude-1",
    );
    const editLongitudeInput = container.querySelector<HTMLInputElement>(
      "#edit-weather-location-longitude-1",
    );
    const editTimezoneInput = container.querySelector<HTMLInputElement>(
      "#edit-weather-location-timezone-1",
    );
    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("更新"));
    const legacyToggle = container.querySelector<HTMLButtonElement>(
      '[data-testid="edit-weather-location-legacy-toggle-1"]',
    );

    await act(async () => {
      legacyToggle?.click();
      await waitForEffects();
    });

    expect(
      container.querySelector(
        '[data-testid="edit-weather-location-legacy-fields-1"]',
      ),
    ).not.toBeNull();
    expect(container.textContent).toContain("JMA予報区域:");

    expect(editLatitudeInput?.value).toBe("35.8617");
    expect(editLongitudeInput?.value).toBe("139.6455");
    expect(editTimezoneInput?.value).toBe("Asia/Tokyo");

    await act(async () => {
      setInputValue(editNameInput!, "川口（更新）");
      setInputValue(editLatitudeInput!, "35.4437");
      setInputValue(editLongitudeInput!, "139.6380");
      setInputValue(editTimezoneInput!, "Asia/Tokyo");
      await waitForEffects();
    });

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(updateUserWeatherLocationMock).toHaveBeenCalledWith(1, {
      name: "川口（更新）",
      jma_forecast_region_code: "110010",
      jma_forecast_office_code: "110000",
      latitude: 35.4437,
      longitude: 139.638,
      timezone: "Asia/Tokyo",
      is_default: true,
    });
  });

  it("legacy 値がない編集フォームでは補助コード section を表示しない", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [
        {
          id: 1,
          name: "横浜",
          forecast_area_code: null,
          jma_forecast_region_code: null,
          jma_forecast_office_code: null,
          latitude: 35.4437,
          longitude: 139.638,
          timezone: "Asia/Tokyo",
          is_default: true,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
      ],
    });

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

    expect(
      container.querySelector(
        '[data-testid="edit-weather-location-legacy-toggle-1"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="edit-weather-location-legacy-fields-1"]',
      ),
    ).toBeNull();
  });

  it("地域を削除できる", async () => {
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
    confirmMock.mockRestore();
  });

  it("使用中の地域は削除不可メッセージを表示する", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteUserWeatherLocationMock.mockRejectedValueOnce(
      new ApiClientError(422, {
        message: "The given data was invalid.",
        errors: {
          location: ["この地域は天気記録で使用中のため削除できません。"],
        },
      }),
    );

    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    const deleteButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).filter((button) => button.textContent?.includes("削除"));

    await act(async () => {
      deleteButtons[1]?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "この地域は天気記録で使用中のため削除できません。",
    );
    confirmMock.mockRestore();
  });
  it("上下ボタンで表示順を更新できる", async () => {
    reorderUserWeatherLocationsMock.mockResolvedValueOnce({
      message: "reordered",
      locations: [
        {
          id: 2,
          name: "東京23区",
          forecast_area_code: "130010",
          jma_forecast_region_code: null,
          jma_forecast_office_code: null,
          latitude: null,
          longitude: null,
          timezone: null,
          is_default: false,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
        {
          id: 1,
          name: "川口",
          forecast_area_code: "110010",
          jma_forecast_region_code: "110010",
          jma_forecast_office_code: "110000",
          latitude: 35.8617,
          longitude: 139.6455,
          timezone: "Asia/Tokyo",
          is_default: true,
          display_order: 2,
          created_at: null,
          updated_at: null,
        },
      ],
    });

    const { default: SettingsWeatherLocationsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsWeatherLocationsPage));
      await waitForEffects();
    });

    const moveUpFirst = container.querySelector<HTMLButtonElement>(
      '[data-testid="weather-location-move-up-1"]',
    );
    const moveDownFirst = container.querySelector<HTMLButtonElement>(
      '[data-testid="weather-location-move-down-1"]',
    );
    const moveDownSecond = container.querySelector<HTMLButtonElement>(
      '[data-testid="weather-location-move-down-2"]',
    );

    expect(moveUpFirst?.disabled).toBe(true);
    expect(moveDownFirst?.disabled).toBe(false);
    expect(moveDownSecond?.disabled).toBe(true);

    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [
        {
          id: 2,
          name: "東京23区",
          forecast_area_code: "130010",
          jma_forecast_region_code: null,
          jma_forecast_office_code: null,
          latitude: null,
          longitude: null,
          timezone: null,
          is_default: false,
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
        {
          id: 1,
          name: "川口",
          forecast_area_code: "110010",
          jma_forecast_region_code: "110010",
          jma_forecast_office_code: "110000",
          latitude: 35.8617,
          longitude: 139.6455,
          timezone: "Asia/Tokyo",
          is_default: true,
          display_order: 2,
          created_at: null,
          updated_at: null,
        },
      ],
    });

    await act(async () => {
      moveDownFirst?.click();
      await waitForEffects();
    });

    await act(async () => {
      await waitForEffects();
    });

    expect(reorderUserWeatherLocationsMock).toHaveBeenCalledWith({
      location_ids: [2, 1],
    });
    expect(container.textContent).toContain("地域の表示順を更新しました。");
    await act(async () => {
      await waitForEffects();
      await waitForEffects();
    });

    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-testid^="weather-location-card-"]',
        ),
      ).map((element) => element.dataset.testid),
    ).toEqual(["weather-location-card-2", "weather-location-card-1"]);
  });
});
