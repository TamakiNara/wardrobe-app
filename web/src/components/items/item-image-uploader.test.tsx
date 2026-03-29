// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ItemImageUploader from "./item-image-uploader";

describe("ItemImageUploader", () => {
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
    props?: Partial<React.ComponentProps<typeof ItemImageUploader>>,
  ) {
    const onPendingImagesChange = props?.onPendingImagesChange ?? vi.fn();
    const onDeleteExistingImage = props?.onDeleteExistingImage ?? vi.fn();
    const onMoveExistingImage = props?.onMoveExistingImage ?? vi.fn();
    const onMakePrimaryExistingImage =
      props?.onMakePrimaryExistingImage ?? vi.fn();

    act(() => {
      root.render(
        <ItemImageUploader
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

  it("file select と画像操作を扱える", async () => {
    const {
      onPendingImagesChange,
      onDeleteExistingImage,
      onMoveExistingImage,
      onMakePrimaryExistingImage,
    } = renderUploader({
      existingImages: [
        {
          id: 1,
          item_id: 10,
          disk: "public",
          path: "items/10/existing.png",
          url: "http://localhost:8000/storage/items/10/existing.png",
          original_filename: "existing.png",
          mime_type: "image/png",
          file_size: 1000,
          sort_order: 1,
          is_primary: true,
        },
      ],
    });

    const input = container.querySelector("#images") as HTMLInputElement;
    const file = new File(["image"], "front.png", { type: "image/png" });

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [file],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const upButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "上へ",
    );
    const downButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "下へ",
    );
    const primaryButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "代表画像",
    );
    const deleteButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "削除",
    );
    await act(async () => {
      upButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      downButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      primaryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onPendingImagesChange).toHaveBeenCalledWith([file]);
    expect(onMoveExistingImage).not.toHaveBeenCalled();
    expect(onMakePrimaryExistingImage).not.toHaveBeenCalled();
    expect(onDeleteExistingImage).toHaveBeenCalledTimes(1);
  });

  it("複数画像では並び替えと代表切り替えを操作できる", async () => {
    const existingImages = [
      {
        id: 1,
        item_id: 10,
        disk: "public",
        path: "items/10/first.png",
        url: "http://localhost:8000/storage/items/10/first.png",
        original_filename: "first.png",
        mime_type: "image/png",
        file_size: 1000,
        sort_order: 1,
        is_primary: true,
      },
      {
        id: 2,
        item_id: 10,
        disk: "public",
        path: "items/10/second.png",
        url: "http://localhost:8000/storage/items/10/second.png",
        original_filename: "second.png",
        mime_type: "image/png",
        file_size: 1000,
        sort_order: 2,
        is_primary: false,
      },
    ] as const;

    const { onMoveExistingImage, onMakePrimaryExistingImage } = renderUploader({
      existingImages: [...existingImages],
    });

    const downButton = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "下へ",
    );
    const makePrimaryButton = Array.from(
      container.querySelectorAll("button"),
    ).find((element) => element.textContent === "代表にする");

    await act(async () => {
      downButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      makePrimaryButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onMoveExistingImage).toHaveBeenCalledWith(existingImages[0], "down");
    expect(onMakePrimaryExistingImage).toHaveBeenCalledWith(existingImages[1]);
  });
});
