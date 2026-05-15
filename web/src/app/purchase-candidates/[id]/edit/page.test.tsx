import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchLaravelWithCookieMock, redirectMock } = vi.hoisted(() => ({
  fetchLaravelWithCookieMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/server/laravel", () => ({
  fetchLaravelWithCookie: fetchLaravelWithCookieMock,
}));

vi.mock("@/components/purchase-candidates/purchase-candidate-form", () => ({
  default: ({
    candidateId,
    initialCandidate,
    cancelHref,
    footerAction,
  }: {
    candidateId: string;
    initialCandidate?: { id: number };
    cancelHref?: string;
    footerAction?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      {
        "data-cancel-href": cancelHref,
        "data-initial-candidate-id": initialCandidate?.id,
      },
      `purchase-candidate-form:${candidateId}`,
      footerAction,
    ),
}));

vi.mock(
  "@/components/purchase-candidates/delete-purchase-candidate-button",
  () => ({
    default: ({
      candidateId,
      isUsedInShoppingMemos,
      shoppingMemoCount,
    }: {
      candidateId: string;
      isUsedInShoppingMemos?: boolean;
      shoppingMemoCount?: number;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "delete-action",
          "data-used-in-shopping-memos": String(isUsedInShoppingMemos),
          "data-shopping-memo-count": shoppingMemoCount,
        },
        `delete-purchase-candidate-button:${candidateId}`,
      ),
  }),
);

describe("EditPurchaseCandidatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLaravelWithCookieMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 14,
          name: "編集候補",
          is_used_in_shopping_memos: false,
          shopping_memo_count: 0,
        },
      }),
    });
  });

  it("編集ヘッダーと削除導線を表示する", async () => {
    const { default: EditPurchaseCandidatePage } = await import("./page");
    const markup = renderToStaticMarkup(
      await EditPurchaseCandidatePage({
        params: Promise.resolve({ id: "14" }),
      }),
    );

    expect(markup).toContain("購入検討管理");
    expect(markup).toContain("購入検討を編集");
    expect(markup).toContain("登録済みの購入検討内容を見直して更新します。");
    expect(markup).toContain('href="/purchase-candidates/14"');
    expect(markup).toContain("詳細へ戻る");
    expect(markup).toContain(
      'data-cancel-href="/purchase-candidates/14?return_to=',
    );
    expect(markup).toContain('data-initial-candidate-id="14"');
    expect(markup).toContain("purchase-candidate-form:14");
    expect(markup).toContain("delete-purchase-candidate-button:14");
    expect(markup).toContain('data-used-in-shopping-memos="false"');
    expect(markup).toContain('data-shopping-memo-count="0"');
  });

  it("買い物メモ所属情報を削除導線へ渡す", async () => {
    fetchLaravelWithCookieMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 14,
          name: "編集候補",
          is_used_in_shopping_memos: true,
          shopping_memo_count: 2,
        },
      }),
    });

    const { default: EditPurchaseCandidatePage } = await import("./page");
    const markup = renderToStaticMarkup(
      await EditPurchaseCandidatePage({
        params: Promise.resolve({ id: "14" }),
      }),
    );

    expect(markup).toContain('data-used-in-shopping-memos="true"');
    expect(markup).toContain('data-shopping-memo-count="2"');
  });
});
