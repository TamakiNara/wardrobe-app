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

vi.mock("@/components/items/item-thumbnail-preview", () => ({
  default: () => React.createElement("div", null, "item-thumbnail-preview"),
}));

describe("DisposedUnderwearItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("手放したアンダーウェア一覧を表示し、詳細戻り先を付与する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 10,
              name: "黒ブラ",
              status: "disposed",
              care_status: null,
              category: "underwear",
              subcategory: "bra",
              shape: "bra",
              colors: [],
              seasons: [],
              tpos: [],
              spec: null,
              images: [],
            },
          ],
          meta: {
            total: 1,
            totalAll: 1,
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
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: DisposedUnderwearItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await DisposedUnderwearItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("手放したアンダーウェア一覧");
    expect(markup).toContain('href="/items/underwear"');
    expect(markup).toContain(
      'href="/items/10?return_to=%2Fitems%2Funderwear%2Fdisposed&amp;return_label=%E6%89%8B%E6%94%BE%E3%81%97%E3%81%9F%E3%82%A2%E3%83%B3%E3%83%80%E3%83%BC%E3%82%A6%E3%82%A7%E3%82%A2%E4%B8%80%E8%A6%A7"',
    );
  });
});
