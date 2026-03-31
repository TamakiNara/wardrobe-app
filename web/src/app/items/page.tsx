import { redirect } from "next/navigation";
import Link from "next/link";
import ItemsList from "@/components/items/items-list";
import { buildSupportedCategoryOptions } from "@/lib/api/categories";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import { mapPreferenceSeasonToFilterValue } from "@/lib/settings/preferences";
import type { CategoryGroupRecord, CategoryOption } from "@/types/categories";
import type { ItemRecord } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

type ItemsPageSearchParams = Record<string, string | string[] | undefined>;

type ItemsResponse = {
  items: ItemRecord[];
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

type PreferencesResponse = {
  preferences?: {
    currentSeason?: "spring" | "summer" | "autumn" | "winter" | null;
    skinTonePreset?: SkinTonePreset | null;
  };
};

type CategoriesResponse = {
  groups?: CategoryGroupRecord[];
};

type CategoryVisibilitySettingsResponse = {
  visibleCategoryIds?: string[];
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

function resolveCurrentSeason(searchParams: ItemsPageSearchParams): string {
  const value = searchParams.season;

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

async function getItems(
  searchParams: ItemsPageSearchParams,
): Promise<ItemsResponse> {
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
  const currentSeason = resolveCurrentSeason(resolvedSearchParams);
  const [preferencesRes, categoryGroupsRes, categoryVisibilityRes] =
    await Promise.all([
      fetchLaravelWithCookie("/api/settings/preferences"),
      fetchLaravelWithCookie("/api/categories"),
      fetchLaravelWithCookie("/api/settings/categories"),
    ]);

  if (preferencesRes.status === 401) {
    redirect("/login");
  }

  let initialSeasonFilter = "";
  let skinTonePreset: SkinTonePreset = DEFAULT_SKIN_TONE_PRESET;
  let initialCategoryOptions: CategoryOption[] | undefined;

  if (preferencesRes.ok) {
    const preferencesData =
      (await preferencesRes.json()) as PreferencesResponse;
    skinTonePreset =
      preferencesData.preferences?.skinTonePreset ?? DEFAULT_SKIN_TONE_PRESET;

    if (!currentSeason) {
      initialSeasonFilter = mapPreferenceSeasonToFilterValue(
        preferencesData.preferences?.currentSeason ?? null,
      );
    }
  }

  if (categoryGroupsRes.ok && categoryVisibilityRes.ok) {
    const categoryGroupsData =
      (await categoryGroupsRes.json()) as CategoriesResponse;
    const categoryVisibilityData =
      (await categoryVisibilityRes.json()) as CategoryVisibilitySettingsResponse;
    initialCategoryOptions = buildSupportedCategoryOptions(
      categoryGroupsData.groups ?? [],
      categoryVisibilityData.visibleCategoryIds,
    );
  }

  const effectiveSearchParams =
    !currentSeason && initialSeasonFilter
      ? {
          ...resolvedSearchParams,
          season: initialSeasonFilter,
        }
      : resolvedSearchParams;
  const data = await getItems(effectiveSearchParams);
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

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/items/disposed"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              手放したアイテム一覧
            </Link>

            <Link
              href="/items/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              アイテムを追加
            </Link>
          </div>
        </header>

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              現在、所持品のアイテムはありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              新しく登録するか、手放したアイテム一覧から所持品に戻すアイテムがないか確認してください。
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/items/disposed"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                手放したアイテム一覧を見る
              </Link>
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
            initialSeasonFilter={currentSeason ? "" : initialSeasonFilter}
            skinTonePreset={skinTonePreset}
            initialCategoryOptions={initialCategoryOptions}
          />
        )}
      </div>
    </main>
  );
}
