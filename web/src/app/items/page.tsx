import { headers } from "next/headers";
import Link from "next/link";

type Item = {
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
  seasons: string[];
  tpos: string[];
};

async function getItems(): Promise<Item[]> {
  const cookie = (await headers()).get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/items`, {
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">アイテム一覧</h1>
            <p className="mt-1 text-sm text-gray-600">
              服の色・形・季節・TPOを登録して管理します。
            </p>
          </div>

          <Link
            href="/items/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            アイテムを追加
          </Link>
        </header>

        {items.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              まだアイテムがありません
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              最初の1着を登録すると、一覧やコーデ管理に進めます。
            </p>

            <div className="mt-6">
              <Link
                href="/items/new"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                アイテムを登録する
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const mainColor = item.colors.find((c) => c.role === "main");
              const subColor = item.colors.find((c) => c.role === "sub");

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {item.name || "名称未設定"}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
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
                    季節:{" "}
                    {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    TPO: {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
