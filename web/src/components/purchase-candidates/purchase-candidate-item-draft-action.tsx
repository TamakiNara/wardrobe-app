"use client";

import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { savePurchaseCandidateItemDraft } from "@/lib/purchase-candidates/item-draft";
import type {
  PurchaseCandidateSizeOption,
  PurchaseCandidateSizeOptionKey,
} from "@/lib/purchase-candidates/size-comparison";
import type { PurchaseCandidateItemDraftResponse } from "@/types/purchase-candidates";

const ITEM_DRAFT_ERROR_MESSAGE =
  "アイテム作成用の初期値作成に失敗しました。時間をおいて再度お試しください。";

type PurchaseCandidateItemDraftActionProps = {
  candidateId: number;
  convertedItemId: number | null;
  sizeOptions: PurchaseCandidateSizeOption[];
};

function toSelectedSizeValue(key: PurchaseCandidateSizeOptionKey) {
  return key === "alternate" ? "secondary" : "primary";
}

export default function PurchaseCandidateItemDraftAction({
  candidateId,
  convertedItemId,
  sizeOptions,
}: PurchaseCandidateItemDraftActionProps) {
  const router = useRouter();
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [selectedSizeKey, setSelectedSizeKey] =
    useState<PurchaseCandidateSizeOptionKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMultipleSizeOptions = sizeOptions.length > 1;

  async function submitItemDraft(
    selectedSize?: PurchaseCandidateSizeOptionKey,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/purchase-candidates/${candidateId}/item-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            selectedSize
              ? { selected_size: toSelectedSizeValue(selectedSize) }
              : {},
          ),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | PurchaseCandidateItemDraftResponse
        | { message?: string }
        | { errors?: Record<string, string[]> }
        | null;

      if (response.status === 401) {
        setError("セッションが切れました。再度ログインしてください。");
        window.setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok || !data || !("item_draft" in data)) {
        setError(
          getUserFacingSubmitErrorMessage(data, ITEM_DRAFT_ERROR_MESSAGE),
        );
        return;
      }

      savePurchaseCandidateItemDraft(data);
      const nextSearchParams = new URLSearchParams({
        source: "purchase-candidate",
      });
      const currentPathname = window.location.pathname;
      const currentSearch = window.location.search;
      const returnTo = `${currentPathname}${currentSearch}`;

      if (currentPathname) {
        nextSearchParams.set("returnTo", returnTo);
      }

      router.push(`/items/new?${nextSearchParams.toString()}`);
    } catch {
      setError(ITEM_DRAFT_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrimaryActionClick() {
    if (!hasMultipleSizeOptions) {
      const onlyOption = sizeOptions[0];
      await submitItemDraft(onlyOption?.key);
      return;
    }

    setSelectedSizeKey(null);
    setError(null);
    setIsChooserOpen(true);
  }

  async function handleConfirmClick() {
    if (!selectedSizeKey) {
      setError("サイズ候補を選んでからアイテムに追加してください。");
      return;
    }

    await submitItemDraft(selectedSizeKey);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePrimaryActionClick}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {convertedItemId === null
          ? "アイテムに追加する"
          : "アイテム初期値を再生成する"}
      </button>

      {isChooserOpen ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                アイテム化するサイズを選択
              </h3>
              <p className="text-xs text-slate-500">
                選んだサイズ候補だけを item 作成初期値へ引き継ぎます。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsChooserOpen(false);
                setSelectedSizeKey(null);
                setError(null);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="サイズ選択を閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3">
            {sizeOptions.map((option, index) => {
              const isSelected = option.key === selectedSizeKey;
              const displayLabel =
                option.label.trim() !== "" ? option.label : "サイズ未入力";

              return (
                <label
                  key={option.key}
                  className={[
                    "flex cursor-pointer flex-col gap-1.5 rounded-xl border px-3.5 py-3 transition",
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name={`purchase-candidate-size-choice-${candidateId}`}
                      value={option.key}
                      checked={isSelected}
                      onChange={() => setSelectedSizeKey(option.key)}
                      className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          サイズ候補{index + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {displayLabel}
                        </span>
                      </div>
                      {option.note ? (
                        <p className="text-xs text-slate-600">{option.note}</p>
                      ) : null}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsChooserOpen(false);
                setSelectedSizeKey(null);
                setError(null);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={submitting || selectedSizeKey === null}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <ArrowRight className="h-4 w-4" />
              {convertedItemId === null
                ? "このサイズで追加"
                : "このサイズで再生成"}
            </button>
          </div>
        </div>
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
