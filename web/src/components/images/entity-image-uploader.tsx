"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import SafeImage from "@/components/images/safe-image";

export type UploadableImageRecord = {
  id?: number;
  url?: string | null;
  original_filename: string | null;
  file_size: number | null;
  sort_order: number;
  is_primary: boolean;
};

type EntityImageUploaderProps = {
  existingImages: UploadableImageRecord[];
  pendingImages: File[];
  onPendingImagesChange: (files: File[]) => void;
  onDeleteExistingImage?: (image: UploadableImageRecord) => void;
  onMoveExistingImage?: (
    image: UploadableImageRecord,
    direction: "up" | "down",
  ) => void;
  onMakePrimaryExistingImage?: (image: UploadableImageRecord) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  inputId?: string;
  existingHeading?: string;
  pendingHeading?: string;
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

export default function EntityImageUploader({
  existingImages,
  pendingImages,
  onPendingImagesChange,
  onDeleteExistingImage,
  onMoveExistingImage,
  onMakePrimaryExistingImage,
  disabled = false,
  error,
  helperText,
  inputId = "images",
  existingHeading,
  pendingHeading = "追加時に保存される画像",
}: EntityImageUploaderProps) {
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

    const remaining = Math.max(
      0,
      MAX_IMAGE_COUNT - existingImages.length - pendingImages.length,
    );
    if (remaining <= 0) {
      setLocalError(
        "画像は5枚まで追加できます。既存の画像を削除してから追加してください。",
      );
      return;
    }

    const accepted: File[] = [];

    for (const file of nextFiles) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setLocalError(
          "対応していない画像形式です。JPEG / PNG / WebP を選んでください。",
        );
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
    onPendingImagesChange(
      pendingImages.filter((_, index) => index !== targetIndex),
    );
  }

  const displayedError = error ?? localError;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">画像を追加</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ファイルを選択
          </button>
          <p className="text-xs text-gray-500">
            JPEG / PNG / WebP、5MB以下、最大5枚
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={disabled}
        onChange={handleFileInputChange}
        className="sr-only"
      />

      <div
        tabIndex={disabled ? -1 : 0}
        aria-label="画像の貼り付けとドロップエリア"
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
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-default"}`}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">
            画像を貼り付け、またはドラッグ＆ドロップ
          </p>
          <p className="text-sm text-gray-600">
            この枠内で貼り付けできます。画像ファイルをドラッグ＆ドロップして追加することもできます。
          </p>
          {helperText ? (
            <p className="text-xs text-gray-500">{helperText}</p>
          ) : null}
        </div>
      </div>

      {existingImages.length > 0 && (
        <div className="space-y-2">
          {existingHeading ? (
            <p className="text-sm font-medium text-gray-700">
              {existingHeading}
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {existingImages.map((image, index) => (
              <article
                key={
                  image.id ??
                  `${image.original_filename ?? "image"}-${image.sort_order}-${index}`
                }
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {image.original_filename ?? "画像"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {image.sort_order}枚目
                      {image.is_primary ? " / 代表画像" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {onMoveExistingImage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onMoveExistingImage(image, "up")}
                          disabled={disabled || index === 0}
                          className="text-sm font-medium text-gray-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          上へ
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveExistingImage(image, "down")}
                          disabled={
                            disabled || index === existingImages.length - 1
                          }
                          className="text-sm font-medium text-gray-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          下へ
                        </button>
                      </>
                    ) : null}
                    {onMakePrimaryExistingImage ? (
                      <button
                        type="button"
                        onClick={() => onMakePrimaryExistingImage(image)}
                        disabled={disabled || image.is_primary}
                        className="text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        {image.is_primary ? "代表画像" : "代表にする"}
                      </button>
                    ) : null}
                    {onDeleteExistingImage ? (
                      <button
                        type="button"
                        onClick={() => onDeleteExistingImage(image)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-lg bg-gray-50 p-2">
                  <SafeImage
                    src={image.url}
                    alt={image.original_filename ?? "image"}
                    className="h-full w-full object-contain"
                    fallback={
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-gray-100 px-3 text-center text-sm text-gray-500">
                        <span>
                          {image.url ? "画像を表示できません" : "画像なし"}
                        </span>
                      </div>
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {pendingPreviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{pendingHeading}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingPreviews.map((preview, index) => (
              <article
                key={preview.key}
                className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {existingImages.length + index + 1}枚目
                      {existingImages.length === 0 && index === 0
                        ? " / 代表画像候補"
                        : ""}
                      {preview.file.size
                        ? ` / ${formatBytes(preview.file.size)}`
                        : ""}
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
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {displayedError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayedError}
        </p>
      ) : null}
    </div>
  );
}
