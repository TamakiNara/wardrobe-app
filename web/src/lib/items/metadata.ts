import type { ItemImageRecord } from "@/types/items";
import type { PurchaseCandidateImageRecord } from "@/types/purchase-candidates";

export const ITEM_SIZE_GENDER_LABELS = {
  women: "レディース",
  men: "メンズ",
  unisex: "ユニセックス",
  unknown: "未指定",
} as const;

export function formatItemPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

export function mapPurchaseCandidateImagesToItemImages(
  images: PurchaseCandidateImageRecord[],
): ItemImageRecord[] {
  return normalizeItemImages(images.map((image) => ({
    disk: image.disk,
    path: image.path,
    url: image.url,
    original_filename: image.original_filename,
    mime_type: image.mime_type,
    file_size: image.file_size,
    sort_order: image.sort_order,
    is_primary: image.is_primary,
  })));
}

export function normalizeItemImages(images: ItemImageRecord[]): ItemImageRecord[] {
  const primaryIndex = images.findIndex((image) => image.is_primary);
  const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return images.map((image, index) => ({
    ...image,
    sort_order: index + 1,
    is_primary: images.length === 0 ? false : index === resolvedPrimaryIndex,
  }));
}
