import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const redirectMock = vi.fn();
const useRouterMock = vi.fn();
const fetchLaravelWithCookieMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => useRouterMock(),
}));

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: fetchLaravelWithCookieMock,
}));

describe("WearLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("振り返りとこの日の天気を表示できる", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: {
          id: 55,
          status: "worn",
          event_date: "2026-04-30",
          display_order: 1,
          source_outfit_id: 12,
          source_outfit_name: "通勤コーデ",
          source_outfit_status: "active",
          memo: "朝は少し肌寒かった",
          outdoor_temperature_feel: "slightly_cold",
          indoor_temperature_feel: "comfortable",
          overall_rating: "neutral",
          feedback_tags: [
            "worked_for_tpo",
            "color_worked_well",
            "mood_matched",
            "morning_hot",
            "color_mismatch",
            "mood_mismatch",
          ],
          feedback_memo: "羽織りは正解だった",
          weather_records: [
            {
              id: 31,
              weather_date: "2026-04-30",
              location_id: 5,
              location_name: "川口",
              location_name_snapshot: "川口",
              forecast_area_code_snapshot: "110000",
              weather_condition: "sunny",
              temperature_high: 22,
              temperature_low: 13,
              memo: "日差しが強かった",
              source_type: "manual",
              source_name: "manual",
              source_fetched_at: null,
              created_at: null,
              updated_at: null,
            },
          ],
          items: [
            {
              id: 101,
              source_item_id: 33,
              item_name: "白シャツ",
              item_source_type: "outfit",
              sort_order: 1,
              source_item_status: "active",
              source_item_care_status: "none",
            },
          ],
          created_at: "2026-04-30T09:00:00Z",
          updated_at: "2026-04-30T09:00:00Z",
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({
        params: Promise.resolve({ id: "55" }),
      }),
    );

    expect(markup).toContain("服装の振り返り");
    expect(markup).toContain("総合評価");
    expect(markup).toContain("普通");
    expect(markup).toContain("よかったこと");
    expect(markup).toContain("TPOに合っていた");
    expect(markup).toContain("色合わせがよかった");
    expect(markup).toContain("気分に合っていた");
    expect(markup).toContain("気になったこと");
    expect(markup).toContain("朝暑い");
    expect(markup).toContain("色合わせが微妙だった");
    expect(markup).toContain("気分と合わなかった");
    expect(markup).toContain("この日の天気");
    expect(markup).toContain("川口");
    expect(markup).toContain("晴れ / 最高22℃ / 最低13℃");
    expect(markup).toContain("日差しが強かった");
    expect(markup).toContain("メモ: 日差しが強かった");
    expect(markup).toContain('href="/items/33"');
  });

  it("振り返りも天気も未登録なら該当セクションを出さない", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: {
          id: 56,
          status: "planned",
          event_date: "2026-04-29",
          display_order: 1,
          source_outfit_id: null,
          source_outfit_name: null,
          source_outfit_status: null,
          memo: null,
          outdoor_temperature_feel: null,
          indoor_temperature_feel: null,
          overall_rating: null,
          feedback_tags: [],
          feedback_memo: null,
          weather_records: [],
          items: [],
          created_at: "2026-04-29T09:00:00Z",
          updated_at: "2026-04-29T09:00:00Z",
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({
        params: Promise.resolve({ id: "56" }),
      }),
    );

    expect(markup).not.toContain("服装の振り返り");
    expect(markup).not.toContain("この日の天気");
  });
});
