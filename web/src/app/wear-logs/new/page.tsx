import Link from "next/link";
import WearLogForm from "@/components/wear-logs/wear-log-form";
import { FormPageHeader } from "@/components/shared/form-page-header";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import { redirect } from "next/navigation";

type PreferencesResponse = {
  preferences?: {
    currentSeason?: "spring" | "summer" | "autumn" | "winter" | null;
    defaultWearLogStatus?: "planned" | "worn" | null;
  };
};

type NewWearLogPageSearchParams = Record<string, string | string[] | undefined>;

function getSearchParam(
  searchParams: NewWearLogPageSearchParams,
  key: string,
): string | null {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapPreferenceSeasonToFilterValue(
  currentSeason: "spring" | "summer" | "autumn" | "winter" | null | undefined,
): string | undefined {
  switch (currentSeason) {
    case "spring":
      return "春";
    case "summer":
      return "夏";
    case "autumn":
      return "秋";
    case "winter":
      return "冬";
    default:
      return undefined;
  }
}

export default async function NewWearLogPage({
  searchParams,
}: {
  searchParams?: Promise<NewWearLogPageSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  let initialStatus: "planned" | "worn" = "planned";
  let initialCurrentSeason: string | undefined;
  const initialEventDate = (() => {
    const value = getSearchParam(resolvedSearchParams, "event_date");
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
  })();
  const initialDisplayOrder = (() => {
    const value = Number(
      getSearchParam(resolvedSearchParams, "display_order") ?? "1",
    );
    return Number.isInteger(value) && value > 0 ? value : 1;
  })();

  const preferencesRes = await fetchLaravelWithCookie(
    "/api/settings/preferences",
  );

  if (preferencesRes.status === 401) {
    redirect("/login");
  }

  if (preferencesRes.ok) {
    const data = (await preferencesRes.json()) as PreferencesResponse;
    if (data.preferences?.defaultWearLogStatus === "worn") {
      initialStatus = "worn";
    }
    initialCurrentSeason = mapPreferenceSeasonToFilterValue(
      data.preferences?.currentSeason,
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "着用履歴一覧", href: "/wear-logs" },
            { label: "新規登録" },
          ]}
          eyebrow="着用履歴管理"
          title="着用履歴登録"
          description="日付や状態、元のコーディネートやアイテムを選んで着用履歴を登録します。"
          actions={
            <Link
              href="/wear-logs"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧に戻る
            </Link>
          }
        />

        <WearLogForm
          mode="create"
          initialStatus={initialStatus}
          initialEventDate={initialEventDate}
          initialDisplayOrder={initialDisplayOrder}
          initialCurrentSeason={initialCurrentSeason}
        />
      </div>
    </main>
  );
}
