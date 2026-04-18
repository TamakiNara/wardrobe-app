"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";

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
  const shouldShowVariants = sortedCandidates.length > 1;

  if (!selectedCandidate) {
    return null;
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Link
        href={`/purchase-candidates/${selectedCandidate.id}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        <div className="flex aspect-[2/3] items-center justify-center bg-gray-50 p-1 transition hover:bg-gray-100">
          {selectedCandidate.primary_image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedCandidate.primary_image.url}
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
              {selectedCandidate.colors.length > 0 && (
                <div className="mt-3 flex items-center gap-1">
                  {selectedCandidate.colors.map((color, index) => (
                    <span
                      key={`${selectedCandidate.id}-empty-color-${index}`}
                      className="h-2.5 w-2.5 rounded-full border border-gray-300"
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

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {shouldShowVariants && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-2">
            {sortedCandidates.map((candidate) => {
              const isSelected = candidate.id === selectedCandidate.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${resolveVariantLabel(candidate)}を表示`}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                    isSelected
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-gray-300"
                    style={{ backgroundColor: resolveVariantHex(candidate) }}
                    aria-hidden="true"
                  />
                  {resolveVariantLabel(candidate)}
                </button>
              );
            })}
          </div>
        )}

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
          {selectedCandidate.colors.length > 0 && (
            <div className="ml-auto flex items-center gap-1">
              {selectedCandidate.colors.map((color, index) => (
                <span
                  key={`${selectedCandidate.id}-color-${index}`}
                  className="h-2.5 w-2.5 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
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

        <section className="flex min-h-[92px] flex-col justify-between rounded-xl bg-gray-50 px-3 py-2.5">
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
                <span>
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

        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <Link
            href={`/purchase-candidates/${selectedCandidate.id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            詳細を見る
          </Link>
          {selectedCandidate.purchase_url ? (
            <a
              href={selectedCandidate.purchase_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
            >
              商品ページ
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </div>
    </article>
  );
}
