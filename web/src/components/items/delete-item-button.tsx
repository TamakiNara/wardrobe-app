"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";

type DeleteItemButtonProps = {
  itemId: number;
};

const DELETE_CONFIRM_MESSAGE = [
  "このアイテムを削除しますか？",
  "この操作は取り消せません。実際に手放しただけの場合は「手放す」を使ってください。",
  "登録画像も削除されます。",
].join("\n");

const DELETE_FALLBACK_ERROR_MESSAGE = "アイテムを削除できませんでした。";

function getDeleteErrorMessage(data: unknown): string {
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

  return getUserFacingSubmitErrorMessage(data, DELETE_FALLBACK_ERROR_MESSAGE);
}

export default function DeleteItemButton({ itemId }: DeleteItemButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm(DELETE_CONFIRM_MESSAGE);
    if (!ok) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        window.alert(
          "ログインが必要です。再度ログインしてからお試しください。",
        );
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(getDeleteErrorMessage(data));
        return;
      }

      router.push("/items");
      router.refresh();
    } catch {
      setError(DELETE_FALLBACK_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={submitting}
        className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "削除中..." : "アイテムを削除する"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
