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

describe("DisposedItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("手放したアイテム一覧に disposed item を表示し、詳細への戻り導線を渡す", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 10,
              name: "黒ジャケット",
              status: "disposed",
              care_status: null,
              category: "outer",
              shape: "tailored",
              colors: [
                {
                  role: "main",
                  mode: "preset",
                  value: "black",
                  hex: "#111111",
                  label: "ブラック",
                },
              ],
              seasons: ["秋"],
              tpos: ["仕事"],
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

    const { default: DisposedItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await DisposedItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("手放したアイテム一覧");
    expect(markup).toContain(
      "通常一覧とは分けて保持し、詳細確認や所持品に戻す判断を行います。",
    );
    expect(markup).toContain("表示件数: 1 / 1");
    expect(markup).toContain("黒ジャケット");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain(
      'href="/items/10?return_to=%2Fitems%2Fdisposed&amp;return_label=%E6%89%8B%E6%94%BE%E3%81%97%E3%81%9F%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0%E4%B8%80%E8%A6%A7"',
    );
    expect(markup).toContain('href="/items"');
    expect(markup).toContain("アイテム一覧に戻る");
  });

  it("手放したアイテムがない場合は専用の空状態を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [],
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
            skinTonePreset: "neutral_medium",
          },
        }),
      });

    const { default: DisposedItemsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await DisposedItemsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("手放したアイテムはありません");
    expect(markup).toContain(
      "現在、確認や復帰判断が必要な手放し済みアイテムはありません。",
    );
    expect(markup).toContain('href="/items"');
  });
});
