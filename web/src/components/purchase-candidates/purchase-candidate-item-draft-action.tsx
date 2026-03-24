"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  savePurchaseCandidateItemDraft,
} from "@/lib/purchase-candidates/item-draft";
import type { PurchaseCandidateItemDraftResponse } from "@/types/purchase-candidates";

type PurchaseCandidateItemDraftActionProps = {
  candidateId: number;
  convertedItemId: number | null;
};

export default function PurchaseCandidateItemDraftAction({
  candidateId,
  convertedItemId,
}: PurchaseCandidateItemDraftActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/purchase-candidates/${candidateId}/item-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = (await response.json().catch(() => null)) as PurchaseCandidateItemDraftResponse | { message?: string } | null;

      if (response.status === 401) {
        setError("セッションが切れました。再度ログインしてください。");
        window.setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok || !data || !("item_draft" in data)) {
        setError(data?.message ?? "item 初期値の生成に失敗しました。");
        return;
      }

      savePurchaseCandidateItemDraft(data);
      router.push("/items/new?source=purchase-candidate");
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {convertedItemId === null ? "item に追加する" : "item 初期値を再生成する"}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
