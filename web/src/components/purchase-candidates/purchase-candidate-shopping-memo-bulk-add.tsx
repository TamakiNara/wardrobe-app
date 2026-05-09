"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  addItemsToShoppingMemo,
  fetchShoppingMemoDetail,
  fetchShoppingMemos,
  removeItemFromShoppingMemo,
} from "@/lib/api/shopping-memos";
import type { PurchaseCandidateListItem } from "@/types/purchase-candidates";
import type {
  ShoppingMemoDetailResponse,
  ShoppingMemoListItem,
} from "@/types/shopping-memos";
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

type ShoppingMemoMembershipMap = Record<number, number>;

const ADDABLE_STATUSES = new Set(["considering", "on_hold"]);

function isAddableCandidate(candidate: PurchaseCandidateListItem): boolean {
  return ADDABLE_STATUSES.has(candidate.status);
}

function buildMembershipMap(
  response: ShoppingMemoDetailResponse,
): ShoppingMemoMembershipMap {
  return Object.fromEntries(
    (response.shoppingMemo.groups ?? [])
      .flatMap((group) => group.items ?? [])
      .map((item) => [item.purchase_candidate_id, item.shopping_memo_item_id]),
  );
}

function buildResultMessage(
  pendingAddCount: number,
  pendingRemoveCount: number,
): string {
  if (pendingAddCount > 0 && pendingRemoveCount > 0) {
    return "買い物メモを更新しました。";
  }

  if (pendingAddCount > 0) {
    return `${pendingAddCount}件を買い物メモに追加しました。`;
  }

  return `${pendingRemoveCount}件を買い物メモから外しました。`;
}

export default function PurchaseCandidateShoppingMemoBulkAdd({
  groups,
  detailQueryString,
  createMemoHref = "/shopping-memos/new",
}: PurchaseCandidateShoppingMemoBulkAddProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingAddCandidateIds, setPendingAddCandidateIds] = useState<
    number[]
  >([]);
  const [pendingRemoveCandidateIds, setPendingRemoveCandidateIds] = useState<
    number[]
  >([]);
  const [draftMemos, setDraftMemos] = useState<ShoppingMemoListItem[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState("");
  const [memoItemIdByCandidateId, setMemoItemIdByCandidateId] =
    useState<ShoppingMemoMembershipMap>({});
  const [loadingMemos, setLoadingMemos] = useState(false);
  const [loadingSelectedMemoDetail, setLoadingSelectedMemoDetail] =
    useState(false);
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

  const alreadyAddedCandidateIds = useMemo(
    () =>
      Object.keys(memoItemIdByCandidateId).map((candidateId) =>
        Number(candidateId),
      ),
    [memoItemIdByCandidateId],
  );
  const pendingAddCount = pendingAddCandidateIds.length;
  const pendingRemoveCount = pendingRemoveCandidateIds.length;
  const hasPendingChanges = pendingAddCount > 0 || pendingRemoveCount > 0;

  async function syncSelectedMemoDetail(nextMemoId: number) {
    setLoadingSelectedMemoDetail(true);

    try {
      const response = await fetchShoppingMemoDetail(nextMemoId);
      const nextMembershipMap = buildMembershipMap(response);

      setMemoItemIdByCandidateId(nextMembershipMap);
      setPendingAddCandidateIds((current) =>
        current.filter((candidateId) => !(candidateId in nextMembershipMap)),
      );
      setPendingRemoveCandidateIds((current) =>
        current.filter((candidateId) => candidateId in nextMembershipMap),
      );
    } catch {
      setMemoItemIdByCandidateId({});
    } finally {
      setLoadingSelectedMemoDetail(false);
    }
  }

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

  useEffect(() => {
    if (!selectionMode || selectedMemoId === "") {
      setMemoItemIdByCandidateId({});
      setPendingAddCandidateIds([]);
      setPendingRemoveCandidateIds([]);
      setLoadingSelectedMemoDetail(false);
      return;
    }

    let active = true;

    void (async () => {
      setLoadingSelectedMemoDetail(true);

      try {
        const response = await fetchShoppingMemoDetail(Number(selectedMemoId));

        if (!active) {
          return;
        }

        const nextMembershipMap = buildMembershipMap(response);

        setMemoItemIdByCandidateId(nextMembershipMap);
        setPendingAddCandidateIds((current) =>
          current.filter((candidateId) => !(candidateId in nextMembershipMap)),
        );
        setPendingRemoveCandidateIds((current) =>
          current.filter((candidateId) => candidateId in nextMembershipMap),
        );
      } catch {
        if (!active) {
          return;
        }

        setMemoItemIdByCandidateId({});
      } finally {
        if (active) {
          setLoadingSelectedMemoDetail(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedMemoId, selectionMode]);

  function resetSelectionMode() {
    setSelectionMode(false);
    setPendingAddCandidateIds([]);
    setPendingRemoveCandidateIds([]);
    setMemoItemIdByCandidateId({});
    setSelectedMemoId((current) => current);
    setErrorMessage(null);
  }

  function toggleCandidate(candidateId: number) {
    const alreadyAdded = candidateId in memoItemIdByCandidateId;

    if (alreadyAdded) {
      setPendingRemoveCandidateIds((current) =>
        current.includes(candidateId)
          ? current.filter((id) => id !== candidateId)
          : [...current, candidateId],
      );
      return;
    }

    setPendingAddCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  async function handleApplyChanges() {
    if (!selectedMemoId || !hasPendingChanges) {
      return;
    }

    const memoId = Number(selectedMemoId);
    const nextPendingAddCount = pendingAddCount;
    const nextPendingRemoveCount = pendingRemoveCount;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (nextPendingAddCount > 0) {
        await addItemsToShoppingMemo(memoId, pendingAddCandidateIds);
      }

      if (nextPendingRemoveCount > 0) {
        await Promise.all(
          pendingRemoveCandidateIds.map((candidateId) =>
            removeItemFromShoppingMemo(
              memoId,
              memoItemIdByCandidateId[candidateId],
            ),
          ),
        );
      }

      await syncSelectedMemoDetail(memoId);

      setResultMessage(
        buildResultMessage(nextPendingAddCount, nextPendingRemoveCount),
      );
      setPendingAddCandidateIds([]);
      setPendingRemoveCandidateIds([]);
      setSelectionMode(false);
    } catch (error) {
      await syncSelectedMemoDetail(memoId);

      if (error instanceof ApiClientError) {
        setErrorMessage(
          error.data?.message ?? "買い物メモを更新できませんでした。",
        );
      } else {
        setErrorMessage("買い物メモを更新できませんでした。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasDraftMemos = draftMemos.length > 0;
  const canSubmit =
    !loadingMemos &&
    !loadingSelectedMemoDetail &&
    !submitting &&
    hasDraftMemos &&
    selectedMemoId !== "" &&
    hasPendingChanges;
  const selectionHint = !hasDraftMemos
    ? null
    : selectedMemoId === ""
      ? "追加先の買い物メモを選択してください。"
      : !hasPendingChanges
        ? "追加または解除する候補を選択してください。"
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
                    買い物メモを更新
                  </p>
                  <p className="text-sm text-gray-600">
                    追加先の買い物メモを選ぶと、候補の追加と解除をまとめて調整できます。
                  </p>

                  {loadingMemos ? (
                    <p className="text-sm text-gray-600">
                      追加先の買い物メモを読み込んでいます...
                    </p>
                  ) : errorMessage &&
                    errorMessage.includes(
                      "追加先の買い物メモを読み込めませんでした。",
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
                        onChange={(event) => {
                          setPendingAddCandidateIds([]);
                          setPendingRemoveCandidateIds([]);
                          setSelectedMemoId(event.target.value);
                        }}
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
                      追加 {pendingAddCount}件 / 解除 {pendingRemoveCount}件
                    </p>
                    {selectionHint ? (
                      <p className="text-xs text-gray-500">{selectionHint}</p>
                    ) : loadingSelectedMemoDetail ? (
                      <p className="text-xs text-gray-500">
                        追加済み候補を確認しています...
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleApplyChanges}
                      disabled={canSubmit === false}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "反映中..." : "変更を反映"}
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
        !errorMessage.includes("追加先の買い物メモを読み込めませんでした。") ? (
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
            selectedCandidateIds={pendingAddCandidateIds}
            alreadyAddedCandidateIds={alreadyAddedCandidateIds}
            pendingRemoveCandidateIds={pendingRemoveCandidateIds}
            onToggleCandidate={toggleCandidate}
            isCandidateSelectable={isAddableCandidate}
          />
        ))}
      </section>
    </div>
  );
}
