import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { buildPageMetadata } from "@/lib/metadata";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { WearLogRecord } from "@/types/wear-logs";
import WearLogReflectionForm from "./wear-log-reflection-form";

const fallbackMetadata = buildPageMetadata("着用履歴の振り返り");

function formatWearLogTitleDate(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return "着用履歴の振り返り";
  }

  return `${Number(year)}年${Number(month)}月${Number(day)}日の振り返り`;
}

async function fetchWearLogDetail(
  id: string,
): Promise<{ status: number; wearLog: WearLogRecord | null }> {
  const response = await fetchLaravelWithCookie(`/api/wear-logs/${id}`);
  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    wearLog: response.ok
      ? ((data?.wearLog as WearLogRecord | undefined) ?? null)
      : null,
  };
}

async function getWearLog(id: string): Promise<WearLogRecord> {
  const result = await fetchWearLogDetail(id);

  if (result.status === 401) {
    redirect("/login");
  }

  if (!result.wearLog) {
    redirect("/wear-logs");
  }

  return result.wearLog;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchWearLogDetail(id);
  const eventDate = result.wearLog?.event_date;

  if (!eventDate) {
    return fallbackMetadata;
  }

  return buildPageMetadata(formatWearLogTitleDate(eventDate));
}

export default async function WearLogReflectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wearLog = await getWearLog(id);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "着用履歴一覧", href: "/wear-logs" },
            { label: "詳細", href: `/wear-logs/${wearLog.id}` },
            { label: "振り返り" },
          ]}
          eyebrow="着用履歴管理"
          title="着用履歴の振り返り"
          details={
            <p className="text-sm text-gray-600">
              服装の感想だけを編集します。着用日やアイテムは変更しません。
            </p>
          }
          actions={
            <Link
              href={`/wear-logs/${wearLog.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              詳細へ戻る
            </Link>
          }
        />

        <WearLogReflectionForm wearLog={wearLog} />
      </div>
    </main>
  );
}
