# Wardrobe App 分岐メモ（CODEX引き継ぎ用）

このドキュメントは、この分岐で話し合って決まった内容・方針・将来機能案を、日本語でまとめた引き継ぎ用メモである。  
今後 CODEX で作業を継続できるよう、実装済み事項・設計方針・将来拡張を一括で整理する。

---

# 1. 現在のアプリ概要

Wardrobe App は、服アイテムとコーディネートを管理する Web アプリである。  
基本構成は以下。

- フロント: Next.js (App Router)
- BFF: Next.js API Route
- バックエンド: Laravel
- DB: MySQL
- 認証: Laravel セッション認証
- CSRF: Laravel の csrf-cookie フロー利用
- デザイン: Tailwind CSS

構成イメージ:

- Browser
- Next.js (BFF)
- Laravel API
- Database

---

# 2. 実装済み機能

## 2-1. 認証

実装済み:

- ユーザー登録
- ログイン
- ログアウト
- ログイン状態取得 (`/api/me`)

方針:

- Laravel の session auth を使用
- CSRF cookie を取得して BFF 経由で API 通信
- API 未認証時は JSON で `401 Unauthenticated.` を返す
- `/api/*` は login ルートへリダイレクトさせない

BFF 側の役割:

- Cookie を Laravel へ転送
- 必要に応じて CSRF cookie を取得
- Laravel レスポンスの cookie をブラウザへ返す

補足:

- DELETE 系は最終的に Laravel 側で BFF 管理下の一部 API を CSRF 例外にして安定化した
- BFF helper は GET / POST / PUT / DELETE 用に整理した

---

## 2-2. アイテム管理（Items）

実装済み:

- 一覧
- 新規登録
- 詳細
- 編集
- 削除
- 一覧絞り込み

追加実装（この分岐）:

- tops spec UI（shape / sleeve / length / neck / design / fit）
- アイテム登録画面のリアルタイムプレビュー
- SVG による形状表示
- tops master-data 分離

現在のフロント構造:

web/src
  components/items
    item-preview-card.tsx
    preview-svg/
      tops-preview-svg.tsx
      tshirt-preview-svg.tsx

  lib/master-data
    item-tops/
      shapes.ts
      sleeves.ts
      lengths.ts
      necks.ts
      designs.ts
      fits.ts
      rules.ts
      index.ts

保存項目（現状）:

- name
- category
- shape
- colors
- seasons
- tpos

UI/UX:

- 一覧・詳細・新規・編集ページにパンくず風ナビゲーション追加
- 一覧から TOP に戻る導線あり
- セッション切れ時はログイン画面へ戻す

一覧絞り込み:

- category
- season
- tpo

季節絞り込み仕様:

- `オール` を含むアイテムは特定季節フィルタでも一致扱い
- 未設定 (`[]`) もオールシーズン扱いとして一致させる方針

---

## 2-3. コーデ管理（Outfits）

実装済み:

- 一覧
- 新規登録
- 詳細
- 編集
- 削除
- 一覧絞り込み

保存項目:

- name（未指定可）
- memo
- seasons
- tpos
- items（複数）
- sort_order

方針:

- outfit と outfit_items の 2 テーブル構成
- 順序は `sort_order` で保持
- name 未指定時は「名称未設定コーデ」にせず空欄表示

一覧絞り込み:

- season
- tpo

季節絞り込み仕様:

- items 一覧と同じ考え方
- `オール` および未設定は特定季節フィルタでも一致扱い

---

## 2-4. ホーム画面

実装済み:

- ログイン済みホーム
- 未ログインホーム
- アイテム件数
- コーデ件数
- アイテム一覧 / 新規追加への導線
- コーデ一覧 / 新規追加への導線
- ログアウトボタン

方針:

- 公開アプリとして「入口ページ」になるよう設計
- ログイン済みユーザーが次に何をするか分かりやすい構成

---

## 2-5. ドキュメント整備

作成・更新済みのもの:

- `docs/system-architecture.md`
- `docs/api.md`
- `docs/database.md`
- 設計判断ログ
- README
- Product roadmap 系メモ
- tops 仕様書

---

# 3. BFF / Laravel 連携方針

## 3-1. BFF を採用した理由

- ブラウザから Laravel へ直接通信せず、Next.js を境界にできる
- Cookie / CSRF / セッション周りの扱いをフロント画面から分離できる
- 将来的な API 差し替えや公開時の保守がしやすい
- 認証まわりの複雑さを UI 実装から隠せる

---

## 3-2. Session auth を採用した理由

- Laravel 標準の仕組みに乗りやすい
- BFF 経由と相性が良い
- 個人用アプリから公開アプリへ拡張しても扱いやすい
- ログイン状態の扱いが直感的

---

## 3-3. `/api/items` や `/api/outfits` を web ミドルウェア下に置く理由

- session auth を前提にするため
- 同じ cookie / CSRF の流れで扱うため
- API だが認証モデルは Laravel Web に近い構成にするため

---

# 4. 現在のデータ設計方針

## 4-1. JSON で保存しているもの

現時点で JSON として扱うもの:

- colors
- seasons
- tpos

理由:

- MVP では柔軟性を優先したい
- 複雑な中間テーブルを避けたい
- 将来仕様変更が起きても拡張しやすい

---

## 4-2. アイテム形状の将来方針

現状は `shape` を持っているが、将来的にはより構造化する方針。

トップスは次の属性で持つ想定:

- shape
- sleeve
- length
- neck
- design
- fit

この方針は `docs/item-spec-tops.md` に整理済み。

---

# 5. tops 仕様方針（重要）

トップスは以下の 6 属性で表現する。

- shape
- sleeve
- length
- neck
- design
- fit

UI の入力順:

1. shape
2. sleeve
3. length
4. neck
5. design
6. fit

---

## 5-1. shape

想定値（MVP 優先）:

- tshirt
- shirt
- blouse
- knit
- cardigan
- camisole
- tanktop

---

## 5-2. sleeve

想定値:

- short
- five
- seven
- long
- sleeveless
- french
- camisole

方針:

- 袖の長さ・有無のみを sleeve で持つ
- ラグランのような構造差は sleeve に混ぜない

---

## 5-3. design

想定値（MVP）:

- raglan

方針:

- `raglan_short` / `raglan_long` のように sleeve に混ぜない
- 例:
  - 半袖ラグラン → sleeve = short, design = raglan
  - 長袖ラグラン → sleeve = long, design = raglan

将来拡張候補:

- lantern
- puff
- gather
- frill
- peplum など

ボトムスにも同じ考え方を適用予定:

- tight
- mermaid
- flare
- pleated
- wrap など

---

## 5-4. length

想定値:

- short
- normal
- long

補足:

- `oversized` は length ではなく fit として扱う

---

## 5-5. neck

想定値:

- crew
- v
- turtle
- mock

将来拡張候補:

- boat
- square
- henley
- off_shoulder など

---

## 5-6. fit

想定値:

- normal
- oversized

方針:

- design とは分ける
- fit は最後に選ぶ
- トップス中心の概念だが、将来ボトムスにも近い概念を拡張する余地あり

---

# 6. SVG 表示方針

## 6-1. 目的

- 画像アップロードなしでも形の違いを一目で分かるようにする
- 色と形を一覧で統一感を持って見せる
- 登録前プレビューにも使えるようにする

この分岐で Tシャツ用 SVG を導入済み。

仕様:

- viewBox: `0 0 300 300`
- silhouette SVG をコードに直接埋め込む
- mainColor で本体を塗る
- raglan の場合のみ袖を subColor で描画
- subColor の用途が無い場合は右下に色チップ表示
- 正中線は tshirt では表示しない

---

## 6-2. 基本ルール

- SVG はコードで管理する
- shape ベース + 差分属性で描画する
- viewBox は統一する
- 線色は固定濃色にする
- メインカラーで本体を塗る
- サブカラーは意味がある時のみパーツに使う
- 使い道がない場合は右下の丸チップで表現する

線色の例:

- `#334155`

---

## 6-3. サブカラーの扱い

### サブカラーをパーツに使うケース
- design = raglan → 袖
- 配色トップス → 襟 / 袖口 / 切替
- キャミソール → 肩紐
- 将来のワンピース → ベルト / 切替 など

### 使い道がないケース
- 右下に小さい色チップ（●）で表示

---

## 6-4. 正中線の扱い

「正中線は基本表示しない」は広すぎるため修正済み。

ルール:

- 正中線は前開き構造があるトップスのみ表示する
- 表示しない:
  - tshirt
  - knit
  - tanktop
  - camisole
- 表示する:
  - shirt
  - 前開き blouse
  - cardigan

---

## 6-5. SVG 差分の考え方

描画順:

1. shape
2. sleeve
3. neck
4. length
5. design
6. fit

方針:

- shape = ベース輪郭
- sleeve = 袖差分
- neck = 首回り差分
- length = 裾差分
- design = 装飾差分
- fit = 全体バランス差分

現在実装済み:

- tshirt silhouette

未実装:

- shirt
- blouse
- knit
- cardigan
- camisole
- tanktop

実装方針:

shape ごとに SVG base を用意し
差分属性で変形する構造にする。
---

## 6-6. 登録前プレビュー

将来的に必ず相性が良い機能。

想定:

- category 選択
- shape / sleeve / length / neck / design / fit を選択
- mainColor / subColor を選択
- SVG がリアルタイム更新

まずは tops から導入する方針。

---

# 7. レディース先行・将来メンズ対応方針

## 7-1. 基本方針

- 最初はレディース先行
- 将来的にメンズ対応可能な構造を意識
- gender でカテゴリ構造を固定しない
- ユーザーごとに「使う分類」を持つ

---

## 7-2. 分類セット方式

ユーザー登録後に次を選ぶ想定:

- 女基本セット
- 男基本セット
- カスタム

あとで設定画面から変更可能にする。

### 女基本セットのイメージ
- tops
- bottoms
- skirts
- dresses
- outers
- shoes
- bags

### 男基本セットのイメージ
- tops
- bottoms
- outers
- shoes
- bags

### カスタム
- 全カテゴリからチェックボックスで選択

---

## 7-3. DB 方針

ユーザー単位で JSON を持つ想定。

例:

- classification_preset
- category_visibility

イメージ:

```json
{
  "preset": "female_basic",
  "categoryVisibility": {
    "tops": true,
    "bottoms": true,
    "skirts": true,
    "dresses": true,
    "outers": true,
    "shoes": true,
    "bags": true
  }
}
```

方針:

- category マスタ自体は全員共通
- 表示 ON/OFF はユーザーごとに持つ
- まずは category_visibility だけで十分
- shape_visibility までは MVP ではやらない

---

## 7-4. サイズ対応

Item にはサイズを持たせたい。

方針:

- サイズ系は分類表示とは別概念で持つ
- size_system は未選択可

想定値:

- women
- men
- unisex
- null

例:

```json
{
  "sizeSystem": "unisex",
  "sizeLabel": "L"
}
```

# 8. コーデ自動生成に関する考え方

## 8-1. 自動生成は安易にしない

方針:

- コーデは単純組み合わせでは決められない
- 自動生成を大量に行うと「ゴミコーデ」「飽和」が起きやすい
- ユーザーの邪魔になる危険がある

したがって、方針は

- 自動生成 ×
- 候補提示 / 支援 ○

---

## 8-2. 代わりに相性の良い機能

- この服と合う服
- この服で作れるコーデ
- 最近着ていない既存コーデの提示
- 条件に合うコーデ候補を数件だけ出す
- 購入候補を追加したら増えるコーデ数を示す

アプリのコンセプトは

- コーデ生成アプリではなく
- クローゼット支援アプリ
- ワードローブ最適化ツール

に寄せる方針。

---

# 9. 将来機能ロードマップ

## 9-1. 公開アプリ前提の考え方

優先したいもの:

- 初見ユーザーでも価値が分かる
- 続ける意味がある
- 既存機能と自然につながる
- 差別化できる

## 9-2. 強い機能候補

### 1. 購入候補管理（Wishlist）

かなり相性が良い。

保存項目候補:

- name
- brand
- price
- url
- color
- category
- memo
- status

status 候補:

- candidate
- purchased
- discarded

価値:

- 欲しい服を整理できる
- 衝動買い防止
- 手持ち服との相性判断に広げられる

### 1. 着用履歴（Wear Logs）

かなり強い。

保存項目候補:

- date
- outfit_id
- memo
- optional weather
- optional temperature

価値:

- 着用頻度の可視化
- 未着用アイテムの発見
- コーデカレンダーにつながる
- 継続利用につながる

### 3. 不足アイテム分析

強い差別化ポイント。

例:

- 夏トップス不足
- 仕事用パンツ不足
- 休日用シューズ不足

価値:

- クローゼットの偏りが見える
- 買い物判断を支援できる

### 4. 着回し力スコア

かなり面白い神機能候補。

概念:

- この服が何コーデ作れるか
- この購入候補を買うと何コーデ増えるか

例:

- 白Tシャツ → 4コーデ
- 青シャツ → 1コーデ

価値:

- 買い物判断
- コスパ判断
- 服の活用度の可視化

### 5. 購入候補の価値判定

wishlist と手持ち服をつなぐ。

例:

- このスカートを買うと 5 コーデ増える
- 似た服が既にあります

### 6. パーソナルカラー

段階的に導入したい。

まずはプロフィールに保存。

値候補:
- spring
- summer
- autumn
- winter

将来的な用途:

- 色おすすめ
- 手持ち分析
- 不足色分析

### 7. 顔タイプ

こちらも段階的に導入。

例:

- cute
- fresh
- elegant
- cool

用途:

- ネックライン提案
- shape 提案
- style recommendation

### 8. 統計・可視化

例:

- 色分布
- カテゴリ分布
- 季節分布
- 着用回数ランキング

---

## 9-3. 公開前提のおすすめ優先順位

最優先

1. wishlist
2. 登録前 SVG プレビュー
3. wear_logs

次点

4. personal color 登録
5. face type 登録

その後

6. 不足アイテム分析
7. この服と合う服
8. 着回し力スコア
9. AI 提案

---

# 10. 将来のコンセプト

Wardrobe App は最終的に

- 服管理アプリではなく
- パーソナルスタイリング支援ツール
- ワードローブ最適化ツール

へ進化させる方針。

目標:

- 服の整理
- コーデの整理
- 買い物判断
- 自分に似合う服選び
- 手持ち服の最大活用

を一つのアプリで支援する。

---

# 11. 次の実装候補（優先）

現時点で次に実装候補として有力なもの:

1. wishlist
2. wear_logs
3. tops の spec 設計を UI に反映
4. 登録前 SVG プレビュー
5. アイテム spec JSON 化
6. 分類セット（female_basic / male_basic / custom）

---

# 12. tops 仕様書に関する補足

`docs/item-spec-tops.md` について補足。

修正済み・確認済み事項:

- shape / sleeve / length / neck / design / fit の 6 属性
- raglan を design に分離
- fit は design に含めず別管理
- キャミ → camisole
- 正中線ルール修正
- サブカラー使用ルール修正

残りの補足ポイント:

- Overview に design を含める
- Example に design を入れる
- Preview Policy に design を入れる
- fit の default を実装時に決める

default の推奨:

- shape: required
- sleeve: null
- length: null
- neck: null
- design: null
- fit: normal

# 12-2. tops UI 実装メモ

items/new 画面に tops 専用入力 UI を追加済み。

入力順:

1 shape
2 sleeve
3 length
4 neck
5 design
6 fit

UI 挙動:

- shape 変更時に defaults を適用
- TOPS_RULES を参照して選択肢を制御
- preview card がリアルタイム更新

プレビュー構成:

ItemPreviewCard
  ↓
TopsPreviewSvg
  ↓
TshirtPreviewSvg

---

# 13. 実装上の注意

- いきなり全カテゴリで spec を拡張しない
- まず tops だけ先行導入
- まずフロント側 UI / プレビューから試作してもよい
- DB は最終的に spec JSON を items に追加する方向が自然
- SVG は最初から全種類作らず、使用頻度の高いものから段階導入する
- 公開前提なので、入力項目が多すぎないよう「最低限入力モード」と「詳細入力モード」の分離も将来検討する

# 14. CODEX で次に作業しやすい順番

推奨順:

1. tshirt SVG の微調整
2. shirt SVG 実装
3. blouse SVG 実装
4. items.spec JSON カラム追加
5. tops spec を DB 保存
6. preview SVG と spec JSON の接続
7. wishlist 実装
8. wear_logs 実装

# 15. この分岐での基本方針まとめ

- レディース先行
- 将来メンズ対応可能にする
- gender で構造を固定しない
- ユーザーごと分類セット方式
- コーデは大量自動生成しない
- 生成より支援を優先
- 服管理からワードローブ最適化へ進化させる
- tops は shape / sleeve / length / neck / design / fit で管理する
- SVG は登録前プレビューまで見据えて設計する

