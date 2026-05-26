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

function getSectionMarkup(markup: string, testId: string): string {
  const testIdIndex = markup.indexOf(`data-testid="${testId}"`);
  expect(testIdIndex).toBeGreaterThanOrEqual(0);

  const sectionStart = markup.lastIndexOf("<section", testIdIndex);
  const sectionEnd = markup.indexOf("</section>", testIdIndex);

  expect(sectionStart).toBeGreaterThanOrEqual(0);
  expect(sectionEnd).toBeGreaterThanOrEqual(0);

  return markup.slice(sectionStart, sectionEnd + "</section>".length);
}

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
              weather_code: "sunny",
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
    expect(markup).toContain("着用メモ");
    expect(markup).toContain("朝は少し肌寒かった");
    const basicInfoSection = getSectionMarkup(
      markup,
      "wear-log-basic-info-section",
    );
    expect(basicInfoSection).toContain("基本情報");
    expect(basicInfoSection).toContain("状態");
    expect(basicInfoSection).toContain("着用済み");
    expect(basicInfoSection).toContain("日付");
    expect(basicInfoSection).toContain("2026-04-30");
    expect(basicInfoSection).toContain("表示順");
    expect(basicInfoSection).toContain("1件目");
    expect(basicInfoSection).toContain("着用メモ");
    expect(basicInfoSection).toContain("朝は少し肌寒かった");
    expect(basicInfoSection).not.toContain("予定に戻す");
    expect(basicInfoSection).not.toContain("削除");
    const statusManagementSection = getSectionMarkup(
      markup,
      "wear-log-status-management-section",
    );
    expect(statusManagementSection).toContain("状態管理");
    expect(statusManagementSection).toContain("予定と着用済みを切り替えます。");
    expect(statusManagementSection).not.toContain("現在の状態");
    expect(statusManagementSection).toContain("予定に戻す");
    expect(statusManagementSection).toContain(
      'data-testid="wear-log-status-action"',
    );
    expect(markup).toContain("振り返りメモ");
    expect(markup).toContain("この日の天気");
    expect(markup).toContain("川口");
    expect(markup).toContain("晴れ / 最高 22℃ / 最低 13℃");
    expect(markup).toContain("日差しが強かった");
    expect(markup).toContain("メモ: 日差しが強かった");
    expect(markup).toContain('data-weather-code="sunny"');
    expect(markup).toContain('href="/items/33"');
    expect(markup).toContain("一覧へ戻る");
    expect(markup).toContain('href="/wear-logs/55/edit"');
    expect(markup).toContain("着用内容を編集");
    expect(markup).toContain('href="/wear-logs/55/reflection"');
    expect(markup).toContain("振り返りを編集");
    expect(markup).toContain("予定に戻す");
    expect(markup).toContain("削除");
    const deleteSection = getSectionMarkup(markup, "wear-log-delete-section");
    expect(deleteSection).toContain("削除");
    expect(deleteSection).toContain(
      "誤って登録した着用履歴など、履歴として残す必要がない場合にのみ削除してください。",
    );
    expect(deleteSection).toContain('data-testid="wear-log-delete-action"');
    expect(markup).not.toContain("着用内容や服装の振り返りを編集できます。");
  });

  it("作成直後の worn detail では振り返り登録への次アクションを表示する", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: {
          id: 57,
          status: "worn",
          event_date: "2026-05-23",
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
          created_at: "2026-05-23T09:00:00Z",
          updated_at: "2026-05-23T09:00:00Z",
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({
        params: Promise.resolve({ id: "57" }),
        searchParams: Promise.resolve({
          created: "1",
          next: "reflection",
        }),
      }),
    );

    expect(markup).toContain("着用履歴を登録しました。");
    expect(markup).toContain("続けて振り返りを登録");
    expect(markup).toContain('href="/wear-logs/57/reflection"');
    expect(markup).toContain(
      'data-testid="wear-log-created-reflection-prompt"',
    );
  });

  it("query parameter がない場合は作成直後の振り返り導線を表示しない", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: {
          id: 58,
          status: "worn",
          event_date: "2026-05-24",
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
          created_at: "2026-05-24T09:00:00Z",
          updated_at: "2026-05-24T09:00:00Z",
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({
        params: Promise.resolve({ id: "58" }),
      }),
    );

    expect(markup).not.toContain("着用履歴を登録しました。");
    expect(markup).not.toContain("続けて振り返りを登録");
  });

  it("planned detail では作成直後 query があっても振り返り登録への次アクションを表示しない", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: {
          id: 59,
          status: "planned",
          event_date: "2026-05-25",
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
          created_at: "2026-05-25T09:00:00Z",
          updated_at: "2026-05-25T09:00:00Z",
        },
      }),
    });

    const { default: WearLogDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await WearLogDetailPage({
        params: Promise.resolve({ id: "59" }),
        searchParams: Promise.resolve({
          created: "1",
          next: "reflection",
        }),
      }),
    );

    expect(markup).not.toContain("着用履歴を登録しました。");
    expect(markup).not.toContain("続けて振り返りを登録");
    expect(markup).toContain("振り返りを編集");
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

    expect(markup).not.toContain("総合評価");
    expect(markup).not.toContain("振り返りメモ");
    expect(markup).not.toContain("この日の天気");
    expect(markup).toContain("振り返りはまだ記録されていません。");
  });
});
