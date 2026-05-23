"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  addItemsToShoppingMemo,
  fetchShoppingMemoDetail,
  fetchShoppingMemos,
} from "@/lib/api/shopping-memos";
import type { PurchaseCandidateStatus } from "@/types/purchase-candidates";
import type {
  ShoppingMemoDetailResponse,
  ShoppingMemoListItem,
} from "@/types/shopping-memos";

type PurchaseCandidateShoppingMemoAddProps = {
  candidateId: number;
  candidateStatus: PurchaseCandidateStatus;
};

const ADDABLE_STATUSES = new Set<PurchaseCandidateStatus>([
  "considering",
  "on_hold",
]);

function shoppingMemoContainsCandidate(
  response: ShoppingMemoDetailResponse,
  candidateId: number,
): boolean {
  return (response.shoppingMemo.groups ?? [])
    .flatMap((group) => group.items ?? [])
    .some((item) => item.purchase_candidate_id === candidateId);
}

function buildMutationMessage({
  addedCount,
  duplicateCount,
  invalidStatusCount,
}: {
  addedCount: number;
  duplicateCount: number;
  invalidStatusCount: number;
}): string {
  if (addedCount > 0) {
    return "買い物メモに追加しました。";
  }

  if (duplicateCount > 0) {
    return "この買い物メモには追加済みです。";
  }

  if (invalidStatusCount > 0) {
    return "この購入検討は現在の状態では買い物メモに追加できません。";
  }

  return "買い物メモに追加できませんでした。";
}

export default function PurchaseCandidateShoppingMemoAdd({
  candidateId,
  candidateStatus,
}: PurchaseCandidateShoppingMemoAddProps) {
  const [draftMemos, setDraftMemos] = useState<ShoppingMemoListItem[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState("");
  const [loadingMemos, setLoadingMemos] = useState(true);
  const [loadingSelectedMemoDetail, setLoadingSelectedMemoDetail] =
    useState(false);
  const [selectedMemoContainsCandidate, setSelectedMemoContainsCandidate] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedMemoId, setAddedMemoId] = useState<number | null>(null);

  const selectedMemo = useMemo(
    () => draftMemos.find((memo) => String(memo.id) === selectedMemoId) ?? null,
    [draftMemos, selectedMemoId],
  );
  const isAddableCandidate = ADDABLE_STATUSES.has(candidateStatus);
  const hasDraftMemos = draftMemos.length > 0;
  const shouldShowAlreadyAddedMessage =
    selectedMemoContainsCandidate && !resultMessage;
  const shoppingMemoLinkId =
    addedMemoId ?? (selectedMemoContainsCandidate ? selectedMemo?.id : null);
  const canSubmit =
    selectedMemo !== null &&
    isAddableCandidate &&
    !selectedMemoContainsCandidate &&
    !loadingMemos &&
    !loadingSelectedMemoDetail &&
    !submitting;

  useEffect(() => {
    let active = true;

    setLoadingMemos(true);
    setErrorMessage(null);

    fetchShoppingMemos()
      .then((response) => {
        if (!active) {
          return;
        }

        setDraftMemos(
          (response.shoppingMemos ?? []).filter(
            (memo) => memo.status === "draft",
          ),
        );
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
  }, []);

  useEffect(() => {
    if (selectedMemoId === "") {
      setSelectedMemoContainsCandidate(false);
      setLoadingSelectedMemoDetail(false);
      return;
    }

    let active = true;

    setLoadingSelectedMemoDetail(true);
    setResultMessage(null);
    setErrorMessage(null);
    setAddedMemoId(null);

    fetchShoppingMemoDetail(Number(selectedMemoId))
      .then((response) => {
        if (!active) {
          return;
        }

        setSelectedMemoContainsCandidate(
          shoppingMemoContainsCandidate(response, candidateId),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSelectedMemoContainsCandidate(false);
        setErrorMessage("追加済み状態を確認できませんでした。");
      })
      .finally(() => {
        if (active) {
          setLoadingSelectedMemoDetail(false);
        }
      });

    return () => {
      active = false;
    };
  }, [candidateId, selectedMemoId]);

  async function handleAddToMemo() {
    if (!selectedMemo || !canSubmit) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setResultMessage(null);
    setAddedMemoId(null);

    try {
      const response = await addItemsToShoppingMemo(selectedMemo.id, [
        candidateId,
      ]);
      const nextMessage = buildMutationMessage({
        addedCount: response.added_count,
        duplicateCount: response.duplicate_count,
        invalidStatusCount: response.invalid_status_count,
      });

      setResultMessage(nextMessage);

      if (response.added_count > 0 || response.duplicate_count > 0) {
        setSelectedMemoContainsCandidate(true);
        setAddedMemoId(selectedMemo.id);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(
          error.data?.message ?? "買い物メモに追加できませんでした。",
        );
      } else {
        setErrorMessage("買い物メモに追加できませんでした。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            買い物メモに追加
          </h2>
          <p className="text-sm leading-6 text-gray-600">
            この購入検討を、検討中の買い物メモに追加できます。
          </p>
        </div>
        {shoppingMemoLinkId ? (
          <Link
            href={`/shopping-memos/${shoppingMemoLinkId}`}
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            買い物メモを見る
          </Link>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {loadingMemos ? (
          <p className="text-sm text-gray-600">
            追加先の買い物メモを読み込んでいます...
          </p>
        ) : !hasDraftMemos ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              追加先にできる買い物メモがありません。先に買い物メモを作成してください。
            </p>
            <Link
              href="/shopping-memos/new"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              買い物メモを作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="block text-sm text-gray-700">
              <span className="mb-2 block font-medium text-gray-900">
                追加先
              </span>
              <select
                aria-label="追加先の買い物メモ"
                value={selectedMemoId}
                onChange={(event) => setSelectedMemoId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">選択してください</option>
                {draftMemos.map((memo) => (
                  <option key={memo.id} value={memo.id}>
                    {memo.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleAddToMemo}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "追加中..." : "追加する"}
            </button>
          </div>
        )}

        {loadingSelectedMemoDetail ? (
          <p className="text-sm text-gray-600">
            追加済み状態を確認しています...
          </p>
        ) : shouldShowAlreadyAddedMessage ? (
          <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            この買い物メモには追加済みです。
          </p>
        ) : !isAddableCandidate ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            この購入検討は現在の状態では買い物メモに追加できません。
          </p>
        ) : null}

        {resultMessage ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {resultMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
