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

vi.mock("@/components/wear-logs/wear-log-form", () => ({
  default: ({
    initialStatus,
    initialEventDate,
    initialDisplayOrder,
    initialCurrentSeason,
  }: {
    initialStatus?: string;
    initialEventDate?: string;
    initialDisplayOrder?: number;
    initialCurrentSeason?: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-initial-status": initialStatus ?? "",
        "data-initial-event-date": initialEventDate ?? "",
        "data-initial-display-order": String(initialDisplayOrder ?? ""),
        "data-initial-current-season": initialCurrentSeason ?? "",
      },
      "wear-log-form",
    ),
}));

describe("NewWearLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("preference の defaultWearLogStatus を新規作成初期値に使う", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: {
          currentSeason: null,
          defaultWearLogStatus: "worn",
        },
      }),
    });

    const { default: NewWearLogPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await NewWearLogPage({ searchParams: Promise.resolve({}) }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/settings/preferences",
      expect.any(Object),
    );
    expect(markup).toContain("着用履歴管理");
    expect(markup).toContain("着用履歴登録");
    expect(markup).toContain(
      "日付や状態、元のコーディネートやアイテムを選んで着用履歴を登録します。",
    );
    expect(markup).toContain('href="/wear-logs"');
    expect(markup).toContain("一覧に戻る");
    expect(markup).toContain('data-initial-status="worn"');
  });

  it("未設定時は planned を初期値にする", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: {
          currentSeason: null,
          defaultWearLogStatus: null,
        },
      }),
    });

    const { default: NewWearLogPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await NewWearLogPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain('data-initial-status="planned"');
  });

  it("現在の季節設定がある場合は作成時の候補絞り込み初期値に反映する", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: {
          currentSeason: "spring",
          defaultWearLogStatus: "planned",
        },
      }),
    });

    const { default: NewWearLogPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await NewWearLogPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain('data-initial-current-season="春"');
  });

  it("query の event_date / display_order を新規作成初期値に使う", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: {
          currentSeason: null,
          defaultWearLogStatus: "planned",
        },
      }),
    });

    const { default: NewWearLogPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await NewWearLogPage({
        searchParams: Promise.resolve({
          event_date: "2026-03-12",
          display_order: "3",
        }),
      }),
    );

    expect(markup).toContain('data-initial-event-date="2026-03-12"');
    expect(markup).toContain('data-initial-display-order="3"');
  });
});
