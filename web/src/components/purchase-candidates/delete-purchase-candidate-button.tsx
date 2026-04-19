"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";

const DELETE_ERROR_MESSAGE =
  "削除に失敗しました。時間をおいて再度お試しください。";

type DeletePurchaseCandidateButtonProps = {
  candidateId: string;
};

export default function DeletePurchaseCandidateButton({
  candidateId,
}: DeletePurchaseCandidateButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("この購入検討を削除しますか？");

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/purchase-candidates/${candidateId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setError("セッションが切れました。再度ログインしてください。");
        window.setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        setError(getUserFacingSubmitErrorMessage(data, DELETE_ERROR_MESSAGE));
        return;
      }

      router.push("/purchase-candidates?message=deleted");
      router.refresh();
    } catch {
      setError(DELETE_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        削除
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
