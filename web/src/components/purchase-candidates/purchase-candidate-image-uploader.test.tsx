// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseCandidateImageUploader from "./purchase-candidate-image-uploader";

describe("PurchaseCandidateImageUploader", () => {
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

  function renderUploader(
    props?: Partial<
      React.ComponentProps<typeof PurchaseCandidateImageUploader>
    >,
  ) {
    const onPendingImagesChange = props?.onPendingImagesChange ?? vi.fn();

    act(() => {
      root.render(
        <PurchaseCandidateImageUploader
          existingImages={props?.existingImages ?? []}
          pendingImages={props?.pendingImages ?? []}
          onPendingImagesChange={onPendingImagesChange}
          onDeleteExistingImage={props?.onDeleteExistingImage}
          disabled={props?.disabled ?? false}
          error={props?.error}
          helperText={props?.helperText}
        />,
      );
    });

    return { onPendingImagesChange };
  }

  it("file select で画像を追加できる", async () => {
    const { onPendingImagesChange } = renderUploader();
    const input = container.querySelector("#images") as HTMLInputElement;
    const file = new File(["image"], "front.png", { type: "image/png" });

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [file],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onPendingImagesChange).toHaveBeenCalledTimes(1);
    expect(onPendingImagesChange).toHaveBeenCalledWith([file]);
  });

  it("drag & drop と paste で画像を追加できる", async () => {
    const { onPendingImagesChange } = renderUploader();
    const dropzone = container.querySelector(
      '[aria-label="画像追加エリア"]',
    ) as HTMLDivElement;
    const droppedFile = new File(["drop"], "drop.png", { type: "image/png" });
    const pastedFile = new File(["paste"], "paste.webp", {
      type: "image/webp",
    });

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        configurable: true,
        value: { files: [droppedFile] },
      });
      dropzone.dispatchEvent(dropEvent);
    });

    await act(async () => {
      const pasteEvent = new Event("paste", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(pasteEvent, "clipboardData", {
        configurable: true,
        value: { files: [pastedFile] },
      });
      dropzone.dispatchEvent(pasteEvent);
    });

    expect(onPendingImagesChange).toHaveBeenNthCalledWith(1, [droppedFile]);
    expect(onPendingImagesChange).toHaveBeenNthCalledWith(2, [pastedFile]);
  });

  it("上限超過時に日本語エラーを表示する", async () => {
    renderUploader({
      existingImages: [
        {
          id: 1,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/a.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/a.png",
          original_filename: "a.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 1,
          is_primary: true,
        },
        {
          id: 2,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/b.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/b.png",
          original_filename: "b.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 2,
          is_primary: false,
        },
        {
          id: 3,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/c.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/c.png",
          original_filename: "c.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 3,
          is_primary: false,
        },
        {
          id: 4,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/d.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/d.png",
          original_filename: "d.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 4,
          is_primary: false,
        },
      ],
      pendingImages: [new File(["p"], "pending.png", { type: "image/png" })],
    });

    const input = container.querySelector("#images") as HTMLInputElement;
    const overflowFile = new File(["overflow"], "overflow.png", {
      type: "image/png",
    });

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [overflowFile],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "画像は5枚まで登録できます。不要な画像を削除してから追加してください。",
    );
  });
});
