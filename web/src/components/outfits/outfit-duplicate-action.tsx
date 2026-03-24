"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import {
  saveOutfitDuplicatePayload,
} from "@/lib/outfits/duplicate";
import type { OutfitDuplicateResponse } from "@/types/outfits";

type OutfitDuplicateActionProps = {
  outfitId: number;
  buttonLabel?: string;
  className?: string;
};

export default function OutfitDuplicateAction({
  outfitId,
  buttonLabel = "複製して新規作成",
  className,
}: OutfitDuplicateActionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<OutfitDuplicateResponse>(
        `/api/outfits/${outfitId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!data?.outfit) {
        setError("複製の初期値を読み込めませんでした。");
        return;
      }

      saveOutfitDuplicatePayload(data.outfit);
      router.push("/outfits/new?source=duplicate");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          window.alert("セッションが切れました。再度ログインしてください。");
          router.push("/login");
          return;
        }

        if (error.status === 404) {
          setError("対象のコーディネートが見つかりませんでした。");
          return;
        }

        setError(error.data?.message ?? "複製の初期値を作成できませんでした。");
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
        {submitting ? "準備中..." : buttonLabel}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
