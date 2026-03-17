"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isItemVisibleByCategorySettings } from "@/lib/api/categories";
import { fetchCategoryVisibilitySettings } from "@/lib/api/settings";

type OutfitItem = {
  id: number;
  item_id: number;
  sort_order: number;
  item: {
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
  };
};

type Outfit = {
  id: number;
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  outfit_items?: OutfitItem[];
  outfitItems?: OutfitItem[];
};

type OutfitsListProps = {
  outfits: Outfit[];
};

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

export default function OutfitsList({ outfits }: OutfitsListProps) {
  const [seasonFilter, setSeasonFilter] = useState("");
  const [tpoFilter, setTpoFilter] = useState("");
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;

    fetchCategoryVisibilitySettings()
      .then((settings) => {
        if (!active) return;
        setVisibleCategoryIds(settings.visibleCategoryIds);
      })
      .catch(() => {
        // 設定取得に失敗した場合でも、一覧自体は表示する
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      const seasons = outfit.seasons ?? [];
      const tpos = outfit.tpos ?? [];

      const isAllSeason = seasons.length === 0 || seasons.includes("オール");

      const matchSeason = seasonFilter
        ? seasonFilter === "オール"
          ? isAllSeason
          : seasons.includes(seasonFilter) || isAllSeason
        : true;

      const matchTpo = tpoFilter ? tpos.includes(tpoFilter) : true;

      return matchSeason && matchTpo;
    });
  }, [outfits, seasonFilter, tpoFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              季節
            </label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">すべて</option>
              {SEASON_OPTIONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              TPO
            </label>
            <select
              value={tpoFilter}
              onChange={(e) => setTpoFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">すべて</option>
              {TPO_OPTIONS.map((tpo) => (
                <option key={tpo} value={tpo}>
                  {tpo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            表示件数： {filteredOutfits.length} / {outfits.length}
          </p>

          <button
            type="button"
            onClick={() => {
              setSeasonFilter("");
              setTpoFilter("");
            }}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            絞り込みをクリア
          </button>
        </div>
      </section>

      {filteredOutfits.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            条件に一致するコーディネートがありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            条件を変更するか、絞り込みをクリアしてください。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOutfits.map((outfit) => {
            const outfitItems = outfit.outfitItems ?? outfit.outfit_items ?? [];
            const visibleOutfitItems =
              visibleCategoryIds === null
                ? outfitItems
                : outfitItems.filter((outfitItem) =>
                    isItemVisibleByCategorySettings(outfitItem.item, visibleCategoryIds),
                  );
            const itemCount = visibleOutfitItems.length;
            const hiddenItemCount = outfitItems.length - visibleOutfitItems.length;

            return (
              <Link href={`/outfits/${outfit.id}`} key={outfit.id}>
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50">
                  <h2 className="min-h-6 text-lg font-semibold text-gray-900">
                    {outfit.name ?? ""}
                  </h2>

                  {outfit.memo && (
                    <p className="mt-2 text-sm text-gray-600">{outfit.memo}</p>
                  )}

                  <p className="mt-4 text-sm text-gray-600">
                    表示アイテム数： {itemCount}
                  </p>

                  {hiddenItemCount > 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      現在の表示設定により {hiddenItemCount} 件を非表示にしています。
                    </p>
                  )}

                  <p className="mt-2 text-sm text-gray-600">
                    季節：{" "}
                    {outfit.seasons?.length ? outfit.seasons.join(" / ") : "未設定"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    TPO： {outfit.tpos?.length ? outfit.tpos.join(" / ") : "未設定"}
                  </p>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
