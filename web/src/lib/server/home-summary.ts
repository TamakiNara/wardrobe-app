import { fetchLaravelWithCookie } from "@/lib/server/laravel";

type HomeSummaryResponse = {
  summary?: {
    itemsCount?: number;
    outfitsCount?: number;
    wearLogsCount?: number;
    purchaseCandidatesCount?: number;
  };
};

export type HomeSummary = {
  itemsCount: number;
  outfitsCount: number;
  wearLogsCount: number;
  purchaseCandidatesCount: number;
};

export async function fetchHomeSummary(): Promise<HomeSummary> {
  const res = await fetchLaravelWithCookie("/api/home/summary");

  if (!res.ok) {
    return {
      itemsCount: 0,
      outfitsCount: 0,
      wearLogsCount: 0,
      purchaseCandidatesCount: 0,
    };
  }

  const data = (await res.json()) as HomeSummaryResponse;

  return {
    itemsCount: data.summary?.itemsCount ?? 0,
    outfitsCount: data.summary?.outfitsCount ?? 0,
    wearLogsCount: data.summary?.wearLogsCount ?? 0,
    purchaseCandidatesCount: data.summary?.purchaseCandidatesCount ?? 0,
  };
}
