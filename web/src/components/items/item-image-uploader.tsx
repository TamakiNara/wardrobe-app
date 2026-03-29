"use client";

import EntityImageUploader from "@/components/images/entity-image-uploader";
import type { ItemImageRecord } from "@/types/items";

type ItemImageUploaderProps = {
  existingImages: ItemImageRecord[];
  pendingImages: File[];
  onPendingImagesChange: (files: File[]) => void;
  onDeleteExistingImage?: (image: ItemImageRecord) => void;
  onMoveExistingImage?: (
    image: ItemImageRecord,
    direction: "up" | "down",
  ) => void;
  onMakePrimaryExistingImage?: (image: ItemImageRecord) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  existingHeading?: string;
  pendingHeading?: string;
};

export default function ItemImageUploader(props: ItemImageUploaderProps) {
  const {
    onDeleteExistingImage,
    onMoveExistingImage,
    onMakePrimaryExistingImage,
    ...rest
  } = props;

  return (
    <EntityImageUploader
      {...rest}
      onDeleteExistingImage={
        onDeleteExistingImage
          ? (image) => onDeleteExistingImage(image as ItemImageRecord)
          : undefined
      }
      onMoveExistingImage={
        onMoveExistingImage
          ? (image, direction) =>
              onMoveExistingImage(image as ItemImageRecord, direction)
          : undefined
      }
      onMakePrimaryExistingImage={
        onMakePrimaryExistingImage
          ? (image) => onMakePrimaryExistingImage(image as ItemImageRecord)
          : undefined
      }
    />
  );
}
