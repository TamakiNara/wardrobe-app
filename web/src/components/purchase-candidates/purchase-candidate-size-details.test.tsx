// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PurchaseCandidateSizeDetails from "./purchase-candidate-size-details";

describe("PurchaseCandidateSizeDetails", () => {
  let container: HTMLDivElement;
  let root: Root;

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
  });

  it("複数サイズ候補がある場合はタブで切り替えて表示できる", () => {
    act(() => {
      root.render(
        <PurchaseCandidateSizeDetails
          sizeGender="women"
          resolvedCategory="skirts"
          resolvedShape="narrow"
          sizeOptions={[
            {
              key: "primary",
              label: "M",
              note: "ジャスト寄り",
              sizeDetails: {
                structured: {
                  waist: { value: 66 },
                },
              },
              optionLabel: "サイズ候補1（M）",
            },
            {
              key: "alternate",
              label: "L",
              note: "ゆったり寄り",
              sizeDetails: {
                structured: {
                  waist: { value: 70 },
                },
                custom_fields: [
                  {
                    label: "裾スリット",
                    value: 24,
                    sort_order: 1,
                  },
                ],
              },
              optionLabel: "サイズ候補2（L）",
            },
          ]}
        />,
      );
    });

    const tablist = container.querySelector('[role="tablist"]');
    const primaryTab = container.querySelector(
      '[role="tab"][id="purchase-candidate-size-tab-primary"]',
    );
    const alternateTab = container.querySelector(
      '[role="tab"][id="purchase-candidate-size-tab-alternate"]',
    );

    expect(tablist?.getAttribute("aria-label")).toBe("サイズ候補");
    expect(primaryTab?.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("ジャスト寄り");
    expect(container.textContent).toContain("66cm");

    act(() => {
      alternateTab?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(alternateTab?.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("ゆったり寄り");
    expect(container.textContent).toContain("70cm");
    expect(container.textContent).toContain("裾スリット");
    expect(container.textContent).toContain("24cm");
  });

  it("サイズ候補が1つだけのときはタブを表示しない", () => {
    act(() => {
      root.render(
        <PurchaseCandidateSizeDetails
          sizeGender="men"
          resolvedCategory="tops"
          resolvedShape="shirt"
          sizeOptions={[
            {
              key: "primary",
              label: "S",
              note: null,
              sizeDetails: null,
              optionLabel: "サイズ候補1（S）",
            },
          ]}
        />,
      );
    });

    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain("サイズ区分");
    expect(container.textContent).toContain("メンズ");
    expect(container.textContent).toContain("S");
  });
});
