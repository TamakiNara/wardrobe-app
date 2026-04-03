// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OutfitDuplicatePayload } from "@/types/outfits";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const fetchUserTposMock = vi.fn();
const routerMock = {
  push: pushMock,
  refresh: refreshMock,
  replace: replaceMock,
};
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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

describe("NewOutfitPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    searchParamsValue = "";
    window.sessionStorage.clear();
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
      vi.fn().mockResolvedValue({
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
              seasons: [],
              tpos: [],
            },
            {
              id: 3,
              name: "黒パンツ",
              category: "bottoms",
              shape: "pants",
              colors: [],
              seasons: [],
              tpos: [],
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

  it("カテゴリ表示設定の取得に失敗してもアイテム候補は表示する", async () => {
    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("白T");
    expect(container.textContent).not.toContain(
      "登録済みアイテムがありません。",
    );
    expect(container.textContent).toContain("コーディネート管理");
    expect(container.textContent).toContain("コーディネート登録");
    expect(container.textContent).toContain(
      "組み合わせるアイテムや季節・TPOを選んで、新しいコーディネートを登録します。",
    );
    expect(container.innerHTML).toContain('href="/outfits"');
    expect(container.textContent).toContain("一覧に戻る");
    expect(container.textContent).toContain(
      "「必須」が付いた項目は登録に必要です。",
    );
    expect(container.textContent).toContain("アイテム選択");
    expect(container.textContent?.match(/必須/g)?.length).toBe(2);
  });

  it("active outfit 由来の duplicate 初期値を反映する", async () => {
    searchParamsValue = "source=duplicate";
    const payload: OutfitDuplicatePayload = {
      name: "通勤コーデ（コピー）",
      memo: "朝会用",
      seasons: ["春"],
      tpos: ["仕事"],
      tpo_ids: [1],
      items: [
        {
          item_id: 1,
          sort_order: 1,
          selectable: true,
          note: null,
        },
      ],
    };
    window.sessionStorage.setItem(
      "outfit-duplicate-payload",
      JSON.stringify(payload),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.querySelector<HTMLInputElement>("#name")?.value).toBe(
      "通勤コーデ（コピー）",
    );
    expect(container.querySelector<HTMLTextAreaElement>("#memo")?.value).toBe(
      "朝会用",
    );
    expect(container.textContent).toContain(
      "複製元の内容を初期値として読み込みました。",
    );
    expect(container.textContent).toContain("選択中 1 件");
    expect(container.textContent).toContain("1. 白T (tops / tshirt)");
    expect(replaceMock).toHaveBeenCalledWith("/outfits/new");
  });

  it("invalid outfit 由来で selectable=false の item は初期選択せず、note を表示する", async () => {
    searchParamsValue = "source=duplicate";
    const payload: OutfitDuplicatePayload = {
      name: "休日コーデ（コピー）",
      memo: null,
      seasons: ["夏"],
      tpos: ["休日"],
      tpo_ids: [2],
      items: [
        {
          item_id: 1,
          sort_order: 1,
          selectable: true,
          note: null,
        },
        {
          item_id: 2,
          sort_order: 2,
          selectable: false,
          note: "手放したアイテムのため初期選択から除外",
        },
      ],
    };
    window.sessionStorage.setItem(
      "outfit-duplicate-payload",
      JSON.stringify(payload),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("選択中 1 件");
    expect(container.textContent).toContain(
      "元のコーディネートで使われていた一部アイテムは現在利用できないため、初期選択から外しました。",
    );
    expect(container.textContent).toContain(
      "2番目のアイテム: 手放したアイテムのため初期選択から除外",
    );
    expect(container.textContent).toContain("1. 白T (tops / tshirt)");
  });

  it("duplicate 初期値が見つからない場合はエラーを表示し、通常新規作成として続けられる", async () => {
    searchParamsValue = "source=duplicate";

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "複製の初期値を読み込めませんでした。通常の新規作成として続けてください。",
    );
    expect(container.textContent).toContain("白T");
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
            items: [
              {
                id: 1,
                name: "白T",
                category: "tops",
                shape: "tshirt",
                colors: [],
                seasons: [],
                tpos: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({
            errors: {
              name: ["名前は255文字以内で入力してください。"],
              tpo_ids: ["TPO を選び直してください。"],
            },
          }),
        }),
    );

    const { default: NewOutfitPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(NewOutfitPage));
      await waitForEffects();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const checkbox = checkboxes[checkboxes.length - 1] ?? null;
    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("登録する"),
    );

    await act(async () => {
      checkbox?.click();
      submitButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "名前は255文字以内で入力してください。",
    );
    expect(container.textContent).toContain("TPO を選び直してください。");
    expect(container.textContent).not.toContain(
      "コーディネートの登録に失敗しました。",
    );
  });
});
