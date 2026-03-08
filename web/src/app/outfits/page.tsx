import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

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

async function getOutfits(): Promise<Outfit[]> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/outfits`, {
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.outfits ?? [];
}

export default async function OutfitsPage() {
  const outfits = await getOutfits();

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <span className="text-gray-700">コーデ一覧</span>
        </nav>
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">コーデ管理</p>
            <h1 className="text-2xl font-bold text-gray-900">コーデ一覧</h1>
            <p className="mt-1 text-sm text-gray-600">
              登録したアイテムを組み合わせてコーデを管理します。
            </p>
          </div>

          <Link
            href="/outfits/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            コーデを追加
          </Link>
        </header>

        {outfits.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              まだコーデがありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              登録済みアイテムを使って、最初のコーデを作成できます。
            </p>

            <div className="mt-6">
              <Link
                href="/outfits/new"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                コーデを登録する
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {outfits.map((outfit) => {
              const outfitItems = outfit.outfitItems ?? outfit.outfit_items ?? [];
              const itemCount = outfitItems.length;

              return (
                <Link href={`/outfits/${outfit.id}`} key={outfit.id}>
                  <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                    <h2 className="min-h-6 text-lg font-semibold text-gray-900">
                      {outfit.name ?? ""}
                    </h2>

                    {outfit.memo && (
                      <p className="mt-2 text-sm text-gray-600">{outfit.memo}</p>
                    )}

                    <p className="mt-4 text-sm text-gray-600">
                      アイテム数: {itemCount}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      季節: {outfit.seasons?.length ? outfit.seasons.join(" / ") : "未設定"}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      TPO: {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                    </p>
                  </article>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
