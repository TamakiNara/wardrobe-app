"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from "react";
import type { PurchaseCandidateImageRecord } from "@/types/purchase-candidates";

type PurchaseCandidateImageUploaderProps = {
  existingImages: PurchaseCandidateImageRecord[];
  pendingImages: File[];
  onPendingImagesChange: (files: File[]) => void;
  onDeleteExistingImage?: (imageId: number) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
};

type PendingImagePreview = {
  key: string;
  file: File;
  url: string;
};

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatBytes(bytes: number | null): string | null {
  if (bytes === null || Number.isNaN(bytes)) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 102.4) / 10}KB`;
  }

  return `${Math.round(bytes / 104857.6) / 10}MB`;
}

export default function PurchaseCandidateImageUploader({
  existingImages,
  pendingImages,
  onPendingImagesChange,
  onDeleteExistingImage,
  disabled = false,
  error,
  helperText,
}: PurchaseCandidateImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pendingPreviews = useMemo<PendingImagePreview[]>(
    () =>
      pendingImages.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [pendingImages],
  );

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [pendingPreviews]);

  function applyFiles(nextFiles: File[]) {
    if (disabled) {
      return;
    }

    const remaining = Math.max(0, MAX_IMAGE_COUNT - existingImages.length - pendingImages.length);
    if (remaining <= 0) {
      setLocalError("画像は5枚まで登録できます。不要な画像を削除してから追加してください。");
      return;
    }

    const accepted: File[] = [];

    for (const file of nextFiles) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setLocalError("対応していない画像形式です。JPEG / PNG / WebP を選んでください。");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setLocalError("画像サイズは5MB以下にしてください。");
        return;
      }

      accepted.push(file);
    }

    if (accepted.length > remaining) {
      setLocalError(`画像はあと${remaining}枚まで追加できます。`);
      return;
    }

    setLocalError(null);
    onPendingImagesChange([...pendingImages, ...accepted]);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    applyFiles(nextFiles);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    applyFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const clipboardFiles = Array.from(event.clipboardData.files ?? []);
    if (clipboardFiles.length === 0) {
      return;
    }

    event.preventDefault();
    applyFiles(clipboardFiles);
  }

  function removePendingImage(targetIndex: number) {
    setLocalError(null);
    onPendingImagesChange(pendingImages.filter((_, index) => index !== targetIndex));
  }

  const displayedError = error ?? localError;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="画像追加エリア"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onPaste={handlePaste}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-5 transition ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <input
          ref={inputRef}
          id="images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={disabled}
          onChange={handleFileInputChange}
          className="sr-only"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">クリックして画像を選択</p>
          <p className="text-sm text-gray-600">ドラッグ＆ドロップ、または貼り付けでも追加できます。</p>
          <p className="text-xs text-gray-500">JPEG / PNG / WebP、5MB以下、最大5枚</p>
          {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
        </div>
      </div>

      {existingImages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {existingImages.map((image) => (
            <article key={image.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{image.original_filename ?? "画像"}</p>
                  <p className="text-xs text-gray-500">
                    {image.sort_order}枚目{image.is_primary ? " / 代表画像" : ""}
                  </p>
                </div>
                {onDeleteExistingImage ? (
                  <button
                    type="button"
                    onClick={() => onDeleteExistingImage(image.id)}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    削除
                  </button>
                ) : null}
              </div>

              {image.url ? (
                <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-lg bg-gray-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.original_filename ?? "candidate image"} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                  画像なし
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {pendingPreviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">保存時に追加される画像</p>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingPreviews.map((preview, index) => (
              <article key={preview.key} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">{preview.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {existingImages.length + index + 1}枚目
                      {existingImages.length === 0 && index === 0 ? " / 代表画像予定" : ""}
                      {preview.file.size ? ` / ${formatBytes(preview.file.size)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingImage(index)}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    取り消す
                  </button>
                </div>

                <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-lg bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.url} alt={preview.file.name} className="h-full w-full object-contain" />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {displayedError ? (
        <p className="text-sm text-red-600">{displayedError}</p>
      ) : null}
    </div>
  );
}
