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
  return images.map((image) => ({
    disk: image.disk,
    path: image.path,
    url: image.url,
    original_filename: image.original_filename,
    mime_type: image.mime_type,
    file_size: image.file_size,
    sort_order: image.sort_order,
    is_primary: image.is_primary,
  }));
}
