import Link from "next/link";
import DeletePurchaseCandidateButton from "@/components/purchase-candidates/delete-purchase-candidate-button";
import PurchaseCandidateForm from "@/components/purchase-candidates/purchase-candidate-form";
import { FormPageHeader } from "@/components/shared/form-page-header";

export default async function EditPurchaseCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧", href: "/purchase-candidates" },
            { label: "詳細", href: `/purchase-candidates/${id}` },
            { label: "編集" },
          ]}
          eyebrow="購入検討管理"
          title="購入検討編集"
          description="登録済みの購入検討内容を見直して更新します。"
          actions={
            <Link
              href={`/purchase-candidates/${id}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              詳細へ戻る
            </Link>
          }
        />

        <PurchaseCandidateForm
          mode="edit"
          candidateId={id}
          cancelHref={`/purchase-candidates/${id}`}
          footerAction={<DeletePurchaseCandidateButton candidateId={id} />}
        />
      </div>
    </main>
  );
}
