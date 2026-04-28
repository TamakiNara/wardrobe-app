import Link from "next/link";
import { redirect } from "next/navigation";
import PurchaseCandidateListCard from "@/components/purchase-candidates/purchase-candidate-list-card";
import PurchaseCandidateListFilters from "@/components/purchase-candidates/purchase-candidate-list-filters";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import { UnderwearIcon } from "@/components/shared/underwear-icon";
import { buildSupportedCategoryOptions } from "@/lib/api/categories";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { CategoriesResponse, CategoryOption } from "@/types/categories";
import type {
  PurchaseCandidateListEntry,
  PurchaseCandidateListItem,
  PurchaseCandidatesResponse,
} from "@/types/purchase-candidates";
import type { UserBrandRecord } from "@/types/settings";

type PurchaseCandidatesPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

type CategoryVisibilitySettingsResponse = {
  visibleCategoryIds?: string[];
};

function buildQueryString(
  searchParams: PurchaseCandidatesPageSearchParams,
): string {
  const params = new URLSearchParams();
  const category = readSearchParam(searchParams, "category");

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "message" || (key === "subcategory" && !category)) {
      continue;
    }

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

function readSearchParam(
  searchParams: PurchaseCandidatesPageSearchParams,
  key: string,
): string {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function buildPageHref(
  searchParams: PurchaseCandidatesPageSearchParams,
  page: number,
): string {
  const query = buildQueryString({
    ...searchParams,
    page: page <= 1 ? undefined : String(page),
  });

  return query
    ? `/purchase-candidates/underwear?${query}`
    : "/purchase-candidates/underwear";
}

async function getPurchaseCandidates(
  searchParams: PurchaseCandidatesPageSearchParams,
): Promise<PurchaseCandidatesResponse> {
  const params = new URLSearchParams(buildQueryString(searchParams));
  params.set("storage", "underwear");
  const response = await fetchLaravelWithCookie(
    `/api/purchase-candidates?${params.toString()}`,
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      purchaseCandidateEntries: [],
      availableBrands: [],
      meta: {
        total: 0,
        totalAll: 0,
        page: 1,
        lastPage: 1,
      },
    };
  }

  const data = (await response.json()) as Partial<PurchaseCandidatesResponse>;
  const fallbackEntries = (data.purchaseCandidates ?? []).map(
    (candidate): PurchaseCandidateListEntry => ({
      type: "single",
      candidate,
    }),
  );
  const currentPage = data.meta?.current_page ?? data.meta?.page ?? 1;

  return {
    purchaseCandidateEntries: data.purchaseCandidateEntries ?? fallbackEntries,
    availableBrands: data.availableBrands ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      per_page: data.meta?.per_page,
      current_page: currentPage,
      page: currentPage,
      lastPage: data.meta?.lastPage ?? 1,
    },
  };
}

async function getCategoryOptions(): Promise<CategoryOption[]> {
  const [categoriesResponse, visibilityResponse] = await Promise.all([
    fetchLaravelWithCookie("/api/categories"),
    fetchLaravelWithCookie("/api/settings/categories"),
  ]);

  if (categoriesResponse.status === 401 || visibilityResponse.status === 401) {
    redirect("/login");
  }

  if (!categoriesResponse.ok) {
    return [];
  }

  const categoriesData =
    (await categoriesResponse.json()) as Partial<CategoriesResponse>;
  const visibilityData = visibilityResponse.ok
    ? ((await visibilityResponse.json()) as CategoryVisibilitySettingsResponse)
    : {};

  return buildSupportedCategoryOptions(
    categoriesData.groups ?? [],
    visibilityData.visibleCategoryIds,
  ).filter((option) => option.value === "underwear");
}

async function getBrandOptions(): Promise<UserBrandRecord[]> {
  const response = await fetchLaravelWithCookie(
    "/api/settings/brands?active_only=1",
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    brands?: UserBrandRecord[];
  };

  return (data.brands ?? [])
    .filter((brand) => brand.is_active)
    .sort((a, b) => a.name.localeCompare(b.name, "ja-JP"));
}

function mergePurchaseCandidateBrandOptions(
  brandOptions: UserBrandRecord[],
  availableBrands: string[],
): UserBrandRecord[] {
  const mergedByName = new Map<string, UserBrandRecord>();

  for (const brand of brandOptions) {
    const normalizedName = brand.name.trim();
    if (normalizedName === "") {
      continue;
    }

    mergedByName.set(normalizedName, {
      ...brand,
      name: normalizedName,
    });
  }

  for (const [index, brandName] of availableBrands.entries()) {
    const normalizedName = brandName.trim();
    if (normalizedName === "" || mergedByName.has(normalizedName)) {
      continue;
    }

    mergedByName.set(normalizedName, {
      id: -(index + 1),
      name: normalizedName,
      kana: null,
      is_active: true,
      updated_at: "",
    });
  }

  return Array.from(mergedByName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ja-JP"),
  );
}

type PurchaseCandidateListGroup = {
  key: string;
  candidates: PurchaseCandidateListItem[];
};

function buildPurchaseCandidateListGroups(
  entries: PurchaseCandidateListEntry[],
): PurchaseCandidateListGroup[] {
  return entries.map((entry) => {
    if (entry.type === "group") {
      return {
        key: `group-${entry.group_id}`,
        candidates: entry.candidates,
      };
    }

    return {
      key: `candidate-${entry.candidate.id}`,
      candidates: [entry.candidate],
    };
  });
}

export default async function UnderwearPurchaseCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<PurchaseCandidatesPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [data, categoryOptions, brandOptions] = await Promise.all([
    getPurchaseCandidates(resolvedSearchParams),
    getCategoryOptions(),
    getBrandOptions(),
  ]);
  const mergedBrandOptions = mergePurchaseCandidateBrandOptions(
    brandOptions,
    data.availableBrands ?? [],
  );
  const flashMessage =
    resolvedSearchParams.message === "deleted"
      ? "購入検討を削除しました。"
      : null;
  const currentPage = data.meta.page;
  const lastPage = data.meta.lastPage;
  const keyword = readSearchParam(resolvedSearchParams, "keyword");
  const status = readSearchParam(resolvedSearchParams, "status");
  const priority = readSearchParam(resolvedSearchParams, "priority");
  const category = readSearchParam(resolvedSearchParams, "category");
  const brand = readSearchParam(resolvedSearchParams, "brand");
  const sort = readSearchParam(resolvedSearchParams, "sort");
  const subcategory = readSearchParam(resolvedSearchParams, "subcategory");
  const purchaseCandidateGroups = buildPurchaseCandidateListGroups(
    data.purchaseCandidateEntries,
  );
  const shouldShowFilteredEmptyState =
    data.meta.totalAll > 0 && purchaseCandidateGroups.length === 0;
  const detailQueryString = new URLSearchParams({
    return_to: "/purchase-candidates/underwear",
    return_label: "アンダーウェア購入検討一覧",
  }).toString();

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧", href: "/purchase-candidates" },
            { label: "アンダーウェア購入検討一覧" },
          ]}
          eyebrow="購入検討管理"
          title="アンダーウェア購入検討一覧"
          description="通常の購入検討一覧とは分けて、下着類の購入検討だけをまとめて管理します。"
          actions={
            <>
              <Link
                href="/purchase-candidates"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                購入検討一覧
              </Link>
              <Link
                href="/purchase-candidates/new?category=underwear&returnTo=%2Fpurchase-candidates%2Funderwear"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <UnderwearIcon className="h-4 w-4 text-white" />
                購入検討を追加
              </Link>
            </>
          }
        />

        {flashMessage && (
          <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {flashMessage}
          </section>
        )}

        {data.meta.totalAll > 0 && (
          <PurchaseCandidateListFilters
            keyword={keyword}
            status={status}
            priority={priority}
            category={category}
            subcategory={subcategory}
            brand={brand}
            sort={sort}
            itemCount={purchaseCandidateGroups.length}
            totalCount={data.meta.total}
            categoryOptions={categoryOptions}
            brandOptions={mergedBrandOptions}
          />
        )}

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              アンダーウェアの購入検討がまだありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              ブラやショーツなど、通常一覧に並べたくない購入検討をここで管理できます。
            </p>
          </section>
        ) : shouldShowFilteredEmptyState ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              条件に一致する購入検討がありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              条件を変えて試してください。
            </p>
          </section>
        ) : (
          <>
            <section
              data-testid="purchase-candidate-card-grid"
              className="grid gap-4 lg:grid-cols-2"
            >
              {purchaseCandidateGroups.map((group) => (
                <PurchaseCandidateListCard
                  key={group.key}
                  candidates={group.candidates}
                  detailQueryString={detailQueryString}
                />
              ))}
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, currentPage - 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  前へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400">
                  前へ
                </span>
              )}

              <p className="text-sm text-gray-600">
                {currentPage} / {lastPage}ページ
                <span className="ml-2 text-gray-400">
                  （全{data.meta.total}件）
                </span>
              </p>

              {currentPage < lastPage ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, currentPage + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  次へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400">
                  次へ
                </span>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
