// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ColorSelect from "./color-select";

describe("ColorSelect", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
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

  it("選択肢パネルを trigger 幅より広く表示でき、HEX を補助表示する", async () => {
    const handleChange = vi.fn();

    act(() => {
      root.render(
        <ColorSelect
          value="white"
          onChange={handleChange}
          placeholder="メインカラーを選択"
        />,
      );
    });

    const triggerButton = container.querySelector("button");
    expect(triggerButton).not.toBeNull();

    await act(async () => {
      triggerButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    const dropdown = Array.from(container.querySelectorAll("div")).find(
      (node) => node.className.includes("w-[min(22rem,calc(100vw-2rem))]"),
    );

    expect(dropdown).not.toBeUndefined();
    expect(container.textContent).toContain("#ECECEC");
    expect(container.textContent).toContain("ホワイト");
  });
});
