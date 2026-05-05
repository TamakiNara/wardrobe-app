import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import DeleteWearLogButton from "@/components/wear-logs/delete-wear-log-button";
import WearLogForm from "@/components/wear-logs/wear-log-form";
import { FormPageHeader } from "@/components/shared/form-page-header";

export const metadata = buildPageMetadata("着用履歴編集");

export default async function EditWearLogPage({
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
            { label: "着用履歴一覧", href: "/wear-logs" },
            { label: "詳細", href: `/wear-logs/${id}` },
            { label: "編集" },
          ]}
          eyebrow="着用履歴管理"
          title="着用履歴編集"
          description="登録済みの着用履歴内容を見直して更新します。"
          actions={
            <Link
              href={`/wear-logs/${id}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              詳細へ戻る
            </Link>
          }
        />

        <WearLogForm
          mode="edit"
          wearLogId={id}
          cancelHref={`/wear-logs/${id}`}
          footerAction={<DeleteWearLogButton wearLogId={id} />}
        />
      </div>
    </main>
  );
}
