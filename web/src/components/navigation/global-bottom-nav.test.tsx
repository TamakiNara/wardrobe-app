// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

describe("GlobalBottomNav", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
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
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("詳細画面でも該当タブをアクティブにする", async () => {
    usePathnameMock.mockReturnValue("/items/42/edit");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const activeLink = container.querySelector('[aria-current="page"]');

    expect(activeLink?.getAttribute("href")).toBe("/items");
    expect(activeLink?.textContent).toContain("アイテム");
  });

  it("purchase_candidates 配下では購入候補タブをアクティブにする", async () => {
    usePathnameMock.mockReturnValue("/purchase-candidates/12/edit");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const activeLink = container.querySelector('[aria-current="page"]');

    expect(activeLink?.getAttribute("href")).toBe("/purchase-candidates");
    expect(activeLink?.textContent).toContain("購入候補");
  });
});
