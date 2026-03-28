"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { settingsActionIcons } from "@/lib/icons/settings-icons";
import {
  createUserBrand,
  fetchUserBrands,
  updateUserBrand,
} from "@/lib/api/settings";
import type { UserBrandRecord } from "@/types/settings";

function SettingsBrandsPageContent() {
  const EditIcon = settingsActionIcons.edit;
  const router = useRouter();
  const [brands, setBrands] = useState<UserBrandRecord[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsLoadError, setBrandsLoadError] = useState<string | null>(null);
  const [brandSaveMessage, setBrandSaveMessage] = useState<string | null>(null);
  const [brandSaveError, setBrandSaveError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandKana, setNewBrandKana] = useState("");
  const [brandKeyword, setBrandKeyword] = useState("");
  const [showInactiveBrands, setShowInactiveBrands] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandKana, setEditBrandKana] = useState("");
  const [editBrandIsActive, setEditBrandIsActive] = useState(true);
  const [updatingBrandId, setUpdatingBrandId] = useState<number | null>(null);

  async function loadBrands(keyword?: string) {
    const response = await fetchUserBrands(keyword, false);
    setBrands(response.brands);
  }

  useEffect(() => {
    let active = true;

    loadBrands(brandKeyword.trim() || undefined)
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.push("/login");
          return;
        }
        setBrandsLoadError("ブランド候補を読み込めませんでした。時間をおいて再度お試しください。");
      })
      .finally(() => {
        if (!active) return;
        setBrandsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [brandKeyword, router]);

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [brands]);

  const activeBrands = useMemo(
    () => sortedBrands.filter((brand) => brand.is_active),
    [sortedBrands],
  );

  const inactiveBrands = useMemo(
    () => sortedBrands.filter((brand) => !brand.is_active),
    [sortedBrands],
  );

  const hasBrandKeyword = brandKeyword.trim().length > 0;

  function formatBrandUpdatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "日時不明";
    }

    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function resetBrandMessages() {
    setBrandSaveMessage(null);
    setBrandSaveError(null);
  }

  async function refreshBrands() {
    await loadBrands(brandKeyword.trim() || undefined);
  }

  async function handleCreateBrand() {
    if (addingBrand) return;

    resetBrandMessages();
    setAddingBrand(true);

    try {
      await createUserBrand({
        name: newBrandName,
        kana: newBrandKana.trim() || null,
        is_active: true,
      });
      await refreshBrands();
      setNewBrandName("");
      setNewBrandKana("");
      setBrandSaveMessage("ブランド候補を追加しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(
          error.data?.errors?.name?.[0] ??
            error.data?.errors?.kana?.[0] ??
            error.message,
        );
      } else {
        setBrandSaveError("ブランド候補を追加できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setAddingBrand(false);
    }
  }

  function startEditingBrand(brand: UserBrandRecord) {
    resetBrandMessages();
    setEditingBrandId(brand.id);
    setEditBrandName(brand.name);
    setEditBrandKana(brand.kana ?? "");
    setEditBrandIsActive(brand.is_active);
  }

  async function handleUpdateBrand(brandId: number) {
    if (updatingBrandId !== null) return;

    resetBrandMessages();
    setUpdatingBrandId(brandId);

    try {
      await updateUserBrand(brandId, {
        name: editBrandName,
        kana: editBrandKana.trim() || null,
        is_active: editBrandIsActive,
      });
      await refreshBrands();
      setEditingBrandId(null);
      setBrandSaveMessage("ブランド候補を更新しました。");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(
          error.data?.errors?.name?.[0] ??
            error.data?.errors?.kana?.[0] ??
            error.message,
        );
      } else {
        setBrandSaveError("ブランド候補を更新できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setUpdatingBrandId(null);
    }
  }

  async function handleToggleBrandActive(brand: UserBrandRecord) {
    if (updatingBrandId !== null) return;

    resetBrandMessages();
    setUpdatingBrandId(brand.id);

    try {
      await updateUserBrand(brand.id, {
        is_active: !brand.is_active,
      });
      await refreshBrands();
      setBrandSaveMessage(
        !brand.is_active
          ? "ブランド候補を有効にしました。"
          : "ブランド候補を無効にしました。",
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBrandSaveError(error.message);
      } else {
        setBrandSaveError("ブランド候補の状態を更新できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setUpdatingBrandId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          {" / "}
          <span className="text-gray-700">ブランド候補設定</span>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-gray-500">設定</p>
              <h1 className="text-2xl font-bold text-gray-900">ブランド候補設定</h1>
              <p className="mt-2 text-sm text-gray-600">
                アイテム入力で使うブランド候補を管理できます。既存 item のブランド名は自動更新しません。
              </p>
            </div>

            <Link
              href="/settings"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              設定へ戻る
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ブランド候補を追加</h2>
              <p className="mt-2 text-sm text-gray-600">
                ブランド名と読み仮名を登録できます。
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {brandSaveMessage ? (
                <p className="text-sm text-emerald-700">{brandSaveMessage}</p>
              ) : null}
              {brandSaveError ? (
                <p className="text-sm text-red-600">{brandSaveError}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 md:grid-cols-[2fr_2fr_auto]">
              <div>
                <label htmlFor="new-brand-name" className="mb-1 block text-sm font-medium text-gray-700">
                  ブランド名
                </label>
                <input
                  id="new-brand-name"
                  type="text"
                  value={newBrandName}
                  onChange={(event) => setNewBrandName(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="new-brand-kana" className="mb-1 block text-sm font-medium text-gray-700">
                  読み仮名
                </label>
                <input
                  id="new-brand-kana"
                  type="text"
                  value={newBrandKana}
                  onChange={(event) => setNewBrandKana(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateBrand}
                  disabled={addingBrand}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {addingBrand ? "追加中..." : "追加する"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">登録済みブランド候補</h2>
              <p className="mt-2 text-sm text-gray-600">
                無効にした候補は新規候補から外れます。既存データはそのまま保持します。
              </p>
            </div>
            <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showInactiveBrands}
                onChange={(event) => setShowInactiveBrands(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              無効候補も表示する
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label
              htmlFor="brand-keyword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              キーワードで絞り込む
            </label>
            <input
              id="brand-keyword"
              type="text"
              value={brandKeyword}
              onChange={(event) => setBrandKeyword(event.target.value)}
              placeholder="ブランド名または読み仮名で検索"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              ブランド名・読み仮名のどちらでも探せます。
            </p>
          </div>

          {brandsLoading ? (
            <p className="mt-6 text-sm text-gray-600">ブランド候補を読み込み中です...</p>
          ) : brandsLoadError ? (
            <p className="mt-6 text-sm text-red-600">{brandsLoadError}</p>
          ) : sortedBrands.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              {hasBrandKeyword
                ? "条件に合うブランド候補はありません。"
                : "ブランド候補はまだありません。"}
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {activeBrands.length > 0 ? (
                activeBrands.map((brand) => {
                  const isEditing = editingBrandId === brand.id;
                  const isUpdating = updatingBrandId === brand.id;

                  return (
                    <section
                      key={brand.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-gray-900">{brand.name}</p>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              有効
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            読み仮名: {brand.kana ?? "未設定"}
                          </p>
                          <p className="text-xs text-gray-500">
                            更新日時: {formatBrandUpdatedAt(brand.updated_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingBrand(brand)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                          >
                            <EditIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBrandActive(brand)}
                            disabled={isUpdating}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            無効にする
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
                          <div>
                            <label htmlFor={`brand-name-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                              ブランド名
                            </label>
                            <input
                              id={`brand-name-${brand.id}`}
                              type="text"
                              value={editBrandName}
                              onChange={(event) => setEditBrandName(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div>
                            <label htmlFor={`brand-kana-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                              読み仮名
                            </label>
                            <input
                              id={`brand-kana-${brand.id}`}
                              type="text"
                              value={editBrandKana}
                              onChange={(event) => setEditBrandKana(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 md:self-end">
                            <input
                              type="checkbox"
                              checked={editBrandIsActive}
                              onChange={(event) => setEditBrandIsActive(event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            有効
                          </label>
                          <div className="flex gap-2 md:self-end">
                            <button
                              type="button"
                              onClick={() => setEditingBrandId(null)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBrand(brand.id)}
                              disabled={isUpdating}
                              className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              {isUpdating ? "更新中..." : "更新する"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </section>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  有効なブランド候補はありません。
                </p>
              )}

              {showInactiveBrands && inactiveBrands.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">無効候補</h3>
                  {inactiveBrands.map((brand) => {
                    const isEditing = editingBrandId === brand.id;
                    const isUpdating = updatingBrandId === brand.id;

                    return (
                      <section
                        key={brand.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-gray-900">{brand.name}</p>
                              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                                無効
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              読み仮名: {brand.kana ?? "未設定"}
                            </p>
                            <p className="text-xs text-gray-500">
                              更新日時: {formatBrandUpdatedAt(brand.updated_at)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingBrand(brand)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                            >
                              <EditIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBrandActive(brand)}
                              disabled={isUpdating}
                              className="rounded-lg border border-emerald-400 bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              有効にする
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
                            <div>
                              <label htmlFor={`brand-name-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                ブランド名
                              </label>
                              <input
                                id={`brand-name-${brand.id}`}
                                type="text"
                                value={editBrandName}
                                onChange={(event) => setEditBrandName(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div>
                              <label htmlFor={`brand-kana-${brand.id}`} className="mb-1 block text-sm font-medium text-gray-700">
                                読み仮名
                              </label>
                              <input
                                id={`brand-kana-${brand.id}`}
                                type="text"
                                value={editBrandKana}
                                onChange={(event) => setEditBrandKana(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <label className="inline-flex h-[50px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 md:self-end">
                              <input
                                type="checkbox"
                                checked={editBrandIsActive}
                                onChange={(event) => setEditBrandIsActive(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              有効
                            </label>
                            <div className="flex gap-2 md:self-end">
                              <button
                                type="button"
                                onClick={() => setEditingBrandId(null)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                              >
                                キャンセル
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBrand(brand.id)}
                                disabled={isUpdating}
                                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {isUpdating ? "更新中..." : "更新する"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </section>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SettingsBrandsPage() {
  return (
    <Suspense>
      <SettingsBrandsPageContent />
    </Suspense>
  );
}
