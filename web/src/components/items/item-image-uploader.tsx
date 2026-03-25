"use client";

import EntityImageUploader from "@/components/images/entity-image-uploader";
import type { ItemImageRecord } from "@/types/items";

type ItemImageUploaderProps = {
  existingImages: ItemImageRecord[];
  pendingImages: File[];
  onPendingImagesChange: (files: File[]) => void;
  onDeleteExistingImage?: (image: ItemImageRecord) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  existingHeading?: string;
  pendingHeading?: string;
};

export default function ItemImageUploader(props: ItemImageUploaderProps) {
  const { onDeleteExistingImage, ...rest } = props;

  return (
    <EntityImageUploader
      {...rest}
      onDeleteExistingImage={onDeleteExistingImage ? (image) => onDeleteExistingImage(image as ItemImageRecord) : undefined}
    />
  );
}
