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

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-list-filters",
  () => ({
    default: ({
      categoryOptions,
    }: {
      categoryOptions?: Array<{ value: string }>;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "purchase-candidate-filters",
          "data-category-count": categoryOptions?.length ?? 0,
        },
        "purchase-candidate-filters",
      ),
  }),
);

vi.mock(
  "@/components/purchase-candidates/purchase-candidate-list-card",
  () => ({
    default: ({
      candidates,
      detailQueryString,
    }: {
      candidates: Array<{ id: number; name: string }>;
      detailQueryString?: string;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "purchase-candidate-card",
          "data-detail-href": detailQueryString
            ? `/purchase-candidates/${candidates[0].id}?${detailQueryString}`
            : `/purchase-candidates/${candidates[0].id}`,
        },
        candidates[0].name,
      ),
  }),
);

describe("UnderwearPurchaseCandidatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => undefined);
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("アンダーウェア購入検討一覧を表示し、専用 detail href を渡す", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          purchaseCandidateEntries: [
            {
              type: "single",
              candidate: {
                id: 5,
                name: "黒ブラ候補",
                status: "considering",
                colors: [],
              },
            },
          ],
          availableBrands: [],
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
        json: async () => ({
          groups: [
            {
              id: "underwear",
              name: "アンダーウェア",
              categories: [{ id: "underwear_bra", name: "ブラ" }],
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
          brands: [],
        }),
      });

    const { default: UnderwearPurchaseCandidatesPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await UnderwearPurchaseCandidatesPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("アンダーウェア購入検討一覧");
    expect(markup).toContain('href="/purchase-candidates"');
    expect(markup).toContain('data-category-count="1"');
    expect(markup).toContain("黒ブラ候補");
    expect(markup).toContain(
      'data-detail-href="/purchase-candidates/5?return_to=%2Fpurchase-candidates%2Funderwear&amp;return_label=%E3%82%A2%E3%83%B3%E3%83%80%E3%83%BC%E3%82%A6%E3%82%A7%E3%82%A2%E8%B3%BC%E5%85%A5%E6%A4%9C%E8%A8%8E%E4%B8%80%E8%A6%A7"',
    );
  });
});
