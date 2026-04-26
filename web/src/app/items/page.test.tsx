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

vi.mock("@/components/items/items-list", () => ({
  default: ({
    skinTonePreset,
    initialSeasonFilter,
  }: {
    skinTonePreset?: string;
    initialSeasonFilter?: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-skin-tone-preset": skinTonePreset ?? "",
        "data-initial-season-filter": initialSeasonFilter ?? "",
      },
      "items-list",
    ),
}));

describe("ItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => undefined);
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("アイテムが未登録なら空状態を表示する", async () => {
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
          groups: [],
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
          items: [],
          meta: {
            total: 0,
            totalAll: 0,
            page: 1,
            lastPage: 1,
            availableCategories: [],
            availableSeasons: [],
            availableTpos: [],
          },
        }),
      });

    const { default: ItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("アイテム管理");
    expect(markup).toContain("アイテム一覧");
    expect(markup).toContain("現在、所持品のアイテムはありません");
    expect(markup).toContain(
      "新しく登録するか、手放したアイテム一覧からクローゼットに戻すアイテムがないか確認してください。",
    );
    expect(markup).toContain('href="/items/disposed"');
    expect(markup).toContain("手放したアイテム一覧を見る");
    expect(markup).toContain("アイテムを追加する");
  });

  it("URL に season と currentSeason がない場合は設定の currentSeason を currentSeason クエリへ反映する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "spring",
            defaultWearLogStatus: null,
            skinTonePreset: "yellow_light",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [],
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
        status: 200,
        json: async () => ({
          items: [],
          meta: {
            total: 0,
            totalAll: 1,
            page: 1,
            lastPage: 1,
            availableCategories: [],
            availableBrands: [],
            availableSeasons: [],
            availableTpos: [],
          },
        }),
      });

    const { default: ItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(redirectMock).not.toHaveBeenCalledWith(
      "/items?currentSeason=%E6%98%A5",
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/items",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season-filter="春"');
  });

  it("URL に currentSeason がある場合はその値で一覧を取得する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "spring",
            defaultWearLogStatus: null,
            skinTonePreset: "yellow_light",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [],
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
          items: [{ id: 1, name: "白T" }],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
            availableCategories: ["tops"],
            availableBrands: [],
            availableSeasons: ["春"],
            availableTpos: [],
          },
        }),
      });

    const { default: ItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemsPage({
        searchParams: Promise.resolve({ currentSeason: "春" }),
      }),
    );

    expect(redirectMock).not.toHaveBeenCalledWith(
      "/items?currentSeason=%E6%98%A5",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/items?currentSeason=%E6%98%A5",
      expect.any(Object),
    );
    expect(markup).toContain("アイテム一覧");
  });

  it("URL に season がある場合は currentSeason より優先して一覧取得に使う", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "spring",
            defaultWearLogStatus: null,
            skinTonePreset: "pink_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [],
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
          items: [{ id: 1, name: "白T" }],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
            availableCategories: ["tops"],
            availableBrands: [],
            availableSeasons: ["夏"],
            availableTpos: [],
          },
        }),
      });

    const { default: ItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await ItemsPage({ searchParams: Promise.resolve({ season: "夏" }) }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(markup).toContain("アイテム管理");
    expect(markup).toContain('href="/items/disposed"');
    expect(markup).toContain("手放したアイテム一覧を見る");
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/items?season=%E5%A4%8F",
      expect.any(Object),
    );
    expect(redirectMock).not.toHaveBeenCalledWith(
      "/items?currentSeason=%E6%98%A5",
    );
  });
});
