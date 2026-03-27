"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ItemCareStatus } from "@/types/items";

type ItemCareStatusActionProps = {
  itemId: number;
  careStatus: ItemCareStatus | null | undefined;
};

function getActionConfig(careStatus: ItemCareStatus | null | undefined) {
  if (careStatus === "in_cleaning") {
    return {
      nextCareStatus: null,
      buttonLabel: "クリーニング解除",
      submittingLabel: "解除中...",
      successMessage: "クリーニング状態を解除しました。",
    };
  }

  return {
    nextCareStatus: "in_cleaning" as const,
    buttonLabel: "クリーニング中にする",
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
        window.alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("対象のアイテムが見つかりませんでした。");
          return;
        }

        setError(data?.message ?? "クリーニング状態を更新できませんでした。");
        return;
      }

      setSuccess(successMessage);
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className={
          careStatus === "in_cleaning"
            ? "rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>

      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
