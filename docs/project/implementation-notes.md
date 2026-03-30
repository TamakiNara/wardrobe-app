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
settings / calendar / wear logs / care_status の後続設計メモを見返すときは `docs/specs/settings_calendar_wearlog_codex_plan.md` を参照します。
thumbnail の current 確認用パターン一覧を見返すときは `docs/specs/items/thumbnail-current-reference.md` を参照します。

## 削除導線の共通方針

- 一覧画面は原則として「確認・遷移」を主責務とし、操作導線は最小限に留める
- 削除導線は原則として一覧には置かず、詳細画面または編集画面に置く
- 詳細画面が未実装の機能は、当面編集画面を削除導線の配置先とする
- 削除前には誤操作防止の confirm を入れ、高頻度削除が必要な機能だけ例外扱いを検討する
- wear logs は current では個別詳細を主導線とし、編集画面側にも footer action として削除導線を維持してよい

## 直近TODO

優先順:

1. docs 正本の整合確認を続ける
   - `docs/specs/wears/wear-logs.md`
   - `docs/specs/outfits/create-edit.md`
   - `docs/data/database.md`
   - `docs/api/openapi.yaml`
     の間で、仕様 / DB / API のズレがないか確認する
2. `docs/api/openapi.yaml` の Item / Outfit 関連を引き続き確認する
   - `ItemRecord.status`
   - `ItemUpsertRequest` の `status` 非包含方針
   - `disposed` と delete の役割分担
   - outfits / wear logs の候補除外前提との整合
3. 各画面のエラーメッセージと空状態を整理する
   - 未反映画面と細かな文言差分を引き続き詰める
4. ログ設計の方針を整理する
   - アプリケーションログと一部イベントログの方針を詰める
   - item `disposed` / outfit `invalid` / 将来の wear logs 状態変更で何を残すか整理する
5. スマホ実機でキーワード検索入力と IME 変換が安定するかを確認する
   - Safari 実機が必要なら追加確認する
6. item SVG の簡略化方針を docs と画面で揃える
   - tops / `onepiece_allinone` の item SVG は shape 個別表現を増やさず、カテゴリ単位の記号化を維持する
7. item `care_status` の後続整理
   - item 一覧で `in_cleaning` の絞り込みを追加するか検討する

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
- `sale_price` / `sale_ends_at` は購入検討専用の補助情報として create / edit / list / detail まで実装済み
- candidate 複製機能は詳細画面から使える current 機能として実装済みで、colors / seasons / tpos / images を引き継ぎ、画像は新 candidate 用保存先へ物理コピーする
- `purchased` の購入検討は item 化済み履歴として扱い、candidate 側更新を item へ逆流させない
- `purchased` の購入検討では `memo` / `wanted_reason` / `priority` / `sale_price` / `sale_ends_at` / `purchase_url` / 画像のみ更新可とし、item-draft 導線は表示しない
- 比較ロジックの詳細は後続検討とする
- candidate `memo` は current で item 作成画面の `memo` 初期値へ引き継ぎ、保存後は candidate / item で独立管理とする
- purchase_candidates の create / edit でも `size_note` をサイズ感・着用感メモ、`size_details` を `structured` / `custom_fields` を持つ構造化実寸として入力できる
- purchase_candidates のサイズ実寸 UI は items 側の `item-size-details-fields.tsx` と `size-details.ts` を再利用し、item draft でも `size_details` をそのまま引き継ぐ

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
   - wear logs も主要導線としてボトムナビへ追加済み
6. 購入検討の残課題整理
   - ホーム sale 表示は将来検討として切り分ける
   - candidate 側の並び替え / 代表画像切り替え UI を後続整理する

既存仕様との衝突確認メモ:

- 購入検討は items / outfits / wear logs と責務を分け、candidate を outfits に直接混ぜない前提を維持する
- `dropped` は見送り履歴を残す状態であり、DELETE は登録ミスや重複削除用として役割を分ける
- candidate から item へ全画像を引き継ぐ方針は UX 上は自然で、保存時には item 用保存先へ物理コピーする
- item 側画像と別管理である点を UI 上でも誤解されないよう整理が必要
- `size_gender` の内部値は `women / men / unisex` を想定しており、カテゴリプリセットの `male / female / custom` 命名とズレるため、表示ラベル変換ルールを後続整理したい
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

## ナビゲーション current メモ

- 購入検討は主要導線としてボトムナビへ追加済み
- wear logs は主要導線としてボトムナビへ追加済み
- current のボトムナビ順序は ホーム / アイテム / コーディネート / 購入検討 / 着用履歴 / 設定
- `/wear-logs` 配下では着用履歴タブを active とする
- wear log form では item / outfit の中身確認を詳細画面への導線で補い、フォーム自体に詳細責務を持たせすぎない

## 実装着手前チェックリスト

### docs 上で決定済み

- Item の `status` は `active` / `disposed` とし、通常一覧・outfit・wear logs の候補から `disposed` を除外する
  - 正本: `docs/specs/items/status-management.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- Item の補助状態として `care_status = in_cleaning | null` を持ち、候補除外や invalid 化ではなく補助バッジ・警告・解除導線に使う
  - 正本: `docs/specs/items/status-management.md`, `docs/specs/items/detail-status-ui.md`, `docs/api/openapi.yaml`
- Outfit の `status` は `active` / `invalid` とし、通常保存では `status` を payload に含めない
  - 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- wear logs は `source_outfit_id` を「ベースにした outfit」として持ち、最終的な item 構成は `items` / `wear_log_items` を正本とする
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`
- `item_source_type` は `outfit` / `manual`、`current status` は補助情報として扱う
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/api/openapi.yaml`

### current

- `invalid outfit` では `GET /api/outfits/invalid`、`POST /api/outfits/{id}/restore`、`POST /api/outfits/{id}/duplicate` は実装済み
- wear logs の API / DB / UI は一覧 / 詳細 / 登録 / 更新 / 削除まで実装済み
  - 一覧 → 詳細 → 編集 の責務分離を前提とする
  - 削除導線は個別詳細に置き、編集画面側にも footer action として維持してよい
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

### planned

- wear logs の残タスクの中心は snapshot
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
- `in_cleaning` item は wear logs の新規登録・更新候補から除外せず、planned / worn ともに保存可能とし、UI では警告のみを表示する
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/api/openapi.yaml`
- wear log の削除は個別詳細を主導線として行い、関連 `wear_log_items` も合わせて物理削除する
  - 編集画面側にも footer action として削除導線を維持してよい
  - 他レコードの `display_order` 自動再採番は行わない
  - 正本: `docs/specs/wears/wear-logs.md`, `docs/api/openapi.yaml`

## current 実装メモ

### recent performance improvements

- ホーム件数取得は、一覧 API 4 本を件数目的で呼ぶ current をやめ、`GET /api/home/summary` の軽量 endpoint へ置き換えた
- `UserTpoNameResolver` は user ごとの name map を一括構築して使い回す形に寄せ、items / outfits 一覧で `user_tpos` をレコードごとに引き直さないようにした
- `ItemsIndexQuery` / `OutfitsIndexQuery` / `WearLogsIndexQuery` / `PurchaseCandidatesIndexQuery` は、可能な範囲で `filter / sort / paginate` を DB query builder 側へ寄せた
- 上記は一覧 API の仕様変更ではなく、current のレスポンス形と filter 条件を維持した内部最適化として実施した
- 残課題は、auth 確認や `no-store` の多用、一覧画面の追加 fetch の見直し、production build を含む実測確認、必要に応じた query log ベースの再調整


### settings

実装済み:

- `GET /api/settings/categories` で現在のカテゴリ表示設定を取得できる
- `PUT /api/settings/categories` で `visible_category_ids` を保存できる
- `GET /api/settings/preferences` / `PUT /api/settings/preferences` を実装済み
- `GET /api/settings/tpos` / `POST /api/settings/tpos` / `PATCH /api/settings/tpos/{id}` を実装済み
- `user_preferences` に `currentSeason` / `defaultWearLogStatus` / `calendarWeekStart` / `skinTonePreset` を保存できる
- `user_tpos` にユーザーごとの TPO 選択肢正本を保存できる
- ユーザー作成時に、`user_tpos` へプリセット `仕事 / 休日 / フォーマル` を初期投入する
- `user_tpos` 導入 migration で当時の既存ユーザーを backfill し、`ensurePresets()` は runtime 防御コードとして残す
- 役割分担は、migration が導入前ユーザーの一括補完、ユーザー作成時初期投入が正本、`ensurePresets()` が想定外欠損の救済用
- settings トップは `currentSeason` / `defaultWearLogStatus` / `calendarWeekStart` / `skinTonePreset` の取得・保存と、各設定画面へのハブとして動作する
- `/settings/categories` でカテゴリ表示設定の取得・保存ができる
- `/settings/tpos` で TPO 一覧 / 追加 / 有効無効切替 / 上下移動 / 追加 TPO の名称編集ができる
- `/settings/brands` でブランド候補一覧 / 追加 / 編集 / 有効無効切替ができる
- settings 配下の操作系アイコンは `web/src/lib/icons/settings-icons.ts` に寄せ、現状は TPO 画面で使っている
- create / edit / list のカテゴリ候補は、保存済みのカテゴリ表示設定を考慮する
  - 新規作成では ON の大分類だけをカテゴリ候補に出す
  - 一覧では ON の大分類だけをカテゴリ絞り込みに出す
  - 編集では基本は ON の大分類だけを出す
  - ただし編集中のアイテムが現在 OFF のカテゴリだった場合は、そのカテゴリだけは残す
- items 一覧では、OFF にしたカテゴリのアイテム自体も一覧表示から外す
- items 一覧では、通常一覧とクローゼットビューの表示切替を持ち、検索・絞り込み・並び順条件を維持したまま切り替えられる
- クローゼットビューは category master の中分類単位で表示しつつ、その中を shape 単位でもう一段グルーピングして、`active` item のみを色付き図形で横並びベースに表示する
- クローゼットビューの色順は shared utility で HSL 正規化し、無彩色先行・彩色は `hue asc -> lightness asc`・色欠損は末尾で安定化している
- TPO の選択肢正本は `user_tpos` とし、Phase 1 では settings + item + outfit を ID ベースで接続済み
- item / outfit は `tpo_ids` を保存正本とし、`tpos` は表示用の resolved name として返す
- inactive TPO は新規候補に出さず、既存 item / outfit に含まれる場合は表示・保持できる
- item 一覧 / outfits 一覧では、URL に季節条件がない場合のみ `currentSeason` を初期値として適用する
- `currentSeason` の保存値は英語 enum だが、一覧 UI / URL の季節 filter 値は既存どおり日本語を維持し、初期適用時だけ変換する
- wear log 新規作成では `defaultWearLogStatus` を初期値として使い、edit では既存 record の `status` を優先する
- wear log カレンダーの週開始は月曜始まりを既定とし、settings の `calendarWeekStart` で日曜始まりへ切り替えられる
- settings 画面の週開始選択は `月曜始まり / 日曜始まり` の2択で表示する
- `skinTonePreset` は settings トップの色タイル UI で選択し、Phase 2-2 時点では item サムネイルだけへ反映する
- thumbnail skin exposure は current で item spec (`spec.bottoms.length_type` / `spec.legwear.coverage_type`)・item サムネイル・`skinTonePreset` 反映まで実装済み
- Phase 2-3 で outfit thumbnail の lower-body preview を実装済みで、表示対象 item から `sort_order` 昇順で representative bottoms / legwear を選定して item 側 lower-body 描画ルールを再利用する
- bottoms は作成 / 編集時に `spec.bottoms.length_type` を必須とし、描画側では旧データ互換として欠落 / 無効値を `full` 扱いにフォールバックする
- legwear は `socks` / `leggings` の作成 / 編集時に `spec.legwear.coverage_type` を必須とし、`tights` / `stockings` は今回の必須化対象外とする
- outfit thumbnail の current は representative bottoms がある場合のみ lower-body preview を表示し、representative bottoms / legwear は有効 spec がある最初の候補を優先する
- representative bottoms の全候補が無効な場合のみ描画側フォールバックで `full` 扱いにする
- representative legwear は `tights` / `stockings` を未設定でも候補に残し、欠落 / 判定不能時の描画側 fallback は full-length legwear とする
- lower-body の重ね順は legwear を先、その上に bottoms を重ねる
- これらの fallback は旧データ互換のためであり、item 作成 / 編集時の必須入力要件を緩めるものではない
- wear log での脚見え合成表現、`onepiece_allinone` 対応、tights / stockings のサブカラー固定は planned のままとし、正本は `docs/specs/items/thumbnail-skin-exposure.md` を参照する
- `onepiece_allinone` は item 単体では共通四角 SVG を維持しつつ、outfit サムネイルでは `bottoms` がない場合と `onepiece + bottoms` の場合に限って専用 mode で全高レイヤー候補として扱う
- tops と `onepiece_allinone` の上下関係は `sort_order` の大きい item を上側レイヤーとして解決し、`legwear` は下側の lower-body preview 専用責務を維持する
- `onepiece + bottoms` は許容し、current の outfit サムネイルでは `onepiece` を主レイヤー、`bottoms` を裾見せの lower-body 補助レイヤーとして簡略表示する
- `allinone + bottoms` は `onepiece` と同列に確定せず、表示ルールは要再判断のまま残す
- current では `allinone + bottoms` のみ `onepiece_allinone` レイヤーへ寄せず通常レイアウトを維持し、wear log への同ルール適用は後続とする
- outfit サムネイルの色帯レイアウトでは `legwear` を `others` から除外し、lower-body preview 側だけで扱うように寄せた。`others` は non-lower-body の残余カテゴリを指し、`onepiece_allinone` 後続整理でも `legwear = lower-body 専用` を前提にする
- `OutfitColorThumbnail` は current で mode 判定 / ViewModel 組み立て / JSX 描画を分離したが、これは責務整理であり、`onepiece + bottoms`・`allinone + bottoms`・`legwear = lower-body 専用` の current 挙動自体は変更していない
- wear log 側へ広げる場合も、outfit current の責務分離（`legwear = lower-body 専用`、tops と `onepiece_allinone` の前後は `sort_order` 正本）は流用するが、representative 選定や mode 判定の入力正本は source outfit ではなく `wear_log_items` として別途整理する
- TODO: item の開発用プレビュー詳細（spec / メインカラー / サブカラー / skinTonePreset）は、そのまま本番 UI の正本にしない
- current では `NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG=true` のときだけ表示し、通常ユーザーには既定で非表示とする
- 開発時に表示したい場合は、`web/.env.local` に `NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG=true` を設定して web を再起動する
- 第2弾として、wear logs に `GET /api/wear-logs/calendar` / `GET /api/wear-logs/by-date` を追加し、月カレンダー表示と日詳細モーダルを current 実装にした
- 月カレンダーは dot 表示中心とし、`planned / worn` の文字は月セル内に出さない
- dot は `wear log 1件 = 1個` で、`planned / worn` のみを表し、警告状態やクリーニング中のような補助状態は載せない
- 月セルの過去日は弱いグレー背景で補助表示し、大画面では広がりすぎない正方形寄りサイズに抑える
- 空の日でも日詳細モーダルは開き、`この日で新規作成` 導線から選択日付きの新規作成画面へ進める
- 過去日の `planned` は自動削除せず、日詳細モーダルで補助表示だけ行う
- outfits 新規作成では、OFF にしたカテゴリのアイテムは選択候補に出さない
- outfits 編集では、OFF にしたカテゴリのアイテムは候補から外す
  - ただし現在そのコーディネートに含まれているアイテムは、編集不能にしないため候補へ残す
- outfits 新規作成 / 編集では、カテゴリ表示設定の取得に失敗した場合でも、アイテム一覧取得が成功していれば候補自体は表示する
- outfits 一覧では、コーディネート自体は残しつつ、表示アイテム数を現在の表示設定で再計算する
- outfit 一覧では、画像の代わりに current の item 配色から生成する配色サムネイルを補助表示として出す
- wear logs 一覧では、`wear_log_items` を正本にした補助配色サムネイルを表示する
- 配色サムネイルの色 fallback は `#E5E7EB` に統一しつつ、outfit 一覧は current outfit item、wear logs 一覧は `wear_log_items` をそれぞれ正本にしている
- 配色サムネイルのレイアウトは、tops / bottoms のメインコンテナと `others` の下部バーを構造上も分けて current 仕様に揃えている
- wear log thumbnail の current code は `WearLogColorThumbnail` / `WearLogModalColorThumbnail` から representative selection / mode resolution / ViewModel build を呼ぶ構成に整理済みで、`onepiece + bottoms` のときだけ dedicated `onepiece_allinone` mode に入る
- wear log thumbnail は current で representative bottoms / legwear を `wear_log_items` から選び、representative bottoms がある場合のみ lower-body preview を表示する
- wear log thumbnail は current で `legwear` を `others` から除外し、lower-body preview 専用責務として扱う
- current の wear log API は `thumbnail_items` へ `shape` / `spec` / `sort_order` まで返し、wear log 側 helper が `wear_log_items` 正本で representative selection と lower-body preview の入力へ変換する
- wear log の skin tone は current で API payload に重複保持せず、wear logs page が settings の `skinTonePreset` を取得して一覧カードと日詳細モーダルの thumbnail へ渡す
- wear log の `onepiece_allinone` 専用 mode は current では `onepiece + bottoms` に限って導入し、`allinone + bottoms` は引き続き `standard` mode に残す
- wear log で専用 mode を入れる場合の着手順は、`wear_log_items` 正本の判定条件整理 -> dedicated ViewModel 導入 -> renderer 分岐 -> test 拡張、の順を想定する
- wear log で `onepiece + bottoms` を導入する場合は `onepiece` を主レイヤー、`bottoms` を裾見せ補助レイヤーとし、`allinone + bottoms` は要再判断に残す
- wear log thumbnail 実装着手前タスクは、1) API で `thumbnail_items` に `shape` / `spec` / `sort_order` を追加、2) web 型を追随、3) `wear_log_items` 正本の representative selection / mode resolution / lower-body preview helper を追加、4) wear log thumbnail component に ViewModel と描画分岐を導入、5) settings の `skinTonePreset` を thumbnail へ渡して lower-body preview に反映、6) API / helper / component / integration test を順に増やす、の依存順で進める
- outfit helper のうち lower-body preview source build、`sort_order` 正本の前後判定、`legwear = lower-body 専用` という責務境界は流用候補だが、representative selection・mode 判定・ViewModel build は `wear_log_items` 入力前提の wear log 専用責務として持つ想定にする
- wear logs の日詳細モーダルでは、`wear_log_items` 正本を維持した簡略版配色サムネイルを表示する
- `items=[]` かつ `source_outfit_id` ありで保存した wear log でも、current 実装では source outfit の構成を `wear_log_items` として実体化する
- 過去に `wear_log_items` が欠けていた outfit ベース record は migration で backfill する
## thumbnail 共通化候補メモ

- current の outfit / wear log thumbnail は、入力正本が異なるため、まず「どこまでを shared helper にしてよいか」を明示してから進める
- いま共通化してよい候補:
  - lower-body preview source build 本体（`buildOutfitLowerBodyPreviewSource` など、入力変換後の描画ソース生成）
  - main / sub color の hex 解決
  - `tops` と `onepiece_allinone` の前後判定（`sort_order` 正本）
  - `onepiece_allinone` layer style 計算
  - `SegmentRow` / `OnepieceAllinoneLayerBand` のような renderer primitives
- 分けるべき責務:
  - representative selection
  - mode 判定
  - ViewModel build のうち入力正本依存部分
  - entry component（outfit 一覧 / wear logs 一覧 / 日詳細モーダルなどの受け口）
- 共通化はまだ早い候補:
  - outfit / wear log の ViewModel builder 全体
  - standard / dedicated renderer の完全共通化
  - mode 判定と representative 選定の統合 helper
- 共通化のメリット:
  - `sort_order` 前後判定や layer style の修正箇所を 1 か所に寄せられる
  - lower-body preview まわりの色・フォールバック・ `legwear = lower-body 専用` 境界のズレを減らせる
  - renderer primitives の見た目調整を outfit / wear log で揃えやすい
- 共通化のデメリット:
  - 入力正本の違い（outfit items / `wear_log_items`）が helper 境界で見えにくくなる
  - `allinone + bottoms` のような current / 要再判断境界を shared code に閉じ込めると、挙動差の説明が難しくなる
  - entry component までまとめると、一覧 / モーダル / 詳細の責務差が崩れやすい
- 実装するなら順序は次を優先する:
  1. 色 hex 解決、`tops` と `onepiece_allinone` の前後判定、layer style 計算などの純粋関数を shared helper に寄せる
  2. `SegmentRow` / `OnepieceAllinoneLayerBand` のような renderer primitives を共通利用に寄せる
  3. lower-body preview 入力変換のうち、source build に渡す直前の共通部分だけを helper 化する
  4. representative selection / mode 判定 / ViewModel build は最後まで outfit / wear log 別責務として維持するかを再判断する
- current 前提として、`onepiece + bottoms` / `allinone + bottoms` / `legwear = lower-body 専用` の境界は、shared helper 化より先に壊さないことを優先する

## thumbnail 残タスクメモ

- current で十分安定しているため、当面触らなくてよい部分:
  - outfit / wear log とも、`legwear = lower-body 専用` と `skinTonePreset` 反映の current は固まっている
  - `onepiece + bottoms` / `allinone + bottoms` / `onepiece_allinone` mode の current 境界は、当面は振る舞い変更よりも保持を優先する
- planned のまま残す部分:
  - `tights / stockings` のサブカラー固定
  - wear log snapshot 導入時の thumbnail 正本見直し
  - renderer 完全共通化は、input 正本差と current 境界が更に揃うまで後回しにする
- 要再判断のうち優先度が高いもの:
  1. `allinone + bottoms` を dedicated mode へ上げるかどうか
  2. 極小サイズ時の `onepiece + bottoms` 裾見せ量と layer 省略の最終値
  3. wear log snapshot 導入後も `wear_log_items` 正本の表現を維持するか、snapshot 専用 input へ移すか
- 共通化を今後進めるなら、まず shared helper / renderer primitives の範囲にとどめ、representative selection / mode 判定 / ViewModel build 全体は outfit / wear log 別責務のまま再判断する
- 次の着手順候補:
  1. `allinone + bottoms` の current / planned / 要再判断をサムネイルと表示例で再整理する
  2. 極小サイズ時の simplified renderer 調整を、current 参照 md と突き合わせて行う
  3. wear log snapshot 導入時の payload / type / helper 影響を切り出して別タスク化する

## `onepiece + bottoms` 極小サイズ簡略化メモ

- 参照正本:
  - current 確認: `docs/specs/items/thumbnail-current-reference.md`
  - 設計正本: `docs/specs/items/thumbnail-skin-exposure.md`
- ここでいう「極小サイズ」は画面全体の breakpoint ではなく、small 系 thumbnail variant を指す
  - outfit: `OutfitColorThumbnail` の `size="small"`
  - wear log list: `WearLogColorThumbnail`
  - wear log modal: `WearLogModalColorThumbnail`
- current 前提の再確認:
  - `onepiece + bottoms` は outfit / wear log とも dedicated mode を維持する
  - `allinone + bottoms` は current では standard 維持のまま切り離す
  - `legwear` は `others` に戻さず lower-body preview 専用を維持する
  - `tops` と `onepiece_allinone` の前後は `sort_order` 正本とし、tops 個別混在は前提にしない
  - `others` は引き続き別バーを維持する
- 極小サイズでも最低限残す情報:
  - `onepiece main` は主役として最優先で残す
  - `bottoms hem` は `onepiece + bottoms` を読むための補助情報として残す
  - `tops` は個別混在ではなく、tops 全体が overlay / underlay のどちら側に見えるかだけを残す
  - `others` は情報量圧縮の対象にしても、存在自体は別バーとして残す
- どこまで簡略化してよいか:
  - `onepiece main` の縦方向占有を優先し、`bottoms hem` は最小高さへ圧縮してよい
  - `tops overlay / underlay` は full 表現を維持せず、極小サイズ専用の薄い帯または短い占有で読めればよい
  - `legwear` は current どおり lower-body preview 専用のままとし、`others` 側へ逃がさない
  - `bottoms hem` や `tops` が視認限界を下回る場合でも、dedicated mode 自体は落とさず、省略ルールを dedicated mode 内に閉じ込めるほうが current 境界を壊しにくい
- A案: current dedicated mode の縮小最適化
  - メリット: mode 判定を増やさず、outfit / wear log で current の境界を保ちやすい
  - メリット: current 参照 md の延長で説明しやすく、`onepiece main` / `bottoms hem` / `others` の責務も維持しやすい
  - デメリット: 極小サイズでは `tops overlay / underlay` と `bottoms hem` の最小可視量の調整が難しく、renderer 条件分岐が段階的に増えやすい
- B案: 極小サイズ専用の簡略レイアウトを別に持つ
  - メリット: 極小サイズ向けに情報密度を割り切りやすく、`tops` と `bottoms hem` の省略基準を明示しやすい
  - デメリット: dedicated mode の中にさらに別レイアウト責務が増え、outfit / wear log で乖離しやすい
  - デメリット: current 参照 md / 設計正本 / test の更新点が増える
- 現時点の比較メモ:
  - 第一候補は A案。極小サイズでも `onepiece + bottoms` dedicated mode を維持する前提を優先し、専用 mode の中で縮小最適化するほうが current と矛盾しにくい
  - B案は、A案では `tops` と `bottoms hem` の可読性が確保できないと判明した場合の次案として残す
- outfit / wear log を揃えるか:
  - mode 境界と最低限残す情報は揃える
  - ただし入力正本は outfit item / `wear_log_items` で別なので、helper や ViewModel は別責務のまま調整してよい
- 今決めること:
  - 極小サイズでも `onepiece + bottoms` は dedicated mode を維持する前提で進める
  - 最低限残す情報は `onepiece main` / `bottoms hem` / tops 全体の overlay / underlay のどちら側か / `others` とする
  - compact は小さい thumbnail variant を指す補助区分として残してよいが、一覧 / 詳細で `onepiece main`・`bottoms hem`・tops 全体・`others` の構造比率は変えない
  - `legwear = lower-body 専用`、`allinone + bottoms = standard 維持`、`sort_order` 正本は今回の検討では動かさない
- まだ保留でよいこと:
  - `bottoms hem` の最小高さの最終値
  - `tops overlay / underlay` を帯で表すか、より簡略した占有で表すか
  - 極小サイズの閾値を viewport 幅基準にするか、thumbnail 実寸基準にするか
  - A案で足りない場合にだけ B案へ切り出すかどうか
- 実装する場合の最小着手順:
  1. current 参照 md に合わせて、極小サイズでも残す要素と省略候補を ViewModel 上で明文化する
  2. outfit / wear log それぞれで dedicated mode の極小サイズ分岐を追加し、`onepiece main` / `bottoms hem` / tops 全体 / `others` の優先順位を固定する
  3. renderer を最小調整し、必要なら A案の範囲で `tops` と `bottoms hem` の縮小表現だけを追加する
  4. test と current 参照 md を突き合わせて、B案が不要か確認する
- test 観点:
  - outfit / wear log とも極小サイズでも `onepiece + bottoms` が dedicated mode のままか
  - `onepiece main` が常に主役として残り、`allinone + bottoms` は standard のままか
  - `bottoms hem` が dedicated mode 内の補助表現として残り、`others` は別バーを維持するか
  - `tops` は個別混在ではなく、tops 全体が overlay / underlay のどちら側に見えるかだけを表すか
  - `legwear` が `others` に戻らず lower-body preview 専用のままか


## `allinone + bottoms` 検討メモ

- A案: dedicated mode へ上げる
  - メリット: `onepiece + bottoms` と同じ系統で読める
  - デメリット: `allinone` は current で full 寄りの衣服として扱っており、`bottoms` を補助表示にしても意味がぶれやすい
  - 影響: outfit / wear log 両方で mode 判定、ViewModel、renderer、参照 md の更新が必要
- B案: current どおり standard 維持
  - メリット: current 実装 / current 参照 md / current test をそのまま保てる
  - デメリット: `onepiece + bottoms` だけ dedicated mode で、`allinone + bottoms` は standard のままという差が残る
  - 影響: outfit / wear log とも追加実装は不要で、必要なのは判断材料の追記と表示例整理にとどまる
- `onepiece + bottoms` と同列に扱えない理由:
  - current の `allinone` は onepiece よりも body 全体を占める台形が強く、`bottoms` を「裾から少し見える補助」として正当化しにくい
  - `tops` との前後は dedicated mode を入れても `sort_order` 正本で解決する必要があるが、`allinone + bottoms` では lower-body preview の出し方や `others` へ残す情報が課題になる
- current のまま残す場合の不整合:
  - `onepiece_allinone` という総称に対して `onepiece` と `allinone` で mode が分かれる
  - ただし current 参照 md で明示しているため、実装上の即時修正が必須な不整合ではない
- 今決めること:
  - `allinone + bottoms` は current / planned / 要再判断 のうち、引き続き `要再判断` に置き、current では standard 維持とする
- まだ保留でよいこと:
  - dedicated mode 化するとした場合の lower-body preview 高さ、`others` との棲み分け、極小サイズ時の省略方法
- 実装する場合の最小着手順:
  1. outfit / wear log 両方で `allinone + bottoms` 専用の mode 条件を仮固めする
  2. dedicated ViewModel の lower-body 扱いと `tops` との前後をサムネイル表示例で確認する
  3. mode test / ViewModel test / integration test で current 境界との差を固めてから renderer へ入る
- test 観点:
  - outfit / wear log とも `allinone + bottoms` が standard のままか、または dedicated mode へ入れたか
  - `tops` と `allinone` の前後が `sort_order` 正本で崩れないか
  - `legwear` が `others` に戻らず lower-body preview 専用のままか



- wear logs の個別詳細には、まだ配色サムネイルを出していない
- wear log 個別詳細は主操作画面として扱い、`planned <-> worn` の状態変更はその場で行い、日付・表示順・item 構成の変更は編集画面へ寄せる
- wear log 個別詳細では、`invalid` outfit / `disposed` item / `in_cleaning` item / 過去 planned を補助 warning として表示する
- wear log 個別詳細の UI は、過去 planned の補助文と主操作を上段に寄せ、基本情報を同じカード内の下段に続けている
- outfits 詳細では、OFF にしたカテゴリのアイテムを非表示にし、非表示件数を案内する
- 新規登録完了後はカテゴリプリセット選択画面へ遷移し、`male / female / custom` の初期設定を完了してからホームへ進む
- `custom` を選んだ場合は settings の onboarding モードで全カテゴリ ON から調整し、保存後にホームへ遷移する
- ブランド候補基盤として `user_brands`、`BrandNormalizer`、`GET /api/settings/brands` / `POST /api/settings/brands` / `PATCH /api/settings/brands/{id}` を実装済み
- item create / update は `save_brand_as_candidate` を受け取り、Laravel 側で候補追加を試行する
- `items.brand_name` は item の正本、`user_brands` は入力補助候補の正本とし、FK では結ばない
- item 新規作成 / 編集画面では、`GET /api/settings/brands` を使ったブランド候補サジェスト UI を実装済み
- `/settings/brands` ではブランド候補一覧 / 追加 / 編集 / 有効無効切替 UI を実装済み
- 設定画面のブランド候補一覧では、キーワード絞り込み、更新日時表示、無効候補の折りたたみ表示まで実装済み

planned:

- ページ内遷移での未保存変更警告は未対応のため、必要に応じて今後整理する
- DELETE API は未対応
- TPO Phase 1 の互換として残している item / outfit の `tpos` フィールドは、wear log 側の対応方針と旧入力互換の整理後に削除可否を判断する
- `api/routes/web.php` に残っている settings preferences / categories と item / outfit の長い validation・更新処理は、後続で controller / request / support へ分割できる

### テスト用 seed ユーザー

実装済み:

- 3 アカウント固定の `empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を Seeder で作成する
- デフォルトパスワードは `password123` 、env は `TEST_SEED_USER_PASSWORD` で上書きできる
- `TestDatasetSeeder` で、テスト用ユーザーと sample data だけを再投入できる
- `TestDatasetSeeder` 単体実行でも category group / master / preset を含めて再投入できる
- `standard-user` には手書き 12 件の items と 6 件の outfits、8 件の wear logs を紐づける
- `large-user` には Factory 併用の 36 件の items と 12 件の outfits を紐づける
- `empty-user` は items / outfits 0 件の初期状態として再生成する
- TPO 候補用 `SampleUserTpoSeeder` を追加し、`standard-user` / `large-user` では active / inactive を含む `user_tpos` を再投入できる
- settings 配下以外でも同じ操作系アイコンの利用が増えた場合は、`settings-icons.ts` をより汎用な shared icon 定義へ切り出すかを再判断する
- ブランド候補用 `SampleUserBrandSeeder` を追加し、`empty-user` 0 件、`standard-user` 標準件数、`large-user` 多件数の `user_brands` を再投入できる
- `standard-user` は item 側の `brand_name` と揃えた候補を中心に持ち、`large-user` は絞り込み・無効候補折りたたみ確認向けに inactive 候補も含める

補足:

- sample data では category / colors / seasons / tpos / tpo_ids / spec に加え、brand 候補確認用の `items.brand_name` と `user_brands` も反映済み
- TODO: wear log の sample date は固定日ではなく、seed 実行日を基準に前後日・月またぎを確認できる相対日付投入へ寄せる

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
- BFF の GET でも upstream の `Set-Cookie` をブラウザへ返すようにし、`/api/auth/me` を含む GET 経路で Laravel 側の session refresh が伝播するよう整理した
- 一方で Server Component から直接 Laravel を読む SSR 用 GET helper は、レスポンスヘッダをそのままブラウザへ返せないため、session refresh の伝播経路にはならないことを明記した

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
- item SVG は画像がない場合の代替表現として簡潔さを優先し、non-lower-body 系カテゴリを角丸四角ベースの共通表現へ寄せた
- サブカラーは基本を上寄りの水平ラインとし、shoes だけ下寄りラインの例外を持たせた
- tops spec は保存・表示には残しつつ、item SVG の shape 個別描画からは切り離した
- outfit 側のサムネイルは item と責務が異なるため、既存の重ね着 / 分割 / 合成ルールを維持している
- `tops` 用 master-data (`shape / sleeve / length / neck / design / fit`) を UI に反映した
- 詳細画面では `topsSpecRaw` を nullable-safe に組み立てるよう修正した
- `spec.tops` の表示ラベル変換を共通化し、detail / create / edit のプレビュー表示で同じ変換を使うようにした
- category / shape の表示は master-data の日本語ラベルを使うように統一した
- category master を DB / Seeder / API に追加し、`GET /api/categories` を利用できるようにした
- create / edit / list のカテゴリ選択肢は categories API を読む下地を追加した
- Item 新規作成 / 編集のカテゴリ候補に `onepiece_allinone` と `inner` を追加し、ワンピース / オールインワンとルームウェア・インナーも設定連動で選べるようにした
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

- item SVG の簡略化方針を docs と実装メモで揃え続ける
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
- invalid outfit 一覧は通常一覧と分離し、一覧では短い invalid 理由と `詳細 / 複製` を主導線にし、復旧は詳細で条件確認して行う
- invalid outfit 詳細は「無効の理由」と次操作をまとめて示し、複製を主導線、復旧を補助導線として配置している
- invalid outfit 詳細の memo / season / tpo は `基本情報` セクションでまとめて確認する

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
- ホーム / アイテム / コーディネート / 購入検討 / 着用履歴 / 設定 の共通ボトムナビ
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
- `size_note`：サイズ感・着用感の補足メモ
- `size_details`：`structured` と `custom_fields` からなる構造化実寸
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

- current MVP に対する推奨は「今すぐ実装しない。ただし、将来入れるなら内部向け最小 event log を第一候補にする」
- 優先候補は `item_disposed` / `item_reactivated` / `outfit_invalidated` / `outfit_restored` / `outfit_duplicated` / `purchase_candidate_purchased`
- wear logs の create / update / delete 全件記録や、ユーザー向け履歴 UI は当面保留とする

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

wear logs は一覧 / 詳細 / 登録 / 更新 / 削除、月カレンダー表示、日詳細シートまで実装済み。  
一方で、snapshot や候補 UI のさらなる高度化は未実装。

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
- 一覧は確認・遷移、詳細は確認と主操作、編集は内容変更の責務で分け、削除導線は個別詳細を主導線としつつ編集画面側にも残している
- form の候補 UI では、outfit に構成数 / 季節 / TPO、item にカテゴリ / 形 / 色の補助情報を出し、詳細責務を持たせすぎない範囲で選択しやすさを補う
- selected item の順序は frontend 上で上下移動でき、保存時はその順序に従って `sort_order` を連番再採番する
- candidate 数が多い場合に備え、form 内で outfit 名・季節・TPO、item 名・カテゴリ・季節・TPOの軽い絞り込みを持たせる
- 一覧画面には月カレンダーを併設し、`GET /api/wear-logs/calendar` を使って日付ごとの件数と dot を描画する
- 日付クリック後は `GET /api/wear-logs/by-date` で日詳細シートを開き、`display_order asc` で当日の wear log を確認できる
- カレンダーセルは dot 主体で見せ、`planned / worn` の文字は出さず、選択日 / 今日 / 他月日 / 過去日を弱い状態差で表現する
- 空の日でも日詳細シートは開き、`この日で新規作成` 導線から選択日付きの新規作成画面へ進める

### 要再判断: snapshot

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
