import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/purchase-candidates/purchase-candidate-form", () => ({
  default: ({
    candidateId,
    cancelHref,
    footerAction,
  }: {
    candidateId: string;
    cancelHref?: string;
    footerAction?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      {
        "data-cancel-href": cancelHref,
      },
      `purchase-candidate-form:${candidateId}`,
      footerAction,
    ),
}));

vi.mock(
  "@/components/purchase-candidates/delete-purchase-candidate-button",
  () => ({
    default: ({ candidateId }: { candidateId: string }) =>
      React.createElement(
        "div",
        { "data-testid": "delete-action" },
        `delete-purchase-candidate-button:${candidateId}`,
      ),
  }),
);

describe("EditPurchaseCandidatePage", () => {
  it("編集ヘッダーと削除導線を表示する", async () => {
    const { default: EditPurchaseCandidatePage } = await import("./page");
    const markup = renderToStaticMarkup(
      await EditPurchaseCandidatePage({
        params: Promise.resolve({ id: "14" }),
      }),
    );

    expect(markup).toContain("購入検討管理");
    expect(markup).toContain("購入検討編集");
    expect(markup).toContain("登録済みの購入検討内容を見直して更新します。");
    expect(markup).toContain('href="/purchase-candidates/14"');
    expect(markup).toContain("詳細へ戻る");
    expect(markup).toContain('data-cancel-href="/purchase-candidates/14"');
    expect(markup).toContain("purchase-candidate-form:14");
    expect(markup).toContain("delete-purchase-candidate-button:14");
  });
});
