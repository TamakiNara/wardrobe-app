"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ItemStatus } from "@/types/items";

type ItemStatusActionProps = {
  itemId: number;
  status: ItemStatus;
};

const DISPOSE_CONFIRM_MESSAGE = [
  "このアイテムを手放しますか？",
  "",
  "手放したアイテムは通常一覧やコーディネート候補、着用履歴の登録候補から除外されます。",
  "このアイテムを含むコーディネートは無効になります。",
].join("\n");

function getActionConfig(status: ItemStatus) {
  if (status === "disposed") {
    return {
      endpoint: "reactivate",
      buttonLabel: "所持品に戻す",
      submittingLabel: "更新中...",
      successMessage: "アイテムを所持品に戻しました。",
    };
  }

  return {
    endpoint: "dispose",
    buttonLabel: "手放す",
    submittingLabel: "手放し中...",
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
        window.alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("対象のアイテムが見つかりませんでした。");
          return;
        }

        setError(data?.message ?? "アイテムの状態を変更できませんでした。");
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
          status === "disposed"
            ? "rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {submitting ? submittingLabel : buttonLabel}
      </button>

      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
