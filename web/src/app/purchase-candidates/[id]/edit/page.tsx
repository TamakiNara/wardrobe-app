import Link from "next/link";
import DeletePurchaseCandidateButton from "@/components/purchase-candidates/delete-purchase-candidate-button";
import PurchaseCandidateForm from "@/components/purchase-candidates/purchase-candidate-form";

export default async function EditPurchaseCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/purchase-candidates" className="hover:underline">
            購入検討一覧
          </Link>
          {" / "}
          <Link href={`/purchase-candidates/${id}`} className="hover:underline">
            詳細
          </Link>
          {" / "}
          <span className="text-gray-700">編集</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">購入検討(管理)</p>
            <h1 className="text-2xl font-bold text-gray-900">購入検討編集</h1>
          </div>

          <Link
            href={`/purchase-candidates/${id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            詳細へ戻る
          </Link>
        </div>

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
