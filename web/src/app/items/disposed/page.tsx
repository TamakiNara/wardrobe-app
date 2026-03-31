import Link from "next/link";
import { redirect } from "next/navigation";
import ItemThumbnailPreview from "@/components/items/item-thumbnail-preview";
import { ItemsPageHeader } from "@/components/items/items-page-header";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import { ITEM_CARE_STATUS_LABELS } from "@/lib/items/metadata";
import {
  findItemCategoryLabel,
  findItemShapeLabel,
} from "@/lib/master-data/item-shapes";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemRecord } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

type DisposedItemsPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

type DisposedItemsResponse = {
  items: ItemRecord[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
  };
};

function buildQueryString(searchParams: DisposedItemsPageSearchParams): string {
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

async function getDisposedItems(
  searchParams: DisposedItemsPageSearchParams,
): Promise<DisposedItemsResponse> {
  const query = buildQueryString(searchParams);
  const path = query ? `/api/items/disposed?${query}` : "/api/items/disposed";
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
      },
    };
  }

  const data = (await res.json()) as Partial<DisposedItemsResponse>;

  return {
    items: data.items ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
    },
  };
}

async function getSkinTonePreset(): Promise<SkinTonePreset> {
  const res = await fetchLaravelWithCookie("/api/settings/preferences");

  if (res.status === 401) redirect("/login");
  if (!res.ok) return DEFAULT_SKIN_TONE_PRESET;

  const data = (await res.json()) as {
    preferences?: { skinTonePreset?: SkinTonePreset | null };
  };
  return data.preferences?.skinTonePreset ?? DEFAULT_SKIN_TONE_PRESET;
}

function buildPageHref(page: number): string {
  return page <= 1 ? "/items/disposed" : `/items/disposed?page=${page}`;
}

export default async function DisposedItemsPage({
  searchParams,
}: {
  searchParams: Promise<DisposedItemsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [data, skinTonePreset] = await Promise.all([
    getDisposedItems(resolvedSearchParams),
    getSkinTonePreset(),
  ]);
  const currentPage = data.meta.page;
  const lastPage = data.meta.lastPage;
  const returnTo = buildPageHref(currentPage);
  const returnLabel = "手放したアイテム一覧";

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <ItemsPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "アイテム一覧", href: "/items" },
            { label: "手放したアイテム一覧" },
          ]}
          eyebrow="アイテム管理"
          title="手放したアイテム一覧"
          description="通常一覧とは分けて管理し、必要に応じて所持品に戻せます。"
          actions={
            <Link
              href="/items"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              アイテム一覧に戻る
            </Link>
          }
        />

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              手放したアイテムはまだありません。
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              現在、確認や復帰判断が必要な手放し済みアイテムはありません。
            </p>
            <div className="mt-6">
              <Link
                href="/items"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                アイテム一覧に戻る
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">
                表示件数: {data.items.length} / {data.meta.total}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.items.map((item) => {
                const mainColor = item.colors.find((c) => c.role === "main");
                const subColor = item.colors.find((c) => c.role === "sub");
                const categoryLabel = findItemCategoryLabel(item.category);
                const shapeLabel = findItemShapeLabel(
                  item.category,
                  item.shape,
                );
                const detailQuery = new URLSearchParams({
                  return_to: returnTo,
                  return_label: returnLabel,
                });

                return (
                  <Link
                    href={`/items/${item.id}?${detailQuery.toString()}`}
                    key={item.id}
                  >
                    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <ItemThumbnailPreview
                          category={item.category}
                          shape={item.shape}
                          mainColorHex={mainColor?.hex}
                          subColorHex={subColor?.hex}
                          spec={item.spec}
                          images={item.images}
                          skinTonePreset={skinTonePreset}
                          size="small"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900">
                              {item.name || "名称未設定"}
                            </h2>
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                              手放し済み
                            </span>
                            {item.care_status ? (
                              <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                                {ITEM_CARE_STATUS_LABELS[item.care_status]}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            {categoryLabel} / {shapeLabel}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {mainColor ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                                <span
                                  className="h-4 w-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: mainColor.hex }}
                                />
                                {mainColor.label}
                              </span>
                            ) : null}
                            {subColor ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
                                <span
                                  className="h-4 w-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: subColor.hex }}
                                />
                                {subColor.label}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-4 text-sm text-gray-600">
                            季節:{" "}
                            {item.seasons?.length
                              ? item.seasons.join(" / ")
                              : "未設定"}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            TPO:{" "}
                            {item.tpos?.length
                              ? item.tpos.join(" / ")
                              : "未設定"}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  前へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400">
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
                  href={buildPageHref(currentPage + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  次へ
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400">
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
