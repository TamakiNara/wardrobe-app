import type { ItemImageRecord } from "@/types/items";

export function resolveItemPhotoThumbnail(
  images: ItemImageRecord[] | undefined,
): ItemImageRecord | null {
  const imagesWithUrl = (images ?? []).filter((image) => image.url);

  return (
    imagesWithUrl.find((image) => image.is_primary) ??
    [...imagesWithUrl].sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }

      return (left.id ?? 0) - (right.id ?? 0);
    })[0] ??
    null
  );
}
