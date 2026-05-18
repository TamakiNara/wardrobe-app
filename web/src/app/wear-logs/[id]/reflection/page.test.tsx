// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
const fetchLaravelWithCookieMock = vi.fn();
const updateWearLogFeedbackMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: fetchLaravelWithCookieMock,
}));

vi.mock("@/lib/api/wear-logs", () => ({
  updateWearLogFeedback: updateWearLogFeedbackMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function buildWearLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 55,
    status: "worn",
    event_date: "2026-04-30",
    display_order: 1,
    source_outfit_id: 12,
    source_outfit_name: "通勤コーデ",
    source_outfit_status: "active",
    memo: "出社用",
    outdoor_temperature_feel: "slightly_cold",
    indoor_temperature_feel: "comfortable",
    overall_rating: "neutral",
    feedback_tags: ["color_worked_well"],
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
    ...overrides,
  };
}

describe("WearLogReflectionPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    fetchLaravelWithCookieMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        wearLog: buildWearLog(),
      }),
    });
    updateWearLogFeedbackMock.mockResolvedValue({
      message: "updated",
      wearLog: buildWearLog({
        overall_rating: "good",
      }),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.resetModules();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("着用履歴の context と既存の振り返り項目を初期表示できる", async () => {
    const { default: WearLogReflectionPage } = await import("./page");
    const page = await WearLogReflectionPage({
      params: Promise.resolve({ id: "55" }),
    });

    await act(async () => {
      root.render(page);
      await waitForEffects();
    });

    expect(container.textContent).toContain("着用履歴の振り返り");
    expect(container.textContent).toContain("2026年4月30日");
    expect(container.textContent).toContain("着用済み");
    expect(container.textContent).toContain("通勤コーデ");
    expect(container.textContent).toContain("川口");
    expect(container.textContent).toContain("晴れ / 最高 22℃ / 最低 13℃");
    expect(container.textContent).toContain("普通");
    expect(container.textContent).toContain("色合わせがよかった");

    expect(
      container.querySelector<HTMLSelectElement>(
        "#reflection-outdoor-temperature-feel",
      )?.value,
    ).toBe("slightly_cold");
    expect(
      container.querySelector<HTMLSelectElement>(
        "#reflection-indoor-temperature-feel",
      )?.value,
    ).toBe("comfortable");
    expect(
      container.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="例: 室内は少し寒かった、色合わせがよかった"]',
      )?.value,
    ).toBe("羽織りは正解だった");
    expect(container.innerHTML).toContain('href="/wear-logs/55"');
  });

  it("feedback field だけを PATCH し、保存後に detail へ戻る", async () => {
    const { default: WearLogReflectionPage } = await import("./page");
    const page = await WearLogReflectionPage({
      params: Promise.resolve({ id: "55" }),
    });

    await act(async () => {
      root.render(page);
      await waitForEffects();
    });

    const outdoorSelect = container.querySelector<HTMLSelectElement>(
      "#reflection-outdoor-temperature-feel",
    );
    const indoorSelect = container.querySelector<HTMLSelectElement>(
      "#reflection-indoor-temperature-feel",
    );
    const memoField = container.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="例: 室内は少し寒かった、色合わせがよかった"]',
    );
    const form = container.querySelector("form");

    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("よかった"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const selectSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      )?.set;
      selectSetter?.call(outdoorSelect, "hot");
      outdoorSelect?.dispatchEvent(new Event("change", { bubbles: true }));
      selectSetter?.call(indoorSelect, "");
      indoorSelect?.dispatchEvent(new Event("change", { bubbles: true }));

      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("雨でも問題なかった"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const memoSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      memoSetter?.call(memoField, "雨でも快適だった");
      memoField?.dispatchEvent(new Event("input", { bubbles: true }));

      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await waitForEffects();
    });

    expect(updateWearLogFeedbackMock).toHaveBeenCalledWith(55, {
      overall_rating: "good",
      outdoor_temperature_feel: "hot",
      indoor_temperature_feel: null,
      feedback_tags: ["color_worked_well", "rain_ready"],
      feedback_memo: "雨でも快適だった",
    });
    const [, payload] = updateWearLogFeedbackMock.mock.calls[0];
    expect(Object.keys(payload).sort()).toEqual([
      "feedback_memo",
      "feedback_tags",
      "indoor_temperature_feel",
      "outdoor_temperature_feel",
      "overall_rating",
    ]);
    expect(pushMock).toHaveBeenCalledWith("/wear-logs/55");
  });

  it("保存失敗時は画面内にエラーを表示する", async () => {
    const { ApiClientError } = await import("@/lib/api/client");

    updateWearLogFeedbackMock.mockRejectedValueOnce(
      new ApiClientError(422, {
        message: "入力内容を確認してください。",
      }),
    );

    const { default: WearLogReflectionPage } = await import("./page");
    const page = await WearLogReflectionPage({
      params: Promise.resolve({ id: "55" }),
    });

    await act(async () => {
      root.render(page);
      await waitForEffects();
    });

    await act(async () => {
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await waitForEffects();
    });

    expect(container.textContent).toContain("入力内容を確認してください。");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
