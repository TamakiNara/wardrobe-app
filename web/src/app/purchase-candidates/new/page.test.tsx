import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const purchaseCandidateFormMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/purchase-candidates/purchase-candidate-form", () => ({
  default: (props: {
    mode: string;
    cancelHref?: string;
    initialCategoryId?: string;
  }) => {
    purchaseCandidateFormMock(props);

    return React.createElement("div", {
      "data-testid": "purchase-candidate-form",
      "data-mode": props.mode,
      "data-cancel-href": props.cancelHref ?? "",
      "data-initial-category-id": props.initialCategoryId ?? "",
    });
  },
}));

describe("NewPurchaseCandidatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("underwear 一覧から開いた場合は初期カテゴリと戻り先を引き継ぐ", async () => {
    const { default: NewPurchaseCandidatePage } = await import("./page");
    const markup = renderToStaticMarkup(
      await NewPurchaseCandidatePage({
        searchParams: Promise.resolve({
          category: "underwear",
          returnTo: "/purchase-candidates/underwear",
        }),
      }),
    );

    expect(purchaseCandidateFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "create",
        cancelHref: "/purchase-candidates/underwear",
        initialCategoryId: "underwear",
        initialCategoryGroupId: "underwear",
      }),
    );
    expect(markup).toContain('data-initial-category-id="underwear"');
    expect(markup).toContain('href="/purchase-candidates/underwear"');
  });
});
