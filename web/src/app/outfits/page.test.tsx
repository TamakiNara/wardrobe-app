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

vi.mock("@/components/outfits/outfits-list", () => ({
  default: ({
    initialSeasonFilter,
    skinTonePreset,
  }: {
    initialSeasonFilter?: string;
    skinTonePreset?: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-initial-season": initialSeasonFilter ?? "",
        "data-skin-tone-preset": skinTonePreset ?? "",
      },
      "outfits-list",
    ),
}));

describe("OutfitsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("アイテム未登録時はアイテム追加導線を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: null,
            defaultWearLogStatus: null,
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: [],
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
        json: async () => ({
          meta: {
            totalAll: 0,
          },
        }),
      });

    const { default: OutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain('href="/outfits/invalid"');
    expect(markup).toContain('href="/items/new"');
  });

  it("アイテム登録済みでコーデ未登録ならコーデ追加導線を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: null,
            defaultWearLogStatus: null,
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: [],
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
        json: async () => ({
          meta: {
            totalAll: 3,
          },
        }),
      });

    const { default: OutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain('href="/outfits/invalid"');
    expect(markup).toContain('href="/outfits/new"');
  });

  it("URL に season と currentSeason がない場合は設定の currentSeason を初期値として渡す", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "autumn",
            defaultWearLogStatus: null,
            skinTonePreset: "yellow_light",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: [{ id: 1, name: "秋コーデ" }],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
          },
        }),
      });

    const { default: OutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/outfits",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season="秋"');
    expect(markup).toContain('data-skin-tone-preset="yellow_light"');
  });

  it("URL に currentSeason がある場合はその値で一覧を取得する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "autumn",
            defaultWearLogStatus: null,
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: [{ id: 1, name: "秋コーデ" }],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
          },
        }),
      });

    const { default: OutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitsPage({
        searchParams: Promise.resolve({ currentSeason: "秋" }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/outfits?currentSeason=%E7%A7%8B",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season="秋"');
    expect(markup).toContain('data-skin-tone-preset="neutral_medium"');
  });

  it("URL に season がある場合は currentSeason より優先して一覧取得に使う", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "autumn",
            defaultWearLogStatus: null,
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          outfits: [{ id: 1, name: "夏コーデ" }],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
          },
        }),
      });

    const { default: OutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitsPage({ searchParams: Promise.resolve({ season: "夏" }) }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/outfits?season=%E5%A4%8F",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season="秋"');
    expect(markup).toContain('data-skin-tone-preset="neutral_medium"');
  });
});
