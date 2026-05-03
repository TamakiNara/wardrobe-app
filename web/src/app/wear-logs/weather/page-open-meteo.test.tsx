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
    get: (key: string) => (key === "date" ? "2026-05-01" : null),
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

describe("WearLogWeatherPage Open-Meteo forecast integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  const openMeteoLocation: UserWeatherLocationRecord = {
    id: 1,
    name: "川口 Open-Meteo",
    forecast_area_code: null,
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: 35.8617,
    longitude: 139.6455,
    timezone: "Asia/Tokyo",
    is_default: true,
    display_order: 1,
    created_at: null,
    updated_at: null,
  };

  const legacyLocation: UserWeatherLocationRecord = {
    id: 2,
    name: "川口 legacy",
    forecast_area_code: "110010",
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
    is_default: true,
    display_order: 1,
    created_at: null,
    updated_at: null,
  };

  const emptyLocation: UserWeatherLocationRecord = {
    id: 3,
    name: "未設定",
    forecast_area_code: null,
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
    is_default: true,
    display_order: 1,
    created_at: null,
    updated_at: null,
  };

  async function waitForEffects() {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  function getButtonByText(text: string) {
    return Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === text,
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [openMeteoLocation],
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
  });

  it("latitude / longitude がある地域では天気を取得ボタンが有効になる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
    expect(container.textContent).toContain(
      "保存済み地域の位置情報または予報区域を使って天気を取得します。取得しても自動保存はされません。",
    );
  });

  it("Open-Meteo の forecast をフォームへ反映し、source_name を保存 payload に含める", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 1,
        location_name: "川口 Open-Meteo",
        forecast_area_code: null,
        weather_code: "rain",
        raw_weather_code: 61,
        temperature_high: 22.1,
        temperature_low: 13.4,
        precipitation: 3.2,
        rain_sum: 3.2,
        snowfall_sum: 0,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: null,
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 1,
        weather_date: "2026-05-01",
        location_id: 1,
        location_name: "川口 Open-Meteo",
        location_name_snapshot: "川口 Open-Meteo",
        forecast_area_code_snapshot: null,
        weather_code: "rain",
        temperature_high: 22.1,
        temperature_low: 13.4,
        memo: null,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
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
      getButtonByText("天気を取得")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(
      (container.querySelector("#temperature-high") as HTMLInputElement).value,
    ).toBe("22.1");
    expect(
      (container.querySelector("#temperature-low") as HTMLInputElement).value,
    ).toBe("13.4");
    expect(container.textContent).toContain("Open-Meteo");
    expect(container.textContent).toContain("61");
    expect(container.textContent).toContain("降水量の参考値");
    expect(container.textContent).toContain("3.2 mm");

    await act(async () => {
      getButtonByText("天気を登録")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weather_code: "rain",
        temperature_high: 22.1,
        temperature_low: 13.4,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
      }),
    );
  });

  it("legacy forecast_area_code だけの地域でも fallback として天気を取得できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [legacyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
  });

  it("位置情報も予報区域もない地域では天気を取得を disabled にする", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [emptyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "位置情報または予報区域を設定すると、天気を取得できます。",
    );
  });
});
