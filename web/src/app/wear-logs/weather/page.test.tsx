// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const fetchUserWeatherLocationsMock = vi.fn();
const fetchWeatherRecordsByDateMock = vi.fn();
const createWeatherRecordMock = vi.fn();
const updateWeatherRecordMock = vi.fn();
const deleteWeatherRecordMock = vi.fn();
let searchParamsValue =
  "date=2026-04-30&returnTo=%2Fwear-logs%3Fmonth%3D2026-04";
const routerMock = { push: pushMock };

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserWeatherLocations: fetchUserWeatherLocationsMock,
}));

vi.mock("@/lib/api/weather", () => ({
  fetchWeatherRecordsByDate: fetchWeatherRecordsByDateMock,
  createWeatherRecord: createWeatherRecordMock,
  updateWeatherRecord: updateWeatherRecordMock,
  deleteWeatherRecord: deleteWeatherRecordMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function setInputValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("WearLogWeatherPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    searchParamsValue =
      "date=2026-04-30&returnTo=%2Fwear-logs%3Fmonth%3D2026-04";
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
    fetchWeatherRecordsByDateMock.mockResolvedValue({ weatherRecords: [] });
    createWeatherRecordMock.mockResolvedValue({});
    updateWeatherRecordMock.mockResolvedValue({});
    deleteWeatherRecordMock.mockResolvedValue({});
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("地域が未登録でも一時的な地域で登録できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValueOnce({ locations: [] });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("2026年4月30日の天気");
    expect(container.textContent).toContain("登録済みの地域");
    expect(container.textContent).toContain("今回だけの地域");
    expect(container.textContent).toContain(
      "普段使う地域は保存できます。旅行先などは今回だけ入力できます。",
    );
    const regionLabel = container.textContent?.indexOf("地域") ?? -1;
    const regionDescription =
      container.textContent?.indexOf(
        "普段使う地域は保存できます。旅行先などは今回だけ入力できます。",
      ) ?? -1;
    const savedTab = container.textContent?.indexOf("登録済みの地域") ?? -1;
    expect(regionLabel).toBeGreaterThanOrEqual(0);
    expect(regionDescription).toBeGreaterThan(regionLabel);
    expect(savedTab).toBeGreaterThan(regionDescription);

    const temporaryButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("今回だけの地域"));

    await act(async () => {
      temporaryButton?.click();
      await waitForEffects();
    });

    const locationInput = container.querySelector<HTMLInputElement>(
      "#temporary-weather-location",
    );

    expect(locationInput).not.toBeNull();
    expect(container.textContent).toContain("地域名");
    expect(locationInput?.getAttribute("placeholder")).toBe(
      "例: 秋田市 / 東京23区 / 横浜",
    );
  });

  it("保存済み地域を選んで天気を登録できる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const locationSelect =
      container.querySelector<HTMLSelectElement>("#weather-location");
    const weatherSelect =
      container.querySelector<HTMLSelectElement>("#weather-condition");
    const highInput =
      container.querySelector<HTMLInputElement>("#temperature-high");
    const lowInput =
      container.querySelector<HTMLInputElement>("#temperature-low");
    const memoInput =
      container.querySelector<HTMLTextAreaElement>("#weather-memo");
    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("天気を登録"));

    expect(locationSelect?.value).toBe("1");
    expect(container.textContent).toContain("2026年4月30日");
    expect(container.textContent).toContain("くもり");
    expect(container.textContent).not.toContain("荒天");
    expect(highInput?.getAttribute("type")).toBe("number");
    expect(lowInput?.getAttribute("type")).toBe("number");
    expect(highInput?.getAttribute("placeholder")).toBe("例: 22");
    expect(lowInput?.getAttribute("placeholder")).toBe("例: 13");

    await act(async () => {
      weatherSelect!.value = "sunny";
      weatherSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      setInputValue(highInput!, "22.5");
      setInputValue(lowInput!, "13");
      setInputValue(memoInput!, "日差しが強かった");
      await waitForEffects();
    });

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(createWeatherRecordMock).toHaveBeenCalledWith({
      weather_date: "2026-04-30",
      location_id: 1,
      location_name: null,
      save_location: undefined,
      weather_condition: "sunny",
      temperature_high: 22.5,
      temperature_low: 13,
      memo: "日差しが強かった",
    });
  });

  it("一時的な地域名だけで天気を登録できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValueOnce({ locations: [] });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const temporaryButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("今回だけの地域"));

    await act(async () => {
      temporaryButton?.click();
      await waitForEffects();
    });

    const locationInput = container.querySelector<HTMLInputElement>(
      "#temporary-weather-location",
    );
    const weatherSelect =
      container.querySelector<HTMLSelectElement>("#weather-condition");
    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("天気を登録"));

    await act(async () => {
      setInputValue(locationInput!, "東京23区");
      weatherSelect!.value = "cloudy";
      weatherSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(createWeatherRecordMock).toHaveBeenCalledWith({
      weather_date: "2026-04-30",
      location_id: null,
      location_name: "東京23区",
      save_location: false,
      weather_condition: "cloudy",
      temperature_high: null,
      temperature_low: null,
      memo: null,
    });
  });

  it("一時的な地域を保存対象として登録できる", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValueOnce({ locations: [] });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const temporaryButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("今回だけの地域"));

    await act(async () => {
      temporaryButton?.click();
      await waitForEffects();
    });

    const locationInput = container.querySelector<HTMLInputElement>(
      "#temporary-weather-location",
    );
    const saveLocationCheckbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("天気を登録"));

    await act(async () => {
      setInputValue(locationInput!, "秋田市");
      saveLocationCheckbox!.click();
      await waitForEffects();
    });

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(createWeatherRecordMock).toHaveBeenCalledWith({
      weather_date: "2026-04-30",
      location_id: null,
      location_name: "秋田市",
      save_location: true,
      weather_condition: "sunny",
      temperature_high: null,
      temperature_low: null,
      memo: null,
    });
  });

  it("一時地域を保存する補足文が表示される", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValueOnce({ locations: [] });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const temporaryButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("今回だけの地域"));

    await act(async () => {
      temporaryButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("次回からも使う");
    expect(container.textContent).toContain(
      "オンにすると、次回から「登録済みの地域」で選べます。",
    );
  });

  it("登録済み天気で地域名とメモを区別して表示する", async () => {
    fetchWeatherRecordsByDateMock.mockResolvedValueOnce({
      weatherRecords: [
        {
          id: 31,
          weather_date: "2026-04-30",
          location_id: 1,
          location_name: "テスト",
          location_name_snapshot: "テスト",
          forecast_area_code_snapshot: "110000",
          weather_condition: "sunny",
          temperature_high: 22,
          temperature_low: 13,
          memo: "テスト",
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: null,
          updated_at: null,
        },
        {
          id: 32,
          weather_date: "2026-04-30",
          location_id: 2,
          location_name: "川口",
          location_name_snapshot: "川口",
          forecast_area_code_snapshot: "130010",
          weather_condition: "cloudy",
          temperature_high: 20,
          temperature_low: 12,
          memo: null,
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: null,
          updated_at: null,
        },
      ],
    });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("テスト");
    expect(container.textContent).toContain("晴れ / 最高22℃ / 最低13℃");
    expect(container.textContent).toContain("メモ: テスト");
    expect(container.textContent).toContain("川口");
    expect(container.textContent).toContain("くもり / 最高20℃ / 最低12℃");
  });

  it("登録済み地域がない場合は地域設定導線を表示する", async () => {
    fetchUserWeatherLocationsMock.mockResolvedValueOnce({ locations: [] });
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const savedButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("登録済みの地域"));

    await act(async () => {
      savedButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("登録済みの地域がありません。");
    expect(container.textContent).toContain(
      "よく使う地域は地域設定から追加できます。",
    );
    expect(container.textContent).toContain("地域設定を開く");
  });

  it("地域選択をタブとして切り替えられる", async () => {
    const { default: WearLogWeatherPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(WearLogWeatherPage));
      await waitForEffects();
    });

    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const tabList = container.querySelector<HTMLElement>('[role="tablist"]');
    expect(tabs).toHaveLength(2);
    expect(tabList).not.toBeNull();
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("false");

    await act(async () => {
      tabs[1]?.click();
      await waitForEffects();
    });

    expect(tabs[0]?.getAttribute("aria-selected")).toBe("false");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(
      container.querySelector<HTMLInputElement>("#temporary-weather-location"),
    ).not.toBeNull();
  });
});
