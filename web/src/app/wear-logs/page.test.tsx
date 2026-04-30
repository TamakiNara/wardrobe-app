import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const redirectMock = vi.fn();
const fetchMock = vi.fn();
const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  usePathname: () => "/wear-logs",
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

describe("WearLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("デフォルトではカレンダービューだけを表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          month: "2026-03",
          days: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            calendarWeekStart: "monday",
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/wear-logs/calendar?");
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/api/wear-logs?"),
      ),
    ).toBe(false);
    expect(markup).toContain('href="/wear-logs?view=list"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain("wear-log-color-thumbnail");
  });

  it("一覧ビューでは一覧だけを表示してカレンダー API を呼ばない", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          wearLogs: [
            {
              id: 1,
              status: "planned",
              event_date: "2026-03-24",
              display_order: 1,
              source_outfit_id: 5,
              source_outfit_name: "春コーデ",
              source_outfit_status: "active",
              has_disposed_items: false,
              memo: "メモあり",
              overall_rating: "good",
              feedback_tags: ["comfortable_all_day", "rain_problem"],
              items_count: 2,
              thumbnail_items: [
                {
                  source_item_id: 31,
                  category: "tops",
                  colors: [{ role: "main", hex: "#eeeeee", label: "ホワイト" }],
                },
              ],
            },
          ],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 2,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            calendarWeekStart: "monday",
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({
        searchParams: Promise.resolve({
          view: "list",
          keyword: "春",
          status: "planned",
          month: "2026-03",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/api/wear-logs?keyword=%E6%98%A5&status=planned",
    );
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/api/wear-logs/calendar?"),
      ),
    ).toBe(false);
    expect(markup).toContain("春コーデ");
    expect(markup).toContain("wear-log-color-thumbnail");
    expect(markup).toContain("総合評価:");
    expect(markup).toContain('href="/wear-logs/1"');
  });

  it("タブ切り替えリンクにフィルタ状態を引き継ぐ", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          wearLogs: [],
          meta: {
            total: 0,
            totalAll: 0,
            page: 1,
            lastPage: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            calendarWeekStart: "monday",
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({
        searchParams: Promise.resolve({
          view: "list",
          keyword: "春",
          status: "planned",
          date_from: "2026-03-01",
          date_to: "2026-03-31",
          month: "2026-03",
          sort: "date_asc",
        }),
      }),
    );

    expect(markup).toContain('name="view" value="list"');
    expect(markup).toContain(
      'href="/wear-logs?keyword=%E6%98%A5&amp;status=planned&amp;date_from=2026-03-01&amp;date_to=2026-03-31&amp;month=2026-03&amp;sort=date_asc"',
    );
    expect(markup).toContain(
      'href="/wear-logs?view=list&amp;keyword=%E6%98%A5&amp;status=planned&amp;date_from=2026-03-01&amp;date_to=2026-03-31&amp;month=2026-03&amp;sort=date_asc"',
    );
  });

  it("カレンダービューでも共通フィルタを維持したまま取得する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          month: "2026-03",
          days: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            calendarWeekStart: "monday",
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: WearLogsPage } = await import("./page");
    await WearLogsPage({
      searchParams: Promise.resolve({
        keyword: "春",
        status: "planned",
        date_from: "2026-03-01",
        date_to: "2026-03-31",
        month: "2026-03",
        sort: "date_asc",
      }),
    });

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/api/wear-logs/calendar?keyword=%E6%98%A5&status=planned&date_from=2026-03-01&date_to=2026-03-31&month=2026-03",
    );
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("sort=");
  });

  it("一覧ビューのページネーションでも view=list を維持する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          wearLogs: [
            {
              id: 1,
              status: "planned",
              event_date: "2026-03-24",
              display_order: 1,
              source_outfit_id: null,
              source_outfit_name: null,
              source_outfit_status: null,
              has_disposed_items: false,
              memo: null,
              overall_rating: null,
              feedback_tags: [],
              items_count: 1,
              thumbnail_items: [],
            },
          ],
          meta: {
            total: 3,
            totalAll: 3,
            page: 2,
            lastPage: 3,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            calendarWeekStart: "monday",
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({
        searchParams: Promise.resolve({
          view: "list",
          keyword: "春",
          page: "2",
        }),
      }),
    );

    expect(markup).toContain(
      'href="/wear-logs?view=list&amp;keyword=%E6%98%A5&amp;page=1"',
    );
    expect(markup).toContain(
      'href="/wear-logs?view=list&amp;keyword=%E6%98%A5&amp;page=3"',
    );
  });
});
