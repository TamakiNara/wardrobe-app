"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";

const DELETE_ERROR_MESSAGE =
  "削除に失敗しました。時間をおいて再度お試しください。";

type DeletePurchaseCandidateButtonProps = {
  candidateId: string;
  isUsedInShoppingMemos?: boolean;
  shoppingMemoCount?: number;
};

function getDeleteErrorMessage(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    const message = data.message.trim();

    if (
      message !== "" &&
      !/SQLSTATE|PDOException|QueryException|Illuminate\\|stack trace|exception/i.test(
        message,
      )
    ) {
      return message;
    }
  }

  return getUserFacingSubmitErrorMessage(data, DELETE_ERROR_MESSAGE);
}

export default function DeletePurchaseCandidateButton({
  candidateId,
  isUsedInShoppingMemos = false,
  shoppingMemoCount = 0,
}: DeletePurchaseCandidateButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedShoppingMemoCount = Math.max(0, shoppingMemoCount);
  const isDeleteBlockedByShoppingMemo =
    isUsedInShoppingMemos || normalizedShoppingMemoCount > 0;

  function openConfirm() {
    setError(null);

    if (isDeleteBlockedByShoppingMemo) {
      setIsConfirming(false);
      return;
    }

    setIsConfirming(true);
  }

  function closeConfirm() {
    if (submitting) return;

    setIsConfirming(false);
  }

  async function handleDelete() {
    if (isDeleteBlockedByShoppingMemo) {
      setIsConfirming(false);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/purchase-candidates/${candidateId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setError("セッションが切れました。再度ログインしてください。");
        window.setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        setError(getDeleteErrorMessage(data));
        return;
      }

      router.push("/purchase-candidates?message=deleted");
      router.refresh();
    } catch {
      setError(DELETE_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openConfirm}
        disabled={submitting || isDeleteBlockedByShoppingMemo}
        className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        購入検討を削除する
      </button>

      {isDeleteBlockedByShoppingMemo && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <p className="font-medium">
            買い物メモに含まれているため削除できません
          </p>
          <p className="mt-1">
            {normalizedShoppingMemoCount > 0
              ? `この購入検討は ${normalizedShoppingMemoCount} 件の買い物メモに含まれています。`
              : "この購入検討は買い物メモに含まれています。"}
          </p>
          <p className="mt-1">
            削除するには、先に買い物メモから外してください。
          </p>
        </div>
      )}

      {!isDeleteBlockedByShoppingMemo && isConfirming && (
        <div
          role="alertdialog"
          aria-labelledby={`purchase-candidate-delete-confirm-title-${candidateId}`}
          aria-describedby={`purchase-candidate-delete-confirm-body-${candidateId}`}
          className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-4 shadow-sm"
        >
          <h3
            id={`purchase-candidate-delete-confirm-title-${candidateId}`}
            className="text-sm font-semibold text-slate-900"
          >
            購入検討を削除しますか？
          </h3>
          <div
            id={`purchase-candidate-delete-confirm-body-${candidateId}`}
            className="mt-2 space-y-1 text-sm text-slate-700"
          >
            <p>この操作は取り消せません。</p>
            <p>関連する表示や比較にも影響する場合があります。</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-lg border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
