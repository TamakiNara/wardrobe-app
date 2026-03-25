# Wardrobe App 作業メモ

このファイルは、現在の実装状況と次に着手する内容を共有するための引き継ぎメモです。
設計の正本は `docs/` 配下の各資料を参照し、日々の実装状況と判断メモはこのファイルに集約します。

実装着手前の確認観点を見返すときは `docs/project/implementation-checklist.md` を参照します。
item status 変更仕様の正本を確認するときは `docs/specs/items/status-management.md` を参照します。
item 詳細画面での status 操作 UI を確認するときは `docs/specs/items/detail-status-ui.md` を参照します。
購入検討の仕様正本を確認するときは `docs/specs/purchase-candidates.md` を参照します。
購入検討の API 入口を確認するときは `docs/api/api-overview.md` を参照します。
action keyword と response schema の命名ルールを確認するときも `docs/api/api-overview.md` を参照します。
OpenAPI に明示する error response の基準を短く見返すときも `docs/api/api-overview.md` を参照します。
422 response と `ValidationErrorResponse` の使い分けを確認するときも `docs/api/api-overview.md` を参照します。
401 / 404 の読み分けルールを確認するときも `docs/api/api-overview.md` を参照します。
409 と業務ルール違反系 422 の使い分けを確認するときも `docs/api/api-overview.md` を参照します。
400 / 429 / 500 を docs でどこまで明示するかの方針を確認するときも `docs/api/api-overview.md` を参照します。
購入検討の DB 保存方針と `purchase_candidate_images` / `item_images` の関係を確認するときは `docs/data/database.md` を参照します。
主要 spec の索引から購入検討を含む資料一覧へ辿るときは `docs/specs/README.md` を参照します。
購入検討の OpenAPI 定義は `docs/api/openapi.yaml` に反映済みで、current 実装との差分確認はこのファイルを起点に行います。
購入検討の後続設計メモを見返すときは `docs/project/purchase-candidate-handover.md` を参照します。
ブランド候補の仕様正本を確認するときは `docs/specs/settings/brand-candidates.md` を参照します。

## 削除導線の共通方針

- 一覧画面は原則として「確認・遷移」を主責務とし、操作導線は最小限に留める
- 削除導線は原則として一覧には置かず、詳細画面または編集画面に置く
- 詳細画面が未実装の機能は、当面編集画面を削除導線の配置先とする
- 削除前には誤操作防止の confirm を入れ、高頻度削除が必要な機能だけ例外扱いを検討する
- wear logs はこの方針に従い、編集画面からのみ削除可能とする

## 直近TODO

優先順:

1. docs 正本の整合確認を続ける
   - `docs/specs/wears/wear-logs.md`
   - `docs/specs/outfits/create-edit.md`
   - `docs/data/database.md`
   - `docs/api/openapi.yaml`
   の間で、仕様 / DB / API のズレがないか確認する
   - wear logs / outfits / item status 変更系の OpenAPI 表現は current 実装に合わせて整理済みのため、次は周辺 response schema の過不足を必要に応じて見直す
2. `docs/api/openapi.yaml` の Item / Outfit 関連を引き続き確認する
   - `ItemRecord.status`
   - `ItemUpsertRequest` の `status` 非包含方針
   - `disposed` と delete の役割分担
   - outfits / wear logs の候補除外前提との整合
   - invalid outfit の実装済み API（一覧 / `restore` / `duplicate`）の description / schema / response は current 実装と整合済み。今後は変更時の追従確認を続ける
3. 各画面のエラーメッセージと空状態を整理する
   - login / register / items / outfits / settings に初期文言を反映済み
   - 未反映画面と細かな文言差分を引き続き詰める
4. ログ設計の方針を整理する
   - アプリケーションログと一部イベントログの方針を詰める
   - item `disposed` / outfit `invalid` / 将来の wear logs 状態変更で何を残すか整理する
5. スマホ実機でキーワード検索入力と IME 変換が安定するかを確認する
   - Chrome 実機では items / outfits の入力確認を完了
   - Safari 実機が必要なら追加確認する
6. tops SVG の見た目調整に戻る
   - tshirt / shirt / blouse の細部調整を再開する

## 購入検討 実装メモ

位置づけ:

- 購入検討の正本は `docs/specs/purchase-candidates.md` を参照する
- MVP として candidate 保存・画像管理・item draft 導線まで実装済み
- item 側では `brand_name / price / purchase_url / purchased_at / size_* / is_rain_ok / item_images` の受け皿まで実装済み
- candidate 由来画像は item 保存時に item 用保存先へ物理コピーし、`item_images` にはコピー先の `disk + path` を保存する
- 購入検討の画像追加 UI は file select / drag & drop / paste に対応済み
- 購入検討一覧では代表画像、詳細・編集では画像全体確認を優先する表示へ整理済み
- 購入検討でも一覧 → 詳細 → 編集 の責務分離を採用し、一覧は確認・遷移、編集は詳細画面からを主導線に整理済み
- 購入検討で導入した `必須` バッジを items / outfits / wear logs の主要フォームにも揃え、必須項目をラベル上で事前判別できるようにした
- item 作成時に `purchase_candidate_id` を受け取り、Laravel 側で candidate の `purchased` 反映と `converted_item_id` / `converted_at` 更新まで処理する
- 比較ロジックの詳細は後続検討とする
- sale 情報 (`sale_price` / `sale_ends_at`) と candidate 複製機能は未実装であり、現時点では current 仕様へ混ぜない
- candidate `memo` を item 初期値へ引き継ぐ current 実装は残っているため、item に持ち込まない方針へ寄せるかは後続判断とする

直近または中期 TODO:

1. item draft と item 昇格後の追従を整理する
   - draft は保存済み item ではなく item 作成画面用の初期値 payload とする
   - item 作成後に candidate へ戻る導線や、重複昇格をどう扱うかを後続整理する
2. 画像アップロード方針を整理する
   - candidate 側の複数画像 upload / delete は実装済み
   - candidate -> item の保存時引き継ぎは実装済み
   - item 側画像 upload / delete UI は実装済み
   - item 側では並び替え / 代表画像切り替え UI まで実装済み
   - candidate 側の並び替え / 代表画像切り替え UI と保存後の編集責務分離を整理する
3. 比較結果の扱いを整理する
   - 現時点では補助表示前提とし、比較ロジックの詳細や強い自動判定は後続検討とする
4. 月次服飾費集計の前提を残す
   - `items.purchased_at` を持たせる案をベースに、item の `price` と組み合わせて集計できるようにする
5. ナビゲーション整理
   - 購入検討はボトムナビへ追加済み
   - wear logs を含む major feature 追加時のボトムナビ再編方針を引き続き整理する
6. sale / 複製差分整理
   - `sale_price` / `sale_ends_at` の schema, API, UI 導入範囲を設計する
   - 一覧 / 詳細での sale 表示を次段階の planned とし、ホーム sale 表示は将来検討として切り分ける
   - candidate 複製機能の API 形式と画像複製方針を整理する
   - `purchased` 後 candidate の編集範囲と、current の `memo` 引き継ぎ方針を再確認する

既存仕様との衝突確認メモ:

- 購入検討は items / outfits / wear logs と責務を分け、candidate を outfits に直接混ぜない前提を維持する
- `dropped` は見送り履歴を残す状態であり、DELETE は登録ミスや重複削除用として役割を分ける
- candidate から item へ全画像を引き継ぐ方針は UX 上は自然で、保存時には item 用保存先へ物理コピーする
- item 側画像と別管理である点を UI 上でも誤解されないよう整理が必要
- `size_gender` の内部値は `women / men / unisex / unknown` を想定しており、カテゴリプリセットの `male / female / custom` 命名とズレるため、表示ラベル変換ルールを後続整理したい
- items は現行 DB で `colors / seasons / tpos` を JSON で持つが、purchase_candidates 実装時は API / `item-draft` を配列で統一し、Laravel 側で構造差を吸収する
- candidate は `category_id` を正本にしつつ、`item-draft` では current item API 用の `category` / `shape` を返す前提とする

## purchase_candidates 実装着手前メモ

### 今回固定する前提

- `item-draft` は current `POST /api/items` に合わせた初期値 payload とし、frontend がそのまま item 作成画面へ流し込める形を優先する
- candidate 側の正本カテゴリは `category_id` とし、item 作成用の `category` / `shape` へのマッピングは Laravel 側で行う
- `colors` / `seasons` / `tpos` は DB 構造差があっても API と `item-draft` では配列で統一する
- candidate 画像は item 作成初期値へ全件引き継ぐが、保存時に item 用保存先へ物理コピーし、保存後は `item_images` として別管理にする
- `wanted_reason` は candidate 側の情報とし、item `memo` へ自動結合しない

### まだ保留でよい前提

- items 側を `item_colors` / `item_seasons` / `item_tpos` の別テーブルへ移行するか
- `category_id` から current item API の `category` / `shape` を解決できないカテゴリが出た場合の API 拡張方針
- 比較ロジックの詳細と、比較結果をどの粒度で response に含めるか

### 実装時の注意点

- frontend / BFF にカテゴリ変換ロジックを分散させない
- OpenAPI には API 入出力と planned schema を書き、実装順・責務分担・保留事項は implementation-notes に寄せる
- `planned` だが設計済みの API は OpenAPI に残し、実装済みかどうかの管理は implementation 系 docs で行う
- DB 構造差を吸収する変換は Laravel 側 service / mapper に閉じ、画面側では配列 payload を正本として扱う

## ナビゲーション TODO

- ボトムナビに着用履歴を追加するか検討する
- ボトムナビはホーム / items / outfits / purchase_candidates / settings 配下に加え、wear logs 配下でも表示する
- 主要機能追加時のボトムナビ再編方針を整理する
- 購入検討は主要導線としてボトムナビへ追加済み
- wear logs 配下でも既存ボトムナビは表示し、独立タブ化は引き続き保留とする
- wear log form では item / outfit の中身確認を詳細画面への導線で補い、フォーム自体に詳細責務を持たせすぎない

## 実装着手前チェックリスト

### docs 上で決定済み

- Item の `status` は `active` / `disposed` とし、通常一覧・outfit・wear logs の候補から `disposed` を除外する
  - 正本: `docs/specs/items/status-management.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- Outfit の `status` は `active` / `invalid` とし、通常保存では `status` を payload に含めない
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- wear logs は `source_outfit_id` を「ベースにした outfit」として持ち、最終的な item 構成は `items` / `wear_log_items` を正本とする
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- `item_source_type` は `outfit` / `manual`、`current status` は補助情報として扱う
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/api/openapi.yaml`

### 未実装

- `invalid outfit` では `GET /api/outfits/invalid`、`POST /api/outfits/{id}/restore`、`POST /api/outfits/{id}/duplicate` は実装済み
  - 残タスクの中心は wear logs と event log
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`
- wear logs の API / DB / UI は一覧 / 詳細 / 登録 / 更新 / 削除まで実装済み
  - 一覧 → 詳細 → 編集 の責務分離を前提とする
  - 削除導線は編集画面からのみとする
  - 未実装は snapshot
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- event log は `disposed / invalid / restore / duplicate` を優先対象としているが未実装
  - 正本: `docs/specs/logging/logging-policy.md`

### `future API`

- wear logs 関連の future API は現時点ではなし

### 副作用あり

- item を `disposed` にすると、その item を含む `active outfit` は `invalid` に遷移する
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`
- item が `active` に戻っても outfit は自動 `restore` しない
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`
- 手動 `restore` は対象 outfit が `invalid` で、構成 item がすべて `active` の場合のみ許可する
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`
- `duplicate` は保存済み outfit ではなく、新規作成画面へ渡す初期値 payload を返す
  - invalid outfit 由来の `disposed` item は `selectable=false` と `note` で返す
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/specs/outfits/item-candidate-rules.md`, `docs/api/openapi.yaml`
- `disposed item` / `invalid outfit` は wear logs の新規登録・更新候補から除外する
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- wear log の削除は編集画面からのみ行い、関連 `wear_log_items` も合わせて物理削除する
  - 他レコードの `display_order` 自動再採番は行わない
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/api/openapi.yaml`

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
- outfits 新規作成 / 編集では、カテゴリ表示設定の取得に失敗した場合でも、アイテム一覧取得が成功していれば候補自体は表示する
- outfits 一覧では、コーディネート自体は残しつつ、表示アイテム数を現在の表示設定で再計算する
- outfits 詳細では、OFF にしたカテゴリのアイテムを非表示にし、非表示件数を案内する
- 新規登録完了後はカテゴリプリセット選択画面へ遷移し、`male / female / custom` の初期設定を完了してからホームへ進む
- `custom` を選んだ場合は settings の onboarding モードで全カテゴリ ON から調整し、保存後にホームへ遷移する
- ブランド候補基盤として `user_brands`、`BrandNormalizer`、`GET /api/settings/brands` / `POST /api/settings/brands` / `PATCH /api/settings/brands/{id}` を実装済み
- item create / update は `save_brand_as_candidate` を受け取り、Laravel 側で候補追加を試行する
- `items.brand_name` は item の正本、`user_brands` は入力補助候補の正本とし、FK では結ばない
- item 新規作成 / 編集画面では、`GET /api/settings/brands` を使ったブランド候補サジェスト UI を実装済み
- 設定画面ではブランド候補一覧 / 追加 / 編集 / 有効無効切替 UI を実装済み
- 設定画面のブランド候補一覧では、キーワード絞り込み、更新日時表示、無効候補の折りたたみ表示まで実装済み

未完了:

- ページ内遷移での未保存変更警告は未対応のため、必要に応じて今後整理する
- DELETE API は未対応

### テスト用 seed ユーザー

実装済み:

- 3 アカウント固定の `empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を Seeder で作成する
- デフォルトパスワードは `password123` 、env は `TEST_SEED_USER_PASSWORD` で上書きできる
- `TestDatasetSeeder` で、テスト用ユーザーと sample data だけを再投入できる
- `TestDatasetSeeder` 単体実行でも category group / master / preset を含めて再投入できる
- `standard-user` には手書き 8 件の items と 4 件の outfits を紐づける
- `large-user` には Factory 併用の 36 件の items と 12 件の outfits を紐づける
- `empty-user` は items / outfits 0 件の初期状態として再生成する
- ブランド候補用 `SampleUserBrandSeeder` を追加し、`empty-user` 0 件、`standard-user` 標準件数、`large-user` 多件数の `user_brands` を再投入できる
- `standard-user` は item 側の `brand_name` と揃えた候補を中心に持ち、`large-user` は絞り込み・無効候補折りたたみ確認向けに inactive 候補も含める

補足:

- sample data では category / colors / seasons / tpos / spec に加え、brand 候補確認用の `items.brand_name` と `user_brands` も反映済み

### 認証

実装済み:

- ユーザー登録
- ログイン
- ログアウト
- ログイン状態確認 (`/api/me`)
- 認証切れ後の再ログインで、BFF が CSRF / session cookie を補完しながら自動再試行できる
- 未認証時はログイン / 新規登録画面で共通ボトムナビを出さない

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
- items 一覧は `keyword / category / season / tpo / sort` を URL クエリを正本として扱い、再読み込みや戻る操作後も条件を復元できる
- 複数条件は AND で絞り込み、`sort` は `updated_at_desc / name_asc` で切り替える
- キーワード入力は IME 変換中に URL 更新を止め、変換確定後に検索条件へ反映する
- BFF の GET は URL クエリを Laravel へそのまま転送し、Laravel 側で検索・並び替え・`page` を適用する
- Laravel の一覧 API は `total / totalAll / page / lastPage` と filter 候補を meta として返し、UI で前へ / 次へのページャを描画する
- `total` は現在の検索条件に一致した件数、`totalAll` はフィルタ前の母数として API から取得している。現在のページャ文言は `2 / 3ページ（全36件）` の形で `total` のみを表示する
- 1 ページ件数は `App\Support\ListQuerySupport::PAGE_SIZE = 12` で統一している
- docs の一覧共通仕様も 12件/ページ 前提に揃える

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

今回までの反映内容:

- outfits 一覧は `keyword / season / tpo / sort` を URL クエリを正本として扱い、再読み込みや戻る操作後も条件を復元できる
- 複数条件は AND で絞り込み、`sort` は `updated_at_desc / name_asc` で切り替える
- キーワード入力は IME 変換中に URL 更新を止め、変換確定後に検索条件へ反映する
- BFF の GET は URL クエリを Laravel へそのまま転送し、Laravel 側で検索・並び替え・`page` を適用する
- Laravel の一覧 API は `total / totalAll / page / lastPage` を meta として返し、UI で前へ / 次へのページャを描画する
- `total` は現在の検索条件に一致した件数、`totalAll` はフィルタ前の母数として API から取得している。現在のページャ文言は `2 / 3ページ（全36件）` の形で `total` のみを表示する
- 1 ページ件数は `App\Support\ListQuerySupport::PAGE_SIZE = 12` で統一している
- docs の一覧共通仕様も 12件/ページ 前提に揃える

関連仕様:

- 作成 / 編集 / invalid / 複製の正本は `docs/specs/outfits/create-edit.md`

`future API` メモ:

- invalid outfit の一覧取得 `GET /api/outfits/invalid` は実装済み
- 手動復帰 `POST /api/outfits/{id}/restore` は実装済み
- 複製初期値取得 `POST /api/outfits/{id}/duplicate` は実装済み
- 現時点の残タスクの中心は以下
  - wear logs の snapshot / 補助 UI
  - event log
- `restore` は手動復帰用の補助導線とし、対象 outfit が `invalid` で、構成 item がすべて active の場合のみ許可する
- `duplicate` は active / invalid 共通機能だが、invalid outfit では再利用の主導線として扱う
- `duplicate` は保存済み outfit を直接複製作成する API ではなく、新規作成画面に渡す初期値生成 API として設計している

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
- server component の件数取得や詳細取得は `LARAVEL_API_BASE_URL` 経由で Laravel を直接参照し、`NEXT_APP_URL` には依存しない

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
- `size_note`：購入候補由来メモや補足サイズ
- `size_details`：実寸の詳細
- `price`：購入金額
- `purchase_url`：商品ページなどの URL
- `purchased_at`：購入日
- `last_worn_at`：最終着用日
- `wear_count`：着用回数
- `is_favorite`：お気に入り
- 画像アップロード
  - `item_images` は `purchase_candidate_images` と別テーブルで管理する
  - DB には `disk + path` を保存し、表示用 URL は API / BFF 側で生成する
  - `is_primary` / `sort_order` を持ち、複数画像対応とする
  - candidate -> item では全画像を初期値に引き継ぎ、item 作成時に item 用保存先へ物理コピーして `item_images` として保存する
  - 保存後は item 側画像として別管理にし、自動同期しない
  - 優先画像がある場合は SVG ではなく画像をアイコン表示する

補足:

- `last_worn_at` と `wear_count` だけでは履歴一覧を完全には表現できないため、カレンダー連携や着用履歴を本格対応する場合は `wear_logs` のような別テーブル案も検討する
- 画像保存方針は `item_images` / `purchase_candidate_images` を別テーブルで持ち、DB には `disk + path` を保存し、URL は API / BFF 側で生成する方針で整理する
- item 側の追加項目と `item_images` は purchase_candidates 受け皿として実装済みであり、item 画像の並び替え / 代表画像切り替え UI も反映済みである
- 残タスクは candidate 側画像 UI の拡張と、昇格後の戻り導線・重複昇格ガード整理である

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

### ログ設計

関連仕様:

- ログ設計の正本は `docs/specs/logging/logging-policy.md`

メモ:

- MVP ではアプリケーションログとイベントログを分けて考える
- イベントログは `disposed / invalid / restore / duplicate` など、重要な状態変化を優先して残す
- 軽微な編集や閲覧操作は原則としてイベントログに残さない
- ログ記録はモデルイベントではなく、サービス層 / ユースケース層で明示的に行う方針とする

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

## wear logs 実装メモ

wear logs は一覧 / 詳細 / 登録 / 更新 / 削除と、確認用の専用詳細画面まで実装済み。  
一方で、snapshot や候補 UI の高度化は未実装。

### 正本として参照するファイル

- 仕様: `docs/specs/wears/wear-logs.md`
- DB: `docs/data/database.md`
- API: `docs/api/openapi.yaml`

### 実装時の前提

- `planned` / `worn` は同一レコードで管理する
- `worn -> planned -> worn` の再変更を許可し、常に最終保存状態を正とする
- 1 wear log = 1着用イベント
- 同日複数件を許容する
- 時刻は持たず、`event_date + display_order` で順序を表現する
- `source_outfit_id` は「完全一致したコーデ」ではなく、「ベースにした outfit」を表す
- 保存時の正本は最終的な `items` 構成とする
- `item_source_type` は `outfit` / `manual`
- 同一 wear log 内で同一 item の重複は不可
- MVP では snapshot を持たない
- `disposed` item と `invalid` outfit は新規登録・更新時の候補から除外する
- `current status` は履歴の主表示ではなく補助情報として扱う

### 実装時の補足

- Request / Response / validation / transaction は `openapi.yaml` と `wear-logs.md` に合わせて整理済み
- 更新処理は差分更新ではなく、明細込み全体更新を前提とする
- 編集時は現在の候補外データを表示責務として残し、新規候補の選択責務と分ける
- 一覧は確認・遷移、詳細は確認、編集は変更・削除の責務で分け、削除導線は編集画面に残している
- form の候補 UI では、outfit に構成数 / 季節 / TPO、item にカテゴリ / 形 / 色の補助情報を出し、詳細責務を持たせすぎない範囲で選択しやすさを補う
- selected item の順序は frontend 上で上下移動でき、保存時はその順序に従って `sort_order` を連番再採番する
- candidate 数が多い場合に備え、form 内で outfit 名・季節・TPO、item 名・カテゴリ・季節・TPOの軽い絞り込みを持たせる

### snapshot 保留メモ

- 現時点では wear logs snapshot は未実装であり、**current データ参照ベース**で運用する
- 今は `source_outfit_id` / `items` / `item_source_type` と `current status` の補助表示で MVP を成立させ、snapshot 導入は後続検討に分ける
- 未実装でよい理由は、一覧・登録・更新の基本フローを先に安定させる方が優先度が高く、snapshot の保存責務を先に固定しなくても現行要件を満たせるため
- 推奨案は「snapshot なし継続」とし、代替案としては `worn` 確定時保存を第一候補に留める
- 新規作成時保存や `planned / worn` 両方保存は、現時点では DB / API / UI / 既存データ移行の影響が大きく、MVP 後の再検討でよい

### snapshot で後から決めること

- 保存タイミング: 新規登録時、`planned -> worn` 確定時、または両方
- 保存対象: item / outfit の名称、カテゴリ、色、spec、構成 item などのどこまでを snapshot 化するか
- 表示用途: 一覧 / 詳細 / 編集で当時情報をどう見せるか、current データとの差分を表示するか
- 集計用途: 将来の集計・分析を current データ基準にするか snapshot 基準にするか
- 既存データ移行: 導入前レコードへ backfill するか、導入後レコードのみ snapshot 対象にするか

### snapshot 導入時の影響範囲

- DB schema の追加変更
- API response / mapper / validation の見直し
- 一覧 / 編集 / 将来詳細画面の表示責務整理
- 既存 wear logs データの移行手順と運用ルール


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
- 設計の正本は `docs/specs/` `docs/data/database.md` `docs/api/openapi.yaml` を参照する
- 特に wear logs は `docs/specs/wears/wear-logs.md`、outfits は `docs/specs/outfits/create-edit.md` を優先して参照する
- 日本語テキストは UTF-8 前提で編集すること
