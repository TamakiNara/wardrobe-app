import Link from "next/link";
import { redirect } from "next/navigation";
import OutfitsList from "@/components/outfits/outfits-list";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import { mapPreferenceSeasonToFilterValue } from "@/lib/settings/preferences";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
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
    spec?: ItemSpec | null;
  };
};

type Outfit = {
  id: number;
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

type OutfitsPageSearchParams = Record<string, string | string[] | undefined>;

type OutfitsResponse = {
  outfits: Outfit[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
    availableTpos?: string[];
  };
};

type ItemCountResponse = {
  meta: {
    totalAll: number;
  };
};

type PreferencesResponse = {
  preferences?: {
    currentSeason?: "spring" | "summer" | "autumn" | "winter" | null;
    skinTonePreset?: SkinTonePreset | null;
  };
};

function buildQueryString(searchParams: OutfitsPageSearchParams): string {
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

function resolveCurrentSeason(searchParams: OutfitsPageSearchParams): string {
  const value = searchParams.season;

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

async function getOutfits(
  searchParams: OutfitsPageSearchParams,
): Promise<OutfitsResponse> {
  const query = buildQueryString(searchParams);
  const path = query ? `/api/outfits?${query}` : "/api/outfits";
  const res = await fetchLaravelWithCookie(path);

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    return {
      outfits: [],
      meta: {
        total: 0,
        totalAll: 0,
        page: 1,
        lastPage: 1,
      },
    };
  }

  const data = (await res.json()) as Partial<OutfitsResponse>;

  return {
    outfits: data.outfits ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
      availableTpos: data.meta?.availableTpos ?? [],
    },
  };
}

async function getItemCount(): Promise<number> {
  const res = await fetchLaravelWithCookie("/api/items");

  if (!res.ok) {
    return 0;
  }

  const data = (await res.json()) as Partial<ItemCountResponse>;
  return data.meta?.totalAll ?? 0;
}

export default async function OutfitsPage({
  searchParams,
}: {
  searchParams: Promise<OutfitsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentSeason = resolveCurrentSeason(resolvedSearchParams);
  let initialSeasonFilter = "";
  let skinTonePreset: SkinTonePreset = DEFAULT_SKIN_TONE_PRESET;

  const preferencesRes = await fetchLaravelWithCookie(
    "/api/settings/preferences",
  );

  if (preferencesRes.status === 401) {
    redirect("/login");
  }

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

  const effectiveSearchParams =
    !currentSeason && initialSeasonFilter
      ? {
          ...resolvedSearchParams,
          season: initialSeasonFilter,
        }
      : resolvedSearchParams;
  const data = await getOutfits(effectiveSearchParams);
  const itemCount = data.meta.totalAll === 0 ? await getItemCount() : 0;
  const outfits = data.outfits;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <span className="text-gray-700">コーディネート一覧</span>
        </nav>
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">コーディネート管理</p>
            <h1 className="text-2xl font-bold text-gray-900">
              コーディネート一覧
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              登録したアイテムを組み合わせてコーディネートを管理します。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/outfits/invalid"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              無効コーディネート一覧
            </Link>

            <Link
              href="/outfits/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              コーディネートを追加
            </Link>
          </div>
        </header>

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              まだコーディネートが登録されていません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {itemCount === 0
                ? "先にアイテムを登録して、組み合わせを作れる状態にしましょう。"
                : "手持ちのアイテムを組み合わせて作ってみましょう。"}
            </p>

            <div className="mt-6">
              <Link
                href={itemCount === 0 ? "/items/new" : "/outfits/new"}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {itemCount === 0
                  ? "アイテムを追加する"
                  : "コーディネートを作成する"}
              </Link>
            </div>
          </section>
        ) : (
          <OutfitsList
            outfits={outfits}
            totalCount={data.meta.total}
            totalAllCount={data.meta.totalAll}
            currentPage={data.meta.page}
            lastPage={data.meta.lastPage}
            availableTpos={data.meta.availableTpos ?? []}
            initialSeasonFilter={currentSeason ? "" : initialSeasonFilter}
            skinTonePreset={skinTonePreset}
          />
        )}
      </div>
    </main>
  );
}
