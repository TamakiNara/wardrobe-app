import { headers } from "next/headers";
import Link from "next/link";
import LogoutButton from "@/components/auth/logout-button";

type User = {
  id: number;
  name: string;
  email: string;
};

type Item = {
  id: number;
};

type Outfit = {
  id: number;
};

async function getUser(): Promise<User | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

async function getItems(): Promise<Item[]> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/items`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.items ?? [];
}

async function getOutfits(): Promise<Outfit[]> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/outfits`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.outfits ?? [];
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

  const [items, outfits] = await Promise.all([getItems(), getOutfits()]);

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

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">アイテム管理</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {items.length}
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
              {outfits.length}
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
