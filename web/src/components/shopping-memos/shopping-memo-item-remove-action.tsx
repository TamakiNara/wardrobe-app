"use client";

import { CircleX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { removeItemFromShoppingMemo } from "@/lib/api/shopping-memos";

type ShoppingMemoItemRemoveActionProps = {
  memoId: number;
  shoppingMemoItemId: number;
};

const CONFIRM_MESSAGE =
  "この候補を買い物メモから外しますか？\n購入検討一覧には残ります。";
const REMOVE_ERROR_MESSAGE = "買い物メモから外せませんでした。";

export default function ShoppingMemoItemRemoveAction({
  memoId,
  shoppingMemoItemId,
}: ShoppingMemoItemRemoveActionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    const confirmed = window.confirm(CONFIRM_MESSAGE);

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await removeItemFromShoppingMemo(memoId, shoppingMemoItemId);

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set("message", "removed");

      const nextHref = `${pathname}?${nextSearchParams.toString()}`;

      router.replace(nextHref, { scroll: false });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          router.push("/login");
          return;
        }

        setError(
          getUserFacingSubmitErrorMessage(error.data, REMOVE_ERROR_MESSAGE),
        );
        return;
      }

      setError(REMOVE_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRemove}
        disabled={submitting}
        aria-label="買い物メモから外す"
        title="買い物メモから外す"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CircleX className="h-4 w-4" aria-hidden="true" />
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
