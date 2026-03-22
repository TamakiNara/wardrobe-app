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
  default: () => React.createElement("div", null, "items-list"),
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
    fetchMock.mockResolvedValue({
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

    expect(markup).toContain("まだアイテムが登録されていません");
    expect(markup).toContain("まずは 1 件追加してみましょう。");
    expect(markup).toContain("アイテムを追加する");
  });
});
