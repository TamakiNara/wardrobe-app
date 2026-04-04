"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteItemButtonProps = {
  itemId: number;
};

export default function DeleteItemButton({ itemId }: DeleteItemButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm(
      "このアイテムを完全に削除しますか？\n登録ミスなど、履歴を残さず消したい場合に限って使います。",
    );
    if (!ok) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        window.alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(data?.message ?? "完全削除に失敗しました。");
        return;
      }

      router.push("/items");
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
        onClick={handleDelete}
        disabled={submitting}
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "削除中..." : "完全に削除"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
