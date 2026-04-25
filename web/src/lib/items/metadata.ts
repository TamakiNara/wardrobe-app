import type {
  ItemCareStatus,
  ItemImageRecord,
  ItemSheerness,
} from "@/types/items";
import type { PurchaseCandidateImageRecord } from "@/types/purchase-candidates";

export const ITEM_SIZE_GENDER_LABELS = {
  women: "レディース",
  men: "メンズ",
  unisex: "ユニセックス",
} as const;

export const ITEM_CARE_STATUS_LABELS: Record<ItemCareStatus, string> = {
  in_cleaning: "クリーニング中",
};

export const ITEM_SHEERNESS_LABELS: Record<ItemSheerness, string> = {
  none: "なし",
  slight: "ややあり",
  high: "あり",
};

export function formatItemPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

export function mapPurchaseCandidateImagesToItemImages(
  images: PurchaseCandidateImageRecord[],
): ItemImageRecord[] {
  return normalizeItemImages(
    images.map((image) => ({
      disk: image.disk,
      path: image.path,
      url: image.url,
      original_filename: image.original_filename,
      mime_type: image.mime_type,
      file_size: image.file_size,
      sort_order: image.sort_order,
      is_primary: image.is_primary,
    })),
  );
}

export function normalizeItemImages(
  images: ItemImageRecord[],
): ItemImageRecord[] {
  const sortedImages = [...images].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }

    return (left.id ?? 0) - (right.id ?? 0);
  });
  const primaryIndex = sortedImages.findIndex((image) => image.is_primary);
  const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return sortedImages.map((image, index) => ({
    ...image,
    sort_order: index + 1,
    is_primary:
      sortedImages.length === 0 ? false : index === resolvedPrimaryIndex,
  }));
}
