import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import PurchaseCandidateBrandFilterField from "@/components/purchase-candidates/purchase-candidate-brand-filter-field";
import { IndexPageHeader } from "@/components/shared/index-page-header";
import {
  PURCHASE_CANDIDATE_PRIORITY_LABELS,
  PURCHASE_CANDIDATE_STATUS_LABELS,
} from "@/lib/purchase-candidates/labels";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { CategoriesResponse } from "@/types/categories";
import type { PurchaseCandidatesResponse } from "@/types/purchase-candidates";
import type { UserBrandRecord } from "@/types/settings";

type PurchaseCandidatesPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

function buildQueryString(
  searchParams: PurchaseCandidatesPageSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "message") {
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

  return query ? `/purchase-candidates?${query}` : "/purchase-candidates";
}

type PurchaseCandidateFilterKey =
  | "keyword"
  | "status"
  | "priority"
  | "category"
  | "brand"
  | "sort";

function buildFilterHref(
  searchParams: PurchaseCandidatesPageSearchParams,
  updates: Partial<
    Record<PurchaseCandidateFilterKey | "subcategory", string | undefined>
  >,
): string {
  const query = buildQueryString({
    ...searchParams,
    ...updates,
    message: undefined,
    page: undefined,
  });

  return query ? `/purchase-candidates?${query}` : "/purchase-candidates";
}

function buildClearFilterHref(
  searchParams: PurchaseCandidatesPageSearchParams,
  key: PurchaseCandidateFilterKey,
): string {
  return buildFilterHref(searchParams, {
    [key]: undefined,
    ...(key === "category" ? { subcategory: undefined } : {}),
  });
}

function FilterFieldHeader({
  htmlFor,
  label,
  isActive,
  clearHref,
}: {
  htmlFor: string;
  label: string;
  isActive: boolean;
  clearHref: string;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {isActive ? (
        <Link
          href={clearHref}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          解除
        </Link>
      ) : null}
    </div>
  );
}

async function getPurchaseCandidates(
  searchParams: PurchaseCandidatesPageSearchParams,
): Promise<PurchaseCandidatesResponse> {
  const query = buildQueryString(searchParams);
  const endpoint = query
    ? `/api/purchase-candidates?${query}`
    : "/api/purchase-candidates";
  const response = await fetchLaravelWithCookie(endpoint);

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      purchaseCandidates: [],
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

  return {
    purchaseCandidates: data.purchaseCandidates ?? [],
    availableBrands: data.availableBrands ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
    },
  };
}

async function getCategoryOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const response = await fetchLaravelWithCookie("/api/categories");

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as Partial<CategoriesResponse>;

  return (data.groups ?? [])
    .flatMap((group) =>
      (group.categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder ?? 0,
        groupSortOrder: group.sortOrder ?? 0,
      })),
    )
    .sort((a, b) => {
      if (a.groupSortOrder !== b.groupSortOrder) {
        return a.groupSortOrder - b.groupSortOrder;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ja-JP");
    })
    .map(({ id, name }) => ({ id, name }));
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

export function mergePurchaseCandidateBrandOptions(
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

function formatPrice(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return `${price.toLocaleString("ja-JP")}円`;
}

function formatPriceNumber(price: number | null): string {
  if (price === null) {
    return "未設定";
  }

  return price.toLocaleString("ja-JP");
}

export default async function PurchaseCandidatesPage({
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
  const hasActiveFilters = Boolean(
    keyword || status || priority || category || brand || sort,
  );
  const shouldShowFilteredEmptyState =
    data.meta.totalAll > 0 && data.purchaseCandidates.length === 0;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <IndexPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "購入検討一覧" },
          ]}
          eyebrow="購入検討管理"
          title="購入検討一覧"
          description="検討中・保留中・購入済み・見送りの候補をまとめて確認します。"
          actions={
            <Link
              href="/purchase-candidates/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              購入検討を追加
            </Link>
          }
        />

        {flashMessage && (
          <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {flashMessage}
          </section>
        )}

        {data.meta.totalAll > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <form className="space-y-4" method="get">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <FilterFieldHeader
                    htmlFor="keyword"
                    label="キーワード"
                    isActive={keyword !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "keyword",
                    )}
                  />
                  <input
                    id="keyword"
                    name="keyword"
                    type="search"
                    defaultValue={keyword}
                    placeholder="名前・ブランド・メモで検索"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <FilterFieldHeader
                    htmlFor="status"
                    label="状態"
                    isActive={status !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "status",
                    )}
                  />
                  <select
                    id="status"
                    name="status"
                    defaultValue={status}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">すべて</option>
                    {Object.entries(PURCHASE_CANDIDATE_STATUS_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <FilterFieldHeader
                    htmlFor="priority"
                    label="優先度"
                    isActive={priority !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "priority",
                    )}
                  />
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={priority}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">すべて</option>
                    {Object.entries(PURCHASE_CANDIDATE_PRIORITY_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <FilterFieldHeader
                    htmlFor="category"
                    label="カテゴリ"
                    isActive={category !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "category",
                    )}
                  />
                  <select
                    id="category"
                    name="category"
                    defaultValue={category}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">すべて</option>
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FilterFieldHeader
                    htmlFor="brand"
                    label="ブランド"
                    isActive={brand !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "brand",
                    )}
                  />
                  <PurchaseCandidateBrandFilterField
                    key={`purchase-candidate-brand-filter:${brand}`}
                    inputId="brand"
                    name="brand"
                    defaultValue={brand}
                    brands={mergedBrandOptions}
                  />
                </div>

                <div>
                  <FilterFieldHeader
                    htmlFor="sort"
                    label="並び順"
                    isActive={sort !== ""}
                    clearHref={buildClearFilterHref(
                      resolvedSearchParams,
                      "sort",
                    )}
                  />
                  <select
                    id="sort"
                    name="sort"
                    defaultValue={sort}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">更新順</option>
                    <option value="name_asc">名前順</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  表示件数: {data.purchaseCandidates.length} / {data.meta.total}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {hasActiveFilters ? (
                    <Link
                      href="/purchase-candidates"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      条件をクリア
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">
                      条件をクリア
                    </span>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    絞り込む
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              購入検討がまだありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              気になるアイテムを候補として登録して比較や item
              化の準備を進めましょう。
            </p>
          </section>
        ) : shouldShowFilteredEmptyState ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              条件に一致する購入検討がありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              条件を変えてお試しください。
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {data.purchaseCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <Link
                    href={`/purchase-candidates/${candidate.id}`}
                    className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                  >
                    <div className="flex aspect-[2/3] items-center justify-center bg-gray-50 p-1 transition hover:bg-gray-100">
                      {candidate.primary_image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={candidate.primary_image.url}
                          alt={candidate.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-3 text-center">
                          <p className="text-sm font-medium text-gray-500">
                            画像なし
                          </p>
                          <p className="mt-2 text-xs font-medium text-gray-600">
                            {candidate.category_name ?? "カテゴリ未設定"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {candidate.brand_name || "ブランド未設定"}
                          </p>
                          {candidate.colors.length > 0 && (
                            <div className="mt-3 flex items-center gap-1">
                              {candidate.colors.map((color, index) => (
                                <span
                                  key={`${candidate.id}-empty-color-${index}`}
                                  className="h-2.5 w-2.5 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                  title={color.label}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {PURCHASE_CANDIDATE_STATUS_LABELS[candidate.status]}
                      </span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        優先度:{" "}
                        {PURCHASE_CANDIDATE_PRIORITY_LABELS[candidate.priority]}
                      </span>
                      {candidate.converted_item_id !== null && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          アイテム化済み
                        </span>
                      )}
                      {candidate.colors.length > 0 && (
                        <div className="ml-auto flex items-center gap-1">
                          {candidate.colors.map((color, index) => (
                            <span
                              key={`${candidate.id}-color-${index}`}
                              className="h-2.5 w-2.5 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/purchase-candidates/${candidate.id}`}
                      className="block rounded-lg outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <h2 className="text-[15px] font-semibold leading-6 text-gray-900">
                        {candidate.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {candidate.category_name ?? candidate.category_id}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {candidate.brand_name || "ブランド未設定"}
                      </p>
                    </Link>

                    <section className="flex min-h-[92px] flex-col justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        {candidate.sale_price !== null ? (
                          <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                            セール中
                          </span>
                        ) : (
                          <span
                            className="inline-flex h-6"
                            aria-hidden="true"
                          />
                        )}
                        <div className="space-y-1 text-right">
                          <p className="text-[11px] font-medium tracking-wide text-gray-500">
                            価格
                          </p>
                          <div className="flex items-end justify-end gap-1">
                            <span
                              className={`text-lg font-semibold leading-none ${
                                candidate.sale_price !== null
                                  ? "text-rose-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {formatPriceNumber(
                                candidate.sale_price ?? candidate.price,
                              )}
                            </span>
                            <span
                              className={`text-xs leading-5 ${
                                candidate.sale_price !== null
                                  ? "text-rose-700"
                                  : "text-gray-500"
                              }`}
                            >
                              円
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-gray-200 pt-2 text-xs text-gray-500">
                        {candidate.sale_price !== null ? (
                          <div className="flex items-center justify-between gap-3">
                            <span>通常価格</span>
                            <span>{formatPrice(candidate.price)}</span>
                          </div>
                        ) : (
                          <div className="h-[18px]" aria-hidden="true" />
                        )}
                        {candidate.sale_ends_at !== null ? (
                          <div className="flex items-center justify-between gap-3">
                            <span>セール終了予定</span>
                            <span>
                              {new Intl.DateTimeFormat("ja-JP", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(candidate.sale_ends_at))}
                            </span>
                          </div>
                        ) : (
                          <div className="h-[18px]" aria-hidden="true" />
                        )}
                      </div>
                    </section>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
                      <Link
                        href={`/purchase-candidates/${candidate.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        詳細を見る
                      </Link>
                      {candidate.purchase_url ? (
                        <a
                          href={candidate.purchase_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
                        >
                          商品ページ
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </article>
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
