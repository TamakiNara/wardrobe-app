"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { savePurchaseCandidateColorVariantPayload } from "@/lib/purchase-candidates/duplicate";
import type { PurchaseCandidateColorVariantResponse } from "@/types/purchase-candidates";

const COLOR_VARIANT_DRAFT_ERROR_MESSAGE =
  "色違いの初期値作成に失敗しました。時間をおいて再度お試しください。";

type PurchaseCandidateColorVariantActionProps = {
  candidateId: number;
  className?: string;
  buttonLabel?: string;
};

export default function PurchaseCandidateColorVariantAction({
  candidateId,
  className,
  buttonLabel = "色違いを追加",
}: PurchaseCandidateColorVariantActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleColorVariant() {
    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<PurchaseCandidateColorVariantResponse>(
        `/api/purchase-candidates/${candidateId}/color-variant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!data.purchaseCandidate) {
        setError("色違いの初期値を作成できませんでした。");
        return;
      }

      savePurchaseCandidateColorVariantPayload(data.purchaseCandidate);
      router.push("/purchase-candidates/new?source=color-variant");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          window.alert("セッションが切れました。再度ログインしてください。");
          router.push("/login");
          return;
        }

        if (error.status === 404) {
          setError(COLOR_VARIANT_DRAFT_ERROR_MESSAGE);
          return;
        }

        setError(
          getUserFacingSubmitErrorMessage(
            error.data,
            COLOR_VARIANT_DRAFT_ERROR_MESSAGE,
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
        onClick={handleColorVariant}
        disabled={submitting}
        className={
          className ??
          "text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        }
      >
        {submitting ? "色違い追加中..." : buttonLabel}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
