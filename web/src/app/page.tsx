import Link from "next/link";
import LogoutButton from "@/components/auth/logout-button";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";

type User = {
  id: number;
  name: string;
  email: string;
};

type Item = {
  id: number;
};

type ItemsResponse = {
  items?: Item[];
  meta?: {
    totalAll?: number;
  };
};

type Outfit = {
  id: number;
};

type OutfitsResponse = {
  outfits?: Outfit[];
  meta?: {
    totalAll?: number;
  };
};

type WearLog = {
  id: number;
};

type WearLogsResponse = {
  wearLogs?: WearLog[];
  meta?: {
    totalAll?: number;
  };
};

type PurchaseCandidate = {
  id: number;
};

type PurchaseCandidatesResponse = {
  purchaseCandidates?: PurchaseCandidate[];
  meta?: {
    totalAll?: number;
  };
};

async function getUser(): Promise<User | null> {
  const res = await fetchLaravelWithCookie("/api/me");

  if (!res.ok) {
    return null;
  }

  return res.json();
}

async function getItemsCount(): Promise<number> {
  const res = await fetchLaravelWithCookie("/api/items");

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as ItemsResponse;
  return data.meta?.totalAll ?? data.items?.length ?? 0;
}

async function getOutfitsCount(): Promise<number> {
  const res = await fetchLaravelWithCookie("/api/outfits");

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as OutfitsResponse;
  return data.meta?.totalAll ?? data.outfits?.length ?? 0;
}

async function getWearLogsCount(): Promise<number> {
  const res = await fetchLaravelWithCookie("/api/wear-logs");

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as WearLogsResponse;
  return data.meta?.totalAll ?? data.wearLogs?.length ?? 0;
}

async function getPurchaseCandidatesCount(): Promise<number> {
  const res = await fetchLaravelWithCookie("/api/purchase-candidates");

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as PurchaseCandidatesResponse;
  return data.meta?.totalAll ?? data.purchaseCandidates?.length ?? 0;
}

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">Wardrobe App</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              服とコーディネートを管理するアプリ
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              アイテムの色・形・季節・TPOを登録し、コーディネートとして管理できます。
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

  const [itemsCount, outfitsCount, wearLogsCount, purchaseCandidatesCount] = await Promise.all([
    getItemsCount(),
    getOutfitsCount(),
    getWearLogsCount(),
    getPurchaseCandidatesCount(),
  ]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">ホーム</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                ようこそ {user.name} さん
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                登録済みアイテムやコーディネートをここから確認できます。
              </p>
            </div>

            <LogoutButton />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">アイテム管理</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {itemsCount}
            </p>
            <p className="mt-2 text-sm text-gray-600">登録済みアイテム数</p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/items"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                一覧を見る
              </Link>
              <Link
                href="/items/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                追加する
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">コーディネート管理</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {outfitsCount}
            </p>
            <p className="mt-2 text-sm text-gray-600">登録済みコーディネート数</p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/outfits"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                一覧を見る
              </Link>
              <Link
                href="/outfits/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                追加する
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">着用履歴管理</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {wearLogsCount}
            </p>
            <p className="mt-2 text-sm text-gray-600">登録済み着用履歴数</p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/wear-logs"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                一覧を見る
              </Link>
              <Link
                href="/wear-logs/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                追加する
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">購入検討管理</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {purchaseCandidatesCount}
            </p>
            <p className="mt-2 text-sm text-gray-600">登録済み購入検討数</p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/purchase-candidates"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                一覧を見る
              </Link>
              <Link
                href="/purchase-candidates/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                追加する
              </Link>
            </div>
          </article>
        </section>

        <section className="grid gap-4">

          <Link href="/settings" className="block">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">設定へ</h2>
              <p className="mt-2 text-sm text-gray-600">
                カテゴリ表示設定など、アプリの動作に関わる項目を確認できます。
              </p>
            </article>
          </Link>
        </section>
      </div>
    </main>
  );
}
