"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { savePurchaseCandidateDuplicatePayload } from "@/lib/purchase-candidates/duplicate";
import type { PurchaseCandidateDuplicateResponse } from "@/types/purchase-candidates";

const DUPLICATE_DRAFT_ERROR_MESSAGE =
  "複製の初期値作成に失敗しました。時間をおいて再度お試しください。";

type PurchaseCandidateDuplicateActionProps = {
  candidateId: number;
  className?: string;
  buttonLabel?: string;
};

export default function PurchaseCandidateDuplicateAction({
  candidateId,
  className,
  buttonLabel = "複製する",
}: PurchaseCandidateDuplicateActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<PurchaseCandidateDuplicateResponse>(
        `/api/purchase-candidates/${candidateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!data.purchaseCandidate) {
        setError("複製の初期値を作成できませんでした。");
        return;
      }

      savePurchaseCandidateDuplicatePayload(data.purchaseCandidate);
      router.push("/purchase-candidates/new?source=duplicate");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          window.alert("セッションが切れました。再度ログインしてください。");
          router.push("/login");
          return;
        }

        if (error.status === 404) {
          setError(DUPLICATE_DRAFT_ERROR_MESSAGE);
          return;
        }

        setError(
          getUserFacingSubmitErrorMessage(
            error.data,
            DUPLICATE_DRAFT_ERROR_MESSAGE,
          ),
        );
        return;
      }

      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={submitting}
        className={
          className ??
          "text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        }
      >
        {submitting ? "複製中..." : buttonLabel}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
