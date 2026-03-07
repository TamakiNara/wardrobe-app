import { headers } from "next/headers";
import Link from "next/link";
import LogoutButton from "@/components/auth/logout-button";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

async function getUser(): Promise<AuthUser | null> {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";
  const appUrl = process.env.NEXT_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${appUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

function MenuCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Wardrobe App
          </h1>
          <p className="mb-6 text-gray-600">
            ログインすると、アイテム管理やコーデ管理を利用できます。
          </p>

          <Link
            href="/login"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            ログインしてください
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">ログイン中</p>
            <h1 className="text-2xl font-bold text-gray-900">
              ようこそ {user.name} さん
            </h1>
            <p className="mt-1 text-sm text-gray-600">{user.email}</p>
          </div>

          <LogoutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MenuCard
            href="/items"
            title="アイテム管理"
            description="服の色・形・季節・TPOを登録して管理します。"
          />
          <MenuCard
            href="/outfits"
            title="コーデ管理"
            description="コーデを登録し、一覧から見返せるようにします。"
          />
          <MenuCard
            href="/settings"
            title="設定"
            description="死蔵判定の日数など、使い方に合わせて調整します。"
          />
          <MenuCard
            href="/items"
            title="今日の候補"
            description="今後、TPOや季節から候補を表示する予定です。"
          />
        </section>
      </div>
    </main>
  );
}
