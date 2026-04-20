"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import type { ItemCareStatus } from "@/types/items";

type ItemCareStatusActionProps = {
  itemId: number;
  careStatus: ItemCareStatus | null | undefined;
};

function getActionConfig(careStatus: ItemCareStatus | null | undefined) {
  if (careStatus === "in_cleaning") {
    return {
      nextCareStatus: null,
      buttonLabel: "解除する",
      submittingLabel: "更新中...",
      successMessage: "クリーニング状態を解除しました。",
    };
  }

  return {
    nextCareStatus: "in_cleaning" as const,
    buttonLabel: "クリーニングに出す",
    submittingLabel: "更新中...",
    successMessage: "クリーニング中に設定しました。",
  };
}

export default function ItemCareStatusAction({
  itemId,
  careStatus,
}: ItemCareStatusActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [careStatus]);

  const { nextCareStatus, buttonLabel, submittingLabel, successMessage } =
    getActionConfig(careStatus);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/items/${itemId}/care-status`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          care_status: nextCareStatus,
        }),
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
            "ケア状態の更新に失敗しました。時間をおいて再度お試しください。",
          ),
        );
        return;
      }

      setSuccess(successMessage);
      router.refresh();
    } catch {
      setError(
        "ケア状態の更新に失敗しました。時間をおいて再度お試しください。",
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
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
