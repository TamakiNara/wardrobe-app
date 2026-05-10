"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";

type DeleteOutfitButtonProps = {
  outfitId: number;
};

const DELETE_FALLBACK_ERROR_MESSAGE =
  "コーディネートの削除に失敗しました。時間をおいて再度お試しください。";

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

  return getUserFacingSubmitErrorMessage(data, DELETE_FALLBACK_ERROR_MESSAGE);
}

export default function DeleteOutfitButton({
  outfitId,
}: DeleteOutfitButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConfirm() {
    setError(null);
    setIsConfirming(true);
  }

  function closeConfirm() {
    if (submitting) return;

    setIsConfirming(false);
  }

  async function handleDelete() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/outfits/${outfitId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        window.alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(getDeleteErrorMessage(data));
        return;
      }

      router.push("/outfits");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        disabled={submitting}
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "削除中..." : "削除"}
      </button>

      {isConfirming && (
        <div
          role="alertdialog"
          aria-labelledby={`outfit-delete-confirm-title-${outfitId}`}
          aria-describedby={`outfit-delete-confirm-body-${outfitId}`}
          className="basis-full rounded-xl border border-red-200 bg-white p-4 text-left shadow-sm"
        >
          <h3
            id={`outfit-delete-confirm-title-${outfitId}`}
            className="text-sm font-semibold text-slate-900"
          >
            コーディネートを削除しますか？
          </h3>
          <div
            id={`outfit-delete-confirm-body-${outfitId}`}
            className="mt-2 space-y-1 text-sm text-slate-700"
          >
            <p>この操作は取り消せません。</p>
            <p>コーディネートに含まれるアイテム自体は削除されません。</p>
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

      {error && <p className="basis-full text-sm text-red-600">{error}</p>}
    </>
  );
}
