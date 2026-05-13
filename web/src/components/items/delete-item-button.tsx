"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { redirectToLoginForSessionExpired } from "@/lib/auth/unauthorized";

type DeleteItemButtonProps = {
  itemId: number;
};

const DELETE_FALLBACK_ERROR_MESSAGE = "アイテムを削除できませんでした。";

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

export default function DeleteItemButton({ itemId }: DeleteItemButtonProps) {
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
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        redirectToLoginForSessionExpired(router);
        return;
      }

      if (!res.ok) {
        setError(getDeleteErrorMessage(data));
        return;
      }

      router.push("/items");
      router.refresh();
    } catch {
      setError(DELETE_FALLBACK_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={openConfirm}
        disabled={submitting}
        className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "削除中..." : "アイテムを削除する"}
      </button>

      {isConfirming && (
        <div
          role="alertdialog"
          aria-labelledby={`item-delete-confirm-title-${itemId}`}
          aria-describedby={`item-delete-confirm-body-${itemId}`}
          className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-4 shadow-sm"
        >
          <h3
            id={`item-delete-confirm-title-${itemId}`}
            className="text-sm font-semibold text-slate-900"
          >
            アイテムを削除しますか？
          </h3>
          <div
            id={`item-delete-confirm-body-${itemId}`}
            className="mt-2 space-y-1 text-sm text-slate-700"
          >
            <p>この操作は取り消せません。</p>
            <p>実際に手放しただけの場合は「手放す」を使ってください。</p>
            <p>登録画像も削除されます。</p>
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
