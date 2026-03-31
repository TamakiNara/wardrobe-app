import { apiFetch } from "@/lib/api/client";
import type { ItemRecord } from "@/types/items";

type ItemsResponse = {
  items?: ItemRecord[];
  meta?: {
    total?: number;
    totalAll?: number;
    page?: number;
    lastPage?: number;
    availableCategories?: string[];
    availableSeasons?: string[];
    availableTpos?: string[];
  };
};

export async function fetchItems(): Promise<ItemRecord[]> {
  const data = await apiFetch<ItemsResponse>("/api/items");
  return data.items ?? [];
}

type FetchItemsIndexParams = {
  keyword?: string;
  category?: string;
  season?: string;
  tpo?: string;
  sort?: "updated_at_desc" | "name_asc";
  page?: number;
  all?: boolean;
};

export async function fetchItemsIndex(params: FetchItemsIndexParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.keyword) {
    searchParams.set("keyword", params.keyword);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.season) {
    searchParams.set("season", params.season);
  }

  if (params.tpo) {
    searchParams.set("tpo", params.tpo);
  }

  if (params.sort && params.sort !== "updated_at_desc") {
    searchParams.set("sort", params.sort);
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.all) {
    searchParams.set("all", "1");
  }

  const query = searchParams.toString();
  const path = query ? `/api/items?${query}` : "/api/items";
  const data = await apiFetch<ItemsResponse>(path);

  return {
    items: data.items ?? [],
    meta: {
      total: data.meta?.total ?? 0,
      totalAll: data.meta?.totalAll ?? 0,
      page: data.meta?.page ?? 1,
      lastPage: data.meta?.lastPage ?? 1,
      availableCategories: data.meta?.availableCategories ?? [],
      availableSeasons: data.meta?.availableSeasons ?? [],
      availableTpos: data.meta?.availableTpos ?? [],
    },
  };
}
