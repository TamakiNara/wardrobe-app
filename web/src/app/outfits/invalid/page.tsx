import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchLaravelWithCookie } from "@/lib/server/laravel";

type Outfit = {
  id: number;
  status: "active" | "invalid";
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
};

type OutfitsResponse = {
  outfits: Outfit[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
  };
};

async function getInvalidOutfits(): Promise<OutfitsResponse> {
  const res = await fetchLaravelWithCookie("/api/outfits/invalid");

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
    },
  };
}

export default async function InvalidOutfitsPage() {
  const data = await getInvalidOutfits();

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/outfits" className="hover:underline">
            コーディネート一覧
          </Link>
          {" / "}
          <span className="text-gray-700">無効コーディネート一覧</span>
        </nav>

        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">コーディネート管理</p>
            <h1 className="text-2xl font-bold text-gray-900">無効コーディネート一覧</h1>
            <p className="mt-1 text-sm text-gray-600">
              現在利用できないアイテムを含むコーディネートを確認します。
            </p>
          </div>

          <Link
            href="/outfits"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            コーディネート一覧に戻る
          </Link>
        </header>

        {data.meta.totalAll === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              無効なコーディネートはありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              現在は通常利用できないコーディネートはありません。
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {data.outfits.map((outfit) => (
              <article
                key={outfit.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {outfit.name || "名称未設定"}
                      </h2>
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                        無効
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      季節： {outfit.seasons?.length ? outfit.seasons.join(" / ") : "未設定"}
                    </p>
                    <p className="text-sm text-gray-600">
                      TPO： {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/outfits/${outfit.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      詳細
                    </Link>
                    <Link
                      href={`/outfits/${outfit.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      編集
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
