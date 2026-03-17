import { apiFetch } from "@/lib/api/client";
import type { ItemRecord } from "@/types/items";

type ItemsResponse = {
  items?: ItemRecord[];
};

export async function fetchItems(): Promise<ItemRecord[]> {
  const data = await apiFetch<ItemsResponse>("/api/items");
  return data.items ?? [];
}
