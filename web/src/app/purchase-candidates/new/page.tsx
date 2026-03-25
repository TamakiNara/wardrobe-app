import Link from "next/link";
import PurchaseCandidateForm from "@/components/purchase-candidates/purchase-candidate-form";

export default function NewPurchaseCandidatePage() {
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
          <span className="text-gray-700">新規作成</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">購入検討管理</p>
            <h1 className="text-2xl font-bold text-gray-900">購入検討を追加</h1>
          </div>

          <Link
            href="/purchase-candidates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <PurchaseCandidateForm mode="create" />
      </div>
    </main>
  );
}
