import Link from "next/link";

export default function ItemsPage() {
  const items: [] = [];

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
            {/* 今後カード一覧をここに表示 */}
          </section>
        )}
      </div>
    </main>
  );
}
