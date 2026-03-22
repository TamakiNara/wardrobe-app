// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock };

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("EditOutfitPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchCategoryVisibilitySettingsMock.mockRejectedValue(new Error("network"));
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            outfit: {
              id: 10,
              name: "通勤コーデ",
              memo: null,
              seasons: [],
              tpos: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 0,
                  item: {
                    id: 1,
                    name: "白T",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
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
            items: [
              {
                id: 1,
                name: "白T",
                category: "tops",
                shape: "tshirt",
                colors: [],
              },
              {
                id: 2,
                name: "青シャツ",
                category: "tops",
                shape: "shirt",
                colors: [],
              },
            ],
          }),
        }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定の取得に失敗しても編集候補は表示する", async () => {
    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("白T");
    expect(container.textContent).toContain("青シャツ");
    expect(container.textContent).not.toContain("登録済みアイテムがありません。");
  }, 20000);
});
