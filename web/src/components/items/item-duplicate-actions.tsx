"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { saveItemDuplicatePayload } from "@/lib/items/duplicate";
import type {
  ItemColorVariantResponse,
  ItemDuplicateResponse,
} from "@/types/items";

const DUPLICATE_DRAFT_ERROR_MESSAGE =
  "複製を開始できませんでした。時間をおいて再度お試しください。";
const COLOR_VARIANT_DRAFT_ERROR_MESSAGE =
  "色違い追加を開始できませんでした。時間をおいて再度お試しください。";
const LOGIN_REQUIRED_ERROR_MESSAGE =
  "セッションが切れました。再度ログインしてください。";
const UNEXPECTED_ERROR_MESSAGE =
  "処理に失敗しました。時間をおいて再度お試しください。";

type ItemDuplicateActionsProps = {
  itemId: number;
  editHref: string;
  returnHref: string;
  returnLabel?: string;
};

type DraftAction = "duplicate" | "color-variant";

function buildTargetHref(source: DraftAction, returnTo?: string) {
  const searchParams = new URLSearchParams({ source });

  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    searchParams.set("returnTo", returnTo);
  }

  return `/items/new?${searchParams.toString()}`;
}

function getFallbackErrorMessage(action: DraftAction) {
  return action === "duplicate"
    ? DUPLICATE_DRAFT_ERROR_MESSAGE
    : COLOR_VARIANT_DRAFT_ERROR_MESSAGE;
}

export default function ItemDuplicateActions({
  itemId,
  editHref,
  returnHref,
  returnLabel = "一覧へ戻る",
}: ItemDuplicateActionsProps) {
  const router = useRouter();
  const [submittingAction, setSubmittingAction] = useState<DraftAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: DraftAction) {
    setSubmittingAction(action);
    setError(null);

    try {
      const data =
        action === "duplicate"
          ? await apiFetch<ItemDuplicateResponse>(
              `/api/items/${itemId}/duplicate`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
              },
            )
          : await apiFetch<ItemColorVariantResponse>(
              `/api/items/${itemId}/color-variant`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
              },
            );

      if (!data.item) {
        setError(getFallbackErrorMessage(action));
        return;
      }

      setError(null);
      saveItemDuplicatePayload(data.item);
      router.push(buildTargetHref(action, `/items/${itemId}`));
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          window.alert(LOGIN_REQUIRED_ERROR_MESSAGE);
          router.push("/login");
          return;
        }

        setError(
          getUserFacingSubmitErrorMessage(
            error.data,
            getFallbackErrorMessage(action),
          ),
        );
        return;
      }

      setError(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setSubmittingAction(null);
    }
  }

  const primaryButtonClassName =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400";
  const backButtonClassName =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700";

  return (
    <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
      <div className="flex w-full max-w-[21.5rem] flex-wrap justify-start gap-3 md:justify-end">
        <Link href={editHref} className={primaryButtonClassName}>
          編集
        </Link>
        <button
          type="button"
          onClick={() => handleAction("duplicate")}
          disabled={submittingAction === "duplicate"}
          className={secondaryButtonClassName}
          data-item-action="duplicate"
        >
          {submittingAction === "duplicate" ? "複製を準備中..." : "複製"}
        </button>
        <button
          type="button"
          onClick={() => handleAction("color-variant")}
          disabled={submittingAction === "color-variant"}
          className={secondaryButtonClassName}
          data-item-action="color-variant"
        >
          {submittingAction === "color-variant"
            ? "色違い追加を準備中..."
            : "色違い追加"}
        </button>
        <Link href={returnHref} className={backButtonClassName}>
          {returnLabel}
        </Link>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex w-full max-w-[21.5rem] items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
