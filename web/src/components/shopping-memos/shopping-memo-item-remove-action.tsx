"use client";

import { CircleX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  flattenValidationErrors,
  getUserFacingSubmitErrorMessage,
} from "@/lib/api/error-message";
import { removeItemFromShoppingMemo } from "@/lib/api/shopping-memos";

type ShoppingMemoItemRemoveActionProps = {
  memoId: number;
  shoppingMemoItemId: number;
};

const REMOVE_ERROR_MESSAGE = "買い物メモから外せませんでした。";

function getRemoveErrorMessage(data: unknown): string {
  const validationErrors = flattenValidationErrors(data);
  const firstValidationMessage =
    validationErrors.shopping_memo_item ?? validationErrors.item ?? null;

  if (firstValidationMessage) {
    return firstValidationMessage;
  }

  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    const message = data.message.trim();

    if (
      message !== "" &&
      !/SQLSTATE|PDOException|QueryException|Illuminate\\|stack trace|exception/i.test(
        message,
      )
    ) {
      return message;
    }
  }

  return getUserFacingSubmitErrorMessage(data, REMOVE_ERROR_MESSAGE);
}

export default function ShoppingMemoItemRemoveAction({
  memoId,
  shoppingMemoItemId,
}: ShoppingMemoItemRemoveActionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConfirm() {
    setError(null);
    setIsConfirming(true);
  }

  function closeConfirm() {
    if (submitting) return;

    setIsConfirming(false);
  }

  async function handleRemove() {
    setSubmitting(true);
    setError(null);

    try {
      await removeItemFromShoppingMemo(memoId, shoppingMemoItemId);

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set("message", "removed");

      const nextHref = `${pathname}?${nextSearchParams.toString()}`;

      setIsConfirming(false);
      router.replace(nextHref, { scroll: false });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          router.push("/login");
          return;
        }

        setError(getRemoveErrorMessage(error.data));
        return;
      }

      setError(REMOVE_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        disabled={submitting}
        aria-label="買い物メモから外す"
        title="買い物メモから外す"
        className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CircleX className="h-4 w-4" aria-hidden="true" />
      </button>

      {isConfirming ? (
        <div
          role="alertdialog"
          aria-labelledby={`shopping-memo-remove-confirm-title-${shoppingMemoItemId}`}
          aria-describedby={`shopping-memo-remove-confirm-body-${shoppingMemoItemId}`}
          className="w-full rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
        >
          <h3
            id={`shopping-memo-remove-confirm-title-${shoppingMemoItemId}`}
            className="text-sm font-semibold text-slate-900"
          >
            買い物メモから外しますか？
          </h3>
          <div
            id={`shopping-memo-remove-confirm-body-${shoppingMemoItemId}`}
            className="mt-2 space-y-1 text-sm text-slate-700"
          >
            <p>この候補を買い物メモから外します。</p>
            <p>購入検討一覧には残ります。</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={submitting}
              className="rounded-lg border border-amber-200 bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "処理中..." : "外す"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </>
  );
}
