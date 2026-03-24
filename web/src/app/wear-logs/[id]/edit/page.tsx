import Link from "next/link";
import DeleteWearLogButton from "@/components/wear-logs/delete-wear-log-button";
import WearLogForm from "@/components/wear-logs/wear-log-form";

export default async function EditWearLogPage({
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
          <Link href="/wear-logs" className="hover:underline">
            着用履歴一覧
          </Link>
          {" / "}
          <span className="text-gray-700">編集</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">着用履歴管理</p>
            <h1 className="text-2xl font-bold text-gray-900">着用履歴編集</h1>
          </div>

          <Link
            href="/wear-logs"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <WearLogForm mode="edit" wearLogId={id} />

        <div className="flex justify-end">
          <DeleteWearLogButton wearLogId={id} />
        </div>
      </div>
    </main>
  );
}
