// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ItemPreviewCard from "./item-preview-card";

describe("ItemPreviewCard", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("ボトムスと色と skinTonePreset の開発用情報を表示できる", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG", "true");

    await act(async () => {
      root.render(
        <ItemPreviewCard
          name="ミディスカート"
          category="bottoms"
          shape="flare-skirt"
          mainColorHex="#CBB79D"
          mainColorLabel="ベージュ"
          subColorHex="#8A9099"
          subColorLabel="グレー"
          spec={{ bottoms: { length_type: "midi" } }}
          skinTonePreset="neutral_medium"
        />,
      );
    });

    expect(container.textContent).toContain("プレビュー詳細");
    expect(container.textContent).toContain("メインカラー");
    expect(container.textContent).toContain("ベージュ (#CBB79D)");
    expect(container.textContent).toContain("サブカラー");
    expect(container.textContent).toContain("グレー (#8A9099)");
    expect(container.textContent).toContain("skinTonePreset");
    expect(container.textContent).toContain("ニュートラル・標準 (neutral_medium)");
    expect(container.textContent).toContain("ボトムス仕様");
    expect(container.textContent).toContain("ボトムス丈");
    expect(container.textContent).toContain("ミディ丈");
  });

  it("レッグウェア仕様も同じ重さで表示できる", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG", "true");

    await act(async () => {
      root.render(
        <ItemPreviewCard
          name="ブラックタイツ"
          category="legwear"
          shape="tights"
          mainColorHex="#1F1F1F"
          mainColorLabel="ブラック"
          spec={{ legwear: { coverage_type: "tights" } }}
          skinTonePreset="yellow_medium"
        />,
      );
    });

    expect(container.textContent).toContain("レッグウェア仕様");
    expect(container.textContent).toContain("レッグウェア");
    expect(container.textContent).toContain("タイツ");
    expect(container.textContent).toContain("イエロー系・標準 (yellow_medium)");
  });

  it("feature flag が無効なときは開発用詳細を表示しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG", "false");

    await act(async () => {
      root.render(
        <ItemPreviewCard
          name="ミディスカート"
          category="bottoms"
          shape="flare-skirt"
          mainColorHex="#CBB79D"
          mainColorLabel="ベージュ"
          subColorHex="#8A9099"
          subColorLabel="グレー"
          spec={{ bottoms: { length_type: "midi" } }}
          skinTonePreset="neutral_medium"
        />,
      );
    });

    expect(container.textContent).not.toContain("プレビュー詳細");
    expect(container.textContent).not.toContain("メインカラー");
    expect(container.textContent).not.toContain("skinTonePreset");
    expect(container.textContent).not.toContain("ボトムス仕様");
  });
});
