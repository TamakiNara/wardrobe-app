"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/lib/api/client";
import { getUserFacingSubmitErrorMessage } from "@/lib/api/error-message";
import { createShoppingMemo } from "@/lib/api/shopping-memos";

type ShoppingMemoCreateFormProps = {
  cancelHref?: string;
};

const FIELD_CLASS_NAME =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function ShoppingMemoCreateForm({
  cancelHref = "/shopping-memos",
}: ShoppingMemoCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (name.trim() === "") {
      nextErrors.name = "メモ名を入力してください。";
    }

    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("入力内容を確認してください。");
      return;
    }

    setSubmitting(true);

    try {
      const response = await createShoppingMemo({
        name: name.trim(),
        memo: memo.trim() === "" ? null : memo.trim(),
      });
      router.push(`/shopping-memos/${response.shoppingMemo.id}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const nextFieldErrors: Record<string, string> = {};
        const validationErrors = error.data?.errors ?? {};

        for (const [key, value] of Object.entries(validationErrors)) {
          const firstValue = Array.isArray(value) ? value[0] : value;

          if (typeof firstValue === "string" && firstValue.trim() !== "") {
            nextFieldErrors[key] = firstValue;
          }
        }

        setErrors(nextFieldErrors);
        setSubmitError(
          getUserFacingSubmitErrorMessage(
            error.data,
            "入力内容を確認してください。",
          ),
        );
      } else {
        setErrors({});
        setSubmitError(
          "買い物メモの作成に失敗しました。時間をおいて再度お試しください。",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7"
    >
      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="shopping-memo-name"
          className="block text-sm font-medium text-gray-700"
        >
          メモ名
        </label>
        <input
          id="shopping-memo-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => {
              if (!current.name) {
                return current;
              }

              const nextErrors = { ...current };
              delete nextErrors.name;
              return nextErrors;
            });
          }}
          placeholder="例: 春夏セール候補"
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={
            errors.name ? "shopping-memo-name-error" : undefined
          }
          className={FIELD_CLASS_NAME}
        />
        {errors.name ? (
          <p id="shopping-memo-name-error" className="text-sm text-red-600">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="shopping-memo-memo"
          className="block text-sm font-medium text-gray-700"
        >
          メモ
        </label>
        <textarea
          id="shopping-memo-memo"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={5}
          placeholder="例: 店舗で見る候補、セール終了前に比較するもの"
          className={FIELD_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          {submitting ? "作成中..." : "作成する"}
        </button>

        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
