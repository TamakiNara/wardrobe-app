import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteItemButton from "@/components/items/delete-item-button";
import ItemCareStatusAction from "@/components/items/item-care-status-action";
import ItemStatusAction from "@/components/items/item-status-action";
import ItemPreviewCard from "@/components/items/item-preview-card";
import { formatItemPrice, ITEM_CARE_STATUS_LABELS, ITEM_SIZE_GENDER_LABELS } from "@/lib/items/metadata";
import { findBottomsLengthLabel, findLegwearCoverageLabel } from "@/lib/master-data/item-skin-exposure";
import { buildTopsSpecLabels, buildTopsSpecRaw } from "@/lib/master-data/item-tops";
import { findItemCategoryLabel, findItemShapeLabel } from "@/lib/master-data/item-shapes";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";
import type { ItemRecord } from "@/types/items";

async function getItem(id: string): Promise<ItemRecord> {
  const res = await fetchLaravelWithCookie(`/api/items/${id}`);

  if (res.status === 401) redirect("/login");
  if (!res.ok) redirect("/items");

  const data = await res.json();
  return data.item;
}

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const item = await getItem(id);
  const returnToParam = typeof resolvedSearchParams.return_to === "string"
    ? resolvedSearchParams.return_to
    : null;
  const returnLabelParam = typeof resolvedSearchParams.return_label === "string"
    ? resolvedSearchParams.return_label
    : null;

  const mainColor = item.colors.find((c) => c.role === "main");
  const subColor = item.colors.find((c) => c.role === "sub");
  const topsSpec = buildTopsSpecLabels(item.spec?.tops);
  const topsSpecRaw = buildTopsSpecRaw(item.spec?.tops);
  const bottomsLengthLabel = findBottomsLengthLabel(item.spec?.bottoms?.length_type);
  const legwearCoverageLabel = findLegwearCoverageLabel(item.spec?.legwear?.coverage_type);
  const categoryLabel = findItemCategoryLabel(item.category);
  const shapeLabel = findItemShapeLabel(item.category, item.shape);
  const itemImages = item.images ?? [];

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {returnToParam ? (
            <>
              {" / "}
              <Link href={returnToParam} className="hover:underline">
                {returnLabelParam ?? "戻る"}
              </Link>
            </>
          ) : null}
          {" / "}
          <Link href="/items" className="hover:underline">
            アイテム一覧
          </Link>
          {" / "}
          <span className="text-gray-700">詳細</span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="min-h-8 text-2xl font-bold text-gray-900">
              {item.name ?? "名称未設定"}
            </h1>
            {(item.status === "disposed" || item.care_status) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.status === "disposed" && (
                  <p className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                    手放し済み
                  </p>
                )}
                {item.care_status && (
                  <p className="inline-flex rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                    {ITEM_CARE_STATUS_LABELS[item.care_status]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {returnToParam ? (
              <Link
                href={returnToParam}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {returnLabelParam ?? "戻る"}へ戻る
              </Link>
            ) : null}
            <ItemCareStatusAction itemId={item.id} careStatus={item.care_status} />
            <ItemStatusAction itemId={item.id} status={item.status} />

            <Link
              href={`/items/${item.id}/edit`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              編集
            </Link>

            <Link
              href="/items"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              一覧に戻る
            </Link>

            <DeleteItemButton itemId={item.id} />
          </div>
        </div>

        <ItemPreviewCard
          name={item.name ?? ""}
          category={item.category}
          shape={item.shape}
          mainColorHex={mainColor?.hex}
          mainColorLabel={mainColor?.label}
          subColorHex={subColor?.hex}
          subColorLabel={subColor?.label}
          topsSpec={topsSpec}
          topsSpecRaw={topsSpecRaw}
          spec={item.spec}
          images={item.images}
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            {categoryLabel} / {shapeLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {mainColor && (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm">
                <span
                  className="h-4 w-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: mainColor.hex }}
                />
                {mainColor.label}
              </span>
            )}
            {subColor && (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm">
                <span
                  className="h-4 w-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: subColor.hex }}
                />
                {subColor.label}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600">
            季節： {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            TPO： {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
          </p>
          {bottomsLengthLabel ? (
            <p className="mt-1 text-sm text-gray-600">
              ボトムス丈： {bottomsLengthLabel}
            </p>
          ) : null}
          {legwearCoverageLabel ? (
            <p className="mt-1 text-sm text-gray-600">
              レッグウェア： {legwearCoverageLabel}
            </p>
          ) : null}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">画像</h2>
          {itemImages.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {itemImages.map((image) => (
                <article key={image.id ?? `${image.path}-${image.sort_order}`} className="overflow-hidden rounded-xl border border-gray-200">
                  {image.url ? (
                    <div className="flex aspect-[3/4] items-center justify-center bg-gray-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.original_filename ?? "item image"} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-sm text-gray-400">
                      画像なし
                    </div>
                  )}
                  <div className="p-3 text-sm text-gray-600">
                    {image.sort_order}枚目{image.is_primary ? " / 代表画像" : ""}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">画像はまだありません。</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">購入・サイズ情報</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700">ブランド名</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.brand_name ?? "未設定"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">実購入価格</dt>
              <dd className="mt-1 text-sm text-gray-600">{formatItemPrice(item.price ?? null)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">ケア状態</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.care_status ? ITEM_CARE_STATUS_LABELS[item.care_status] : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">購入 URL</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {item.purchase_url ? (
                  <a href={item.purchase_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    開く
                  </a>
                ) : (
                  "未設定"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">購入日</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.purchased_at ? item.purchased_at.slice(0, 10) : "未設定"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ区分</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.size_gender ? (ITEM_SIZE_GENDER_LABELS[item.size_gender] ?? "未設定") : "未設定"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ表記</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.size_label ?? "未設定"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">サイズ補足</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.size_note ?? "未設定"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">雨対応</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.is_rain_ok ? "対応" : "未対応"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-700">実寸メモ</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.size_details?.note ?? "未設定"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-700">メモ</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{item.memo ?? "未設定"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
