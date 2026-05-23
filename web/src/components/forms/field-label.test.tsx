// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import FieldLabel from "./field-label";

describe("FieldLabel", () => {
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

  it("required の場合は必須 badge を表示する", () => {
    act(() => {
      root.render(
        React.createElement(FieldLabel, {
          htmlFor: "item-name",
          label: "アイテム名",
          required: true,
        }),
      );
    });

    const label = container.querySelector("label");

    expect(label?.getAttribute("for")).toBe("item-name");
    expect(label?.textContent).toContain("アイテム名");
    expect(label?.textContent).toContain("必須");
  });

  it("required でない場合は必須 badge を表示しない", () => {
    act(() => {
      root.render(
        React.createElement(FieldLabel, {
          htmlFor: "item-memo",
          label: "メモ",
        }),
      );
    });

    const label = container.querySelector("label");

    expect(label?.textContent).toContain("メモ");
    expect(label?.textContent).not.toContain("必須");
  });

  it("as=div の場合も必須 badge を表示できる", () => {
    act(() => {
      root.render(
        React.createElement(FieldLabel, {
          as: "div",
          label: "カテゴリ",
          required: true,
        }),
      );
    });

    expect(container.querySelector("label")).toBeNull();
    expect(container.textContent).toContain("カテゴリ");
    expect(container.textContent).toContain("必須");
  });
});
