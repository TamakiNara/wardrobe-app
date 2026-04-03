import Link from "next/link";
import {
  CalendarDays,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import { fetchAuthenticatedUser } from "@/lib/server/auth";
import { fetchHomeSummary } from "@/lib/server/home-summary";

export default async function Home() {
  const user = await fetchAuthenticatedUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
            <p className="text-center text-sm leading-6 text-gray-600">
              服・コーディネート・着用履歴・購入検討をまとめて管理できます。
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                新規登録
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { itemsCount, outfitsCount, wearLogsCount, purchaseCandidatesCount } =
    await fetchHomeSummary();

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                  <User
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={1.8}
                  />
                  <span>{user.name}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                  現在の登録状況
                </h1>
                <p className="text-sm leading-6 text-gray-600">
                  登録済みのアイテムやコーディネート、着用履歴などをここから確認できます。
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/items/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Shirt
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    <span>アイテムを追加</span>
                  </Link>
                  <Link
                    href="/outfits/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Sparkles
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    <span>コーディネートを追加</span>
                  </Link>
                  <Link
                    href="/wear-logs/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <CalendarDays
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    <span>着用履歴を追加</span>
                  </Link>
                  <Link
                    href="/purchase-candidates/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <ShoppingBag
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    <span>購入検討を追加</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Settings
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    <span>設定を開く</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <LogoutButton />

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
                <article className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-medium tracking-wide text-gray-500">
                    アイテム
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {itemsCount}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">登録済み</p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-medium tracking-wide text-gray-500">
                    コーディネート
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {outfitsCount}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">登録済み</p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-medium tracking-wide text-gray-500">
                    着用履歴
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {wearLogsCount}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">登録済み</p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-medium tracking-wide text-gray-500">
                    購入検討
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {purchaseCandidatesCount}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">登録済み</p>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
