import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const redirectMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
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

  it("空状態を表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
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
    });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("着用履歴がまだありません");
    expect(markup).toContain("着用履歴を追加");
  });

  it("一覧に planned / worn と編集導線を表示する", async () => {
    fetchMock.mockResolvedValueOnce({
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
            source_outfit_name: "通勤コーディネート",
            source_outfit_status: "active",
            has_disposed_items: false,
            memo: "朝の予定",
            items_count: 2,
          },
          {
            id: 2,
            status: "worn",
            event_date: "2026-03-23",
            display_order: 2,
            source_outfit_id: null,
            source_outfit_name: null,
            source_outfit_status: null,
            has_disposed_items: true,
            memo: null,
            items_count: 1,
          },
        ],
        meta: {
          total: 2,
          totalAll: 2,
          page: 1,
          lastPage: 1,
        },
      }),
    });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("planned");
    expect(markup).toContain("worn");
    expect(markup).toContain("通勤コーディネート");
    expect(markup).toContain("アイテム 1 件");
    expect(markup).toContain("一部アイテムは現在利用不可です。");
    expect(markup).toContain('href="/wear-logs/1/edit"');
    expect(markup).not.toContain(">削除<");
  });

  it("削除完了メッセージを表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
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
    });

    const { default: WearLogsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogsPage({ searchParams: Promise.resolve({ message: "deleted" }) }),
    );

    expect(markup).toContain("着用履歴を削除しました。");
  });
});
