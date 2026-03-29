import Link from "next/link";
import WearLogForm from "@/components/wear-logs/wear-log-form";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import { redirect } from "next/navigation";

type PreferencesResponse = {
  preferences?: {
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

export default async function NewWearLogPage({
  searchParams,
}: {
  searchParams?: Promise<NewWearLogPageSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  let initialStatus: "planned" | "worn" = "planned";
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
  }

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
          <span className="text-gray-700">新規登録</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">着用履歴管理</p>
            <h1 className="text-2xl font-bold text-gray-900">着用履歴登録</h1>
          </div>

          <Link
            href="/wear-logs"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <WearLogForm
          mode="create"
          initialStatus={initialStatus}
          initialEventDate={initialEventDate}
          initialDisplayOrder={initialDisplayOrder}
        />
      </div>
    </main>
  );
}
