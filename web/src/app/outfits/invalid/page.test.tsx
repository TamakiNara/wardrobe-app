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

vi.mock("@/components/outfits/invalid-outfits-list", () => ({
  default: () => React.createElement("div", null, "invalid-outfits-list"),
}));

describe("InvalidOutfitsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("invalid outfit の最小一覧を表示する", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        outfits: [
          {
            id: 10,
            status: "invalid",
            name: "通勤コーデ",
            memo: null,
            seasons: ["秋"],
            tpos: ["仕事"],
          },
        ],
        meta: {
          total: 1,
          totalAll: 1,
          page: 1,
          lastPage: 1,
        },
      }),
    });

    const { default: InvalidOutfitsPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await InvalidOutfitsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("無効コーディネート一覧");
    expect(markup).toContain('href="/outfits"');
    expect(markup).toContain("コーディネート一覧に戻る");
    expect(markup).toContain(
      "通常一覧から分けて保持し、詳細確認や再利用判断を行います。",
    );
    expect(markup).toContain("invalid-outfits-list");
  });
});
