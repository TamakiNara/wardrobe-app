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
let mockDate = "2026-05-01";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: (key: string) => (key === "date" ? mockDate : null),
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
    mockDate = "2026-05-01";
    pushMock.mockReset();
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [openMeteoLocation],
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
    vi.useRealTimers();
  });

  it("過去日では実績取得を主導線にし、予報取得を disabled にする", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;

    expect(fetchButton.disabled).toBe(true);
    expect(observedButton.disabled).toBe(false);
    expect(container.textContent).toContain("天気データを取得");
    expect(container.textContent).toContain(
      "過去日は実績データの取得を推奨します。",
    );
    expect(fetchButton.className).toContain("disabled:border-sky-100");
    expect(observedButton.className).toContain("bg-emerald-600");
  });

  it("未来日では予報取得を主導線にし、実績取得を disabled にする", async () => {
    mockDate = "2026-05-04";

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;

    expect(fetchButton.disabled).toBe(false);
    expect(observedButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "未来日のため、実績データはまだ取得できません。",
    );
    expect(fetchButton.className).toContain("bg-sky-600");
  });

  it("今日では予報取得と実績取得を両方使え、実績の注意文を表示する", async () => {
    mockDate = "2026-05-03";

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    const observedButton = getButtonByText("実績を取得") as HTMLButtonElement;

    expect(fetchButton.disabled).toBe(false);
    expect(observedButton.disabled).toBe(false);
    expect(container.textContent).toContain(
      "今日の実績は未確定の値を含む場合があります。必要に応じて翌日以降に再取得してください。",
    );
    expect(fetchButton.className).toContain("bg-sky-600");
  });

  it("Open-Meteo forecast の取得成功メッセージを表示し、保存時は登録メッセージを表示する", async () => {
    mockDate = "2026-05-03";
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-03",
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
        source_fetched_at: "2026-05-03T10:00:00+09:00",
        raw_telop: null,
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 1,
        weather_date: "2026-05-03",
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
      getButtonByText("予報を取得")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "予報データを取得しました。内容を確認して保存してください。",
    );
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
      (
        container.querySelector('button[type="submit"]') as HTMLButtonElement
      ).dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await waitForEffects();
    });

    expect(container.textContent).toContain("天気情報を登録しました。");
    expect(createWeatherRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weather_code: "rain",
        temperature_high: 22.1,
        temperature_low: 13.4,
        source_type: "forecast_api",
        source_name: "open_meteo_jma_forecast",
        source_fetched_at: "2026-05-03T10:00:00+09:00",
      }),
    );
  });

  it("legacy forecast_area_code だけの地域でも fallback として予報取得できる", async () => {
    mockDate = "2026-05-03";
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [legacyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
  });

  it("位置情報も予報区域もない地域では予報取得が disabled になる", async () => {
    mockDate = "2026-05-03";
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [emptyLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain("予報取得:");
    expect(container.textContent).toContain(
      "位置情報または予報区域を設定すると、天気を取得できます。",
    );
  });
});
