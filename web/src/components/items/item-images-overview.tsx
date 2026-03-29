import type { ItemImageRecord } from "@/types/items";

type ItemImagesOverviewProps = {
  images: ItemImageRecord[];
  title?: string;
  emptyMessage?: string;
  compact?: boolean;
};

export default function ItemImagesOverview({
  images,
  title = "アップロード済み画像の確認",
  emptyMessage = "まだ確認できる画像はありません。",
  compact = false,
}: ItemImagesOverviewProps) {
  const visibleImages = compact ? images.slice(0, 2) : images;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-4"}`}
    >
      <div className={compact ? "mb-2" : "mb-3"}>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {!compact ? (
          <p className="mt-1 text-xs text-gray-500">
            現在登録対象になっている画像を確認できます。画像の追加や削除は、画像セクションで行います。
          </p>
        ) : null}
      </div>

      {images.length === 0 ? (
        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-500`}>
          {emptyMessage}
        </p>
      ) : (
        <div
          className={`grid ${compact ? "grid-cols-2 gap-2" : "gap-3 sm:grid-cols-2 xl:grid-cols-1"}`}
        >
          {visibleImages.map((image, index) => (
            <article
              key={
                image.id ??
                `${image.original_filename ?? "image"}-${image.sort_order}-${index}`
              }
              className={`rounded-xl border border-gray-200 bg-gray-50 ${compact ? "p-2" : "p-3"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`truncate font-medium text-gray-900 ${compact ? "text-xs" : "text-sm"}`}
                  >
                    {compact
                      ? `${image.sort_order}枚目`
                      : (image.original_filename ?? "画像")}
                  </p>
                  {!compact ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {image.sort_order}枚目
                    </p>
                  ) : null}
                </div>
                {image.is_primary && !compact ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    代表画像
                  </span>
                ) : null}
              </div>

              {image.url ? (
                <div
                  className={`mt-3 flex items-center justify-center overflow-hidden rounded-lg bg-white ${compact ? "aspect-square p-1.5" : "aspect-[4/3] p-2"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.original_filename ?? "image"}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                  画像なし
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {compact && images.length > visibleImages.length ? (
        <p className="mt-2 text-xs text-gray-500">
          ほか {images.length - visibleImages.length}{" "}
          枚は画像セクションで確認できます。
        </p>
      ) : null}
    </div>
  );
}
