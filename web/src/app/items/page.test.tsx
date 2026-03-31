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
      "items-list",
    ),
}));

describe("ItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("未登録時は docs に合わせた空状態を表示する", async () => {
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
      "新しく登録するか、手放したアイテム一覧から所持品に戻すアイテムがないか確認してください。",
    );
    expect(markup).toContain('href="/items/disposed"');
    expect(markup).toContain("手放したアイテム一覧を見る");
    expect(markup).toContain("アイテムを追加する");
  });

  it("URL に season がない場合は preference を初期季節として使う", async () => {
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
            availableSeasons: ["春"],
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
    expect(markup).toContain('href="/items/disposed"');
    expect(markup).toContain("手放したアイテム一覧を見る");
    expect(markup).toContain("rounded-lg border border-gray-300");
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/items?season=%E6%98%A5",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season="春"');
    expect(markup).toContain('data-skin-tone-preset="yellow_light"');
  });

  it("URL に season がある場合は preference より URL を優先する", async () => {
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
    expect(markup).toContain("rounded-lg border border-gray-300");
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/items?season=%E5%A4%8F",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season=""');
    expect(markup).toContain('data-skin-tone-preset="pink_medium"');
  });
});
