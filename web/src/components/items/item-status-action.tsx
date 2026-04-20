"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import type { ItemStatus } from "@/types/items";

type ItemStatusActionProps = {
  itemId: number;
  status: ItemStatus;
};

const DISPOSE_CONFIRM_MESSAGE =
  "このアイテムを手放しますか？\n\n通常一覧やコーディネート候補、着用履歴の登録候補から除外されます。\nこのアイテムを含むコーディネートは無効になります。";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [status]);

  const { endpoint, buttonLabel, submittingLabel, successMessage } =
    getActionConfig(status);

  async function handleClick() {
    if (status === "active") {
      const ok = window.confirm(DISPOSE_CONFIRM_MESSAGE);
      if (!ok) return;
    }

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

        setError(
          getUserFacingSubmitErrorMessage(
            data,
            "アイテム状態の更新に失敗しました。時間をおいて再度お試しください。",
          ),
        );
        return;
      }

      setSuccess(successMessage);
      router.refresh();
    } catch {
      setError(
        "アイテム状態の更新に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className={
          status === "disposed"
            ? "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
