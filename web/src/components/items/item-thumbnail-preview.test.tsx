// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ItemThumbnailPreview from "./item-thumbnail-preview";

describe("ItemThumbnailPreview", () => {
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

  it("ボトムス丈に応じて裾位置が変わる", async () => {
    await act(async () => {
      root.render(
        <div>
          <ItemThumbnailPreview
            category="bottoms"
            shape="straight"
            mainColorHex="#1F2937"
            spec={{ bottoms: { length_type: "mini" } }}
            size="small"
          />
          <ItemThumbnailPreview
            category="bottoms"
            shape="straight"
            mainColorHex="#1F2937"
            spec={{ bottoms: { length_type: "full" } }}
            size="small"
          />
        </div>,
      );
    });

    const markers = Array.from(container.querySelectorAll('[data-testid="bottoms-hem-marker"]'));
    expect(markers).toHaveLength(2);
    expect(markers[0]?.getAttribute("y1")).toBe("48");
    expect(markers[1]?.getAttribute("y1")).toBe("102");
  });

  it("ソックスは coverage_type に応じて下側から覆う長さが変わる", async () => {
    await act(async () => {
      root.render(
        <div>
          <ItemThumbnailPreview
            category="legwear"
            shape="socks"
            mainColorHex="#334155"
            spec={{ legwear: { coverage_type: "ankle_socks" } }}
            size="small"
          />
          <ItemThumbnailPreview
            category="legwear"
            shape="socks"
            mainColorHex="#334155"
            spec={{ legwear: { coverage_type: "over_knee" } }}
            size="small"
          />
        </div>,
      );
    });

    const overlays = Array.from(container.querySelectorAll('[data-testid="legwear-overlay"]'));
    expect(overlays).toHaveLength(2);
    expect(overlays[0]?.getAttribute("y")).toBe("86");
    expect(overlays[1]?.getAttribute("y")).toBe("40");
  });

  it("stockings と tights で不透明度が変わる", async () => {
    await act(async () => {
      root.render(
        <div>
          <ItemThumbnailPreview
            category="legwear"
            shape="stockings"
            mainColorHex="#111827"
            spec={{ legwear: { coverage_type: "stockings" } }}
            size="small"
          />
          <ItemThumbnailPreview
            category="legwear"
            shape="tights"
            mainColorHex="#111827"
            spec={{ legwear: { coverage_type: "tights" } }}
            size="small"
          />
        </div>,
      );
    });

    const overlays = Array.from(container.querySelectorAll('[data-testid="legwear-overlay"]'));
    expect(overlays).toHaveLength(2);
    expect(overlays[0]?.getAttribute("fill-opacity")).toBe("0.38");
    expect(overlays[1]?.getAttribute("fill-opacity")).toBe("0.92");
  });

  it("spec 未設定のボトムスは描画上 full 扱いにフォールバックする", async () => {
    await act(async () => {
      root.render(
        <ItemThumbnailPreview
          category="bottoms"
          shape="straight"
          mainColorHex="#9CA3AF"
          size="small"
        />,
      );
    });

    expect(container.querySelector('[data-testid="lower-body-preview-svg"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="bottoms-hem-marker"]')?.getAttribute("y1")).toBe("102");
  });

  it("coverage_type 未設定のレッグウェアは効果なしとして扱う", async () => {
    await act(async () => {
      root.render(
        <ItemThumbnailPreview
          category="legwear"
          shape="socks"
          mainColorHex="#334155"
          size="small"
        />,
      );
    });

    expect(container.querySelector('[data-testid="lower-body-preview-svg"]')).toBeNull();
  });

  it("skinTonePreset に応じて肌色を切り替える", async () => {
    await act(async () => {
      root.render(
        <ItemThumbnailPreview
          category="legwear"
          shape="tights"
          mainColorHex="#111827"
          spec={{ legwear: { coverage_type: "tights" } }}
          skinTonePreset="yellow_deep"
          size="small"
        />,
      );
    });

    expect(container.querySelector('[data-testid="lower-body-skin-base"]')?.getAttribute("fill")).toBe("#C98D5E");
  });
});
