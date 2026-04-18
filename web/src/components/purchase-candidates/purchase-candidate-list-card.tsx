"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import type {
  PurchaseCandidateImageRecord,
  PurchaseCandidateListItem,
} from "@/types/purchase-candidates";

type PurchaseCandidateListCardProps = {
  candidates: PurchaseCandidateListItem[];
};

function formatPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

function formatPriceNumber(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return price.toLocaleString("ja-JP");
}

function resolveVariantLabel(candidate: PurchaseCandidateListItem): string {
  const mainColor = candidate.colors.find((color) => color.role === "main");

  return mainColor?.label ?? candidate.name;
}

function resolveVariantHex(candidate: PurchaseCandidateListItem): string {
  const mainColor = candidate.colors.find((color) => color.role === "main");

  return mainColor?.hex ?? "#E5E7EB";
}

function resolveCandidateImages(
  candidate: PurchaseCandidateListItem,
): PurchaseCandidateImageRecord[] {
  const images = candidate.images ?? [];

  if (images.length > 0) {
    return images;
  }

  return candidate.primary_image === null ? [] : [candidate.primary_image];
}

export default function PurchaseCandidateListCard({
  candidates,
}: PurchaseCandidateListCardProps) {
  const sortedCandidates = useMemo(
    () =>
      [...candidates].sort((a, b) => {
        const aOrder = a.group_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.group_order ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.id - b.id;
      }),
    [candidates],
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    sortedCandidates[0]?.id ?? 0,
  );
  const selectedCandidate =
    sortedCandidates.find(
      (candidate) => candidate.id === selectedCandidateId,
    ) ?? sortedCandidates[0];
  const [selectedImageState, setSelectedImageState] = useState({
    candidateId: sortedCandidates[0]?.id ?? 0,
    imageIndex: 0,
  });
  const shouldShowVariants = sortedCandidates.length > 1;

  if (!selectedCandidate) {
    return null;
  }

  const selectedImages = resolveCandidateImages(selectedCandidate);
  const selectedImageIndex =
    selectedImageState.candidateId === selectedCandidate.id
      ? selectedImageState.imageIndex
      : 0;
  const selectedImage = selectedImages[selectedImageIndex] ?? selectedImages[0];
  const shouldShowImageControls = selectedImages.length > 1;
  const showPreviousImage = () => {
    setSelectedImageState({
      candidateId: selectedCandidate.id,
      imageIndex:
        selectedImageIndex === 0
          ? selectedImages.length - 1
          : selectedImageIndex - 1,
    });
  };
  const showNextImage = () => {
    setSelectedImageState({
      candidateId: selectedCandidate.id,
      imageIndex:
        selectedImageIndex === selectedImages.length - 1
          ? 0
          : selectedImageIndex + 1,
    });
  };

  return (
    <div className="relative h-full pr-1 pb-1">
      {shouldShowVariants && (
        <>
          <span
            className="absolute -right-1 bottom-0 top-3 w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
            aria-hidden="true"
          />
          {sortedCandidates.length > 2 && (
            <span
              className="absolute -right-2 bottom-1 top-6 w-full rounded-2xl border border-gray-100 bg-gray-50 shadow-[0_1px_4px_rgba(15,23,42,0.05)]"
              aria-hidden="true"
            />
          )}
        </>
      )}
      <article
        data-testid="purchase-candidate-card"
        className="relative grid h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[auto_1fr] lg:grid-cols-[14rem_minmax(0,1fr)]"
      >
        <div
          data-testid="purchase-candidate-card-media"
          className="relative sm:col-start-1 sm:row-start-1"
        >
          <Link
            href={`/purchase-candidates/${selectedCandidate.id}`}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            <div className="relative flex aspect-[4/3] min-h-44 items-center justify-center bg-gray-50 p-1 transition hover:bg-gray-100 sm:aspect-square sm:min-h-[13rem] lg:min-h-[14rem]">
              {selectedImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage.url}
                  alt={selectedCandidate.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-3 text-center">
                  <p className="text-sm font-medium text-gray-500">画像なし</p>
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    {selectedCandidate.category_name ?? "カテゴリ未設定"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {selectedCandidate.brand_name || "ブランド未設定"}
                  </p>
                  {selectedImages.length === 0 &&
                    selectedCandidate.colors.length > 0 &&
                    !shouldShowVariants && (
                      <div className="mt-3 flex items-center gap-1">
                        {selectedCandidate.colors.map((color, index) => (
                          <span
                            key={`${selectedCandidate.id}-empty-color-${index}`}
                            data-testid="candidate-color-swatch"
                            className="h-3 w-5 rounded-[4px] border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          </Link>

          {shouldShowImageControls && (
            <>
              <button
                type="button"
                aria-label="前の画像を表示"
                onClick={showPreviousImage}
                className="absolute left-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/85 text-gray-600 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="次の画像を表示"
                onClick={showNextImage}
                className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/85 text-gray-600 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="absolute bottom-2 right-2 z-10 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-gray-600 shadow-sm">
                {selectedImageIndex + 1}/{selectedImages.length}
              </span>
            </>
          )}
        </div>

        {shouldShowVariants && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 bg-white px-3 py-2 sm:col-start-1 sm:row-start-2">
            {sortedCandidates.map((candidate) => {
              const isSelected = candidate.id === selectedCandidate.id;
              const variantLabel = resolveVariantLabel(candidate);
              return (
                <button
                  key={candidate.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${variantLabel}を表示`}
                  title={variantLabel}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  data-testid="variant-swatch"
                  className={`inline-flex h-7 w-9 items-center justify-center rounded-md border bg-white p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-slate-500 bg-slate-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className="h-full w-full rounded-[5px] border border-gray-300"
                    style={{ backgroundColor: resolveVariantHex(candidate) }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div
          data-testid="purchase-candidate-card-content"
          className="flex flex-1 flex-col gap-3 p-3.5 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {PURCHASE_CANDIDATE_STATUS_LABELS[selectedCandidate.status]}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
              優先度:{" "}
              {PURCHASE_CANDIDATE_PRIORITY_LABELS[selectedCandidate.priority]}
            </span>
            {selectedCandidate.converted_item_id !== null && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                アイテム化済み
              </span>
            )}
          </div>

          <Link
            href={`/purchase-candidates/${selectedCandidate.id}`}
            className="block rounded-lg outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <h2 className="text-[15px] font-semibold leading-6 text-gray-900">
              {selectedCandidate.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCandidate.category_name ?? selectedCandidate.category_id}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {selectedCandidate.brand_name || "ブランド未設定"}
            </p>
          </Link>

          <section className="flex flex-col justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              {selectedCandidate.sale_price !== null ? (
                <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                  セール中
                </span>
              ) : (
                <span className="inline-flex h-6" aria-hidden="true" />
              )}
              <div className="space-y-1 text-right">
                <p className="text-[11px] font-medium tracking-wide text-gray-500">
                  価格
                </p>
                <div className="flex items-end justify-end gap-1">
                  <span
                    className={`text-lg font-semibold leading-none ${
                      selectedCandidate.sale_price !== null
                        ? "text-rose-700"
                        : "text-gray-900"
                    }`}
                  >
                    {formatPriceNumber(
                      selectedCandidate.sale_price ?? selectedCandidate.price,
                    )}
                  </span>
                  <span
                    className={`text-xs leading-5 ${
                      selectedCandidate.sale_price !== null
                        ? "text-rose-700"
                        : "text-gray-500"
                    }`}
                  >
                    円
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs text-gray-500">
              {selectedCandidate.sale_price !== null ? (
                <div className="flex items-center justify-between gap-3">
                  <span>通常価格</span>
                  <span>{formatPrice(selectedCandidate.price)}</span>
                </div>
              ) : (
                <div className="h-[18px]" aria-hidden="true" />
              )}
              {selectedCandidate.sale_ends_at !== null ? (
                <div className="flex items-center justify-between gap-3">
                  <span>セール終了予定</span>
                  <span className="font-medium text-rose-700">
                    {new Intl.DateTimeFormat("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(selectedCandidate.sale_ends_at))}
                  </span>
                </div>
              ) : (
                <div className="h-[18px]" aria-hidden="true" />
              )}
            </div>
          </section>

          <div className="mt-auto flex items-center justify-end gap-3 pt-1.5">
            {selectedCandidate.purchase_url ? (
              <a
                href={selectedCandidate.purchase_url}
                target="_blank"
                rel="noreferrer"
                className="mr-auto inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
              >
                商品ページ
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <Link
              href={`/purchase-candidates/${selectedCandidate.id}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              詳細を見る
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
