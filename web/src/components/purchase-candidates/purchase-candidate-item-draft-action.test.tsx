// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("PurchaseCandidateItemDraftAction", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
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

  it("item-draft 成功時は payload を保存して item 新規作成へ遷移する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "item_draft_ready",
            item_draft: {
              name: "コート候補",
              source_category_id: "outer_coat",
              category: "outer",
              shape: "trench",
              size_note: "厚手ニット込み",
              size_details: {
                structured: {
                  shoulder_width: 42,
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
              tpos: ["仕事"],
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
          }),
          { status: 200, headers: { "content-type": "application/json" } },
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
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/purchase-candidates/10/item-draft",
      expect.objectContaining({ method: "POST" }),
    );
    const rawDraft = window.sessionStorage.getItem(
      "purchase-candidate-item-draft",
    );

    expect(rawDraft).toContain("outer_coat");
    expect(rawDraft).toContain("厚手ニット込み");
    expect(rawDraft).toContain("shoulder_width");
    expect(pushMock).toHaveBeenCalledWith(
      "/items/new?source=purchase-candidate",
    );
  });
});
