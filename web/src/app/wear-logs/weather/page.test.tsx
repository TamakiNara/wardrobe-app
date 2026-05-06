// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserWeatherLocationRecord } from "@/types/settings";
import type { WeatherRecord } from "@/types/weather";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
const fetchUserWeatherLocationsMock = vi.fn();
const fetchWeatherRecordsByDateMock = vi.fn();
const fetchWeatherForecastMock = vi.fn();
const createWeatherRecordMock = vi.fn();
const updateWeatherRecordMock = vi.fn();
const deleteWeatherRecordMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: (key: string) => (key === "date" ? "2026-05-04" : null),
  }),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserWeatherLocations: fetchUserWeatherLocationsMock,
}));

vi.mock("@/lib/api/weather", () => ({
  createWeatherRecord: createWeatherRecordMock,
  deleteWeatherRecord: deleteWeatherRecordMock,
  fetchWeatherForecast: fetchWeatherForecastMock,
  fetchWeatherRecordsByDate: fetchWeatherRecordsByDateMock,
  updateWeatherRecord: updateWeatherRecordMock,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WearLogWeatherPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  const openMeteoLocation: UserWeatherLocationRecord = {
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
  };

  const legacyOnlyLocation: UserWeatherLocationRecord = {
    id: 2,
    name: "旧川口",
    forecast_area_code: "110010",
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
    is_default: false,
    display_order: 2,
    created_at: null,
    updated_at: null,
  };

  const jmaOnlyLocation: UserWeatherLocationRecord = {
    id: 3,
    name: "東京 JMA",
    forecast_area_code: null,
    jma_forecast_region_code: "130010",
    jma_forecast_office_code: "130000",
    latitude: null,
    longitude: null,
    timezone: null,
    is_default: false,
    display_order: 3,
    created_at: null,
    updated_at: null,
  };

  const incompleteCoordinateLocation: UserWeatherLocationRecord = {
    id: 4,
    name: "座標不完全",
    forecast_area_code: null,
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: 35.0,
    longitude: null,
    timezone: "Asia/Tokyo",
    is_default: false,
    display_order: 4,
    created_at: null,
    updated_at: null,
  };

  async function waitForEffects() {
    await act(async () => {
      await Promise.resolve();
    });
  }

  function getButtonByText(text: string) {
    return Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === text,
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T09:00:00+09:00"));
    pushMock.mockReset();
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [
        openMeteoLocation,
        legacyOnlyLocation,
        jmaOnlyLocation,
        incompleteCoordinateLocation,
      ],
    });
    fetchWeatherRecordsByDateMock.mockResolvedValue({
      weatherRecords: [] satisfies WeatherRecord[],
    });
    fetchWeatherForecastMock.mockReset();
    createWeatherRecordMock.mockReset();
    updateWeatherRecordMock.mockReset();
    deleteWeatherRecordMock.mockReset();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("座標ありの保存済み地域では予報取得を有効にする", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
  });

  it("legacy forecast_area_code のみの保存済み地域では予報取得を無効にする", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [legacyOnlyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "位置情報を設定すると、天気を取得できます。",
    );
  });

  it("JMA code pair のみの保存済み地域では予報取得を無効にする", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [jmaOnlyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "位置情報を設定すると、天気を取得できます。",
    );
  });

  it("座標設定が不完全な地域では不完全メッセージを表示する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [incompleteCoordinateLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "位置情報の設定が不完全です。地域設定を確認してください。",
    );
  });

  it("今回だけの地域では予報取得を使えない", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const temporaryTab = getButtonByText("今回だけの地域");
    expect(temporaryTab).toBeDefined();

    await act(async () => {
      temporaryTab!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "今回だけの地域では天気取得は使えません。",
    );
  });

  it("Open-Meteo の予報取得結果をフォームへ反映して保存できる", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "cloudy",
        raw_weather_code: 61,
        temperature_high: 22,
        temperature_low: 13,
        precipitation: 3.2,
        rain_sum: 3.2,
        snowfall_sum: 0,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: null,
        time_block_weather: {
          morning: null,
          daytime: "cloudy",
          night: "sunny",
        },
        has_rain_in_time_blocks: false,
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 1,
        weather_date: "2026-05-04",
        location_id: 1,
        location_name: "川口",
        location_name_snapshot: "川口",
        forecast_area_code_snapshot: "110010",
        weather_code: "cloudy",
        temperature_high: 22,
        temperature_low: 13,
        memo: null,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        created_at: null,
        updated_at: null,
      },
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    await act(async () => {
      getButtonByText("予報を取得")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      (container.querySelector("#weather-condition") as HTMLSelectElement)
        .value,
    ).toBe("cloudy");
    expect(
      (container.querySelector("#temperature-high") as HTMLInputElement).value,
    ).toBe("22");
    expect(
      (container.querySelector("#temperature-low") as HTMLInputElement).value,
    ).toBe("13");
    expect(container.textContent).toContain("予報データを取得しました。");
    expect(container.textContent).toContain("取得元: Open-Meteo Forecast");

    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await waitForEffects();
    });

    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        location_id: 1,
        weather_code: "cloudy",
        temperature_high: 22,
        temperature_low: 13,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
      }),
    );
  });
});
