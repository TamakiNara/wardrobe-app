// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const pushMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/outfits/invalid",
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/components/outfits/outfit-duplicate-action", () => ({
  default: ({ outfitId }: { outfitId: number }) =>
    React.createElement("span", null, `duplicate-${outfitId}`),
}));

const sampleOutfits = [
  {
    id: 1,
    status: "invalid" as const,
    name: "春の無効コーデ",
    memo: null,
    seasons: ["春"],
    tpos: ["休日"],
  },
  {
    id: 2,
    status: "invalid" as const,
    name: "夏の無効コーデ",
    memo: null,
    seasons: ["夏"],
    tpos: ["仕事"],
  },
];

const defaultListProps = {
  outfits: sampleOutfits,
  totalCount: sampleOutfits.length,
  currentPage: 1,
  lastPage: 1,
};

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

describe("InvalidOutfitsList", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    searchParamsValue = "";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("URL クエリの初期値を反映し、条件クリアで URL も戻す", async () => {
    searchParamsValue = "keyword=%E5%A4%8F&season=%E5%A4%8F&sort=name_asc";

    const { default: InvalidOutfitsList } = await import("./invalid-outfits-list");

    await act(async () => {
      root.render(
        React.createElement(InvalidOutfitsList, {
          ...defaultListProps,
          outfits: [sampleOutfits[1]],
          totalCount: 1,
        }),
      );
      await waitForEffects();
    });

    const input = container.querySelector<HTMLInputElement>('input[type="search"]');
    const selects = Array.from(container.querySelectorAll("select"));
    const clearButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("クリア"),
    );

    expect(input?.value).toBe("夏");
    expect((selects[0] as HTMLSelectElement).value).toBe("夏");
    expect((selects[2] as HTMLSelectElement).value).toBe("name_asc");
    expect(container.textContent).toContain("夏の無効コーデ");
    expect(container.textContent).toContain("duplicate-2");
    expect(container.textContent).toContain("利用不可のアイテムを含むため、通常一覧から分けています。");
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      clearButton?.click();
      await waitForEffects();
    });

    expect(replaceMock).toHaveBeenCalledWith("/outfits/invalid", { scroll: false });
  });

  it("ページャ操作で page クエリを更新する", async () => {
    searchParamsValue = "page=2";

    const { default: InvalidOutfitsList } = await import("./invalid-outfits-list");

    await act(async () => {
      root.render(
        React.createElement(InvalidOutfitsList, {
          ...defaultListProps,
          currentPage: 2,
          lastPage: 4,
          totalCount: 30,
        }),
      );
      await waitForEffects();
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("次へ"),
    );

    await act(async () => {
      nextButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("2 / 4ページ（全30件）");
    expect(replaceMock).toHaveBeenCalledWith("/outfits/invalid?page=3", { scroll: false });
  });

  it("検索結果が 0 件のときは invalid 一覧向け空状態を表示する", async () => {
    searchParamsValue = "keyword=%E5%86%AC";

    const { default: InvalidOutfitsList } = await import("./invalid-outfits-list");

    await act(async () => {
      root.render(
        React.createElement(InvalidOutfitsList, {
          ...defaultListProps,
          outfits: [],
          totalCount: 0,
        }),
      );
      await waitForEffects();
    });

    expect(container.textContent).toContain("無効なコーディネートはありません");
    expect(container.textContent).toContain("現在は通常利用できないコーディネートはありません。");
    expect(container.textContent).toContain("条件をクリア");
  });

  it("invalid 一覧では確認導線と複製導線を表示し、編集導線は出さない", async () => {
    const { default: InvalidOutfitsList } = await import("./invalid-outfits-list");

    await act(async () => {
      root.render(React.createElement(InvalidOutfitsList, defaultListProps));
      await waitForEffects();
    });

    expect(container.textContent).toContain("利用不可のアイテムを含むため、通常一覧から分けています。");
    expect(container.innerHTML).toContain('href="/outfits/1"');
    expect(container.innerHTML).not.toContain('/outfits/1/edit');
    expect(container.textContent).toContain("duplicate-1");
    expect(container.textContent).not.toContain("詳細で利用不可の項目を確認し、必要に応じて複製または復旧を検討します。");
  });
});
