// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PurchaseCandidateDetailImages from "./purchase-candidate-detail-images";

describe("PurchaseCandidateDetailImages", () => {
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

  it("画像読み込み失敗時に fallback を表示する", async () => {
    await act(async () => {
      root.render(
        <PurchaseCandidateDetailImages
          candidateName="候補"
          images={[
            {
              id: 1,
              purchase_candidate_id: 10,
              disk: "public",
              path: "purchase-candidates/10/broken.png",
              url: "https://example.test/broken.png",
              original_filename: "broken.png",
              mime_type: "image/png",
              file_size: 1024,
              sort_order: 1,
              is_primary: true,
            },
          ]}
        />,
      );
    });

    const image = container.querySelector<HTMLImageElement>(
      'img[src="https://example.test/broken.png"]',
    );
    expect(image).not.toBeNull();

    await act(async () => {
      image!.dispatchEvent(new Event("error"));
    });

    expect(container.textContent).toContain("画像を表示できません");
    expect(
      container.querySelector('img[src="https://example.test/broken.png"]'),
    ).toBeNull();
    expect(container.textContent).toContain("1枚目");
    expect(container.textContent).toContain("代表画像");
  });

  it("画像がない場合は未登録表示にする", async () => {
    await act(async () => {
      root.render(
        <PurchaseCandidateDetailImages candidateName="候補" images={[]} />,
      );
    });

    expect(container.textContent).toContain("画像はまだありません。");
  });
});
