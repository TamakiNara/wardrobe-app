# Wardrobe App 作業メモ

このファイルは、現在の実装状況と次に着手する内容を共有するための引き継ぎメモです。
設計の正本は `docs/` 配下の各資料を参照し、日々の実装状況と判断メモはこのファイルに集約します。

## 直近TODO

優先順:

1. settings の未保存変更まわりを仕上げる
   - 未保存変更の検知
   - 離脱警告
   - 保存ボタンの活性制御
2. カテゴリ表示設定の OFF 操作確認ダイアログを入れる
   - `すべてOFF` 実行時の確認
   - 大分類 / 中分類を OFF にする際、登録済みアイテム件数がある場合のみ確認
   - `現在〇アイテム` を警告表示に含める
   - OFF にしてもデータ自体は削除されないことをダイアログで明示する
   - `ON` に戻す操作では確認ダイアログを出さない
3. 認証切れ後の `CSRF token mismatch` を解消する
   - セッション切れ後の再ログイン導線で、CSRF Cookie の再取得タイミングを見直す
4. 新規登録後のカテゴリプリセット選択画面を作る
   - 登録完了後にプリセット選択画面へ遷移させる
   - `male / female / custom` を内部値とし、UI では `Men / Women / Custom` を表示する選択 UI を用意する
   - `custom` 選択時のカテゴリ微調整導線を整理する
   - 初回導線での保存タイミングを実装に落とす
5. アプリ全体の共通ボトムナビを追加する
   - タブは `ホーム / アイテム / コーディネート / 設定` の 4 つ
   - 初期実装では PC / スマホ共通で画面下部固定とする
   - アイコンは Lucide の `home / tshirt / sparkles / settings` を利用予定
   - 将来的に PC は上部ナビへ切り替える余地を残す
6. 一覧画面の検索・絞り込み・並び順仕様を固める
   - 対象は `items / outfits / wear logs` の 3 画面
   - 検索はテキスト入力、絞り込みは選択式条件として分離する
   - 並び順は単一選択、初期値は items / outfits = 新しい順、wear logs = 日付の新しい順とする
   - 0件時は「データ自体が0件」と「絞り込み結果が0件」を分けて扱う
7. 各画面のエラーメッセージと空状態を整理する
   - エラーメッセージの文体、情報量、行動案内の共通ルールを決める
   - 重要画面は `login / register / item create-edit / settings / outfits / image upload` を対象にする
   - 空状態は `items / outfits / settings / home` を先に整理し、wear logs / search 0 件 / error 系を後追いする
8. テスト用 seed ユーザーと sample data の方針を固める
   - 3 アカウント固定とし、`empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を使う
   - パスワードは README にデフォルト値を書き、env で上書き可能にする
   - 標準確認用は手書き中心、多件数確認用は Factory 併用で作る
   - 詳細は `docs/data/test-seed-users.md` に集約する
9. tops SVG の見た目調整に戻る
   - `tshirt / shirt / blouse` の細部調整を再開する
10. docs の OpenAPI / database / architecture の整合を追加確認する

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

未完了:

- `すべてOFF` と個別カテゴリ `OFF` の前に、登録件数がある場合のみ `現在〇アイテム` を含む確認ダイアログを表示する
- 未保存変更がある状態で、再読み込みやタブを閉じる操作をしたときはブラウザの離脱警告を出す
- ページ内遷移での未保存変更警告は未対応のため、必要に応じて今後整理する
- 新規登録直後のカテゴリプリセット選択画面は未着手

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
- 現状はそのままもう一度ログインすると通るが、不自然なので解消したい

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
- アイテム件数
- コーディネート件数
- アイテム一覧 / 新規作成への導線
- コーディネート一覧 / 新規作成への導線
- ログアウトボタン

## 後回し

### テスト用 seed ユーザー構想

- 3 アカウント固定で、`empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を作る
- デフォルトパスワードは README に記載し、Seeder 側で env 上書きを許可する
- sample data はそれぞれのユーザーに紐づける
  - standard 確認用は手書き中心の Item / Outfits / カテゴリ設定
  - large 確認用は Factory 併用の多件数 data
- 画像あり sample は最初は URL ベースとし、ローカルファイル対応は後回しにする
- 詳細は `docs/data/test-seed-users.md` を参照する

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
- `weather_tags`：天気対応（例：雨対応、防寒、晴れ向きなど）
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

- item 単位 / outfit 単位どちらでも登録できる着用記録を検討中
- 1 日複数件可、同じ item の同日重複も許可する方向
- status は `planned / worn / candidate / log` を候補とする
- outfit 由来登録でも、記録時点の item 構成をスナップショット保存する方向
- カレンダー表示、最近着た item、着用回数、しばらく着ていない item などの集計基盤として使う
- 詳細は `docs/specs/wears/wear-logs.md` に整理

### 検索・絞り込み・並び順構想

将来仕様メモ:

- 対象画面は item 一覧 / outfit 一覧 / 着用履歴一覧
- 検索はテキスト入力、絞り込みは選択式条件として UI を分離する
- 検索対象は item 名 / brand 名 / メモ の部分一致を基本とする
- 並び順は単一選択とし、初期値は items / outfits = 新しい順、wear logs = 日付の新しい順
- 0件時は未登録と絞り込み結果 0 件を別の空状態として扱う
- 詳細は `docs/specs/discovery/search-filter-sort.md` に整理

### エラーメッセージと空状態構想

将来仕様メモ:

- エラーメッセージは丁寧語を基本にし、技術詳細は UI に出さない方向
- 原因は分かる範囲で簡潔に書き、可能な限り次の行動も案内する
- 空状態は「未登録」「条件不一致」「エラー由来」を分けて考える方向
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
