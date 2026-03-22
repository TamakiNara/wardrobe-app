# Wardrobe App 作業メモ

このファイルは、現在の実装状況と次に着手する内容を共有するための引き継ぎメモです。
設計の正本は `docs/` 配下の各資料を参照し、日々の実装状況と判断メモはこのファイルに集約します。

## 直近TODO

優先順:

1. 一覧画面の検索・絞り込み・並び順仕様を実装へ落とし込む
   - URL クエリ / AND 条件 / sort / page / 共通 UI 枠の方針は `docs/specs/discovery/list-common-guidelines.md` を正本にする
2. 各画面のエラーメッセージと空状態を整理する
   - login / register / item / settings / outfits の共通文言を詰める
3. 一覧件数が増えたときのページング方針を整理する
   - UI は もっと見る、API は page / per_page または cursor / limit を検討する
4. tops SVG の見た目調整に戻る
   - tshirt / shirt / blouse の細部調整を再開する
5. ログ設計の方針を整理する
   - アプリケーションログと一部イベントログの方針を詰める
6. docs の OpenAPI / database / architecture の整合を追加確認する
   - `docs/data/database.md` に残っている英語見出し / 英語本文も段階的に日本語へ統一する

## 進行中

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
- 新規登録完了後はカテゴリプリセット選択画面へ遷移し、`male / female / custom` の初期設定を完了してからホームへ進む
- `custom` を選んだ場合は settings の onboarding モードで全カテゴリ ON から調整し、保存後にホームへ遷移する

未完了:

- ページ内遷移での未保存変更警告は未対応のため、必要に応じて今後整理する

### テスト用 seed ユーザー

実装済み:

- 3 アカウント固定の `empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を Seeder で作成する
- デフォルトパスワードは `password123` 、env は `TEST_SEED_USER_PASSWORD` で上書きできる
- `TestDatasetSeeder` で、テスト用ユーザーと sample data だけを再投入できる
- `standard-user` には手書き 7 件の items と 3 件の outfits を紐づける
- `large-user` には Factory 併用の 36 件の items と 12 件の outfits を紐づける
- `empty-user` は items / outfits 0 件の初期状態として再生成する

補足:

- 現行 schema では item の brand / memo / image URL までは持てないため、sample data では category / colors / seasons / tpos / spec を中心に再現している

### 認証

実装済み:

- ユーザー登録
- ログイン
- ログアウト
- ログイン状態確認 (`/api/me`)
- 認証切れ後の再ログインで、BFF が CSRF / session cookie を補完しながら自動再試行できる

方針:

- Laravel のセッション認証を利用
- BFF 経由で Cookie と CSRF を Laravel に引き渡す
- API 未認証時は JSON の `401 Unauthenticated.` を返す
- フロント側で 401 を検知してログインへ誘導する

今回の反映内容:

- BFF の `POST / PUT / DELETE` で CSRF と `laravel-session` cookie を共通的に扱うよう整理した
- `csrf-cookie` の応答が 1 行の `set-cookie` として返る場合でも、`XSRF-TOKEN` と `laravel-session` を分離して引き継ぐようにした
- 更新系リクエストが `419 / CSRF token mismatch` を受けた場合は、CSRF Cookie を再取得して 1 回だけ自動再試行する
- `DELETE` でも `X-CSRF-TOKEN` を付けて Laravel へ転送するようにした
- seed 用アカウントでも使えるよう、ログイン / 登録のメールアドレス検証は `email:rfc` を使う

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
- category master を DB / Seeder / API に追加し、`GET /api/categories` を利用できるようにした
- create / edit / list のカテゴリ選択肢は categories API を読む下地を追加した
- Item 新規作成 / 編集のカテゴリ候補に `dress` と `inner` を追加し、ワンピース・オールインワン / ルームウェア・インナーも設定連動で選べるようにした
- tops の形表示は `Tシャツ/カットソー` `ニット/セーター` など、画面間で揺れない名称に整理した

次に詰める候補:

- tops SVG の形状差分をさらに細かくする
- 一覧カードに tops 仕様の要約表示を出すか検討する

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
- ホーム / アイテム / コーディネート / 設定 の共通ボトムナビ
- アイテム件数
- コーディネート件数
- アイテム一覧 / 新規作成への導線
- コーディネート一覧 / 新規作成への導線
- ログアウトボタン

## 後回し

### items の現状メモ

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

### items 追加候補

検討中の項目:

- `brand_name`：ブランド名
- `memo`：メモ
- `is_rain_ok`：雨対応フラグ（boolean、初期値 false を想定）
- `weather_tags`：天気対応の拡張タグ。必要になるまで後回し
- `size_gender`：メンズ / ウィメンズ
- `size_label`：S / M / L / FREE など
- `size_details`：実寸の詳細
- `price`：購入金額
- `purchase_url`：商品ページなどの URL
- `purchased_at`：購入日
- `last_worn_at`：最終着用日
- `wear_count`：着用回数
- `is_favorite`：お気に入り
- 画像アップロード
  - `item_images` テーブルを分ける案を想定
  - `is_primary` を使い、優先画像がある場合は SVG ではなく画像をアイコン表示する

仮案として想定している items テーブル追加項目:

- `category_id`
- `brand_name`
- `memo`
- `price`
- `purchase_url`
- `purchased_at`
- `last_worn_at`
- `wear_count`
- `is_favorite`
- `size_gender`
- `size_label`
- `is_rain_ok`
- `size_details` （json）
- `tags` / `item_tags` （別テーブル構成を想定）
仮案として想定している item_images テーブル:

- `id`
- `item_id`
- `url`
- `is_primary`
- `sort_order`
- `created_at`
- `updated_at`

補足:

- `last_worn_at` と `wear_count` だけでは履歴一覧を完全には表現できないため、カレンダー連携や着用履歴を本格対応する場合は `wear_logs` のような別テーブル案も検討する

### カラーパレット

- プリセットカラーを `ベーシック / アース / ディープ / ペール / ビビッド` の 5 グループで管理するようにした
- create / edit の色選択 UI はグループ単位で選べるよう `optgroup` 表示にした
- docs 貼り付け用のカラーパレット画像を追加した

![プリセットカラー一覧](../assets/item-colors-palette.svg)

### API / ルーティング整理メモ

将来的な整理方針:

- `web.php` の items / outfits は Controller に分離したい
- 想定候補は `ItemsController` `OutfitsController`
- 作成系 / 更新系の入力は FormRequest に分離したい
- 想定候補は `StoreItemRequest` `UpdateItemRequest` `StoreOutfitRequest` `UpdateOutfitRequest`
- 先に docs 側では API を「認証系 API / 設定系 API / 参照マスタ API」の役割でも追えるように整理する

### タグ / 雨対応フラグ構想

将来仕様メモ:

- タグは共通マスタではなく、ユーザー単位で持つ
- `tags` `item_tags` `outfit_tags` の 3 テーブルを基本に考える
- タグは補助分類として使い、カテゴリ / TPO / 季節 / 天気の正式項目の代替にはしない
- 雨対応はまず `items.is_rain_ok` の boolean で持ち、`weather_tags` のような拡張は後回しにする
- 保存値に `#` は含めず、UI 表示だけで `#` を付ける想定にする
- 将来的に着用履歴へタグを付ける場合は `outfit_log_tags` の追加で拡張する

## 将来案

### 将来機能の候補

- 一括操作
  - アイテムの一括編集
  - アイテムの一括削除
  - お気に入り / 季節 / TPO の一括更新
- コーディネート生成
  - 手動補助として、選択中アイテムに合う候補を表示する
  - 半自動として、色 / 季節 / TPO をもとに候補を提案する
- 分析
  - 着用回数ランキング
  - カテゴリ別割合
  - 無駄買い分析
- カレンダー連携
  - 今日のコーディネート表示
  - 着用履歴の記録 / 閲覧
- 天気連動
  - 天気 API 連携
  - 雨 OK アイテム優先
- 画像活用
  - 自動トリミング / 背景除去
  - 色抽出
- AI拡張（将来）
  - コーディネート提案
  - 手持ちに合う服提案
  - 似ているアイテム検索

補足:

- `last_worn_at` と `wear_count` だけでは履歴一覧を完全には表現できないため、カレンダー連携や着用履歴を本格対応する場合は `wear_logs` のような別テーブル案も検討する
- コーディネート生成 / 分析 / 天気連動 / AI拡張は、Item のメタデータ拡充と着用履歴の設計が前提になる
- `wear_count` は軽量な集計値、`wear_logs` は履歴正本として役割を分ける構成も選択肢に入る
- 画像活用はアップロード基盤が先行し、その後に背景除去・色抽出を段階追加するのが自然

### 着用履歴構想

将来仕様メモ:

- `planned / worn` は同一レコードで扱い、トグルで相互切替可能とする
- `cancelled` / `skipped` は MVP では持たず、不要な予定や誤登録は削除で対応する
- 1 wear log = 1 着用イベントとし、同日複数件を許可する
- 順序は `event_date + display_order` で持ち、初期並び順は `event_date desc, display_order asc` を想定する
- 登録導線は `outfit から登録 / item から登録 / 着用履歴画面から日付先行で登録` を想定する
- `source_outfit_id` は「ベースにした outfit」を示す参照とし、実際に着た item 群の正本は `wear_log_items` とする
- MVP では snapshot なしで始め、まずは `source_item_id` / `source_outfit_id` と構成情報を正にする
- item は `active / disposed`、outfit は `active / invalid` の status 管理候補とし、wear logs 整合性と連動させる
- 詳細は `docs/specs/wears/wear-logs.md` と `docs/data/database.md` に整理

### 検索 / 絞り込み / 並び順構想

将来仕様メモ:

- 対象画面は item 一覧 / outfit 一覧 / 着用履歴一覧
- 検索はテキスト入力、絞り込みは選択式条件として UI を分離する
- 検索対象は item 名 / brand 名 / メモ の部分一致を基本とする
- 並び順は単一選択とし、初期値は items / outfits = 新しい順、wear logs = 日付の新しい順
- 0件時は未登録と絞り込み結果 0 件を別の空状態として扱う
- 詳細は `docs/specs/discovery/search-filter-sort.md` と `docs/specs/discovery/list-common-guidelines.md` に整理

### エラーメッセージと空状態構想

将来仕様メモ:

- エラーメッセージは丁寧語を基本にし、技術詳細は UI に出さない方向
- 原因は分かる範囲で簡潔に書き、可能な限り次の行動も案内する
- 空状態は「未登録」「条件不一致」「エラー由来」を分けて考える方向
- 一覧系の URL クエリ / ページング / 状態別 UI の共通方針は `docs/specs/discovery/list-common-guidelines.md` を参照する
- 詳細は `docs/specs/error-message-guidelines.md` と `docs/ui/empty-state.md` に整理

## 現在の実装状況

### 技術構成

- フロント: Next.js (App Router)
- BFF: Next.js Route Handler / API Route
- バックエンド: Laravel
- DB: MySQL
- 認証: Laravel Session Authentication
- UI: Tailwind CSS

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

## 注意点

- `docs/project/implementation-notes.md` は作業ログ寄りの資料として運用する
- 設計の正本は `docs/api/api-overview.md` `docs/data/database.md` `docs/architecture/system-overview.md` を参照する
- 日本語テキストは UTF-8 前提で編集すること
