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

vi.mock("@/components/wear-logs/wear-log-status-action", () => ({
  default: ({ wearLog }: { wearLog: { id: number; status: string } }) =>
    React.createElement(
      "div",
      { "data-testid": "wear-log-status-action" },
      `wear-log-status-action:${wearLog.id}:${wearLog.status}`,
    ),
}));

vi.mock("@/components/wear-logs/delete-wear-log-button", () => ({
  default: ({ wearLogId }: { wearLogId: string }) =>
    React.createElement(
      "div",
      { "data-testid": "delete-action" },
      `delete-wear-log-button:${wearLogId}`,
    ),
}));

describe("WearLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("個別詳細で主操作と warning を current として表示できる", async () => {
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
          outdoor_temperature_feel: "slightly_cold",
          indoor_temperature_feel: "comfortable",
          overall_rating: "good",
          feedback_tags: [
            "comfortable_all_day",
            "worked_for_tpo",
            "color_worked_well",
            "mood_matched",
            "morning_hot",
            "day_cold",
            "night_hot",
            "rain_problem",
            "too_casual",
            "mood_mismatch",
            "humidity_uncomfortable",
            "unknown_tag",
          ],
          feedback_memo: "冷房は問題なかった",
          created_at: "2026-03-24T09:00:00Z",
          updated_at: "2026-03-24T10:00:00Z",
          items: [
            {
              id: 1,
              source_item_id: 33,
              item_name: "白シャツ",
              source_item_status: "disposed",
              source_item_care_status: "in_cleaning",
              sort_order: 1,
              item_source_type: "outfit",
            },
            {
              id: 2,
              source_item_id: 34,
              item_name: "ネイビーパンツ",
              source_item_status: "active",
              source_item_care_status: null,
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

    expect(markup).toContain("着用履歴管理");
    expect(markup).toContain("着用履歴詳細");
    expect(markup).toContain("着用済み");
    expect(markup).toContain("2026-03-24");
    expect(markup).toContain("2件目");
    expect(markup).toContain("一覧へ戻る");
    expect(markup).toContain("編集");
    expect(markup).toContain("wear-log-status-action:12:worn");
    expect(markup).toContain("delete-wear-log-button:12");
    expect(markup).toContain(
      "元のコーディネートは現在候補外ですが、既存の記録として保持しています。",
    );
    expect(markup).toContain("白シャツ");
    expect(markup).toContain("手放し済み");
    expect(markup).toContain("クリーニング中");
    expect(markup).toContain(
      "クリーニング中のアイテムが含まれています。着用済みとして登録する前に内容を確認してください。",
    );
    expect(markup).toContain(
      "このアイテムは現在候補外ですが、既存の記録として表示しています。",
    );
    expect(markup).toContain(
      "クリーニング中ですが、予定・着用履歴ともに保持できます。",
    );
    expect(markup).toContain("参照コーディネート");
    expect(markup).toContain("手動追加");
    expect(markup).not.toContain(">元のコーディネート<");
    expect(markup).toContain("服装の振り返り");
    expect(markup).toContain("総合評価");
    expect(markup).toContain("屋外");
    expect(markup).toContain("屋内");
    expect(markup).toContain("よかったこと");
    expect(markup).toContain("気になったこと");
    expect(markup).not.toContain("気になった点");
    expect(markup).toContain("TPOに合っていた");
    expect(markup).toContain("色合わせがよかった");
    expect(markup).toContain("気分に合っていた");
    expect(markup).toContain("朝暑い");
    expect(markup).toContain("昼寒い");
    expect(markup).toContain("夜暑い");
    expect(markup.indexOf("気になったこと")).toBeLessThan(
      markup.indexOf("朝暑い"),
    );
    expect(markup).toContain("カジュアルすぎた");
    expect(markup).toContain("気分と合わなかった");
    expect(markup).not.toContain("湿気で不快");
    expect(markup).not.toContain("unknown_tag");
    expect(markup).not.toContain(
      'class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800"></span>',
    );
    expect(markup.indexOf("総合評価")).toBeLessThan(markup.indexOf("屋外"));
    expect(markup.indexOf("屋外")).toBeLessThan(markup.indexOf("屋内"));
    expect(markup).toContain("フィードバックメモ");
    expect(markup).toContain('href="/wear-logs/12/edit"');
    expect(markup).toContain('href="/wear-logs"');
    expect(markup).toContain(
      'href="/outfits/8?from=wear-log&amp;wear_log_id=12"',
    );
    expect(markup).toContain('href="/items/33"');
    expect(markup).not.toContain("wear-log-color-thumbnail");
    expect(markup).not.toContain("wear-log-modal-color-thumbnail");
    expect(markup).not.toContain("wear-log-form:");
  });

  it("振り返りが未入力ならセクションを表示しない", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        wearLog: {
          id: 15,
          status: "planned",
          event_date: "2026-03-25",
          display_order: 1,
          source_outfit_id: null,
          source_outfit_name: null,
          source_outfit_status: null,
          memo: "",
          outdoor_temperature_feel: null,
          indoor_temperature_feel: null,
          overall_rating: null,
          feedback_tags: [],
          feedback_memo: null,
          created_at: "2026-03-25T09:00:00Z",
          updated_at: "2026-03-25T09:00:00Z",
          items: [],
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({ params: Promise.resolve({ id: "15" }) }),
    );

    expect(markup).not.toContain("服装の振り返り");
  });
});
