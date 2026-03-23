"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OutfitRestoreActionProps = {
  outfitId: number;
  canRestore: boolean;
};

export default function OutfitRestoreAction({
  outfitId,
  canRestore,
}: OutfitRestoreActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRestore() {
    if (!canRestore) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/outfits/${outfitId}/restore`, {
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
          setError("対象のコーディネートが見つかりませんでした。");
          return;
        }

        setError(data?.message ?? "コーディネートを戻せませんでした。");
        return;
      }

      setSuccess("コーディネートを有効に戻しました。");

      window.setTimeout(() => {
        router.refresh();
      }, 500);
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
        onClick={handleRestore}
        disabled={submitting || !canRestore}
        className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "更新中..." : "有効に戻す"}
      </button>

      {!canRestore && (
        <p className="max-w-xs text-right text-sm text-amber-800">
          手放し済みのアイテムが含まれているため、まだ戻せません。
        </p>
      )}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
