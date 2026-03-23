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

vi.mock("@/components/outfits/delete-outfit-button", () => ({
  default: () => React.createElement("button", null, "delete"),
}));

describe("OutfitDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("invalid outfit のとき状態説明を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 10,
            status: "invalid",
            name: "通勤コーデ",
            memo: null,
            seasons: [],
            tpos: [],
            outfitItems: [
              {
                id: 1,
                item_id: 2,
                sort_order: 1,
                item: {
                  id: 2,
                  name: "白T",
                  status: "disposed",
                  category: "tops",
                  shape: "tshirt",
                  colors: [],
                  seasons: [],
                  tpos: [],
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          visibleCategoryIds: null,
        }),
      });

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({ params: Promise.resolve({ id: "10" }) }),
    );

    expect(markup).toContain("無効");
    expect(markup).toContain("このコーディネートには現在利用できないアイテムが含まれています。");
    expect(markup).toContain("内容を見直してから保存してください。");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain('href="/outfits/10/edit"');
  });
});
