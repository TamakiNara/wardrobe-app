"use client";

import SafeImage from "@/components/images/safe-image";
import type { PurchaseCandidateImageRecord } from "@/types/purchase-candidates";

type PurchaseCandidateDetailImagesProps = {
  images: PurchaseCandidateImageRecord[];
  candidateName: string;
};

export default function PurchaseCandidateDetailImages({
  images,
  candidateName,
}: PurchaseCandidateDetailImagesProps) {
  if (images.length === 0) {
    return <p className="mt-3 text-sm text-gray-600">画像はまだありません。</p>;
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <article
          key={image.id}
          className="overflow-hidden rounded-xl border border-gray-200"
        >
          <div className="flex aspect-[3/4] items-center justify-center bg-gray-50 p-2">
            <SafeImage
              src={image.url}
              alt={image.original_filename ?? candidateName}
              className="h-full w-full object-contain"
              fallback={
                <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-gray-100 px-3 text-center text-sm text-gray-500">
                  <span>画像を表示できません</span>
                </div>
              }
            />
          </div>
          <div className="p-3 text-sm text-gray-600">
            {image.sort_order}枚目
            {image.is_primary ? " / 代表画像" : ""}
          </div>
        </article>
      ))}
    </div>
  );
}
