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

describe("WearLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("候補外データを含む既存記録でも確認画面として表示できる", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        wearLog: {
          id: 12,
          status: "worn",
          event_date: "2026-03-24",
          display_order: 2,
          source_outfit_id: 8,
          source_outfit_name: "通勤コーディネート",
          source_outfit_status: "invalid",
          memo: "既存記録の確認",
          created_at: "2026-03-24T09:00:00Z",
          updated_at: "2026-03-24T10:00:00Z",
          items: [
            {
              id: 1,
              source_item_id: 33,
              item_name: "白シャツ",
              source_item_status: "disposed",
              sort_order: 1,
              item_source_type: "outfit",
            },
            {
              id: 2,
              source_item_id: 34,
              item_name: "ネイビーパンツ",
              source_item_status: "active",
              sort_order: 2,
              item_source_type: "manual",
            },
          ],
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({ params: Promise.resolve({ id: "12" }) }),
    );

    expect(markup).toContain("着用履歴詳細");
    expect(markup).toContain("着用済み");
    expect(markup).toContain("2026-03-24");
    expect(markup).toContain("2件目");
    expect(markup).toContain("通勤コーディネート");
    expect(markup).toContain("元のコーディネートは現在候補外ですが、既存の記録として表示しています。");
    expect(markup).toContain("白シャツ");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain("このアイテムは現在候補外ですが、既存の記録として表示しています。");
    expect(markup).toContain("元コーディネート");
    expect(markup).toContain("手動追加");
    expect(markup).toContain('href="/wear-logs/12/edit"');
    expect(markup).toContain('href="/outfits/8?from=wear-log&amp;wear_log_id=12"');
    expect(markup).not.toContain("wear-log-color-thumbnail");
    expect(markup).not.toContain("wear-log-form:");
    expect(markup).not.toContain(">削除<");
  });
});
