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
    const markup = renderToStaticMarkup(await InvalidOutfitsPage());

    expect(markup).toContain("無効コーディネート一覧");
    expect(markup).toContain("通勤コーデ");
    expect(markup).toContain("無効");
    expect(markup).toContain("季節： 秋");
    expect(markup).toContain("TPO： 仕事");
    expect(markup).toContain('href="/outfits"');
    expect(markup).toContain("コーディネート一覧に戻る");
    expect(markup).toContain('href="/outfits/10"');
    expect(markup).toContain('href="/outfits/10/edit"');
  });
});
