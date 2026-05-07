import Link from "next/link";
import ShoppingMemoCreateForm from "@/components/shopping-memos/shopping-memo-create-form";
import { FormPageHeader } from "@/components/shared/form-page-header";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("買い物メモ作成");

export default function NewShoppingMemoPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "買い物メモ一覧", href: "/shopping-memos" },
            { label: "新規作成" },
          ]}
          eyebrow="買い物メモ"
          title="買い物メモを作成"
          description="購入を迷っている候補をまとめるためのメモを作成します。候補の追加や比較は、次の画面から行います。"
          actions={
            <Link
              href="/shopping-memos"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧に戻る
            </Link>
          }
        />

        <ShoppingMemoCreateForm cancelHref="/shopping-memos" />
      </div>
    </main>
  );
}
