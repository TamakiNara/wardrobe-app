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

vi.mock("@/components/outfits/outfit-restore-action", () => ({
  default: ({
    outfitId,
    canRestore,
  }: {
    outfitId: number;
    canRestore: boolean;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "outfit-restore-action",
        "data-outfit-id": String(outfitId),
        "data-can-restore": String(canRestore),
      },
      canRestore ? "restore-enabled" : "restore-disabled",
    ),
}));

vi.mock("@/components/outfits/outfit-duplicate-action", () => ({
  default: ({ outfitId }: { outfitId: number }) =>
    React.createElement(
      "div",
      {
        "data-testid": "outfit-duplicate-action",
        "data-outfit-id": String(outfitId),
      },
      "duplicate-action",
    ),
}));

describe("OutfitDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("wear log 由来のときだけ戻りリンクを表示する", async () => {
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
                  spec: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "10" }),
        searchParams: Promise.resolve({ from: "wear-log", wear_log_id: "12" }),
      }),
    );

    expect(markup).toContain("コーディネート管理");
    expect(markup).toContain("通勤コーデ");
    expect(markup).toContain("無効");
    expect(markup).toContain("無効の理由");
    expect(markup).toContain(
      "現在利用できないアイテムを含むため、通常一覧とは分けて保持しています。",
    );
    expect(markup).toContain(
      "再利用する場合は複製して新しく作成してください。",
    );
    expect(markup).toContain(
      "復旧できる条件が揃っている場合のみ、有効に戻せます。",
    );
    expect(markup).toContain("基本情報");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain("restore-disabled");
    expect(markup).toContain('href="/outfits/10/edit"');
    expect(markup).toContain('href="/wear-logs/12"');
    expect(markup).toContain("着用履歴詳細へ戻る");
  });

  it("通常遷移では wear log 戻りリンクを表示しない", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 11,
            status: "active",
            name: "休日コーデ",
            memo: null,
            seasons: [],
            tpos: [],
            outfitItems: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          visibleCategoryIds: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "11" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).not.toContain("着用履歴詳細へ戻る");
    expect(markup).not.toContain('href="/wear-logs/12"');
    expect(markup).toContain("休日コーデ");
    expect(markup).toContain("duplicate-action");
    expect(markup).toContain('href="/outfits/11/edit"');
    expect(markup).toContain("一覧に戻る");
  });

  it("return_to があるときは着用履歴フォームへの戻りリンクを表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 11,
            status: "active",
            name: "休日コーデ",
            memo: null,
            seasons: [],
            tpos: [],
            outfitItems: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          visibleCategoryIds: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "11" }),
        searchParams: Promise.resolve({
          return_to: "/wear-logs/new",
          return_label: "着用履歴フォーム",
        }),
      }),
    );

    expect(markup).toContain('href="/wear-logs/new"');
    expect(markup).toContain("着用履歴フォームへ戻る");
    expect(markup).toContain('href="/outfits/11/edit"');
    expect(markup).toContain("編集");
  });

  it("詳細で representative bottoms があると thumbnail を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 12,
            status: "active",
            name: "ボトムス確認コーデ",
            memo: null,
            seasons: ["春"],
            tpos: ["休日"],
            outfitItems: [
              {
                id: 1,
                item_id: 2,
                sort_order: 1,
                item: {
                  id: 2,
                  name: "ミディスカート",
                  status: "active",
                  category: "bottoms",
                  shape: "flare-skirt",
                  colors: [
                    {
                      role: "main",
                      mode: "preset",
                      value: "beige",
                      hex: "#CBB79D",
                      label: "ベージュ",
                    },
                  ],
                  spec: {
                    bottoms: {
                      length_type: "midi",
                    },
                  },
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          preferences: {
            skinTonePreset: "yellow_medium",
          },
        }),
      });

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "12" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("outfit-color-thumbnail");
    expect(markup).toContain("lower-body-preview-svg");
  });
  it("custom label がある色は fallback ではなく登録済み名を表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 13,
            status: "active",
            name: "custom-color outfit",
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
                  name: "custom color item",
                  status: "active",
                  category: "tops",
                  shape: "tshirt",
                  colors: [
                    {
                      role: "main",
                      mode: "custom",
                      value: "#7E5BEF",
                      hex: "#7E5BEF",
                      label: "カスタムカラー",
                      custom_label: "青みラベンダー",
                    },
                  ],
                  spec: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "13" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("青みラベンダー");
    expect(markup).not.toContain(">カスタムカラー<");
  });

  it("定義済みカラーは登録済みの色名をそのまま表示する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 14,
            status: "active",
            name: "preset-color outfit",
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
                  name: "preset color item",
                  status: "active",
                  category: "tops",
                  shape: "tshirt",
                  colors: [
                    {
                      role: "main",
                      mode: "preset",
                      value: "navy",
                      hex: "#1F3A5F",
                      label: "ネイビー",
                    },
                  ],
                  spec: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "14" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("ネイビー");
    expect(markup).not.toContain(">カスタムカラー<");
  });

  it("表示名が取れない場合だけ カスタムカラー に fallback する", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          outfit: {
            id: 15,
            status: "active",
            name: "hex-only outfit",
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
                  name: "hex only item",
                  status: "active",
                  category: "tops",
                  shape: "tshirt",
                  colors: [
                    {
                      role: "main",
                      mode: "custom",
                      value: "#7E5BEF",
                      hex: "#7E5BEF",
                      label: "",
                      custom_label: null,
                    },
                  ],
                  spec: null,
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

    const { default: OutfitDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await OutfitDetailPage({
        params: Promise.resolve({ id: "15" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("カスタムカラー");
  });
});
