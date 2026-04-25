// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("凡例と日付詳細モーダルを表示できる", async () => {
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
              dots: [
                { status: "planned" },
                { status: "worn" },
                { status: "planned" },
              ],
              overflowCount: 1,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("カレンダー");
    expect(container.textContent).toContain("予定");
    expect(container.textContent).toContain("着用済み");
    expect(container.textContent).toContain("土曜");
    expect(container.textContent).toContain("日曜");
    expect(container.textContent).toContain("2026年3月");
    expect(container.textContent).toContain("+1");

    const dayButton = findDayButton(container, "2026-03-05");

    await act(async () => {
      dayButton?.click();
      await waitForEffects();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/wear-logs/by-date?event_date=2026-03-05",
    );
    expect(container.textContent).toContain("日付詳細");
    expect(container.textContent).toContain("春コーデ");
    expect(container.textContent).toContain("メモあり");
    expect(container.innerHTML).toContain('href="/wear-logs/11"');
    expect(container.innerHTML).toContain("wear-log-modal-color-thumbnail");
  });

  it("土曜と日曜を控えめな色分けで表示する", async () => {
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
    const saturdayHeader = Array.from(
      container.querySelectorAll<HTMLDivElement>(
        'div[data-day-type="saturday"]',
      ),
    )[0];
    const sundayButton = findDayButton(container, "2026-03-01");
    const saturdayButton = findDayButton(container, "2026-03-07");

    expect(sundayHeader?.className).toContain("text-rose-600");
    expect(saturdayHeader?.className).toContain("text-sky-600");
    expect(sundayButton?.getAttribute("data-day-type")).toBe("sunday");
    expect(saturdayButton?.getAttribute("data-day-type")).toBe("saturday");
    expect(sundayButton?.className).toContain("border-rose-200");
    expect(saturdayButton?.className).toContain("border-sky-200");
  });

  it("予定と着用済みのドット色を凡例と同じトーンで表示する", async () => {
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
              dots: [{ status: "planned" }, { status: "worn" }],
              overflowCount: 0,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    const plannedDot = container.querySelector<HTMLSpanElement>(
      'button[data-date="2026-03-05"] span[data-status="planned"]',
    );
    const wornDot = container.querySelector<HTMLSpanElement>(
      'button[data-date="2026-03-05"] span[data-status="worn"]',
    );

    expect(plannedDot?.className).toContain("border-blue-300");
    expect(plannedDot?.className).toContain("bg-white");
    expect(wornDot?.className).toContain("bg-blue-600");
  });

  it("今日と選択状態を表示できる", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-05",
      wearLogs: [],
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

  it("空の日ではその日付で新規追加導線を表示する", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-08",
      wearLogs: [],
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

    const dayButton = findDayButton(container, "2026-03-08");

    await act(async () => {
      dayButton?.click();
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

  it("週始まりを sunday にすると日曜始まりで並ぶ", async () => {
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
});
