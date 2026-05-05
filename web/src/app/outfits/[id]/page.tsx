import Link from "next/link";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import DeleteOutfitButton from "@/components/outfits/delete-outfit-button";
import OutfitColorThumbnail from "@/components/outfits/outfit-color-thumbnail";
import OutfitDuplicateAction from "@/components/outfits/outfit-duplicate-action";
import OutfitRestoreAction from "@/components/outfits/outfit-restore-action";
import { EntityDetailHeader } from "@/components/shared/entity-detail-header";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import { DEFAULT_SKIN_TONE_PRESET } from "@/lib/master-data/skin-tone-presets";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemFormColor, ItemSpec } from "@/types/items";
import type { SkinTonePreset } from "@/types/settings";

export const metadata = buildPageMetadata("コーディネート詳細");

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
    id: number;
    name: string | null;
    category: string;
    shape: string;
    colors: ItemFormColor[];
    spec?: ItemSpec | null;
    status: "active" | "disposed";
    seasons: string[];
    tpos: string[];
  };
};

type Outfit = {
  id: number;
  status: "active" | "invalid";
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

async function getOutfit(id: string): Promise<Outfit> {
  const res = await fetchLaravelWithCookie(`/api/outfits/${id}`);

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    redirect("/outfits");
  }

  const data = await res.json();
  return data.outfit;
}

async function getSkinTonePreset(): Promise<SkinTonePreset> {
  const res = await fetchLaravelWithCookie("/api/settings/preferences");

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    return DEFAULT_SKIN_TONE_PRESET;
  }

  const data = await res.json().catch(() => null);
  return data?.preferences?.skinTonePreset ?? DEFAULT_SKIN_TONE_PRESET;
}

async function getCategoryVisibilitySettings(): Promise<string[] | null> {
  const res = await fetchLaravelWithCookie("/api/settings/categories");

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => null);
  return data?.visibleCategoryIds ?? null;
}

function resolveOutfitItemColorLabel(color?: ItemFormColor) {
  const trimmedCustomLabel = color?.custom_label?.trim();
  const trimmedLabel = color?.label?.trim();

  return trimmedCustomLabel || trimmedLabel || "カスタムカラー";
}

export default async function OutfitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [outfit, visibleCategoryIds, skinTonePreset] = await Promise.all([
    getOutfit(id),
    getCategoryVisibilitySettings(),
    getSkinTonePreset(),
  ]);
  const outfitItems = outfit.outfitItems ?? outfit.outfit_items ?? [];
  const canRestore =
    outfit.status === "invalid" &&
    outfitItems.every((outfitItem) => outfitItem.item.status === "active");
  const visibleOutfitItems =
    visibleCategoryIds === null
      ? outfitItems
      : outfitItems.filter((outfitItem) =>
          isItemVisibleByCategorySettings(outfitItem.item, visibleCategoryIds),
        );
  const hiddenOutfitItemCount = outfitItems.length - visibleOutfitItems.length;
  const wearLogIdParam =
    typeof resolvedSearchParams.wear_log_id === "string"
      ? resolvedSearchParams.wear_log_id
      : null;
  const fromWearLog =
    resolvedSearchParams.from === "wear-log" && wearLogIdParam !== null;
  const returnToParam =
    typeof resolvedSearchParams.return_to === "string"
      ? resolvedSearchParams.return_to
      : null;
  const returnLabelParam =
    typeof resolvedSearchParams.return_label === "string"
      ? resolvedSearchParams.return_label
      : null;
  const backHref = returnToParam
    ? returnToParam
    : fromWearLog && wearLogIdParam
      ? `/wear-logs/${wearLogIdParam}`
      : "/outfits";
  const backLabel = returnToParam
    ? `${returnLabelParam ?? "戻る"}へ戻る`
    : fromWearLog && wearLogIdParam
      ? "着用履歴詳細へ戻る"
      : "一覧に戻る";

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <EntityDetailHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            ...(returnToParam
              ? [
                  {
                    label: returnLabelParam ?? "戻る",
                    href: returnToParam,
                  },
                ]
              : []),
            ...(fromWearLog && wearLogIdParam
              ? [
                  {
                    label: "着用履歴詳細",
                    href: `/wear-logs/${wearLogIdParam}`,
                  },
                ]
              : []),
            { label: "コーディネート一覧", href: "/outfits" },
            { label: "詳細" },
          ]}
          eyebrow="コーディネート管理"
          title={outfit.name ?? "名称未設定"}
          details={
            outfit.status === "invalid" ? (
              <div className="flex flex-wrap gap-2">
                <p className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                  無効
                </p>
              </div>
            ) : null
          }
          actions={
            <>
              <Link
                href={backHref}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {backLabel}
              </Link>
              {outfit.status !== "invalid" && (
                <OutfitDuplicateAction
                  outfitId={outfit.id}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                />
              )}
              <Link
                href={`/outfits/${outfit.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                編集
              </Link>
              <DeleteOutfitButton outfitId={outfit.id} />
            </>
          }
        />

        {outfit.status === "invalid" && (
          <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  無効の理由
                </h2>
                <p className="text-sm text-amber-800">
                  現在利用できないアイテムを含むため、通常一覧とは分けて保持しています。
                </p>
                <p className="text-sm text-gray-600">
                  再利用する場合は複製して新しく作成してください。
                </p>
                <p className="text-sm text-gray-600">
                  復旧できる条件が揃っている場合のみ、有効に戻せます。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <OutfitDuplicateAction outfitId={outfit.id} />
                <OutfitRestoreAction
                  outfitId={outfit.id}
                  canRestore={canRestore}
                />
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {visibleOutfitItems.length > 0 ? (
              <OutfitColorThumbnail
                outfitItems={visibleOutfitItems}
                skinTonePreset={skinTonePreset}
                size="large"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              {outfit.memo && (
                <div className="mb-4">
                  <p className="mb-1 text-sm font-medium text-gray-700">メモ</p>
                  <p className="text-sm text-gray-600">{outfit.memo}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  季節：{" "}
                  {outfit.seasons?.length
                    ? outfit.seasons.join(" / ")
                    : "未設定"}
                </p>
                <p className="text-sm text-gray-600">
                  TPO：{" "}
                  {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            使用アイテム
          </h2>

          {outfitItems.length === 0 ? (
            <p className="text-sm text-gray-600">
              アイテムが登録されていません。
            </p>
          ) : visibleOutfitItems.length === 0 ? (
            <div className="space-y-3">
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                現在の表示設定では、表示中のアイテムがありません。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenOutfitItemCount > 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  現在の表示設定により {hiddenOutfitItemCount}{" "}
                  件を非表示にしています。
                </p>
              )}
              {visibleOutfitItems.map((outfitItem, index) => {
                const item = outfitItem.item;
                const mainColor = item.colors.find((c) => c.role === "main");
                const subColor = item.colors.find((c) => c.role === "sub");
                const mainColorLabel = resolveOutfitItemColorLabel(mainColor);
                const subColorLabel = resolveOutfitItemColorLabel(subColor);

                return (
                  <article
                    key={outfitItem.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <p className="text-sm text-gray-500">{index + 1}番目</p>

                    <div className="mt-1 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {item.name || "名称未設定"}
                          </h3>
                          {item.status === "disposed" && (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                              手放し済み
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.category} / {item.shape}
                        </p>
                      </div>

                      <Link
                        href={`/items/${item.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        アイテム詳細
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {mainColor && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: mainColor.hex }}
                          />
                          {mainColorLabel}
                        </span>
                      )}
                      {subColor && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: subColor.hex }}
                          />
                          {subColorLabel}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
