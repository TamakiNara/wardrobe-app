import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DeleteItemButton from "@/components/items/delete-item-button";
import ItemPreviewCard from "@/components/items/item-preview-card";
import {
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_SHAPES,
  TOPS_SLEEVES,
} from "@/lib/master-data/item-tops";
import type { ItemRecord } from "@/types/items";

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value?: string | null,
) {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}

function buildTopsSpecLabels(item: ItemRecord) {
  const tops = item.spec?.tops;

  if (!tops) return null;

  return {
    shape: findLabel(TOPS_SHAPES, tops.shape),
    sleeve: findLabel(TOPS_SLEEVES, tops.sleeve),
    length: findLabel(TOPS_LENGTHS, tops.length),
    neck: findLabel(TOPS_NECKS, tops.neck),
    design: findLabel(TOPS_DESIGNS, tops.design),
    fit: findLabel(TOPS_FITS, tops.fit),
  };
}

function buildTopsSpecRaw(item: ItemRecord) {
  const tops = item.spec?.tops;

  if (!tops) return null;

  return {
    shape: tops.shape,
    sleeve: tops.sleeve ?? undefined,
    length: tops.length ?? undefined,
    neck: tops.neck ?? undefined,
    design: tops.design ?? undefined,
    fit: tops.fit ?? undefined,
  };
}
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
  const topsSpec = buildTopsSpecLabels(item);
  const topsSpecRaw = buildTopsSpecRaw(item);

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
            {item.category} / {item.shape}
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
