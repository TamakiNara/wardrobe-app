import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DeleteItemButton from "@/components/items/delete-item-button";
import ItemPreviewCard from "@/components/items/item-preview-card";
import { buildTopsSpecLabels, buildTopsSpecRaw } from "@/lib/master-data/item-tops";
import { findItemCategoryLabel, findItemShapeLabel } from "@/lib/master-data/item-shapes";
import type { ItemRecord } from "@/types/items";

async function getItem(id: string): Promise<ItemRecord> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/items/${id}`, {
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");
  if (!res.ok) redirect("/items");

  const data = await res.json();
  return data.item;
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);

  const mainColor = item.colors.find((c) => c.role === "main");
  const subColor = item.colors.find((c) => c.role === "sub");
  const topsSpec = buildTopsSpecLabels(item.spec?.tops);
  const topsSpecRaw = buildTopsSpecRaw(item.spec?.tops);
  const categoryLabel = findItemCategoryLabel(item.category);
  const shapeLabel = findItemShapeLabel(item.category, item.shape);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/items" className="hover:underline">
            アイテム一覧
          </Link>
          {" / "}
          <span className="text-gray-700">詳細</span>
        </nav>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="min-h-8 text-2xl font-bold text-gray-900">
              {item.name ?? "名称未設定"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
            季節: {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            TPO: {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
          </p>
        </div>
      </div>
    </main>
  );
}
