"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WearLogRecord } from "@/types/wear-logs";

type WearLogStatusActionProps = {
  wearLog: WearLogRecord;
};

function getActionConfig(status: WearLogRecord["status"]) {
  if (status === "planned") {
    return {
      nextStatus: "worn" as const,
      buttonLabel: "着用済みにする",
      submittingLabel: "更新中...",
      successMessage: "着用済みに更新しました。",
      className:
        "rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50",
    };
  }

  return {
    nextStatus: "planned" as const,
    buttonLabel: "予定に戻す",
    submittingLabel: "更新中...",
    successMessage: "予定に戻しました。",
    className:
      "rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50",
  };
}

export default function WearLogStatusAction({
  wearLog,
}: WearLogStatusActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasUnresolvedItems = wearLog.items.some(
    (item) => item.source_item_id === null,
  );
  const {
    nextStatus,
    buttonLabel,
    submittingLabel,
    successMessage,
    className,
  } = getActionConfig(wearLog.status);

  async function handleClick() {
    if (hasUnresolvedItems || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/wear-logs/${wearLog.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          event_date: wearLog.event_date,
          display_order: wearLog.display_order,
          source_outfit_id: wearLog.source_outfit_id,
          memo: wearLog.memo ?? "",
          items: wearLog.items
            .filter((item) => item.source_item_id !== null)
            .map((item) => ({
              source_item_id: item.source_item_id as number,
              sort_order: item.sort_order,
              item_source_type: item.item_source_type,
            })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        window.alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(data?.message ?? "状態を更新できませんでした。");
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
    <div
      className="flex flex-col items-start gap-2"
      data-testid="wear-log-status-action"
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting || hasUnresolvedItems}
        className={className}
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>

      {hasUnresolvedItems && (
        <p className="text-sm text-amber-800">
          元アイテム参照が解決できないため、この画面からは状態変更できません。編集画面で内容を確認してください。
        </p>
      )}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
