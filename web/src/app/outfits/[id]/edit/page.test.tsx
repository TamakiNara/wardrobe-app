// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserTposMock = vi.fn();
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
  fetchUserTpos: fetchUserTposMock,
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
    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 0,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
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
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
              {
                id: 2,
                name: "青シャツ",
                status: "active",
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
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
    expect(container.textContent).not.toContain(
      "登録済みアイテムがありません。",
    );
    expect(container.textContent).toContain("コーディネート管理");
    expect(container.textContent).toContain("コーディネート編集");
    expect(container.textContent).toContain(
      "登録済みのコーディネート内容を見直して更新します。",
    );
    expect(container.innerHTML).toContain('href="/outfits/10"');
    expect(container.textContent).toContain("詳細に戻る");
    expect(container.textContent).toContain(
      "「必須」が付いた項目は更新に必要です。",
    );
    expect(container.textContent).toContain("アイテム選択");
    expect(container.textContent?.match(/必須/g)?.length).toBe(2);
  }, 20000);

  it("既存構成の disposed item は表示しつつ、このままでは保存できないことを案内する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 99,
                  sort_order: 1,
                  item: {
                    id: 99,
                    name: "旧トップス",
                    status: "disposed",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
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
                id: 2,
                name: "青シャツ",
                status: "active",
                category: "tops",
                shape: "shirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("旧トップス");
    expect(container.textContent).toContain("手放し済み");
    expect(container.textContent).toContain(
      "このアイテムは現在の候補には使えません",
    );
    expect(container.textContent).toContain(
      "手放し済みのアイテムを含むため、このままでは保存できません。",
    );
    expect(container.textContent).toContain("青シャツ");

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("更新する"),
    );
    expect(submitButton?.hasAttribute("disabled")).toBe(true);
  });

  it("422 の field error を項目近くに表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
              tpo_ids: [],
              outfitItems: [
                {
                  id: 201,
                  item_id: 1,
                  sort_order: 1,
                  item: {
                    id: 1,
                    name: "白T",
                    status: "active",
                    category: "tops",
                    shape: "tshirt",
                    colors: [],
                    seasons: [],
                    tpos: [],
                    tpo_ids: [],
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
                status: "active",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
                tpo_ids: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({
            errors: {
              memo: ["メモは1000文字以内で入力してください。"],
              seasons: ["季節の指定を見直してください。"],
            },
          }),
        }),
    );

    const { default: EditOutfitPage } = await import("./page");

    await act(async () => {
      root.render(
        React.createElement(EditOutfitPage, {
          params: Promise.resolve({ id: "10" }),
        }),
      );
      await waitForEffects();
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("更新する"),
    );

    await act(async () => {
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "メモは1000文字以内で入力してください。",
    );
    expect(container.textContent).toContain("季節の指定を見直してください。");
    expect(container.textContent).not.toContain("更新に失敗しました。");
  });
});
