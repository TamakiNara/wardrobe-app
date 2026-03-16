"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ITEM_CATEGORIES,
  ITEM_SHAPES,
  type ItemCategory,
} from "@/lib/master-data/item-shapes";
import { buildSupportedCategoryOptions, fetchCategoryGroups } from "@/lib/api/categories";
import {
  ITEM_COLORS,
  type ItemColorValue,
} from "@/lib/master-data/item-colors";
import ColorChip from "@/components/items/color-chip";
import ColorSelect from "@/components/items/color-select";
import type { CreateItemPayload, ItemFormColor } from "@/types/items";
import ItemPreviewCard from "@/components/items/item-preview-card";
import {
  buildTopsSpecLabels,
  buildTopsSpecRaw,
  DEFAULT_TOPS_FIT,
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_RULES,
  TOPS_SHAPES,
  TOPS_SLEEVES,
  type TopsDesignValue,
  type TopsFitValue,
  type TopsLengthValue,
  type TopsNeckValue,
  type TopsShapeValue,
  type TopsSleeveValue,
} from "@/lib/master-data/item-tops";

const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;



export default function NewItemPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [categoryOptions, setCategoryOptions] = useState(ITEM_CATEGORIES);
  const [shape, setShape] = useState("");

  const [mainColor, setMainColor] = useState<ItemColorValue | "">("");
  const [subColor, setSubColor] = useState<ItemColorValue | "">("");
  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [useCustomSubColor, setUseCustomSubColor] = useState(false);
  const [customMainHex, setCustomMainHex] = useState("#3B82F6");
  const [customSubHex, setCustomSubHex] = useState("#9CA3AF");

  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);

  const [topsShape, setTopsShape] = useState<TopsShapeValue | "">("");
  const [topsSleeve, setTopsSleeve] = useState<TopsSleeveValue | "">("");
  const [topsLength, setTopsLength] = useState<TopsLengthValue | "">("");
  const [topsNeck, setTopsNeck] = useState<TopsNeckValue | "">("");
  const [topsDesign, setTopsDesign] = useState<TopsDesignValue | "">("");
  const [topsFit, setTopsFit] = useState<TopsFitValue>(DEFAULT_TOPS_FIT);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const isTopsCategory = category === "tops";

  const shapeOptions = useMemo(() => {
    if (!category) return [];
    return ITEM_SHAPES[category];
  }, [category]);

  const selectedMainColor = useMemo(() => {
    if (useCustomMainColor) {
      return {
        label: "カスタムカラー",
        hex: customMainHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === mainColor) ?? null;
  }, [useCustomMainColor, customMainHex, mainColor]);

  const selectedSubColor = useMemo(() => {
    if (useCustomSubColor) {
      return {
        label: "カスタムカラー",
        hex: customSubHex,
      };
    }

    return ITEM_COLORS.find((color) => color.value === subColor) ?? null;
  }, [useCustomSubColor, customSubHex, subColor]);

  const topsRule = useMemo(() => {
    if (!isTopsCategory || !topsShape) return null;
    return TOPS_RULES[topsShape];
  }, [isTopsCategory, topsShape]);

  const availableTopsSleeves = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_SLEEVES.filter((item) => topsRule.sleeves.includes(item.value));
  }, [topsRule]);

  const availableTopsLengths = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_LENGTHS.filter((item) => topsRule.lengths.includes(item.value));
  }, [topsRule]);

  const availableTopsNecks = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_NECKS.filter((item) => topsRule.necks.includes(item.value));
  }, [topsRule]);

  const availableTopsDesigns = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_DESIGNS.filter((item) => topsRule.designs.includes(item.value));
  }, [topsRule]);

  const availableTopsFits = useMemo(() => {
    if (!topsRule) return [];
    return TOPS_FITS.filter((item) => topsRule.fits.includes(item.value));
  }, [topsRule]);


  useEffect(() => {
    let active = true;

    fetchCategoryGroups()
      .then((groups) => {
        if (!active) return;
        const nextOptions = buildSupportedCategoryOptions(groups);
        if (nextOptions.length > 0) {
          setCategoryOptions(nextOptions as typeof ITEM_CATEGORIES);
        }
      })
      .catch(() => {
        // フロントでは取得失敗時に固定 master data へフォールバックする
      });

    return () => {
      active = false;
    };
  }, []);

  function resetTopsState() {
    setTopsShape("");
    setTopsSleeve("");
    setTopsLength("");
    setTopsNeck("");
    setTopsDesign("");
    setTopsFit(DEFAULT_TOPS_FIT);
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory as ItemCategory | "");
    setShape("");

    if (nextCategory !== "tops") {
      resetTopsState();
    }
  }

  function handleTopsShapeChange(nextShape: string) {
    const value = nextShape as TopsShapeValue | "";
    setTopsShape(value);

    if (!value) {
      setTopsSleeve("");
      setTopsLength("");
      setTopsNeck("");
      setTopsDesign("");
      setTopsFit(DEFAULT_TOPS_FIT);
      setShape("");
      return;
    }

    const rule = TOPS_RULES[value];
    setTopsSleeve(rule.defaults?.sleeve ?? "");
    setTopsLength(rule.defaults?.length ?? "");
    setTopsNeck(rule.defaults?.neck ?? "");
    setTopsDesign(rule.defaults?.design ?? "");
    setTopsFit(rule.defaults?.fit ?? DEFAULT_TOPS_FIT);
    setShape(value);
  }

  function toggleValue(value: string, current: string[], setter: (values: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function buildPayload(): CreateItemPayload {
    const colors: ItemFormColor[] = [];

    if (selectedMainColor) {
      colors.push({
        role: "main",
        mode: useCustomMainColor ? "custom" : "preset",
        value: useCustomMainColor ? customMainHex : mainColor,
        hex: selectedMainColor.hex,
        label: selectedMainColor.label,
      });
    }

    if (selectedSubColor) {
      colors.push({
        role: "sub",
        mode: useCustomSubColor ? "custom" : "preset",
        value: useCustomSubColor ? customSubHex : subColor,
        hex: selectedSubColor.hex,
        label: selectedSubColor.label,
      });
    }

    return {
      name,
      category,
      shape,
      colors,
      seasons: selectedSeasons,
      tpos: selectedTpos,
      spec:
        isTopsCategory && topsShape
          ? {
              tops: {
                shape: topsShape,
                sleeve: topsSleeve || null,
                length: topsLength || null,
                neck: topsNeck || null,
                design: topsDesign || null,
                fit: topsFit || null,
              },
            }
          : null,
    };
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!category) nextErrors.category = "カテゴリを選択してください。";
    if (!shape) nextErrors.shape = "形を選択してください。";
    if (!selectedMainColor) nextErrors.mainColor = "メインカラーを選択してください。";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setSubmitError("セッションが切れました。再度ログインしてください。");
        setTimeout(() => router.push("/login"), 800);
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.message ?? "登録に失敗しました。");
        return;
      }

      setSubmitSuccess("登録に成功しました。");
      setTimeout(() => {
        router.push("/items");
        router.refresh();
      }, 800);
    } catch {
      setSubmitError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  const previewTopsSpec = isTopsCategory
    ? buildTopsSpecLabels({
        shape: topsShape || undefined,
        sleeve: topsSleeve || undefined,
        length: topsLength || undefined,
        neck: topsNeck || undefined,
        design: topsDesign || undefined,
        fit: topsFit || undefined,
      })
    : null;

  const previewTopsSpecRaw = isTopsCategory
    ? buildTopsSpecRaw({
        shape: topsShape || undefined,
        sleeve: topsSleeve || undefined,
        length: topsLength || undefined,
        neck: topsNeck || undefined,
        design: topsDesign || undefined,
        fit: topsFit || undefined,
      })
    : null;
  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">アイテム管理</p>
            <h1 className="text-2xl font-bold text-gray-900">新規作成</h1>
          </div>

          <Link href="/items" className="text-sm font-medium text-blue-600 hover:underline">
            一覧に戻る
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                カテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.category ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">選択してください</option>
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="shape" className="mb-1 block text-sm font-medium text-gray-700">
                形
              </label>
              <select
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                disabled={!category || isTopsCategory}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.shape ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">選択してください</option>
                {shapeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.shape && <p className="mt-2 text-sm text-red-600">{errors.shape}</p>}
            </div>
          </section>

          {isTopsCategory && (
            <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">トップス仕様</p>
                <p className="mt-1 text-xs text-gray-500">
                  トップス選択時のみ、形・袖・丈・首回り・デザイン・シルエットを指定できます。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="tops-shape" className="mb-1 block text-sm font-medium text-gray-700">
                    形
                  </label>
                  <select
                    id="tops-shape"
                    value={topsShape}
                    onChange={(e) => handleTopsShapeChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {TOPS_SHAPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-sleeve" className="mb-1 block text-sm font-medium text-gray-700">
                    袖
                  </label>
                  <select
                    id="tops-sleeve"
                    value={topsSleeve}
                    onChange={(e) => setTopsSleeve(e.target.value as TopsSleeveValue | "")}
                    disabled={!topsShape}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {availableTopsSleeves.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-length" className="mb-1 block text-sm font-medium text-gray-700">
                    丈
                  </label>
                  <select
                    id="tops-length"
                    value={topsLength}
                    onChange={(e) => setTopsLength(e.target.value as TopsLengthValue | "")}
                    disabled={!topsShape}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {availableTopsLengths.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-neck" className="mb-1 block text-sm font-medium text-gray-700">
                    首回り
                  </label>
                  <select
                    id="tops-neck"
                    value={topsNeck}
                    onChange={(e) => setTopsNeck(e.target.value as TopsNeckValue | "")}
                    disabled={!topsShape}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">選択してください</option>
                    {availableTopsNecks.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-design" className="mb-1 block text-sm font-medium text-gray-700">
                    デザイン
                  </label>
                  <select
                    id="tops-design"
                    value={topsDesign}
                    onChange={(e) => setTopsDesign(e.target.value as TopsDesignValue | "")}
                    disabled={!topsShape || availableTopsDesigns.length === 0}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{availableTopsDesigns.length ? "未選択" : "選択肢がありません"}</option>
                    {availableTopsDesigns.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tops-fit" className="mb-1 block text-sm font-medium text-gray-700">
                    シルエット
                  </label>
                  <select
                    id="tops-fit"
                    value={topsFit}
                    onChange={(e) => setTopsFit(e.target.value as TopsFitValue)}
                    disabled={!topsShape}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {availableTopsFits.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">色</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">メインカラー</label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomMainColor}
                    onChange={(e) => {
                      setUseCustomMainColor(e.target.checked);
                      if (e.target.checked) setMainColor("");
                    }}
                    className="h-4 w-4"
                  />
                  カスタムカラーを使う
                </label>

                {useCustomMainColor ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <input type="color" value={customMainHex} onChange={(e) => setCustomMainHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1" />
                    <input type="text" value={customMainHex} onChange={(e) => setCustomMainHex(e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.mainColor ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                ) : (
                  <ColorSelect
                    value={mainColor}
                    onChange={setMainColor}
                    placeholder="選択してください"
                  />
                )}
                {errors.mainColor && <p className="mt-2 text-sm text-red-600">{errors.mainColor}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">サブカラー</label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomSubColor}
                    onChange={(e) => {
                      setUseCustomSubColor(e.target.checked);
                      if (e.target.checked) setSubColor("");
                    }}
                    className="h-4 w-4"
                  />
                  カスタムカラーを使う
                </label>

                {useCustomSubColor ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <input type="color" value={customSubHex} onChange={(e) => setCustomSubHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1" />
                    <input type="text" value={customSubHex} onChange={(e) => setCustomSubHex(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </div>
                ) : (
                  <ColorSelect
                    value={subColor}
                    onChange={setSubColor}
                    placeholder="未選択"
                    emptyOptionLabel="色を選ばない"
                  />
                )}
              </div>
            </div>

            {(selectedMainColor || selectedSubColor) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">選択中の色</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMainColor && <ColorChip label={selectedMainColor.label} hex={selectedMainColor.hex} tone="main" />}
                  {selectedSubColor && <ColorChip label={selectedSubColor.label} hex={selectedSubColor.hex} tone="sub" />}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">季節・TPO</h2>

            <div>
              <p className="mb-2 text-sm font-medium">季節</p>
              <div className="flex flex-wrap gap-3">
                {SEASON_OPTIONS.map((season) => {
                  const checked = selectedSeasons.includes(season);
                  return (
                    <label key={season} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}>
                      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={() => toggleValue(season, selectedSeasons, setSelectedSeasons)} />
                      {season}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">TPO</p>
              <div className="flex flex-wrap gap-3">
                {TPO_OPTIONS.map((tpo) => {
                  const checked = selectedTpos.includes(tpo);
                  return (
                    <label key={tpo} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}>
                      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={() => toggleValue(tpo, selectedTpos, setSelectedTpos)} />
                      {tpo}
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "作成中..." : "作成する"}
            </button>

            <Link href="/items" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              キャンセル
            </Link>
          </div>
        </form>

        <ItemPreviewCard
          name={name}
          category={category}
          shape={shape}
          mainColorHex={selectedMainColor?.hex}
          mainColorLabel={selectedMainColor?.label}
          subColorHex={selectedSubColor?.hex}
          subColorLabel={selectedSubColor?.label}
          topsSpec={previewTopsSpec}
          topsSpecRaw={previewTopsSpecRaw}
        />

        {submitError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>}
        {submitSuccess && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{submitSuccess}</div>}
      </div>
    </main>
  );
}
