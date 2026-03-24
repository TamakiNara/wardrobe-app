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

describe("PurchaseCandidatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("空状態を表示できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [],
        meta: {
          total: 0,
          totalAll: 0,
          page: 1,
          lastPage: 1,
        },
      }),
    });

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("購入候補がまだありません");
  });

  it("候補一覧を表示できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidates: [
          {
            id: 1,
            status: "considering",
            priority: "high",
            name: "ネイビーコート",
            category_id: "outer_coat",
            category_name: "コート",
            price: 19800,
            converted_item_id: null,
            converted_at: null,
            primary_image: null,
            updated_at: "2026-03-24T10:00:00+09:00",
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

    const { default: PurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidatesPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("ネイビーコート");
    expect(markup).toContain("コート");
    expect(markup).toContain("検討中");
    expect(markup).toContain("優先度: 高");
    expect(markup).toContain("19,800円");
    expect(markup).toContain("購入候補一覧");
    expect(markup).toContain('href="/purchase-candidates/1"');
  });
});
