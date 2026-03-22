import { redirect } from "next/navigation";
import Link from "next/link";
import ItemsList from "@/components/items/items-list";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";

type Item = {
  id: number;
  name: string | null;
  category: string;
  shape: string;
  colors: {
    role: "main" | "sub";
    mode: "preset" | "custom";
    value: string;
    hex: string;
    label: string;
  }[];
  seasons: string[];
  tpos: string[];
};

type ItemsPageSearchParams = Record<string, string | string[] | undefined>;

type ItemsResponse = {
  items: Item[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
    availableCategories: string[];
    availableSeasons: string[];
    availableTpos: string[];
  };
};

function buildQueryString(searchParams: ItemsPageSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      const firstValue = value[0];
      if (firstValue) {
        params.set(key, firstValue);
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

async function getItems(searchParams: ItemsPageSearchParams): Promise<ItemsResponse> {
  const query = buildQueryString(searchParams);
  const path = query ? `/api/items?${query}` : "/api/items";
  const res = await fetchLaravelWithCookie(path);

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    return {
      items: [],
      meta: {
        total: 0,
        totalAll: 0,
        page: 1,
        lastPage: 1,
        availableCategories: [],
        availableSeasons: [],
        availableTpos: [],
      },
    };
  }

  const data = (await res.json()) as Partial<ItemsResponse>;

  return {
    items: data.items ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
      availableCategories: data.meta?.availableCategories ?? [],
      availableSeasons: data.meta?.availableSeasons ?? [],
      availableTpos: data.meta?.availableTpos ?? [],
    },
  };
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<ItemsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getItems(resolvedSearchParams);
  const items = data.items;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <span className="text-gray-700">アイテム一覧</span>
        </nav>
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">アイテム一覧</h1>
            <p className="mt-1 text-sm text-gray-600">
              服の色・形・季節・TPOを登録して管理します。
            </p>
          </div>

          <Link
            href="/items/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            アイテムを追加
          </Link>
        </header>

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              まだアイテムが登録されていません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              まずは 1 件追加してみましょう。
            </p>

            <div className="mt-6">
              <Link
                href="/items/new"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                アイテムを追加する
              </Link>
            </div>
          </section>
        ) : (
          <ItemsList
            items={items}
            totalCount={data.meta.total}
            totalAllCount={data.meta.totalAll}
            currentPage={data.meta.page}
            lastPage={data.meta.lastPage}
            availableCategoryValues={data.meta.availableCategories}
            availableSeasons={data.meta.availableSeasons}
            availableTpos={data.meta.availableTpos}
          />
        )}
      </div>
    </main>
  );
}
