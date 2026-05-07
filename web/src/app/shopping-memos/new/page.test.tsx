import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/shopping-memos/shopping-memo-create-form", () => ({
  default: ({ cancelHref }: { cancelHref: string }) =>
    React.createElement(
      "div",
      { "data-testid": "shopping-memo-create-form" },
      cancelHref,
    ),
}));

describe("NewShoppingMemoPage", () => {
  it("作成画面のヘッダーとフォームを表示する", async () => {
    const { default: NewShoppingMemoPage } = await import("./page");
    const markup = renderToStaticMarkup(
      React.createElement(NewShoppingMemoPage),
    );

    expect(markup).toContain("買い物メモを作成");
    expect(markup).toContain("買い物メモ一覧");
    expect(markup).toContain('href="/shopping-memos"');
    expect(markup).toContain('data-testid="shopping-memo-create-form"');
  });
});
