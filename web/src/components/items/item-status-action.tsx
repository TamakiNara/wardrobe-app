"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import type { ItemStatus } from "@/types/items";

type ItemStatusActionProps = {
  itemId: number;
  status: ItemStatus;
};

const STATUS_FALLBACK_ERROR_MESSAGE =
  "アイテム状態の更新に失敗しました。時間をおいて再度お試しください。";

function getStatusErrorMessage(data: unknown): string {
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

  return getUserFacingSubmitErrorMessage(data, STATUS_FALLBACK_ERROR_MESSAGE);
}

function getActionConfig(status: ItemStatus) {
  if (status === "disposed") {
    return {
      endpoint: "reactivate",
      buttonLabel: "クローゼットに戻す",
      submittingLabel: "復帰中...",
      successMessage: "アイテムをクローゼットに戻しました。",
    };
  }

  return {
    endpoint: "dispose",
    buttonLabel: "手放す",
    submittingLabel: "更新中...",
    successMessage: "アイテムを手放しました。",
  };
}

export default function ItemStatusAction({
  itemId,
  status,
}: ItemStatusActionProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [status]);

  const { endpoint, buttonLabel, submittingLabel, successMessage } =
    getActionConfig(status);

  function openConfirm() {
    setError(null);
    setSuccess(null);
    setIsConfirming(true);
  }

  function closeConfirm() {
    if (submitting) return;

    setIsConfirming(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/items/${itemId}/${endpoint}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        window.alert("ログインが必要です。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("対象のアイテムが見つかりません。");
          return;
        }

        setError(getStatusErrorMessage(data));
        return;
      }

      setIsConfirming(false);
      setSuccess(successMessage);
      router.refresh();
    } catch {
      setError(STATUS_FALLBACK_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClick() {
    if (status === "active") {
      openConfirm();
      return;
    }

    void handleSubmit();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className={
          status === "disposed"
            ? "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>

      {status === "active" && isConfirming ? (
        <div
          role="alertdialog"
          aria-labelledby={`item-dispose-confirm-title-${itemId}`}
          aria-describedby={`item-dispose-confirm-body-${itemId}`}
          className="w-full rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
        >
          <h3
            id={`item-dispose-confirm-title-${itemId}`}
            className="text-sm font-semibold text-slate-900"
          >
            このアイテムを手放しますか？
          </h3>
          <div
            id={`item-dispose-confirm-body-${itemId}`}
            className="mt-2 space-y-1 text-sm text-slate-700"
          >
            <p>アイテムは削除されず、手放した状態として残ります。</p>
            <p>着用履歴やコーディネートの記録は維持されます。</p>
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
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-lg border border-amber-200 bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "更新中..." : "手放す"}
            </button>
          </div>
        </div>
      ) : null}

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {success && <p className="w-full text-sm text-green-600">{success}</p>}
    </div>
  );
}
