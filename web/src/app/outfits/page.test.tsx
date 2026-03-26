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
  default: ({ initialSeasonFilter }: { initialSeasonFilter?: string }) =>
    React.createElement("div", { "data-initial-season": initialSeasonFilter ?? "" }, "outfits-list"),
}));

describe("OutfitsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("アイテム未登録時は先に item 追加を案内する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: null,
            defaultWearLogStatus: null,
          },
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

    expect(markup).toContain("まだコーディネートが登録されていません");
    expect(markup).toContain(
      "先にアイテムを登録して、組み合わせを作れる状態にしましょう。",
    );
    expect(markup).toContain('href="/outfits/invalid"');
    expect(markup).toContain("無効コーディネート一覧");
    expect(markup).toContain('href="/items/new"');
    expect(markup).toContain("アイテムを追加する");
  });

  it("アイテム登録済みならコーデ作成を案内する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: null,
            defaultWearLogStatus: null,
          },
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

    expect(markup).toContain("手持ちのアイテムを組み合わせて作ってみましょう。");
    expect(markup).toContain('href="/outfits/invalid"');
    expect(markup).toContain("無効コーディネート一覧");
    expect(markup).toContain('href="/outfits/new"');
    expect(markup).toContain("コーディネートを作成する");
  });

  it("URL に season がない場合は preference を初期季節として使う", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            currentSeason: "autumn",
            defaultWearLogStatus: null,
          },
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

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/outfits?season=%E7%A7%8B",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season="秋"');
  });

  it("URL に season がある場合は preference より URL を優先する", async () => {
    fetchMock.mockResolvedValueOnce({
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/outfits?season=%E5%A4%8F",
      expect.any(Object),
    );
    expect(markup).toContain('data-initial-season=""');
  });
});
