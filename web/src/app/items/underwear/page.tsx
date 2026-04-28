import Link from "next/link";
import { redirect } from "next/navigation";
import { ItemsPageHeader } from "@/components/items/items-page-header";
import { UnderwearIcon } from "@/components/shared/underwear-icon";
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
    availableBrands: string[];
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

async function getItems(
  searchParams: ItemsPageSearchParams,
): Promise<ItemsResponse> {
  const params = new URLSearchParams(buildQueryString(searchParams));
  params.set("storage", "underwear");
  const res = await fetchLaravelWithCookie(`/api/items?${params.toString()}`);

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
        availableBrands: [],
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
      availableBrands: data.meta?.availableBrands ?? [],
      availableSeasons: data.meta?.availableSeasons ?? [],
      availableTpos: data.meta?.availableTpos ?? [],
    },
  };
}

export default async function UnderwearItemsPage({
  searchParams,
}: {
  searchParams: Promise<ItemsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [preferencesRes, categoryGroupsRes, categoryVisibilityRes] =
    await Promise.all([
      fetchLaravelWithCookie("/api/settings/preferences"),
      fetchLaravelWithCookie("/api/categories"),
      fetchLaravelWithCookie("/api/settings/categories"),
    ]);

  if (preferencesRes.status === 401) {
    redirect("/login");
  }

  let skinTonePreset: SkinTonePreset = DEFAULT_SKIN_TONE_PRESET;
  let initialCategoryOptions: CategoryOption[] | undefined;
  let preferredSeasonFilter = "";

  if (preferencesRes.ok) {
    const preferencesData =
      (await preferencesRes.json()) as PreferencesResponse;
    skinTonePreset =
      preferencesData.preferences?.skinTonePreset ?? DEFAULT_SKIN_TONE_PRESET;
    preferredSeasonFilter = mapPreferenceSeasonToFilterValue(
      preferencesData.preferences?.currentSeason ?? null,
    );
  }

  if (categoryGroupsRes.ok && categoryVisibilityRes.ok) {
    const categoryGroupsData =
      (await categoryGroupsRes.json()) as CategoriesResponse;
    const categoryVisibilityData =
      (await categoryVisibilityRes.json()) as CategoryVisibilitySettingsResponse;
    initialCategoryOptions = buildSupportedCategoryOptions(
      categoryGroupsData.groups ?? [],
      categoryVisibilityData.visibleCategoryIds,
    ).filter((option) => option.value === "underwear");
  }

  const data = await getItems(resolvedSearchParams);
  const newUnderwearItemHref =
    "/items/new?category=underwear&returnTo=%2Fitems%2Funderwear";

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <ItemsPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "アイテム一覧", href: "/items" },
            { label: "アンダーウェア一覧" },
          ]}
          eyebrow="アンダーウェア管理"
          title="アンダーウェア一覧"
          description="通常のアイテム一覧とは分けて、見せない下着類をまとめて管理します。"
          actions={
            <>
              <Link
                href="/items/underwear/disposed"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                手放したアンダーウェア一覧
              </Link>
              <Link
                href="/items"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                アイテム一覧
              </Link>
              <Link
                href={newUnderwearItemHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <UnderwearIcon className="h-4 w-4 text-white" />
                アイテムを追加
              </Link>
            </>
          }
        />

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              アンダーウェアはまだありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              ブラやショーツなど、通常一覧に出したくない下着類をここで管理できます。
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/items/underwear/disposed"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                手放したアンダーウェア一覧
              </Link>
              <Link
                href="/items"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                アイテム一覧
              </Link>
              <Link
                href={newUnderwearItemHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <UnderwearIcon className="h-4 w-4 text-white" />
                アイテムを追加する
              </Link>
            </div>
          </section>
        ) : (
          <ItemsList
            items={data.items}
            totalCount={data.meta.total}
            totalAllCount={data.meta.totalAll}
            currentPage={data.meta.page}
            lastPage={data.meta.lastPage}
            availableCategoryValues={data.meta.availableCategories}
            availableBrands={data.meta.availableBrands}
            availableSeasons={data.meta.availableSeasons}
            availableTpos={data.meta.availableTpos}
            skinTonePreset={skinTonePreset}
            initialCategoryOptions={initialCategoryOptions}
            initialSeasonFilter={preferredSeasonFilter}
            storage="underwear"
          />
        )}
      </div>
    </main>
  );
}
