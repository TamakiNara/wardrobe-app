// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
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

describe("WearLogWeatherPage の fallback 予報取得", () => {
  let container: HTMLDivElement;
  let root: Root;

  const legacyLocation: UserWeatherLocationRecord = {
    id: 1,
    name: "川口",
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
    id: 2,
    name: "未設定地域",
    forecast_area_code: null,
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

  const jmaLocation: UserWeatherLocationRecord = {
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

  const incompleteJmaLocation: UserWeatherLocationRecord = {
    id: 4,
    name: "不完全 JMA",
    forecast_area_code: null,
    jma_forecast_region_code: "130010",
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
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
        legacyLocation,
        emptyLocation,
        jmaLocation,
        incompleteJmaLocation,
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

  it("legacy forecast_area_code がある保存済み地域では予報を取得できる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得");
    expect(fetchButton).toBeDefined();
    expect(fetchButton).not.toHaveProperty("disabled", true);
  });

  it("JMA コードがある保存済み地域でも予報を取得できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [jmaLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
  });

  it("provider 情報がない保存済み地域では予報を取得できない", async () => {
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
    expect(container.textContent).toContain(
      "位置情報または予報区域を設定すると、天気を取得できます。",
    );
  });

  it("JMA コードが不完全な保存済み地域では disabled 理由を表示する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [incompleteJmaLocation],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("予報を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "JMA予報区域の設定が不完全です。地域設定を確認してください。",
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

  it("tsukumijima 取得結果をフォームへ反映し、forecast source のまま保存できる", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "cloudy_then_rain",
        raw_weather_code: null,
        temperature_high: 22,
        temperature_low: 13,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "くもりのち雨",
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
        weather_code: "cloudy_then_rain",
        temperature_high: 22,
        temperature_low: 13,
        memo: null,
        source_type: "forecast_api",
        source_name: "tsukumijima",
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
    ).toBe("cloudy_then_rain");
    expect(
      (container.querySelector("#temperature-high") as HTMLInputElement).value,
    ).toBe("22");
    expect(
      (container.querySelector("#temperature-low") as HTMLInputElement).value,
    ).toBe("13");
    expect(container.textContent).toContain(
      "予報データを取得しました。内容を確認して保存してください。",
    );
    expect(container.textContent).toContain("取得した予報表記:");
    expect(container.textContent).toContain("くもりのち雨");

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
        weather_code: "cloudy_then_rain",
        temperature_high: 22,
        temperature_low: 13,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
      }),
    );
  });

  it("JMA 取得結果は source_name=jma_forecast_json のまま保存する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [jmaLocation],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 3,
        location_name: "東京 JMA",
        forecast_area_code: null,
        weather_code: "cloudy_then_rain",
        raw_weather_code: null,
        temperature_high: 21,
        temperature_low: 14,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "くもり一時雨",
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 11,
        weather_date: "2026-05-04",
        location_id: 3,
        location_name: "東京 JMA",
        location_name_snapshot: "東京 JMA",
        forecast_area_code_snapshot: null,
        weather_code: "cloudy_then_rain",
        temperature_high: 21,
        temperature_low: 14,
        memo: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
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
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
      }),
    );
  });

  it("API 失敗時はフォームを維持してエラーメッセージを表示する", async () => {
    fetchWeatherForecastMock.mockRejectedValue(
      new ApiClientError(502, {
        message:
          "予報データを取得できませんでした。時間をおいて再度お試しください。",
      }),
    );

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const weatherSelect = container.querySelector(
      "#weather-condition",
    ) as HTMLSelectElement;

    await act(async () => {
      weatherSelect.value = "rain";
      weatherSelect.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      getButtonByText("予報を取得")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await waitForEffects();
    });

    expect(weatherSelect.value).toBe("rain");
    expect(container.textContent).toContain(
      "天気情報を取得できませんでした。手入力で登録できます。",
    );
    expect(createWeatherRecordMock).not.toHaveBeenCalled();
    expect(updateWeatherRecordMock).not.toHaveBeenCalled();
  });

  it("other の forecast では raw telop と補足を表示する", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "other",
        raw_weather_code: null,
        temperature_high: 18,
        temperature_low: null,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "雨か雪",
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
    ).toBe("other");
    expect(container.textContent).toContain("雨か雪");
    expect(container.textContent).toContain(
      "この表記は現在の weather_code に変換できなかったため、「その他」として反映しています。",
    );
  });

  it("JMA の raw telop は整形済みの表記で表示される", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [jmaLocation],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 3,
        location_name: "東京 JMA",
        forecast_area_code: null,
        weather_code: "sunny_then_cloudy",
        raw_weather_code: null,
        temperature_high: 20,
        temperature_low: 12,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "晴れ 夜のはじめ頃 くもり",
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
    ).toBe("sunny_then_cloudy");
    expect(container.textContent).toContain("取得した予報表記:");
    expect(container.textContent).toContain("晴れ 夜のはじめ頃 くもり");
    expect(container.textContent).not.toContain(
      "この表記は現在の weather_code に変換できなかったため、そのまま確認できるように表示しています。",
    );
  });

  it("気温が取れない forecast では補足メッセージを表示し、保存時は null のままにする", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [jmaLocation],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 3,
        location_name: "東京 JMA",
        forecast_area_code: null,
        weather_code: "sunny_then_cloudy",
        raw_weather_code: null,
        temperature_high: null,
        temperature_low: null,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "晴れ 夜のはじめ頃 くもり",
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 21,
        weather_date: "2026-05-04",
        location_id: 3,
        location_name: "東京 JMA",
        location_name_snapshot: "東京 JMA",
        forecast_area_code_snapshot: null,
        weather_code: "sunny_then_cloudy",
        temperature_high: null,
        temperature_low: null,
        memo: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
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
    ).toBe("sunny_then_cloudy");
    expect(
      (container.querySelector("#temperature-high") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (container.querySelector("#temperature-low") as HTMLInputElement).value,
    ).toBe("");
    expect(container.textContent).toContain(
      "予報データを取得しました。内容を確認して保存してください。",
    );
    expect(container.textContent).toContain(
      "気温は取得できませんでした。必要に応じて手入力してください。",
    );

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
        weather_code: "sunny_then_cloudy",
        temperature_high: null,
        temperature_low: null,
        source_name: "jma_forecast_json",
      }),
    );
  });

  it("気温が取得できた forecast では気温補足を表示しない", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-04",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "cloudy_then_rain",
        raw_weather_code: null,
        temperature_high: 22,
        temperature_low: 13,
        precipitation: null,
        rain_sum: null,
        snowfall_sum: null,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-04T10:00:00+09:00",
        raw_telop: "くもりのち雨",
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

    expect(container.textContent).not.toContain(
      "気温は取得できませんでした。必要に応じて手入力してください。",
    );
  });
});
