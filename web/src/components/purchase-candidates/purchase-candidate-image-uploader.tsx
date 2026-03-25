"use client";

import EntityImageUploader from "@/components/images/entity-image-uploader";
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

export default function PurchaseCandidateImageUploader({
  existingImages,
  pendingImages,
  onPendingImagesChange,
  onDeleteExistingImage,
  disabled = false,
  error,
  helperText,
}: PurchaseCandidateImageUploaderProps) {
  return (
    <EntityImageUploader
      existingImages={existingImages}
      pendingImages={pendingImages}
      onPendingImagesChange={onPendingImagesChange}
      onDeleteExistingImage={onDeleteExistingImage ? (image) => image.id && onDeleteExistingImage(image.id) : undefined}
      disabled={disabled}
      error={error}
      helperText={helperText}
    />
  );
}
