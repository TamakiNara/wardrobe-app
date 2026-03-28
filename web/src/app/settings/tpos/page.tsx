"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { settingsActionIcons } from "@/lib/icons/settings-icons";
import { createUserTpo, fetchUserTpos, updateUserTpo } from "@/lib/api/settings";
import type { UserTpoRecord } from "@/types/settings";

export default function SettingsTposPage() {
  const MoveUpIcon = settingsActionIcons.moveUp;
  const MoveDownIcon = settingsActionIcons.moveDown;
  const EditIcon = settingsActionIcons.edit;
  const router = useRouter();
  const [tpos, setTpos] = useState<UserTpoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadAll() {
    const response = await fetchUserTpos(false);
    setTpos(response.tpos);
  }

  useEffect(() => {
    let active = true;

    loadAll()
      .catch((loadErrorValue) => {
        if (!active) return;
        if (loadErrorValue instanceof ApiClientError && loadErrorValue.status === 401) {
          router.push("/login");
          return;
        }

        setLoadError("TPO 設定を読み込めませんでした。時間をおいて再度お試しください。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const sortedTpos = useMemo(
    () => [...tpos].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [tpos],
  );

  function resetMessages() {
    setFormMessage(null);
    setListMessage(null);
    setError(null);
  }

  async function handleCreate() {
    if (adding) return;

    resetMessages();
    setAdding(true);

    try {
      await createUserTpo({ name: newName });
      await loadAll();
      setNewName("");
      setFormMessage("TPO を追加しました。");
    } catch (createError) {
      if (createError instanceof ApiClientError) {
        setError(
          createError.data?.errors?.name?.[0] ??
            createError.message,
        );
      } else {
        setError("TPO を追加できませんでした。");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(tpo: UserTpoRecord) {
    if (updatingId !== null) return;

    resetMessages();
    setUpdatingId(tpo.id);

    try {
      await updateUserTpo(tpo.id, { isActive: !tpo.isActive });
      await loadAll();
      setListMessage(!tpo.isActive ? "TPO を有効にしました。" : "TPO を無効にしました。");
    } catch (updateError) {
      if (updateError instanceof ApiClientError) {
        setError(updateError.message);
      } else {
        setError("TPO の状態を更新できませんでした。");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMove(tpo: UserTpoRecord, direction: "up" | "down") {
    const index = sortedTpos.findIndex((current) => current.id === tpo.id);
    const target = sortedTpos[direction === "up" ? index - 1 : index + 1];
    if (!target || updatingId !== null) return;

    resetMessages();
    setUpdatingId(tpo.id);

    try {
      await updateUserTpo(tpo.id, { sortOrder: target.sortOrder });
      await loadAll();
      setListMessage("TPO の並び順を更新しました。");
    } catch (updateError) {
      if (updateError instanceof ApiClientError) {
        setError(updateError.message);
      } else {
        setError("並び順を更新できませんでした。");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRename(tpoId: number) {
    if (updatingId !== null) return;

    resetMessages();
    setUpdatingId(tpoId);

    try {
      await updateUserTpo(tpoId, { name: editingName });
      await loadAll();
      setEditingId(null);
      setEditingName("");
      setListMessage("TPO 名を更新しました。");
    } catch (updateError) {
      if (updateError instanceof ApiClientError) {
        setError(
          updateError.data?.errors?.name?.[0] ??
            updateError.message,
        );
      } else {
        setError("TPO 名を更新できませんでした。");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          {" / "}
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          {" / "}
          <span className="text-gray-700">TPO 設定</span>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-gray-500">設定</p>
              <h1 className="text-2xl font-bold text-gray-900">TPO 設定</h1>
              <p className="mt-2 text-sm text-gray-600">
                アイテムとコーディネートで使う TPO 候補を管理します。無効化した TPO は新規候補に出ません。
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
          <h2 className="text-lg font-semibold text-gray-900">TPO を追加</h2>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="例: 出張"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={adding}
              className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {adding ? "追加中..." : "追加"}
            </button>
          </div>
          {formMessage ? <p className="mt-3 text-sm text-emerald-700">{formMessage}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">登録済み TPO</h2>
              <p className="mt-1 text-sm text-gray-600">
                無効化した TPO は新規候補に出ません。プリセット名は変更できません。
              </p>
            </div>
          </div>
          {listMessage ? <p className="mt-3 text-sm text-emerald-700">{listMessage}</p> : null}

          {loading ? (
            <p className="mt-6 text-sm text-gray-600">TPO を読み込み中です...</p>
          ) : loadError ? (
            <p className="mt-6 text-sm text-red-600">{loadError}</p>
          ) : sortedTpos.length === 0 ? (
            <p className="mt-6 text-sm text-gray-600">TPO はまだありません。</p>
          ) : (
            <div className="mt-6 space-y-3">
              {sortedTpos.map((tpo, index) => (
                <article
                  key={tpo.id}
                  className={`rounded-xl border p-4 transition ${
                    tpo.isActive
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 bg-amber-50/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {editingId === tpo.id ? (
                          <div className="flex w-full max-w-sm items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleRename(tpo.id)}
                              disabled={updatingId !== null}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className={`text-base font-semibold ${tpo.isActive ? "text-gray-900" : "text-gray-800"}`}>{tpo.name}</h3>
                            {tpo.isPreset ? (
                              <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                                プリセット
                              </span>
                            ) : null}
                            {!tpo.isActive ? (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                無効
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => handleMove(tpo, "up")}
                        disabled={index === 0 || updatingId !== null}
                        aria-label={`${tpo.name} を 1 つ上へ移動`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <MoveUpIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(tpo, "down")}
                        disabled={index === sortedTpos.length - 1 || updatingId !== null}
                        aria-label={`${tpo.name} を 1 つ下へ移動`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <MoveDownIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                      </button>
                      {!tpo.isPreset ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(tpo.id);
                            setEditingName(tpo.name);
                            resetMessages();
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          <EditIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
                          編集
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(tpo)}
                        disabled={updatingId !== null}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                          tpo.isActive
                            ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                            : "border border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {tpo.isActive ? "無効にする" : "有効にする"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
