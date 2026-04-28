// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchaseCandidateSizeOption } from "@/lib/purchase-candidates/size-comparison";

const pushMock = vi.fn();
let pathnameValue = "/purchase-candidates/10";
let searchParamsValue = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => pathnameValue,
  useSearchParams: () => ({
    toString: () => searchParamsValue,
  }),
}));

function syncLocation() {
  const search = searchParamsValue ? `?${searchParamsValue}` : "";
  window.history.pushState({}, "", `${pathnameValue}${search}`);
}

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function buildItemDraftResponse() {
  return {
    message: "item_draft_ready",
    item_draft: {
      name: "コート候補",
      source_category_id: "outerwear_coat",
      category: "outerwear",
      subcategory: "coat",
      shape: "coat",
      size_note: "厚手ニット込み",
      size_details: {
        structured: {
          shoulder_width: { value: 42 },
        },
        custom_fields: [
          {
            label: "裄丈",
            value: 78,
            sort_order: 1,
          },
        ],
      },
      colors: [],
      seasons: ["春"],
      tpos: ["休日"],
      materials: [],
    },
    candidate_summary: {
      id: 10,
      status: "considering",
      priority: "medium",
      name: "コート候補",
      converted_item_id: null,
      converted_at: null,
    },
    images: [],
  };
}

const singleSizeOptions: PurchaseCandidateSizeOption[] = [
  {
    key: "primary",
    label: "M",
    note: "厚手ニット込み",
    optionLabel: "サイズ候補1（M）",
    sizeDetails: {
      structured: {
        shoulder_width: { value: 42 },
      },
    },
  },
];

const multiSizeOptions: PurchaseCandidateSizeOption[] = [
  {
    key: "primary",
    label: "M",
    note: "ジャスト寄り",
    optionLabel: "サイズ候補1（M）",
    sizeDetails: {
      structured: {
        shoulder_width: { value: 42.5 },
      },
      custom_fields: [
        {
          label: "裄丈",
          value: 78,
          sort_order: 1,
        },
      ],
    },
  },
  {
    key: "alternate",
    label: "L",
    note: "ゆったり寄り",
    optionLabel: "サイズ候補2（L）",
    sizeDetails: {
      structured: {
        shoulder_width: { value: 45 },
      },
      custom_fields: [
        {
          label: "裄丈",
          value: 80,
          sort_order: 1,
        },
      ],
    },
  },
];

describe("PurchaseCandidateItemDraftAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    pathnameValue = "/purchase-candidates/10";
    searchParamsValue = "";
    syncLocation();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("サイズ候補が1つだけならそのまま item 新規作成へ遷移する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(buildItemDraftResponse()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { default: PurchaseCandidateItemDraftAction } =
      await import("./purchase-candidate-item-draft-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateItemDraftAction, {
          candidateId: 10,
          convertedItemId: null,
          sizeOptions: singleSizeOptions,
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/purchase-candidates/10/item-draft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ selected_size: "primary" }),
      }),
    );
    expect(container.textContent).not.toContain("アイテム化するサイズを選択");
    expect(pushMock).toHaveBeenCalledWith(
      "/items/new?source=purchase-candidate&returnTo=%2Fpurchase-candidates%2F10",
    );
  });

  it("サイズ候補が2つあるときは選択UIを開いてから item 化する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(buildItemDraftResponse()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { default: PurchaseCandidateItemDraftAction } =
      await import("./purchase-candidate-item-draft-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateItemDraftAction, {
          candidateId: 10,
          convertedItemId: null,
          sizeOptions: multiSizeOptions,
        }),
      );
      await waitForEffects();
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.includes("アイテムに追加する"),
    );

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("アイテム化するサイズを選択");
    expect(container.textContent).toContain("サイズ候補1");
    expect(container.textContent).toContain("サイズ候補2");
    expect(container.textContent).toContain("M");
    expect(container.textContent).toContain("L");
    expect(container.textContent).toContain("ジャスト寄り");
    expect(container.textContent).toContain("ゆったり寄り");
    expect(container.textContent).not.toContain("肩幅");
    expect(container.textContent).not.toContain("自由項目");
    expect(fetchMock).not.toHaveBeenCalled();

    const radios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );

    await act(async () => {
      radios[1]?.click();
      await waitForEffects();
    });

    const confirmButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.includes("このサイズで追加"),
    );

    await act(async () => {
      confirmButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/purchase-candidates/10/item-draft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ selected_size: "secondary" }),
      }),
    );
  });

  it("キャンセル時は item-draft を生成しない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { default: PurchaseCandidateItemDraftAction } =
      await import("./purchase-candidate-item-draft-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateItemDraftAction, {
          candidateId: 10,
          convertedItemId: null,
          sizeOptions: multiSizeOptions,
        }),
      );
      await waitForEffects();
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.includes("アイテムに追加する"),
    );

    await act(async () => {
      openButton?.click();
      await waitForEffects();
    });

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.includes("キャンセル"),
    );

    await act(async () => {
      cancelButton?.click();
      await waitForEffects();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("アイテム化するサイズを選択");
  });

  it("現在の一覧条件を returnTo として item 新規作成へ引き継ぐ", async () => {
    pathnameValue = "/purchase-candidates";
    searchParamsValue = "status=considering&page=2";
    syncLocation();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(buildItemDraftResponse()), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const { default: PurchaseCandidateItemDraftAction } =
      await import("./purchase-candidate-item-draft-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateItemDraftAction, {
          candidateId: 10,
          convertedItemId: null,
          sizeOptions: singleSizeOptions,
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/items/new?source=purchase-candidate&returnTo=%2Fpurchase-candidates%3Fstatus%3Dconsidering%26page%3D2",
    );
  });

  it("item-draft の raw message を action error として表示しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message:
              "SQLSTATE[42S22]: Column not found: 1054 Unknown column custom_label",
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const { default: PurchaseCandidateItemDraftAction } =
      await import("./purchase-candidate-item-draft-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateItemDraftAction, {
          candidateId: 10,
          convertedItemId: null,
          sizeOptions: singleSizeOptions,
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "アイテム作成用の初期値作成に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});
