// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import LowerBodyPreviewSvg from "./item-lower-body-thumbnail-svg";
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

    const markers = Array.from(
      container.querySelectorAll('[data-testid="bottoms-hem-marker"]'),
    );
    expect(markers).toHaveLength(2);
    expect(markers[0]?.getAttribute("y1")).toBe("48");
    expect(markers[1]?.getAttribute("y1")).toBe("102");
  });

  it("トップス item SVG は shape 差分ではなく共通の角丸四角ベースで描く", async () => {
    await act(async () => {
      root.render(
        <div>
          <ItemThumbnailPreview
            category="tops"
            shape="tshirt"
            mainColorHex="#2563EB"
            topsSpecRaw={{ shape: "tshirt", sleeve: "short" }}
            size="small"
          />
          <ItemThumbnailPreview
            category="tops"
            shape="shirt"
            mainColorHex="#2563EB"
            topsSpecRaw={{ shape: "shirt", sleeve: "long" }}
            size="small"
          />
        </div>,
      );
    });

    const svgs = Array.from(
      container.querySelectorAll('[data-testid="item-toplike-preview-svg"]'),
    );
    expect(svgs).toHaveLength(2);
    const rects = svgs.map((svg) => {
      return svg.querySelector("rect[fill]");
    });
    expect(rects[0]?.getAttribute("x")).toBe("22");
    expect(rects[0]?.getAttribute("y")).toBe("20");
    expect(rects[0]?.getAttribute("width")).toBe("76");
    expect(rects[0]?.getAttribute("height")).toBe("72");
    expect(rects[1]?.getAttribute("x")).toBe("22");
    expect(rects[1]?.getAttribute("y")).toBe("20");
    expect(rects[1]?.getAttribute("width")).toBe("76");
    expect(rects[1]?.getAttribute("height")).toBe("72");
  });

  it("ワンピース item もトップスと同じ共通 SVG を使う", async () => {
    await act(async () => {
      root.render(
        <ItemThumbnailPreview
          category="dress"
          shape="onepiece"
          mainColorHex="#7C3AED"
          size="small"
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="item-toplike-preview-svg"]'),
    ).not.toBeNull();
    expect(container.textContent).not.toContain("SVG プレビュー");
  });

  it("トップス系のサブカラーは右下三角ラインで表現する", async () => {
    await act(async () => {
      root.render(
        <div>
          <ItemThumbnailPreview
            category="tops"
            shape="knit"
            mainColorHex="#1F2937"
            subColorHex="#F59E0B"
            size="small"
          />
          <ItemThumbnailPreview
            category="tops"
            shape="knit"
            mainColorHex="#1F2937"
            size="small"
          />
        </div>,
      );
    });

    const lines = Array.from(
      container.querySelectorAll('[data-testid="item-toplike-subcolor-line"]'),
    );
    const svgs = Array.from(
      container.querySelectorAll('[data-testid="item-toplike-preview-svg"]'),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.getAttribute("x")).toBe("22");
    expect(lines[0]?.getAttribute("y")).toBe("20");
    expect(lines[0]?.getAttribute("width")).toBe("76");
    expect(lines[0]?.getAttribute("height")).toBe("6");
    expect(
      svgs[1]?.querySelector('[data-testid="item-toplike-subcolor-line"]'),
    ).toBeNull();
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

    const overlays = Array.from(
      container.querySelectorAll('[data-testid="legwear-overlay"]'),
    );
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

    const overlays = Array.from(
      container.querySelectorAll('[data-testid="legwear-overlay"]'),
    );
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

    expect(
      container.querySelector('[data-testid="lower-body-preview-svg"]'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="bottoms-hem-marker"]')
        ?.getAttribute("y1"),
    ).toBe("102");
  });

  it("coverage_type 未設定のレッグウェアは full-length fallback として扱う", async () => {
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

    const overlay = container.querySelector('[data-testid="legwear-overlay"]');
    expect(
      container.querySelector('[data-testid="lower-body-preview-svg"]'),
    ).not.toBeNull();
    expect(overlay?.getAttribute("y")).toBe("18");
    expect(overlay?.getAttribute("height")).toBe("84");
  });

  it("bottoms と legwear を合成する場合は legwear を先に描いてから bottoms を重ねる", async () => {
    await act(async () => {
      root.render(
        <LowerBodyPreviewSvg
          lengthType="knee"
          coverageType="full_length_fallback"
          bottomsMainColor="#1F2937"
          legwearMainColor="#334155"
        />,
      );
    });

    const svg = container.querySelector(
      '[data-testid="lower-body-preview-svg"]',
    );
    const children = Array.from(
      svg?.querySelectorAll("[data-testid]") ?? [],
    ).map((node) => {
      return node.getAttribute("data-testid");
    });
    expect(children.indexOf("legwear-overlay")).toBeGreaterThan(-1);
    expect(children.indexOf("bottoms-garment")).toBeGreaterThan(-1);
    expect(children.indexOf("legwear-overlay")).toBeLessThan(
      children.indexOf("bottoms-garment"),
    );
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

    expect(
      container
        .querySelector('[data-testid="lower-body-skin-base"]')
        ?.getAttribute("fill"),
    ).toBe("#C98D5E");
  });
});
