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

function findCurrentMonthDayButton(container: HTMLDivElement, day: number) {
  return container.querySelector<HTMLButtonElement>(
    `button[data-date="2026-03-${String(day).padStart(2, "0")}"]`,
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

  it("月表示を描画し、日付クリックで日詳細シートと詳細導線を表示する", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-05",
      wearLogs: [
        {
          id: 11,
          status: "planned",
          event_date: "2026-03-05",
          display_order: 1,
          source_outfit_name: "通勤コーデ",
          items_count: 2,
          memo: "朝会あり",
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
              dots: [{ status: "planned" }, { status: "worn" }, { status: "planned" }],
              overflowCount: 1,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("2026年3月");
    expect(container.textContent).toContain("+1");
    expect(container.textContent).not.toContain("予定 1");
    expect(container.textContent).not.toContain("着用 1");

    const dayButton = findCurrentMonthDayButton(container, 5);

    await act(async () => {
      dayButton?.click();
      await waitForEffects();
    });

    expect(apiFetchMock).toHaveBeenCalledWith("/api/wear-logs/by-date?event_date=2026-03-05");
    expect(container.textContent).toContain("日別詳細");
    expect(container.textContent).toContain("通勤コーデ");
    expect(container.textContent).toContain("朝会あり");
    expect(container.innerHTML).toContain('href="/wear-logs/11"');
    expect(container.innerHTML).toContain("wear-log-modal-color-thumbnail");
    expect(container.innerHTML).not.toContain("wear-log-color-thumbnail");
  });

  it("空の日でもシートを開き、この日で新規作成導線を表示する", async () => {
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

    const dayButton = findCurrentMonthDayButton(container, 8);

    await act(async () => {
      dayButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("この日の着用履歴はまだありません");
    expect(container.innerHTML).toContain('href="/wear-logs/new?event_date=2026-03-08&amp;display_order=1"');
  });

  it("選択日 / 今日 / 他月日 / 過去日の状態差を崩さず表示する", async () => {
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

    const todayButton = container.querySelector<HTMLButtonElement>('button[data-date="2026-03-26"]');
    const pastButton = container.querySelector<HTMLButtonElement>('button[data-date="2026-03-05"]');
    const otherMonthButton = container.querySelector<HTMLButtonElement>('button[data-date="2026-02-23"]');

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

  it("過去 planned は日詳細で補助表示する", async () => {
    apiFetchMock.mockResolvedValue({
      event_date: "2026-03-05",
      wearLogs: [
        {
          id: 21,
          status: "planned",
          event_date: "2026-03-05",
          display_order: 1,
          source_outfit_name: "通勤コーデ",
          items_count: 2,
          memo: null,
          thumbnail_items: [
            {
              source_item_id: 1,
              category: "tops",
              colors: [{ role: "main", hex: "#ffffff", label: "白" }],
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
              wornCount: 0,
              dots: [{ status: "planned" }],
              overflowCount: 0,
            },
          ],
        }),
      );
      await waitForEffects();
    });

    const dayButton = findCurrentMonthDayButton(container, 5);

    await act(async () => {
      dayButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("過去の未完了予定です。");
    expect(container.innerHTML).toContain("bg-gray-100");
  });

  it("月送りで month query を更新する", async () => {
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

    const nextButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("次の月"),
    );

    await act(async () => {
      nextButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/wear-logs?month=2026-04", { scroll: false });
  });

  it("週開始を sunday にすると日曜始まりで並ぶ", async () => {
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

    const weekdayHeaders = Array.from(container.querySelectorAll(".grid.grid-cols-7 > div"))
      .slice(0, 7)
      .map((node) => node.textContent);

    expect(weekdayHeaders).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });
});
