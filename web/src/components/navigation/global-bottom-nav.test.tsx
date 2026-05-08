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

  it("詳細画面でもアイテムタブを active にする", async () => {
    usePathnameMock.mockReturnValue("/items/42/edit");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const activeLink = container.querySelector('[aria-current="page"]');

    expect(activeLink?.getAttribute("href")).toBe("/items");
    expect(activeLink?.textContent).toContain("アイテム");
  });

  it("purchase-candidates 配下では購入検討タブを active にする", async () => {
    usePathnameMock.mockReturnValue("/purchase-candidates/12/edit");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const activeLink = container.querySelector('[aria-current="page"]');

    expect(activeLink?.getAttribute("href")).toBe("/purchase-candidates");
    expect(activeLink?.textContent).toContain("購入検討");
  });

  it("shopping-memos 配下では購入検討タブを active にする", async () => {
    usePathnameMock.mockReturnValue("/shopping-memos/12");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const activeLink = container.querySelector('[aria-current="page"]');

    expect(activeLink?.getAttribute("href")).toBe("/purchase-candidates");
    expect(activeLink?.textContent).toContain("購入検討");
  });

  it("wear logs 配下では一覧・詳細・新規・編集いずれでも着用履歴タブを active にする", async () => {
    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    for (const pathname of [
      "/wear-logs",
      "/wear-logs/12",
      "/wear-logs/new",
      "/wear-logs/12/edit",
    ]) {
      usePathnameMock.mockReturnValue(pathname);

      await act(async () => {
        root.render(React.createElement(GlobalBottomNav));
      });

      const activeLink = container.querySelector('[aria-current="page"]');

      expect(activeLink?.getAttribute("href")).toBe("/wear-logs");
      expect(activeLink?.textContent).toContain("着用履歴");
    }
  });

  it("fixed 配置は pointer-events を分けて、ナビ本体だけ押せる", async () => {
    usePathnameMock.mockReturnValue("/items");

    const { default: GlobalBottomNav } = await import("./global-bottom-nav");

    await act(async () => {
      root.render(React.createElement(GlobalBottomNav));
    });

    const nav = container.querySelector("nav");
    const wrappers = container.querySelectorAll("div");
    const outerWrapper = wrappers[0];
    const card = wrappers[1];

    expect(nav?.className).toContain("pointer-events-none");
    expect(outerWrapper?.className).toContain("pointer-events-none");
    expect(card?.className).toContain("pointer-events-auto");
  });
});
