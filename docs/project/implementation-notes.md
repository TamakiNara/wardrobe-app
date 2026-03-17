# Wardrobe App 作業メモ

このファイルは、現在の実装状況と次に着手する内容を共有するための引き継ぎメモです。
設計の正本は `docs/` 配下の各資料を参照し、日々の実装状況と判断メモはこのファイルに集約します。

## 現在の実装状況

### 技術構成

- フロント: Next.js (App Router)
- BFF: Next.js Route Handler / API Route
- バックエンド: Laravel
- DB: MySQL
- 認証: Laravel Session Authentication
- UI: Tailwind CSS

### 認証

実装済み:

- ユーザー登録
- ログイン
- ログアウト
- ログイン状態確認 (`/api/me`)

方針:

- Laravel のセッション認証を利用
- BFF 経由で Cookie と CSRF を Laravel に引き渡す
- API 未認証時は JSON の `401 Unauthenticated.` を返す
- フロント側で 401 を検知してログインへ誘導する

要調整:

- ログイン状態切れでログイン画面へ戻った直後、1回目のログイン送信で `CSRF token mismatch.` になることがある
- 現状はそのままもう一度ログインすると通るが、不自然なので後で解消する
- セッション切れ後の再ログイン導線で、CSRF Cookie の再取得タイミングを見直す

### settings

実装済み:

- `GET /api/settings/categories` で現在のカテゴリ表示設定を取得できる
- `PUT /api/settings/categories` で `visible_category_ids` を保存できる
- settings 画面でカテゴリ表示設定の取得・保存ができる
- create / edit / list のカテゴリ候補は、保存済みのカテゴリ表示設定を考慮する
  - 新規作成では ON の大分類だけをカテゴリ候補に出す
  - 一覧では ON の大分類だけをカテゴリ絞り込みに出す
  - 編集では基本は ON の大分類だけを出す
  - ただし編集中のアイテムが現在 OFF のカテゴリだった場合は、そのカテゴリだけは残す
- items 一覧では、OFF にしたカテゴリのアイテム自体も一覧表示から外す
- outfits 新規作成では、OFF にしたカテゴリのアイテムは選択候補に出さない
- outfits 編集では、OFF にしたカテゴリのアイテムは候補から外す
  - ただし現在そのコーディネートに含まれているアイテムは、編集不能にしないため候補へ残す
- outfits 一覧では、コーディネート自体は残しつつ、表示アイテム数を現在の表示設定で再計算する
- outfits 詳細では、OFF にしたカテゴリのアイテムを非表示にし、非表示件数を案内する

### 次の作業予定

優先順:

1. settings の未保存変更まわりを仕上げる
   - 未保存変更の検知
   - 離脱警告
   - 保存ボタンの活性制御
2. カテゴリ表示設定の一括操作確認ダイアログを入れる
   - `すべてON / すべてOFF` 実行時の確認
   - 登録済みアイテム件数を警告表示に含める
3. 認証切れ後の `CSRF token mismatch` を解消する
   - 再ログイン時の CSRF Cookie 再取得タイミングを見直す
4. tops SVG の見た目調整に戻る
   - `tshirt / shirt / blouse` の細部調整を再開する

### items

実装済み:

- 一覧
- 新規作成
- 詳細
- 編集
- 削除
- 一覧フィルタ

今回までの反映内容:

- `tops spec` を `items.spec` として保存可能にした
- create / edit / detail / list の各画面で `spec.tops` を利用するように統一した
- `ItemPreviewCard` と一覧カードで tops SVG プレビューを利用するようにした
- `tshirt` に加えて `shirt / blouse / knit / cardigan / camisole / tanktop` の SVG プレビューに対応した
- `tops` 用 master-data (`shape / sleeve / length / neck / design / fit`) を UI に反映した
- 詳細画面では `topsSpecRaw` を nullable-safe に組み立てるよう修正した
- `spec.tops` の表示ラベル変換を共通化し、detail / create / edit のプレビュー表示で同じ変換を使うようにした
- category / shape の表示は master-data の日本語ラベルを使うように統一した
- category master を DB / Seeder / API に追加し、GET /api/categories を利用できるようにした
- create / edit / list のカテゴリ選択肢は categories API を読む下地を追加した
- tops の形表示は `Tシャツ/カットソー` `ニット/セーター` など、画面間で揺れない名称に整理した

現状のデータ項目:

- `name`
- `category`
- `shape`
- `colors`
- `seasons`
- `tpos`
- `spec`

`spec` の現状:

- `items.spec` は JSON カラム
- 現在は `spec.tops` を保存対象として使用
- 想定キーは `shape / sleeve / length / neck / design / fit`

UI/UX メモ:

- tops を選んだときだけ spec 入力 UI を表示する
- shape に応じて選択可能な sleeve / length / neck / design / fit を絞り込む
- 入力中の内容は下部プレビューへ即時反映する
- 一覧でも tops 形状が分かるよう SVG プレビューを利用する

### items 追加候補（TODO）

検討中の項目:

- `brand_name`：ブランド名
- `memo`：メモ
- `weather_tags`：天気対応（例：雨対応、防寒、晴れ向きなど）
- `size_gender`：メンズ / ウィメンズ
- `size_label`：S / M / L / FREE など
- `size_details`：実寸の詳細
- `price`：購入金額
- `purchase_url`：商品ページなどの URL
- 画像アップロード
  - `item_images` テーブルを分ける案を想定
  - `is_primary` を使い、優先画像がある場合は SVG ではなく画像をアイコン表示する

仮案として想定している items テーブル追加項目:

- `category_id`
- `brand_name`
- `memo`
- `price`
- `purchase_url`
- `size_gender`
- `size_label`
- `weather_tags` （json）
- `size_details` （json）

仮案として想定している item_images テーブル:

- `id`
- `item_id`
- `url`
- `is_primary`
- `sort_order`
- `created_at`
- `updated_at`

補足:

- これらはまだ未実装の TODO であり、現時点の DB / API 仕様には含めない
- `category_id` はカテゴリ master 連携を進める場合の移行候補としての位置づけ
- 画像優先表示は item 一覧 / 詳細 / コーディネート選択画面への影響があるので、UI 仕様と同時に検討する
- 透け感の表現として、SVG の `opacity` 属性を使う案を検討対象に含める

### カラーパレット

- プリセットカラーを `ベーシック / アース / ディープ / ペール / ビビッド` の 5 グループで管理するようにした
- create / edit の色選択 UI はグループ単位で選べるよう `optgroup` 表示にした
- docs 貼り付け用のカラーパレット画像を追加した

![プリセットカラー一覧](../assets/item-colors-palette.svg)

### outfits

実装済み:

- 一覧
- 新規作成
- 詳細
- 編集
- 削除
- 一覧フィルタ

項目:

- `name`
- `memo`
- `seasons`
- `tpos`
- `items`
- `sort_order`

### ホーム画面

実装済み:

- ログイン後ホーム
- 未ログイン時ホーム
- アイテム件数
- コーディネート件数
- アイテム一覧 / 新規作成への導線
- コーディネート一覧 / 新規作成への導線
- ログアウトボタン

---

## 今回の変更点

### バックエンド

- `items` テーブルに `spec` JSON カラムを追加
- `Item` モデルで `spec` を `fillable` / `cast` 対象に追加
- `POST /api/items` と `PUT /api/items/{id}` で `spec.tops.*` を受け付けるように変更

### フロントエンド

- `CreateItemPayload` / `ItemRecord` に `spec` 型を追加
- 新規作成画面で `payload.spec.tops` を送信するよう変更
- 編集画面で保存済み `spec.tops` を復元・再編集可能に変更
- 詳細画面で `spec.tops` を利用したプレビュー表示を追加
- 一覧画面で `spec.tops.shape` がある場合は SVG プレビューを表示
- 詳細画面の関連コンポーネント (`ItemPreviewCard`, `DeleteItemButton`) の日本語文字化けを修正
- `tops spec` の表示ラベル共通ヘルパーを追加し、各画面のプレビュー欄で再利用するように変更
- `item-shapes` 側に category / shape の表示ラベル関数を追加し、一覧 / 詳細 / プレビューカードの表記を統一

### ドキュメント

- `docs/specs/items/tops.md` を現行実装に合わせて更新
- `docs/data/database.md` に `items.spec` を追記
- `docs/api/api-overview.md` に `spec.tops` を含む items API の概要を追記

---

## 次にやること

優先度順:

1. tops SVG の形状差分をさらに細かくする
2. 一覧カードに tops 仕様の要約表示を出すか検討する
3. docs の OpenAPI / database / architecture の整合を追加確認する

---

## 注意点

- `docs/project/implementation-notes.md` は作業ログ寄りの資料として運用する
- 設計の正本は `docs/api/api-overview.md` `docs/data/database.md` `docs/architecture/system-overview.md` を参照する
- 日本語テキストは UTF-8 前提で編集すること

## 今後の課題（settings）

- `すべてOFF` と個別カテゴリ `OFF` の前に、登録件数がある場合のみ `現在〇アイテム` を含む確認ダイアログを表示する
- `ON` に戻す操作では確認ダイアログを出さず、OFF 時のみデータが削除されないことをダイアログで明示する
- 未保存変更がある状態で、再読み込みやタブを閉じる操作をしたときはブラウザの離脱警告を出す
- ページ内遷移での未保存変更警告は未対応のため、必要に応じて今後整理する
