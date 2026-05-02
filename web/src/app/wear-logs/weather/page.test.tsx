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

// React 18 の act 警告を抑止するため、jsdom 環境で明示する。
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WearLogWeatherPage forecast integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  const savedLocationWithCode: UserWeatherLocationRecord = {
    id: 1,
    name: "川口",
    forecast_area_code: "110010",
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    is_default: true,
    display_order: 1,
    created_at: null,
    updated_at: null,
  };

  const savedLocationWithoutCode: UserWeatherLocationRecord = {
    id: 2,
    name: "旅行先候補",
    forecast_area_code: null,
    jma_forecast_region_code: null,
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    is_default: false,
    display_order: 2,
    created_at: null,
    updated_at: null,
  };

  const savedLocationWithJmaCodes: UserWeatherLocationRecord = {
    id: 3,
    name: "川口 JMA",
    forecast_area_code: null,
    jma_forecast_region_code: "110010",
    jma_forecast_office_code: "110000",
    latitude: null,
    longitude: null,
    is_default: false,
    display_order: 3,
    created_at: null,
    updated_at: null,
  };

  const savedLocationWithIncompleteJmaCodes: UserWeatherLocationRecord = {
    id: 4,
    name: "設定不完全 JMA",
    forecast_area_code: null,
    jma_forecast_region_code: "130010",
    jma_forecast_office_code: null,
    latitude: null,
    longitude: null,
    is_default: false,
    display_order: 4,
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
      locations: [
        savedLocationWithCode,
        savedLocationWithoutCode,
        savedLocationWithJmaCodes,
        savedLocationWithIncompleteJmaCodes,
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
  });

  it("forecast_area_code がある保存済み地域では天気を取得ボタンが使える", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得");
    expect(fetchButton).toBeDefined();
    expect(fetchButton).not.toHaveProperty("disabled", true);
  });

  it("JMA コードがある保存済み地域でも天気を取得できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithJmaCodes],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(false);
  });

  it("forecast_area_code がない保存済み地域では disabled 理由を表示する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithoutCode],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "予報区域を設定すると、天気を取得できます。",
    );
  });

  it("JMA コードが不完全な保存済み地域では disabled 理由を表示する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithIncompleteJmaCodes],
    });

    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "JMA予報区域の設定が不完全です。地域設定を確認してください。",
    );
  });

  it("今回だけの地域では天気を取得が使えない", async () => {
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

    const fetchButton = getButtonByText("天気を取得") as HTMLButtonElement;
    expect(fetchButton.disabled).toBe(true);
    expect(container.textContent).toContain(
      "今回だけの地域では天気取得は使えません。",
    );
  });

  it("取得成功時にフォームへ反映し、保存 payload に forecast source を含める", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "cloudy_then_rain",
        temperature_high: 22,
        temperature_low: 13,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "曇りのち雨",
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 1,
        weather_date: "2026-05-01",
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
      "天気情報を取得しました。内容を確認して保存してください。",
    );
    expect(container.textContent).toContain("取得した予報表記:");
    expect(container.textContent).toContain("曇りのち雨");

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      form!.dispatchEvent(
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
        source_fetched_at: "2026-05-01T10:00:00+09:00",
      }),
    );
  });

  it("JMA 取得結果も source_name=jma_forecast_json のまま保存する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithJmaCodes],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 3,
        location_name: "川口 JMA",
        forecast_area_code: null,
        weather_code: "cloudy_then_rain",
        temperature_high: 21,
        temperature_low: 14,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "曇のち雨",
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 11,
        weather_date: "2026-05-01",
        location_id: 3,
        location_name: "川口 JMA",
        location_name_snapshot: "川口 JMA",
        forecast_area_code_snapshot: null,
        weather_code: "cloudy_then_rain",
        temperature_high: 21,
        temperature_low: 14,
        memo: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
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

  it("API失敗時はフォームを壊さず自動保存しない", async () => {
    fetchWeatherForecastMock.mockRejectedValue(
      new ApiClientError(502, {
        message: "天気情報を取得できませんでした。手入力で登録できます。",
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
      getButtonByText("天気を取得")!.dispatchEvent(
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

  it("変換できない raw telop は見える形で保持し、その他として案内する", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 1,
        location_name: "川口",
        forecast_area_code: "110010",
        weather_code: "other",
        temperature_high: 18,
        temperature_low: null,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "晴一時雨",
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
      (container.querySelector("#weather-condition") as HTMLSelectElement)
        .value,
    ).toBe("other");
    expect(container.textContent).toContain("晴一時雨");
    expect(container.textContent).toContain(
      "この表記は現在の weather_code に変換できなかったため、「その他」として反映しています。",
    );
  });
  it("JMA の時間帯入り raw telop は整形済みの表記で表示される", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithJmaCodes],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 3,
        location_name: "支社 JMA",
        forecast_area_code: null,
        weather_code: "sunny_then_cloudy",
        temperature_high: 20,
        temperature_low: 12,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "晴れ 夜のはじめ頃 くもり",
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
      (container.querySelector("#weather-condition") as HTMLSelectElement)
        .value,
    ).toBe("sunny_then_cloudy");
    expect(container.textContent).toContain("取得した予報表記");
    expect(container.textContent).toContain("晴れ 夜のはじめ頃 くもり");
    expect(container.textContent).not.toContain(
      "weather_code に変換できなかったため",
    );
  });
  it("気温が取得できない forecast では補足メッセージを表示し、気温欄は空のままにする", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValue({
      locations: [savedLocationWithJmaCodes],
    });
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 3,
        location_name: "自宅 JMA",
        forecast_area_code: null,
        weather_code: "sunny_then_cloudy",
        temperature_high: null,
        temperature_low: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "晴れ 夜のはじめ頃 くもり",
      },
    });
    createWeatherRecordMock.mockResolvedValue({
      message: "created",
      weatherRecord: {
        id: 21,
        weather_date: "2026-05-01",
        location_id: 3,
        location_name: "自宅 JMA",
        location_name_snapshot: "自宅 JMA",
        forecast_area_code_snapshot: null,
        weather_code: "sunny_then_cloudy",
        temperature_high: null,
        temperature_low: null,
        memo: null,
        source_type: "forecast_api",
        source_name: "jma_forecast_json",
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
      "天気情報を取得しました。内容を確認して保存してください。",
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

  it("気温が取得できた forecast では補足メッセージを表示しない", async () => {
    fetchWeatherForecastMock.mockResolvedValue({
      message: "fetched",
      forecast: {
        weather_date: "2026-05-01",
        location_id: 1,
        location_name: "自宅",
        forecast_area_code: "110010",
        weather_code: "cloudy_then_rain",
        temperature_high: 22,
        temperature_low: 13,
        source_type: "forecast_api",
        source_name: "tsukumijima",
        source_fetched_at: "2026-05-01T10:00:00+09:00",
        raw_telop: "曇りのち雨",
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

    expect(container.textContent).not.toContain(
      "気温は取得できませんでした。必要に応じて手入力してください。",
    );
  });
});
