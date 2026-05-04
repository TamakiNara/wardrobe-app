// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  WearLogCalendarWeatherSummary,
  WeatherCalendarStatus,
} from "@/types/wear-logs";
import type { WeatherCode } from "@/types/weather";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const apiFetchMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/wear-logs",
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/api/client", () => ({
  apiFetch: apiFetchMock,
  ApiClientError: class ApiClientError extends Error {
    status: number;
    data: { message?: string } | null;

    constructor(status: number, data: { message?: string } | null) {
      super(data?.message ?? `status ${status}`);
      this.status = status;
      this.data = data;
    }
  },
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

function findDayButton(container: HTMLDivElement, date: string) {
  return container.querySelector<HTMLButtonElement>(
    `button[data-date="${date}"]`,
  );
}

function buildWeatherSummary(
  status: WeatherCalendarStatus,
  weatherCode: WeatherCode | null,
): WearLogCalendarWeatherSummary {
  return {
    status,
    weather_code: weatherCode,
    has_weather: weatherCode !== null,
  };
}

describe("WearLogCalendar", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    searchParamsValue = "month=2026-03";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カレンダーと日付詳細モーダルを表示できる", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-05",
      wearLogs: [
        {
          id: 11,
          status: "planned",
          event_date: "2026-03-05",
          display_order: 1,
          source_outfit_name: "春コーデ",
          items_count: 2,
          memo: "メモあり",
          outdoor_temperature_feel: "slightly_cold",
          indoor_temperature_feel: "comfortable",
          overall_rating: "good",
          feedback_tags: [
            "temperature_gap_ready",
            "morning_hot",
            "rain_problem",
          ],
          feedback_memo: "振り返りメモ",
          thumbnail_items: [
            {
              source_item_id: 1,
              category: "tops",
              colors: [{ role: "main", hex: "#ffffff", label: "白" }],
            },
            {
              source_item_id: 2,
              category: "bottoms",
              colors: [{ role: "main", hex: "#111111", label: "黒" }],
            },
          ],
        },
      ],
      weatherRecords: [
        {
          id: 31,
          weather_date: "2026-03-05",
          location_id: 5,
          location_name: "川口",
          location_name_snapshot: "川口",
          forecast_area_code_snapshot: "110000",
          weather_code: "sunny",
          temperature_high: 22,
          temperature_low: 13,
          memo: "日中はよく晴れた",
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: "2026-03-05T08:00:00Z",
          updated_at: "2026-03-05T08:00:00Z",
        },
      ],
    });

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [
            {
              date: "2026-03-05",
              plannedCount: 1,
              wornCount: 1,
              weather: buildWeatherSummary("forecast", "rain"),
              dots: [
                { status: "planned", has_feedback: false },
                { status: "worn", has_feedback: true },
                { status: "planned", has_feedback: true },
              ],
              has_feedback: true,
              overflowCount: 1,
            },
          ],
          skinTonePreset: "neutral_medium",
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("カレンダー");
    expect(container.textContent).toContain("予定");
    expect(container.textContent).toContain("着用済み");
    expect(container.textContent).toContain("予報の天気");
    expect(container.textContent).toContain("実績の天気");
    expect(container.textContent).toContain("振り返りあり");
    expect(container.textContent).not.toContain("手入力の天気");
    expect(container.textContent).toContain("2026年3月");
    expect(container.textContent).toContain("+1");
    expect(
      container.querySelector('[data-legend-weather-status="forecast"]'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-legend-weather-status="forecast"]')
        ?.getAttribute("data-legend-weather-icon"),
    ).toBe("sun");
    expect(
      container.querySelector(
        '[data-legend-weather-status="forecast"] svg[data-lucide="cloud"]',
      ),
    ).toBeNull();
    expect(
      findDayButton(container, "2026-03-05")?.querySelector(
        '[data-weather-status="forecast"][data-weather-code="rain"]',
      ),
    ).not.toBeNull();

    await act(async () => {
      findDayButton(container, "2026-03-05")?.click();
      await waitForEffects();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/wear-logs/by-date?event_date=2026-03-05",
    );
    expect(container.textContent).toContain("日付詳細");
    expect(container.textContent).toContain("春コーデ");
    expect(container.textContent).toContain("メモあり");
    expect(container.textContent).toContain("評価");
    expect(container.textContent).toContain("よかった");
    expect(container.textContent).toContain("川口");
    expect(container.textContent).toContain("晴れ");
    expect(
      container.querySelector('[data-weather-source-status="manual"]')
        ?.textContent,
    ).toContain("手入力");
    expect(container.textContent).toContain("最高 22℃");
    expect(container.textContent).toContain("最低 13℃");
    expect(container.textContent).toContain("メモ: 日中はよく晴れた");
    expect(container.textContent).not.toContain("振り返りメモ");
    expect(container.innerHTML).toContain('href="/wear-logs/11"');
    expect(container.innerHTML).toContain("wear-log-modal-color-thumbnail");
  });

  it("日付詳細モーダルで複数天気のバッジと内容を確認できる", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-06",
      wearLogs: [
        {
          id: 21,
          status: "worn",
          event_date: "2026-03-06",
          display_order: 1,
          source_outfit_name: "通勤コーデ",
          items_count: 1,
          memo: null,
          outdoor_temperature_feel: null,
          indoor_temperature_feel: null,
          overall_rating: null,
          feedback_tags: [],
          feedback_memo: null,
          thumbnail_items: [
            {
              source_item_id: 1,
              category: "tops",
              colors: [{ role: "main", hex: "#ffffff", label: "白" }],
            },
          ],
        },
      ],
      weatherRecords: [
        {
          id: 42,
          weather_date: "2026-03-06",
          location_id: 1,
          location_name: "川口",
          location_name_snapshot: "川口",
          forecast_area_code_snapshot: null,
          weather_code: "sunny",
          temperature_high: 25,
          temperature_low: 14,
          memo: "日差しが強かった",
          source_type: "historical_api",
          source_name: "open_meteo_historical",
          source_fetched_at: "2026-03-07T06:00:00Z",
          created_at: "2026-03-07T06:00:00Z",
          updated_at: "2026-03-07T06:00:00Z",
        },
        {
          id: 43,
          weather_date: "2026-03-06",
          location_id: null,
          location_name: "秋田",
          location_name_snapshot: "秋田",
          forecast_area_code_snapshot: null,
          weather_code: "sunny",
          temperature_high: null,
          temperature_low: null,
          memo: null,
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: "2026-03-06T08:00:00Z",
          updated_at: "2026-03-06T08:00:00Z",
        },
        {
          id: 41,
          weather_date: "2026-03-06",
          location_id: 2,
          location_name: "さいたま",
          location_name_snapshot: "さいたま",
          forecast_area_code_snapshot: null,
          weather_code: "cloudy",
          temperature_high: 23,
          temperature_low: 13,
          memo: null,
          source_type: "forecast_api",
          source_name: "open_meteo_jma_forecast",
          source_fetched_at: "2026-03-06T06:00:00Z",
          created_at: "2026-03-06T06:00:00Z",
          updated_at: "2026-03-06T06:00:00Z",
        },
      ],
    });

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [
            {
              date: "2026-03-06",
              plannedCount: 0,
              wornCount: 1,
              weather: buildWeatherSummary("observed", "sunny"),
              dots: [{ status: "worn", has_feedback: false }],
              has_feedback: false,
              overflowCount: 0,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    await act(async () => {
      findDayButton(container, "2026-03-06")?.click();
      await waitForEffects();
    });

    const statusBadges = Array.from(
      container.querySelectorAll("[data-weather-source-status]"),
    ).map((element) => element.textContent?.trim());

    expect(statusBadges).toEqual(["実績", "手入力", "予報"]);
    expect(container.textContent).toContain("この日の天気");
    expect(container.textContent).toContain("さいたま");
    expect(container.textContent).toContain("川口");
    expect(container.textContent).toContain("秋田");
    expect(container.textContent).toContain("最高 23℃");
    expect(container.textContent).toContain("最低 13℃");
    expect(container.textContent).toContain("最高 25℃");
    expect(container.textContent).toContain("最低 14℃");
    expect(container.textContent).toContain("メモ: 日差しが強かった");
    expect(
      container.querySelectorAll('a[href*="/wear-logs/weather?"]').length,
    ).toBe(4);

    const modalText = container.textContent ?? "";
    expect(modalText.indexOf("川口")).toBeLessThan(modalText.indexOf("秋田"));
    expect(modalText.indexOf("秋田")).toBeLessThan(
      modalText.indexOf("さいたま"),
    );
  });

  it("日曜・土曜・祝日を色分けして表示する", async () => {
    vi.setSystemTime(new Date("2026-02-20T09:00:00+09:00"));

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [],
        }),
      );
      await waitForEffects();
    });

    const sundayHeader = container.querySelector<HTMLDivElement>(
      'div[data-day-type="sunday"]',
    );
    const saturdayHeader = container.querySelector<HTMLDivElement>(
      'div[data-day-type="saturday"]',
    );
    const sundayButton = findDayButton(container, "2026-03-01");
    const saturdayButton = findDayButton(container, "2026-03-07");
    const holidayButton = findDayButton(container, "2026-03-20");

    expect(sundayHeader?.className).toContain("text-rose-600");
    expect(saturdayHeader?.className).toContain("text-sky-600");
    expect(sundayButton?.className).toContain("border-rose-200");
    expect(saturdayButton?.className).toContain("border-sky-200");
    expect(holidayButton?.getAttribute("data-day-type")).toBe("holiday");
    expect(holidayButton?.getAttribute("data-holiday-name")).toBe("春分の日");
  });

  it("天気アイコン・着用状態・振り返りをその順で表示する", async () => {
    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [
            {
              date: "2026-03-05",
              plannedCount: 2,
              wornCount: 2,
              weather: buildWeatherSummary("observed", "sunny"),
              dots: [
                { status: "planned", has_feedback: false },
                { status: "worn", has_feedback: false },
                { status: "planned", has_feedback: true },
                { status: "worn", has_feedback: true },
              ],
              has_feedback: true,
              overflowCount: 1,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    const dayButton = findDayButton(container, "2026-03-05");
    const markerRow = dayButton?.children[1] as HTMLElement | undefined;
    const weatherMarker = dayButton?.querySelector<HTMLSpanElement>(
      '[data-weather-status="observed"][data-weather-code="sunny"]',
    );
    const plannedDot = dayButton?.querySelector<HTMLSpanElement>(
      'span[data-marker-kind="dot-outline"][data-status="planned"]',
    );
    const wornDot = dayButton?.querySelector<HTMLSpanElement>(
      'span[data-marker-kind="check-filled"][data-status="worn"]',
    );
    const feedbackMarker = dayButton?.querySelector<HTMLSpanElement>(
      'span[data-marker-kind="feedback-note"]',
    );

    expect(weatherMarker).not.toBeNull();
    expect(weatherMarker?.className).toContain("text-emerald-600");
    expect(plannedDot).not.toBeNull();
    expect(wornDot).not.toBeNull();
    expect(feedbackMarker).not.toBeNull();
    expect(markerRow?.children[0]).toBe(weatherMarker);
    expect(markerRow?.children[1]).toBe(plannedDot?.parentElement);
    expect(markerRow?.children[2]).toBe(wornDot?.parentElement);
    expect(markerRow?.children[markerRow.children.length - 2]).toBe(
      feedbackMarker,
    );
    expect(feedbackMarker?.className).toContain("text-slate-500");
    expect(feedbackMarker?.getAttribute("data-feedback-icon")).toBe(
      "square-pen",
    );
    expect(container.textContent).toContain("+1");
  });

  it("manual と forecast を色分けして表示する", async () => {
    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-05",
          weekStart: "monday",
          days: [
            {
              date: "2026-05-03",
              plannedCount: 0,
              wornCount: 1,
              weather: buildWeatherSummary("manual", "cloudy"),
              dots: [{ status: "worn", has_feedback: false }],
              has_feedback: false,
              overflowCount: 0,
            },
            {
              date: "2026-05-04",
              plannedCount: 1,
              wornCount: 0,
              weather: buildWeatherSummary("forecast", "rain"),
              dots: [{ status: "planned", has_feedback: false }],
              has_feedback: false,
              overflowCount: 0,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    const manualMarker = findDayButton(container, "2026-05-03")?.querySelector(
      '[data-weather-status="manual"][data-weather-code="cloudy"]',
    );
    const forecastMarker = findDayButton(
      container,
      "2026-05-04",
    )?.querySelector(
      '[data-weather-status="forecast"][data-weather-code="rain"]',
    );

    expect(manualMarker).not.toBeNull();
    expect(manualMarker?.className).toContain("text-emerald-500");
    expect(forecastMarker).not.toBeNull();
    expect(forecastMarker?.className).toContain("text-sky-600");
  });

  it("振り返りがない日は day-level 振り返りアイコンを表示しない", async () => {
    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [
            {
              date: "2026-03-06",
              plannedCount: 1,
              wornCount: 0,
              weather: buildWeatherSummary("none", null),
              dots: [{ status: "planned", has_feedback: false }],
              has_feedback: false,
              overflowCount: 0,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    const dayButton = findDayButton(container, "2026-03-06");

    expect(dayButton?.querySelector("[data-weather-status]")).toBeNull();
    expect(
      dayButton?.querySelector('[data-marker-kind="feedback-note"]'),
    ).toBeNull();
    expect(
      dayButton?.querySelector('[data-marker-kind="dot-outline"]'),
    ).not.toBeNull();
  });

  it("今日・過去日・月外日を区別して表示する", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-05",
      wearLogs: [],
      weatherRecords: [],
    });

    vi.setSystemTime(new Date("2026-03-26T09:00:00+09:00"));

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [],
        }),
      );
      await waitForEffects();
    });

    const todayButton = findDayButton(container, "2026-03-26");
    const pastButton = findDayButton(container, "2026-03-05");
    const otherMonthButton = findDayButton(container, "2026-02-23");

    expect(todayButton?.getAttribute("data-today")).toBe("true");
    expect(todayButton?.innerHTML).toContain("border-blue-200");
    expect(pastButton?.className).toContain("bg-gray-100");
    expect(otherMonthButton?.getAttribute("data-current-month")).toBe("false");
    expect(otherMonthButton?.className).toContain("text-gray-300");

    await act(async () => {
      pastButton?.click();
      await waitForEffects();
    });

    expect(pastButton?.getAttribute("data-selected")).toBe("true");
    expect(pastButton?.className).toContain("border-blue-500");
  });

  it("記録がない日付でも新規追加導線を表示する", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-08",
      wearLogs: [],
      weatherRecords: [],
    });

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "monday",
          days: [],
        }),
      );
      await waitForEffects();
    });

    await act(async () => {
      findDayButton(container, "2026-03-08")?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("この日の着用履歴はまだありません");
    expect(container.innerHTML).toContain(
      'href="/wear-logs/new?event_date=2026-03-08&amp;display_order=1"',
    );
  });

  it("月送りでは month query を更新する", async () => {
    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          days: [],
        }),
      );
      await waitForEffects();
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("次の月"),
    );

    await act(async () => {
      nextButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/wear-logs?month=2026-04", {
      scroll: false,
    });
  });

  it("週開始日を sunday にすると日曜始まりで表示する", async () => {
    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-03",
          weekStart: "sunday",
          days: [],
        }),
      );
      await waitForEffects();
    });

    const weekdayHeaders = Array.from(
      container.querySelectorAll(".grid.grid-cols-7 > div"),
    )
      .slice(0, 7)
      .map((node) => node.textContent);

    expect(weekdayHeaders).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });

  it("09:00 JST より前でもローカル日の today 判定を使う", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-05-01",
      wearLogs: [],
      weatherRecords: [],
    });

    vi.setSystemTime(new Date("2026-05-01T08:00:00+09:00"));

    const { default: WearLogCalendar } = await import("./wear-log-calendar");

    await act(async () => {
      root.render(
        React.createElement(WearLogCalendar, {
          month: "2026-05",
          weekStart: "monday",
          days: [],
        }),
      );
      await waitForEffects();
    });

    expect(
      findDayButton(container, "2026-05-01")?.getAttribute("data-today"),
    ).toBe("true");
    expect(
      findDayButton(container, "2026-04-30")?.getAttribute("data-today"),
    ).toBe("false");
  });
});
