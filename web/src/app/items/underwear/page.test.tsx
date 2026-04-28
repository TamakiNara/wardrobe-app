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
    storage,
    initialCategoryOptions,
  }: {
    storage?: string;
    initialCategoryOptions?: Array<{ value: string }>;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "items-list",
        "data-storage": storage ?? "",
        "data-category-count": initialCategoryOptions?.length ?? 0,
      },
      "items-list",
    ),
}));

describe("UnderwearItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => undefined);
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("アンダーウェア一覧を表示し、専用導線と storage を渡す", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: null,
            skinTonePreset: "neutral_medium",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [
            {
              id: "underwear",
              name: "アンダーウェア",
              categories: [
                {
                  id: "underwear_bra",
                  name: "ブラ",
                },
              ],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visibleCategoryIds: ["underwear_bra"],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              name: "黒ブラ",
            },
          ],
          meta: {
            total: 1,
            totalAll: 1,
            page: 1,
            lastPage: 1,
            availableCategories: ["underwear"],
            availableBrands: [],
            availableSeasons: [],
            availableTpos: [],
          },
        }),
      });

    const { default: UnderwearItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await UnderwearItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("アンダーウェア一覧");
    expect(markup).toContain("アンダーウェア管理");
    expect(markup).toContain('href="/items/underwear/disposed"');
    expect(markup).toContain("手放したアンダーウェア一覧");
    expect(markup).toContain('href="/items"');
    expect(markup).toContain(
      'href="/items/new?category=underwear&amp;returnTo=%2Fitems%2Funderwear"',
    );
    expect(markup).toContain('data-storage="underwear"');
    expect(markup).toContain('data-category-count="1"');
  });
});
