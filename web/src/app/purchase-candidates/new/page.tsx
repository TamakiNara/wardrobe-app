import Link from "next/link";
import PurchaseCandidateForm from "@/components/purchase-candidates/purchase-candidate-form";
import { FormPageHeader } from "@/components/shared/form-page-header";

export default function NewPurchaseCandidatePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧", href: "/purchase-candidates" },
            { label: "新規作成" },
          ]}
          eyebrow="購入検討管理"
          title="購入検討を追加"
          description="候補の基本情報や購入情報を整理して、新しい購入検討を登録します。"
          actions={
            <Link
              href="/purchase-candidates"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧に戻る
            </Link>
          }
        />

        <PurchaseCandidateForm mode="create" />
      </div>
    </main>
  );
}
