"use client";

import EntityImageUploader from "@/components/images/entity-image-uploader";
import type { PurchaseCandidateImageRecord } from "@/types/purchase-candidates";

type PurchaseCandidateImageUploaderProps = {
  existingImages: PurchaseCandidateImageRecord[];
  pendingImages: File[];
  onPendingImagesChange: (files: File[]) => void;
  onDeleteExistingImage?: (imageId: number) => void;
  onMoveExistingImage?: (
    image: PurchaseCandidateImageRecord,
    direction: "up" | "down",
  ) => void;
  onMakePrimaryExistingImage?: (image: PurchaseCandidateImageRecord) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
};

export default function PurchaseCandidateImageUploader({
  existingImages,
  pendingImages,
  onPendingImagesChange,
  onDeleteExistingImage,
  onMoveExistingImage,
  onMakePrimaryExistingImage,
  disabled = false,
  error,
  helperText,
}: PurchaseCandidateImageUploaderProps) {
  return (
    <EntityImageUploader
      existingImages={existingImages}
      pendingImages={pendingImages}
      onPendingImagesChange={onPendingImagesChange}
      onDeleteExistingImage={
        onDeleteExistingImage
          ? (image) => image.id && onDeleteExistingImage(image.id)
          : undefined
      }
      onMoveExistingImage={
        onMoveExistingImage
          ? (image, direction) =>
              onMoveExistingImage(
                image as PurchaseCandidateImageRecord,
                direction,
              )
          : undefined
      }
      onMakePrimaryExistingImage={
        onMakePrimaryExistingImage
          ? (image) =>
              onMakePrimaryExistingImage(image as PurchaseCandidateImageRecord)
          : undefined
      }
      disabled={disabled}
      error={error}
      helperText={helperText}
    />
  );
}
