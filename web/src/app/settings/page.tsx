"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCategoryGroups } from "@/lib/api/categories";
import type { CategoryGroupRecord } from "@/types/categories";

function buildInitialVisibility(groups: CategoryGroupRecord[]) {
  return Object.fromEntries(
    groups.flatMap((group) =>
      group.categories.map((category) => [category.id, true]),
    ),
  ) as Record<string, boolean>;
}

function getGroupState(
  group: CategoryGroupRecord,
  visibility: Record<string, boolean>,
) {
  const enabledCount = group.categories.filter(
    (category) => visibility[category.id] !== false,
  ).length;

  if (enabledCount === 0) return "off";
  if (enabledCount === group.categories.length) return "on";
  return "partial";
}

export default function SettingsPage() {
  const [groups, setGroups] = useState<CategoryGroupRecord[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchCategoryGroups()
      .then((fetchedGroups) => {
        if (!active) return;
        setGroups(fetchedGroups);
        setVisibility(buildInitialVisibility(fetchedGroups));
        setExpandedGroups(
          Object.fromEntries(
            fetchedGroups.map((group) => [group.id, true]),
          ) as Record<string, boolean>,
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function setGroupVisibility(group: CategoryGroupRecord, enabled: boolean) {
    setVisibility((current) => {
      const next = { ...current };
      for (const category of group.categories) {
        next[category.id] = enabled;
      }
      return next;
    });
  }

  function toggleCategory(categoryId: string) {
    setVisibility((current) => ({
      ...current,
      [categoryId]: !(current[categoryId] !== false),
    }));
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <span className="text-gray-700">設定</span>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">設定</h1>
              <p className="mt-2 text-sm text-gray-600">
                各種設定を変更できます。
                <br />
                表示内容や利用方法に関する項目は、ここから調整できます。
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              保存機能は未接続です。現在は UI と状態管理の土台まで実装しています。
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">カテゴリ表示設定</h2>
          <p className="mt-2 text-sm text-gray-600">
            ONにしたカテゴリのみ、登録や選択時に表示されます。
          </p>


          {loading ? (
            <p className="mt-6 text-sm text-gray-600">カテゴリを読み込み中です...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {groups.map((group) => {
                const state = getGroupState(group, visibility);
                const enabledCount = group.categories.filter(
                  (category) => visibility[category.id] !== false,
                ).length;
                const isExpanded = expandedGroups[group.id] ?? true;

                return (
                  <section
                    key={group.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              state === "on"
                                ? "bg-emerald-100 text-emerald-700"
                                : state === "partial"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {state === "on"
                              ? "ON"
                              : state === "partial"
                                ? "一部ON"
                                : "OFF"}
                          </span>
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {group.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              表示中：{enabledCount} / {group.categories.length}件
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGroupVisibility(group, true)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          すべてON
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupVisibility(group, false)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          すべてOFF
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.categories.map((category) => {
                          const checked = visibility[category.id] !== false;

                          return (
                            <label
                              key={category.id}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategory(category.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
