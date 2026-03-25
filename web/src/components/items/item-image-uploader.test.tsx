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

  function renderUploader(props?: Partial<React.ComponentProps<typeof ItemImageUploader>>) {
    const onPendingImagesChange = props?.onPendingImagesChange ?? vi.fn();
    const onDeleteExistingImage = props?.onDeleteExistingImage ?? vi.fn();

    act(() => {
      root.render(
        <ItemImageUploader
          existingImages={props?.existingImages ?? []}
          pendingImages={props?.pendingImages ?? []}
          onPendingImagesChange={onPendingImagesChange}
          onDeleteExistingImage={onDeleteExistingImage}
          disabled={props?.disabled ?? false}
          error={props?.error}
          helperText={props?.helperText}
        />,
      );
    });

    return { onPendingImagesChange, onDeleteExistingImage };
  }

  it("file select と delete を扱える", async () => {
    const { onPendingImagesChange, onDeleteExistingImage } = renderUploader({
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

    const deleteButton = Array.from(container.querySelectorAll("button")).find((element) => element.textContent === "削除");
    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onPendingImagesChange).toHaveBeenCalledWith([file]);
    expect(onDeleteExistingImage).toHaveBeenCalledTimes(1);
  });
});
