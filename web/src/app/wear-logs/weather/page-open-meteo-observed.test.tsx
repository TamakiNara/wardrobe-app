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
const fetchWeatherObservedMock = vi.fn();
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
    get: (key: string) => (key === "date" ? "2026-05-02" : null),
  }),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserWeatherLocations: fetchUserWeatherLocationsMock,
}));

vi.mock("@/lib/api/weather", () => ({
  createWeatherRecord: createWeatherRecordMock,
  deleteWeatherRecord: deleteWeatherRecordMock,
  fetchWeatherForecast: fetchWeatherForecastMock,
  fetchWeatherObserved: fetchWeatherObservedMock,
  fetchWeatherRecordsByDate: fetchWeatherRecordsByDateMock,
  updateWeatherRecord: updateWeatherRecordMock,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WearLogWeatherPage Open-Meteo historical integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  const locationWithCoordinates: UserWeatherLocationRecord = {
    id: 1,
    name: "川口",
    forecast_area_code: null,
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: 35.8077,
    longitude: 139.7241,
    timezone: "Asia/Tokyo",
    is_default: true,
    display_order: 1,
    created_at: null,
    updated_at: null,
  };

  const locationWithoutCoordinates: UserWeatherLocationRecord = {
    id: 2,
    name: "位置情報なし",
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
      locations: [locationWithCoordinates],
    });
    fetchWeatherRecordsByDateMock.mockResolvedValue({
      weatherRecords: [] satisfies WeatherRecord[],
    });
    fetchWeatherForecastMock.mockReset();
    fetchWeatherObservedMock.mockReset();
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

  it("latitude / longitude がある地域では実績を取得ボタンが有効になる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;
    expect(observedButton.disabled).toBe(false);
  });

  it("位置情報がない地域では実績取得が disabled になる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [locationWithoutCoordinates],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;
    expect(observedButton.disabled).toBe(true);
    expect(container.textContent).toContain("実績取得:");
    expect(container.textContent).toContain(
      "位置情報を設定すると、実績を取得できます。",
    );
  });

  it("今回だけの地域では実績取得が disabled になる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const tabs = Array.from(
      container.querySelectorAll('button[role="tab"]'),
    ) as HTMLButtonElement[];

    await act(async () => {
      tabs[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;
    expect(observedButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "今回だけの地域では実績取得は使えません。",
    );
  });

  it("Open-Meteo Historical の結果をフォームへ反映し、実績取得メッセージと保存メッセージを分けて表示する", async () => {
    fetchWeatherObservedMock.mockResolvedValue({
      message: "fetched",
      observed: {
        weather_date: "2026-05-02",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: null,
        weather_code: "rain",
        raw_weather_code: 61,
        temperature_high: 22.1,
        temperature_low: 13.4,
        precipitation: 3.2,
        rain_sum: 3.2,
        snowfall_sum: 0,
        precipitation_hours: 4,
        source_type: "historical_api",
        source_name: "open_meteo_historical",
        source_fetched_at: "2026-05-03T10:00:00+09:00",
        raw_telop: null,
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 1,
        weather_date: "2026-05-02",
        location_id: 1,
        location_name: "川口",
        location_name_snapshot: "川口",
        forecast_area_code_snapshot: null,
        weather_code: "rain",
        temperature_high: 22.1,
        temperature_low: 13.4,
        memo: null,
        source_type: "historical_api",
        source_name: "open_meteo_historical",
        source_fetched_at: "2026-05-03T10:00:00+09:00",
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
      getButtonByText("実績を取得")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "実績データを取得しました。内容を確認して保存してください。",
    );
    expect(
      (container.querySelector("#temperature-high") as HTMLInputElement).value,
    ).toBe("22.1");
    expect(
      (container.querySelector("#temperature-low") as HTMLInputElement).value,
    ).toBe("13.4");
    expect(container.textContent).toContain("Open-Meteo Historical");
    expect(container.textContent).toContain("61");
    expect(container.textContent).toContain("実績の降水参考値");
    expect(container.textContent).toContain("4 時間");

    const submitButton = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitButton).not.toBeNull();

    await act(async () => {
      submitButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("天気情報を登録しました。");
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weather_code: "rain",
        temperature_high: 22.1,
        temperature_low: 13.4,
        source_type: "historical_api",
        source_name: "open_meteo_historical",
        source_fetched_at: "2026-05-03T10:00:00+09:00",
      }),
    );
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        precipitation: expect.anything(),
      }),
    );
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        rain_sum: expect.anything(),
      }),
    );
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        snowfall_sum: expect.anything(),
      }),
    );
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        precipitation_hours: expect.anything(),
      }),
    );
  });
});
