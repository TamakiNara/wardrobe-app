import Link from "next/link";
import { redirect } from "next/navigation";
import InvalidOutfitsList from "@/components/outfits/invalid-outfits-list";
import { OutfitsPageHeader } from "@/components/outfits/outfits-page-header";
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
    availableTpos?: string[];
  };
};

type InvalidOutfitsPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

function buildQueryString(
  searchParams: InvalidOutfitsPageSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      const firstValue = value[0];
      if (firstValue) {
        params.set(key, firstValue);
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

async function getInvalidOutfits(
  searchParams: InvalidOutfitsPageSearchParams,
): Promise<OutfitsResponse> {
  const query = buildQueryString(searchParams);
  const path = query ? `/api/outfits/invalid?${query}` : "/api/outfits/invalid";
  const res = await fetchLaravelWithCookie(path);

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
      availableTpos: data.meta?.availableTpos ?? [],
    },
  };
}

export default async function InvalidOutfitsPage({
  searchParams,
}: {
  searchParams: Promise<InvalidOutfitsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getInvalidOutfits(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <OutfitsPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: "コーディネート一覧", href: "/outfits" },
            { label: "無効コーディネート一覧" },
          ]}
          eyebrow="コーディネート管理"
          title="無効コーディネート一覧"
          description="通常一覧とは分けて管理し、無効理由の確認や再利用判断を行います。"
          actions={
            <Link
              href="/outfits"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              コーディネート一覧に戻る
            </Link>
          }
        />

        <InvalidOutfitsList
          outfits={data.outfits}
          totalCount={data.meta.total}
          currentPage={data.meta.page}
          lastPage={data.meta.lastPage}
          availableTpos={data.meta.availableTpos ?? []}
        />
      </div>
    </main>
  );
}
