import Link from "next/link";

export default function NewItemPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">アイテム登録</h1>
          </div>

          <Link
            href="/items"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            一覧に戻る
          </Link>
        </div>

        <form className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                名前
              </label>
              <input
                id="name"
                type="text"
                placeholder="例：ネイビーのシャツ"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                カテゴリ
              </label>
              <select
                id="category"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                defaultValue=""
              >
                <option value="" disabled>
                  選択してください
                </option>
                <option value="tops">トップス</option>
                <option value="bottoms">ボトムス</option>
                <option value="outer">アウター</option>
                <option value="shoes">シューズ</option>
                <option value="accessories">小物</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="shape"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                形
              </label>
              <select
                id="shape"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                defaultValue=""
              >
                <option value="" disabled>
                  カテゴリを選んだあとに設定予定
                </option>
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">色</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="main-color"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  メインカラー
                </label>
                <select
                  id="main-color"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  defaultValue=""
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="black">ブラック</option>
                  <option value="white">ホワイト</option>
                  <option value="navy">ネイビー</option>
                  <option value="gray">グレー</option>
                  <option value="beige">ベージュ</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sub-color"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  サブカラー
                </label>
                <select
                  id="sub-color"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  defaultValue=""
                >
                  <option value="">未選択</option>
                  <option value="black">ブラック</option>
                  <option value="white">ホワイト</option>
                  <option value="navy">ネイビー</option>
                  <option value="gray">グレー</option>
                  <option value="beige">ベージュ</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">季節</p>
              <div className="flex flex-wrap gap-3">
                {["春", "夏", "秋", "冬", "オール"].map((season) => (
                  <label
                    key={season}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input type="checkbox" className="h-4 w-4" />
                    {season}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">TPO</p>
              <div className="flex flex-wrap gap-3">
                {["仕事", "休日", "フォーマル"].map((tpo) => (
                  <label
                    key={tpo}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input type="checkbox" className="h-4 w-4" />
                    {tpo}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              登録する
            </button>

            <Link
              href="/items"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}