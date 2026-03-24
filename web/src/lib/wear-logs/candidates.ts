type CandidateCollectionResponse<TEntry, TKey extends string> = {
  meta?: {
    lastPage?: number;
  };
} & Partial<Record<TKey, TEntry[]>>;

export async function fetchAllPaginatedCandidates<TEntry, TKey extends string>(
  path: string,
  key: TKey,
): Promise<{ status: number; entries: TEntry[] }> {
  const entries: TEntry[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const searchSeparator = path.includes("?") ? "&" : "?";
    const response = await fetch(`${path}${searchSeparator}page=${page}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return {
        status: response.status,
        entries: [],
      };
    }

    const data = (await response.json()) as CandidateCollectionResponse<TEntry, TKey>;
    const chunk = data[key];

    if (Array.isArray(chunk)) {
      entries.push(...chunk);
    }

    const responseLastPage = data.meta?.lastPage;
    lastPage = typeof responseLastPage === "number" && responseLastPage > 0
      ? responseLastPage
      : 1;
    page += 1;
  } while (page <= lastPage);

  return {
    status: 200,
    entries,
  };
}
