import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

async function getItem(id: string): Promise<Item> {
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

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{item.name ?? "名称未設定"}</h1>

        <p className="mt-2 text-gray-600">
          {item.category} / {item.shape}
        </p>

        <div className="mt-4 flex gap-2">
          {mainColor && (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: mainColor.hex }}
              />
              {mainColor.label}
            </span>
          )}

          {subColor && (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: subColor.hex }}
              />
              {subColor.label}
            </span>
          )}
        </div>

        <p className="mt-4 text-sm">
          季節: {item.seasons?.length ? item.seasons.join(" / ") : "未設定"}
        </p>

        <p className="text-sm">
          TPO: {item.tpos?.length ? item.tpos.join(" / ") : "未設定"}
        </p>
      </div>
    </main>
  );
}
