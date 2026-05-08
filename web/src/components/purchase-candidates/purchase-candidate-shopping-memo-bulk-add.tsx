"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  addItemsToShoppingMemo,
  fetchShoppingMemos,
} from "@/lib/api/shopping-memos";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";
import type { ShoppingMemoListItem } from "@/types/shopping-memos";
import PurchaseCandidateListCard from "./purchase-candidate-list-card";

type PurchaseCandidateListGroup = {
  key: string;
  candidates: PurchaseCandidateListItem[];
};

type PurchaseCandidateShoppingMemoBulkAddProps = {
  groups: PurchaseCandidateListGroup[];
  detailQueryString?: string;
  createMemoHref?: string;
};

const ADDABLE_STATUSES = new Set(["considering", "on_hold"]);

function isAddableCandidate(candidate: PurchaseCandidateListItem): boolean {
  return ADDABLE_STATUSES.has(candidate.status);
}

function buildResultMessage(result: {
  added_count: number;
  skipped_count: number;
  duplicate_count: number;
  invalid_status_count: number;
}): string {
  const parts: string[] = [];
  const duplicateCount = result.duplicate_count;
  const invalidCount = result.invalid_status_count;
  const otherSkipped = Math.max(
    result.skipped_count - duplicateCount - invalidCount,
    0,
  );

  if (result.added_count > 0) {
    parts.push(`${result.added_count}件を買い物メモに追加しました。`);
  } else {
    parts.push("追加できる候補はありませんでした。");
  }

  if (duplicateCount > 0) {
    parts.push(`${duplicateCount}件は追加済みでした。`);
  }

  if (invalidCount > 0) {
    parts.push(`${invalidCount}件は対象外でした。`);
  }

  if (otherSkipped > 0) {
    parts.push(`${otherSkipped}件は追加できませんでした。`);
  }

  return parts.join(" ");
}

export default function PurchaseCandidateShoppingMemoBulkAdd({
  groups,
  detailQueryString,
  createMemoHref = "/shopping-memos/new",
}: PurchaseCandidateShoppingMemoBulkAddProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>(
    [],
  );
  const [draftMemos, setDraftMemos] = useState<ShoppingMemoListItem[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState("");
  const [loadingMemos, setLoadingMemos] = useState(false);
  const [memosLoaded, setMemosLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectableCandidateCount = useMemo(
    () =>
      groups.flatMap((group) => group.candidates).filter(isAddableCandidate)
        .length,
    [groups],
  );

  useEffect(() => {
    if (!selectionMode || memosLoaded) {
      return;
    }

    let active = true;

    setLoadingMemos(true);
    setErrorMessage(null);

    fetchShoppingMemos()
      .then((response) => {
        if (!active) {
          return;
        }

        const nextDraftMemos = (response.shoppingMemos ?? []).filter(
          (memo) => memo.status === "draft",
        );
        setDraftMemos(nextDraftMemos);
        setSelectedMemoId((current) =>
          nextDraftMemos.some((memo) => String(memo.id) === current)
            ? current
            : "",
        );
        setMemosLoaded(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setDraftMemos([]);
        setErrorMessage("追加先の買い物メモを読み込めませんでした。");
      })
      .finally(() => {
        if (active) {
          setLoadingMemos(false);
        }
      });

    return () => {
      active = false;
    };
  }, [memosLoaded, selectionMode]);

  function resetSelectionMode() {
    setSelectionMode(false);
    setSelectedCandidateIds([]);
    setSelectedMemoId((current) => current);
    setErrorMessage(null);
  }

  function toggleCandidate(candidateId: number) {
    setSelectedCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  async function handleAddItems() {
    if (!selectedMemoId || selectedCandidateIds.length === 0) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await addItemsToShoppingMemo(
        Number(selectedMemoId),
        selectedCandidateIds,
      );

      setResultMessage(buildResultMessage(result));
      setSelectedCandidateIds([]);
      setSelectionMode(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(
          error.data?.message ??
            "買い物メモへの追加に失敗しました。時間をおいて再度お試しください。",
        );
      } else {
        setErrorMessage(
          "買い物メモへの追加に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasDraftMemos = draftMemos.length > 0;
  const canSubmit =
    !loadingMemos &&
    !submitting &&
    hasDraftMemos &&
    selectedMemoId !== "" &&
    selectedCandidateIds.length > 0;
  const selectionHint = !hasDraftMemos
    ? null
    : selectedMemoId === ""
      ? "追加先の買い物メモを選択してください。"
      : selectedCandidateIds.length === 0
        ? "追加する候補を選択してください。"
        : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {!selectionMode ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                買い物メモへ追加
              </p>
              <p className="text-sm text-gray-600">
                購入検討を選択して、既存の買い物メモへまとめて追加できます。
              </p>
            </div>
          ) : null}

          {!selectionMode ? (
            <button
              type="button"
              onClick={() => {
                setSelectionMode(true);
                setResultMessage(null);
                setErrorMessage(null);
              }}
              disabled={selectableCandidateCount === 0}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              選択して追加
            </button>
          ) : (
            <div
              data-testid="shopping-memo-bulk-add-panel"
              className="w-full pt-1"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p
                    data-testid="shopping-memo-bulk-add-heading"
                    className="text-sm font-medium text-gray-900"
                  >
                    買い物メモへ追加
                  </p>
                  <p className="text-sm text-gray-600">
                    購入検討を選択して、既存の買い物メモへまとめて追加できます。
                  </p>

                  {loadingMemos ? (
                    <p className="text-sm text-gray-600">
                      買い物メモを読み込んでいます...
                    </p>
                  ) : errorMessage &&
                    errorMessage.includes(
                      "追加先の買い物メモを読み込めませんでした",
                    ) ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {errorMessage}
                    </p>
                  ) : !hasDraftMemos ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        追加先の買い物メモがありません。先に買い物メモを作成してください。
                      </p>
                      <Link
                        href={createMemoHref}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        買い物メモを作成
                      </Link>
                    </div>
                  ) : (
                    <label className="block text-sm text-gray-700">
                      <span className="mb-2 block font-medium text-gray-900">
                        追加先
                      </span>
                      <select
                        aria-label="追加先の買い物メモ"
                        value={selectedMemoId}
                        onChange={(event) =>
                          setSelectedMemoId(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:max-w-sm"
                      >
                        <option value="">選択してください</option>
                        {draftMemos.map((memo) => (
                          <option key={memo.id} value={memo.id}>
                            {memo.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedCandidateIds.length}件選択中
                    </p>
                    {selectionHint ? (
                      <p className="text-xs text-gray-500">{selectionHint}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleAddItems}
                      disabled={canSubmit === false}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "追加中..." : "追加する"}
                    </button>
                    <button
                      type="button"
                      onClick={resetSelectionMode}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {resultMessage ? (
          <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {resultMessage}
          </p>
        ) : null}

        {errorMessage &&
        !errorMessage.includes("追加先の買い物メモを読み込めませんでした") ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section
        data-testid="purchase-candidate-card-grid"
        className="grid gap-4 lg:grid-cols-2"
      >
        {groups.map((group) => (
          <PurchaseCandidateListCard
            key={group.key}
            candidates={group.candidates}
            detailQueryString={detailQueryString}
            selectionMode={selectionMode}
            selectedCandidateIds={selectedCandidateIds}
            onToggleCandidate={toggleCandidate}
            isCandidateSelectable={isAddableCandidate}
          />
        ))}
      </section>
    </div>
  );
}
