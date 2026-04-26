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
    const onDeleteExistingImage = props?.onDeleteExistingImage ?? vi.fn();
    const onMoveExistingImage = props?.onMoveExistingImage ?? vi.fn();
    const onMakePrimaryExistingImage =
      props?.onMakePrimaryExistingImage ?? vi.fn();

    act(() => {
      root.render(
        <PurchaseCandidateImageUploader
          existingImages={props?.existingImages ?? []}
          pendingImages={props?.pendingImages ?? []}
          onPendingImagesChange={onPendingImagesChange}
          onDeleteExistingImage={onDeleteExistingImage}
          onMoveExistingImage={onMoveExistingImage}
          onMakePrimaryExistingImage={onMakePrimaryExistingImage}
          disabled={props?.disabled ?? false}
          error={props?.error}
          helperText={props?.helperText}
        />,
      );
    });

    return {
      onPendingImagesChange,
      onDeleteExistingImage,
      onMoveExistingImage,
      onMakePrimaryExistingImage,
    };
  }

  it("ファイル選択で画像を追加できる", async () => {
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

  it("貼り付けとドラッグ&ドロップで画像を追加できる", async () => {
    const { onPendingImagesChange } = renderUploader();
    const pasteArea = container.querySelector(
      '[aria-label="画像の貼り付けとドロップエリア"]',
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
      pasteArea.dispatchEvent(dropEvent);
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
      pasteArea.dispatchEvent(pasteEvent);
    });

    expect(onPendingImagesChange).toHaveBeenNthCalledWith(1, [droppedFile]);
    expect(onPendingImagesChange).toHaveBeenNthCalledWith(2, [pastedFile]);
  });

  it("貼り付けエリアのクリックではファイル選択ダイアログを開かない", async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    renderUploader();

    const pasteArea = container.querySelector(
      '[aria-label="画像の貼り付けとドロップエリア"]',
    ) as HTMLDivElement;
    expect(pasteArea).not.toBeNull();

    await act(async () => {
      pasteArea.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("ファイル上限超過時に日本語エラーを表示する", async () => {
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
      "画像は5枚まで追加できます。既存の画像を削除してから追加してください。",
    );
  });

  it("既存画像で fallback と削除・並び替え・代表画像変更を渡せる", async () => {
    const onDeleteExistingImage = vi.fn();
    const onMoveExistingImage = vi.fn();
    const onMakePrimaryExistingImage = vi.fn();

    renderUploader({
      existingImages: [
        {
          id: 10,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/broken.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/broken.png",
          original_filename: "broken.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 1,
          is_primary: true,
        },
        {
          id: 11,
          purchase_candidate_id: 1,
          disk: "public",
          path: "purchase-candidates/1/second.png",
          url: "http://localhost:8000/storage/purchase-candidates/1/second.png",
          original_filename: "second.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 2,
          is_primary: false,
        },
      ],
      onDeleteExistingImage,
      onMoveExistingImage,
      onMakePrimaryExistingImage,
    });

    const image = container.querySelector<HTMLImageElement>(
      'img[src="http://localhost:8000/storage/purchase-candidates/1/broken.png"]',
    );
    expect(image).not.toBeNull();

    await act(async () => {
      image!.dispatchEvent(new Event("error"));
    });

    expect(container.textContent).toContain("画像を表示できません");

    const upButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "上へ",
    );
    const downButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "下へ",
    );
    const primaryButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "代表にする",
    );
    const deleteButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "削除",
    );

    await act(async () => {
      downButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      primaryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(upButton?.hasAttribute("disabled")).toBe(true);
    expect(onMoveExistingImage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      "down",
    );
    expect(onMakePrimaryExistingImage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11 }),
    );
    expect(onDeleteExistingImage).toHaveBeenCalledWith(10);
  });
});
