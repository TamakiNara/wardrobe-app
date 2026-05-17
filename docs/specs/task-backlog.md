# Task Backlog

docs 内に散らばっている planned / TODO / 後続 / 要再判断を、**current 仕様とは分けて**一覧化したバックログです。  
ここでは実装履歴は扱わず、**今後の判断・実装候補・整理対象**だけをまとめます。

## 対象と整理方針

- 対象:
  - `docs/specs` 配下の spec / planning / note
- 探索キーワード:
  - `TODO`, `planned`, `future`, `後続`, `未実装`, `残課題`, `要検討`, `再判断`, `Phase`, `将来`, `FIXME`, `XXX`
- 整理方針:
  - 同じ意味のタスクは統合する
  - current 仕様と planned を混ぜない
  - docs に明示がないが手元タスクにあるものは、末尾で `docs未明記 / 要確認` として別管理する

## サマリ

- 棚卸しした docs / 手元タスク由来タスク: **42件**
- 種別別件数:
  - `バグ`: 3
  - `UI`: 13
  - `機能`: 8
  - `設計`: 10
  - `ドキュメント`: 4
  - `後回し`: 4
- 優先度案:
  - `高`: 8
  - `中`: 21
  - `低`: 13

## バグ / 違和感

### BUG-01 天気 docs の current / planned / legacy 食い違い解消

天気 docs 群で current / planned / legacy の説明がずれる箇所を再整理する

- 出典 / 対象箇所: `wears/weather-docs-reorganization.md`, `wears/weather-current-status.md`, `wears/weather-fetching.md`
- 関連機能: weather
- 種別: `バグ`
- 優先度: `中`
- 依存関係: docs 整理
- すぐ実装できるか: `可`

### BUG-02 着用履歴の日詳細モーダルの情報密度見直し

row ごとのサムネイル位置や情報密度の違和感を見直す

- 出典 / 対象箇所: `wears/wear-logs.md` / `要再判断`
- 関連機能: wear logs
- 種別: `バグ`
- 優先度: `中`
- 依存関係: current UI 確認
- すぐ実装できるか: `可`

### BUG-05 振り返りありアイコンの意味整理と表示条件修正

calendar の `has_feedback` と「振り返りあり」アイコンが、振り返り本文ありを意味するのか、評価・温度感・tag を含む feedback 入力ありを意味するのかを UI-14 とあわせて整理する

- 出典 / 対象箇所: 手元タスク, `wears/wear-logs.md`
- 関連機能: wear logs
- 種別: `バグ`
- 優先度: `高`
- 依存関係: UI-14 と同時整理
- すぐ実装できるか: `要設計`

## UI改善

### UI-01 画面横断のアイコン活用方針統一

重いラベルを減らし、Lucide などの icon 利用を横断で揃える。weather / price / deadline / shopping memo / outfit / wear log / care / delete / remove / warning など、意味ごとの icon を整理し、アイコンだけに依存せず text / aria-label / title と併用する

- 出典 / 対象箇所: `duplicate-color-variant.md` / `アイコン候補`, `purchase-candidates.md` / `アイコン候補`, `navigation/global-navigation.md`, 手元タスク
- 関連機能: shared ui
- 種別: `UI`
- 優先度: `中`
- 依存関係: shared UI ルール整理
- すぐ実装できるか: `可`

### UI-02 買い物メモ詳細の表示改善

期限表示詳細化、比較しやすさ、情報密度の再調整

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `高`
- 依存関係: current 表示仕様の維持
- すぐ実装できるか: `可`

### UI-03 買い物メモ追加モードの選択中候補可視化

現在選択中の候補をより分かりやすく見せる

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: 現行 bulk add UI 維持
- すぐ実装できるか: `可`

### UI-04 closed memo の補足表示と操作ロック見せ方

`終了済みのメモです` 補足や disabled 表示をどう見せるか決める

- 出典 / 対象箇所: `shopping-memos.md` / `status / edge cases`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: closed 方針整理
- すぐ実装できるか: `要設計`

### UI-05 item サムネイルの dedicated mode / 簡略化再判断

極小サイズ時の簡略化や `allinone + bottoms` の dedicated mode 化を判断する

- 出典 / 対象箇所: `items/thumbnail-current-reference.md`, `items/thumbnail-skin-exposure.md`
- 関連機能: items thumbnails
- 種別: `UI`
- 優先度: `低`
- 依存関係: current サムネイル責務維持
- すぐ実装できるか: `要設計`

### UI-06 dropdown / popover の viewport 下端対応と overlay ルール整理

bottom nav / AppShell / confirmation UI / dropdown の棚卸しは実施済みで、BrandFilter dropdown の z-index は `z-[60]` へ修正済み。残件として、SP 幅目視確認、viewport 下端で dropdown が見切れる場合の placement / max-height / safe-area 対応、Portal 要否、z-index / overlay ルール正式化を整理する。

- 出典 / 対象箇所: 手元タスク, ColorSelect dropdown と bottom nav 干渉修正の運用メモ, BrandFilter dropdown z-index 修正
- 関連機能: shared ui / navigation
- 種別: `UI`
- 優先度: `低`
- 依存関係: 新しい dropdown / popover UI の追加時
- すぐ実装できるか: `可`

### UI-08 購入検討削除不可理由から買い物メモへの導線検討

current では買い物メモ所属ありの購入検討は削除前に理由を表示し、削除実行しない。後続では、削除不可理由から該当する買い物メモへ辿れるリンク、買い物メモ名の表示、delete-check API が必要になる条件を検討する。

- 出典 / 対象箇所: `purchase-candidates.md`, `shopping-memos.md`, `docs/api/openapi.yaml`
- 関連機能: purchase candidates / shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: current 削除不可表示 / backend 422 維持
- すぐ実装できるか: `要設計`

### UI-09 詳細画面ヘッダーのレイアウトテンプレート整理

詳細画面の header / actions / footer 相当の配置ルールを整理し、`EntityDetailHeader` の `actions` にはコンパクトな操作群だけを置き、削除確認 UI・warning・補足文のような横幅を取る UI はヘッダー下段またはページ側の独立エリアへ逃がす方針を正本化する。item / outfit / purchase candidate / shopping memo へ展開できるテンプレートとしてまとめる。

- 出典 / 対象箇所: `ui/page-header-guidelines.md`, `items/delete-policy.md`, `outfits/create-edit.md`, 各 detail page current 実装
- 関連機能: shared detail header
- 種別: `UI`
- 優先度: `中`
- 依存関係: current detail header 棚卸し / confirm UI 方針
- すぐ実装できるか: `可`

### UI-10 認証エラー通知と login 後復帰の設計整理

current の 401 は `/login?message=session_expired` へ遷移し、login page 側で通知する。後続では、`return_to` / `next` によるログイン後復帰、Toast / Notification component の導入要否、一般エラー通知 UI の共通化を検討する。

- 出典 / 対象箇所: `web/src` の alert 使用箇所, 手元確認メモ
- 関連機能: auth / error notification
- 種別: `UI`
- 優先度: `中`
- 依存関係: 現状の 401 redirect helper / login message
- すぐ実装できるか: `要設計`

### UI-11 天気の予報から実績更新時の差分表示

予報から実績へ更新する際、天気 / 気温 / 最高気温 / 最低気温 / 降水 / 湿度 / 風 / 体感に関係する項目が、更新前から更新後へどう変わるか比較表示する。最高・最低気温は forecast / observed 取得値が payload / DB / frontend 表示へ反映されることを回帰テストで確認済み。取得した実績欄への最高・最低気温表示は対応済みで、残件は更新前→更新後の差分比較表示。

- 出典 / 対象箇所: 手元タスク, `wears/weather-current-status.md`
- 関連機能: weather
- 種別: `UI`
- 優先度: `中`
- 依存関係: weather update 挙動確認済み
- すぐ実装できるか: `要設計`

### UI-13 着用履歴と天気登録の相互リンク

wear log detail から当日の天気登録・天気詳細へ移動しやすくし、weather record 側から関連する着用履歴へ戻れる導線を検討する。複数着用履歴がある日の扱い、登録済み / 未登録の表示差分も整理する

- 出典 / 対象箇所: 手元タスク, `wears/wear-logs.md`, `wears/weather-current-status.md`
- 関連機能: wear logs / weather
- 種別: `UI`
- 優先度: `中`
- 依存関係: weather record と wear log の紐づけ確認
- すぐ実装できるか: `要設計`

### UI-14 着用履歴の振り返り導線改善

着用履歴詳細画面および登録 / 編集フォームでは、コーディネート・アイテム・天気などの記録内容と、服装の振り返り入力が同じ画面に混在している。まず、登録 / 編集フォームの主責務を「いつ・何を着たかを登録する」画面として整理し、`memo` は登録時メモ、`feedback_memo` / 総合評価 / 屋外・屋内の温度感 / `feedback_tags` は着用後の振り返り・服装フィードバックとして分ける方針を検討する。

#### 短期方針

WearLogForm から振り返り項目を外す前提で、画面責務と項目の意味を先に整理する。実装時は `memo` を登録時メモとして残し、服装フィードバック系項目は詳細画面内の専用セクション、または振り返り専用導線へ寄せる。現行の作成 / 更新 API は全体更新のため、既存 API を流用する場合は詳細取得後に送信内容を再構成する必要がある。backend 側には `PATCH /api/wear-logs/{id}/feedback` を追加済みで、服装フィードバック / 振り返り項目だけを更新できる。

#### 中期方針

振り返り専用ページまたは詳細画面からの専用導線を検討する。現行の `PUT /api/wear-logs/{id}` は `items` を必須にする全体更新寄りの API であり、振り返り画面から既存 API を流用すると `items` / `source_outfit_id` の再構成ミスで着用記録本体を壊すリスクがある。backend 側は `PATCH /api/wear-logs/{id}/feedback` で `overall_rating` / 屋外・屋内の温度感 / `feedback_tags` / `feedback_memo` だけを更新できるため、frontend の振り返り専用導線ではこの API を使う。そのタイミングで `has_feedback` / カレンダーアイコン / aria-label が「服装フィードバックあり」なのか「振り返りメモあり」なのかを再定義する。

- 出典 / 対象箇所: 手元タスク, `wears/wear-logs.md`
- 関連機能: wear logs
- 種別: `UI`
- 優先度: `中`
- 依存関係: BUG-05 と同時整理
- すぐ実装できるか: `要設計`

### UI-15 コーディネート作成時のアイテム選択 UI 改善

コーディネート作成時の選択中 item の見やすさ、順番入れ替え、item 詳細リンク、色チップ、画像表示、季節 / TPO 選択位置を見直す。季節 / TPO がコーディネート自体の属性なのか、選択 item 由来なのかも UI 順序とあわせて検討する

- 出典 / 対象箇所: 手元タスク, `outfits/create-edit.md`
- 関連機能: outfits / items
- 種別: `UI`
- 優先度: `中`
- 依存関係: current outfit create/edit UI 確認
- すぐ実装できるか: `要設計`

## 機能追加

### FEAT-01 セットアップリンク機能

`セットアップ可` を超えて、関連 item のリンク管理まで扱う

- 出典 / 対象箇所: `tags.md` / `セットアップリンク機能`
- 関連機能: tags / items
- 種別: `機能`
- 優先度: `低`
- 依存関係: タグ運用の実績確認
- すぐ実装できるか: `要設計`

### FEAT-02 item 状態管理の完成

`disposed` / `reactivate` / delete の役割分担を完成させる

- 出典 / 対象箇所: `planning/next-features.md` / `item状態管理の完成`, `items/status-management.md`, `items/delete-policy.md`
- 関連機能: items
- 種別: `機能`
- 優先度: `高`
- 依存関係: current status 方針維持
- すぐ実装できるか: `要設計`

### FEAT-03 素材・混率管理

素材明細 + 混率を item / purchase candidate へ導入する

- 出典 / 対象箇所: `planning/next-features.md` / `素材・混率管理`, `items/material-composition.md`
- 関連機能: items / purchase candidates
- 種別: `機能`
- 優先度: `高`
- 依存関係: DB / API 設計確定
- すぐ実装できるか: `要設計`

### FEAT-04 検索・絞り込み強化

状態・雨対応・ブランド・色・素材などの filter を段階追加する

- 出典 / 対象箇所: `planning/next-features.md` / `検索・絞り込み強化`, `discovery/list-common-guidelines.md`
- 関連機能: discovery
- 種別: `機能`
- 優先度: `中`
- 依存関係: 素材・状態・TPO 設計
- すぐ実装できるか: `要設計`

### FEAT-05 分析・可視化 / 着用統計

着用履歴から item 単位の着用回数を集計し、今季よく着た item、着用回数、最終着用日、未着用期間、care status、手放す / クリーニング候補などを表示する。outfit 経由 / item 直接登録 / 同一 wear log 内重複 count / 期間・季節・TPO 指定 / disposed item の扱いも整理する

- 出典 / 対象箇所: `planning/next-features.md` / `分析・可視化`, 手元タスク
- 関連機能: home / wears / items
- 種別: `機能`
- 優先度: `中`
- 依存関係: wear logs 定義の固定
- すぐ実装できるか: `要設計`

### FEAT-06 買い物メモ追加導線の拡張

詳細内追加、購入検討詳細からの単体追加、新規 memo 作成して即追加をまとめて進める

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`, `後続タスク`
- 関連機能: shopping memos / purchase candidates
- 種別: `機能`
- 優先度: `中`
- 依存関係: current bulk add 安定化
- すぐ実装できるか: `可`

### FEAT-07 アイテムからコーディネートを検索する

#### 現状

item detail から `/outfits?item_id={id}` へ遷移し、その item を含む outfit だけを一覧表示する導線と API filter は対応済み。wear log 登録 / 編集では、手動 item を1件選択した時に「このアイテムを含むコーディネート候補」を表示し、候補 outfit 選択で `source_outfit_id` を設定、手動 item 選択をクリアして outfit ベースの記録へ切り替える MVP も対応済み。選択中 item / outfit は選択中エリアから直接解除できる。item / outfit 候補一覧は初期状態では閉じ、開いた時に初回取得する構成へ変更済み。

#### 残件

item detail から outfit list へ遷移した場合の戻り導線、item list 側の導線、複数 item 検索の要否、wear log form の item / outfit 選択 UI polish は残件として扱う。単純に outfit 候補欄を item 一覧より上へ移動すると、item 選択後に上へ戻る必要があり操作の流れに反するため、選択した item カードの近くに候補を出す、候補欄へ自動スクロールする、item 一覧のさらなる折りたたみ、選択中エリアを sticky 化するなど操作導線として再検討する。あわせて、検索 / 絞り込み強化、選択中 outfit から詳細へ遷移する導線、item 手動選択と outfit 選択の状態表示、候補 outfit 欄の補足文・候補なし / loading / error 表示の見せ方を整理する。

- 出典 / 対象箇所: 手元タスク, `outfits/create-edit.md`, `items/status-management.md`, `outfits/list-filters.md`
- 関連機能: items / outfits / wear logs
- 種別: `機能`
- 優先度: `高`
- 依存関係: item_id filter MVP 維持
- すぐ実装できるか: `可`

### FEAT-08 コーディネート参考メモ・画像管理と購入検討リンク

コーディネート参考メモ、参考画像、購入検討とのリンクをどこまで outfit に持たせるか検討する。購入検討から outfit 参考へつなぐ導線、画像管理、import/export 影響も整理する

- 出典 / 対象箇所: 手元タスク
- 関連機能: outfits / purchase candidates
- 種別: `機能`
- 優先度: `低`
- 依存関係: outfit 画像・メモ責務整理
- すぐ実装できるか: `要設計`

## 設計整理

### DES-01 ログ設計 / エラー設計

何を残すか、どの粒度で残すかを実装前提に落とし込む

- 出典 / 対象箇所: `logging/logging-policy.md`, `discovery/list-common-guidelines.md`
- 関連機能: shared backend
- 種別: `設計`
- 優先度: `中`
- 依存関係: current logging 方針確認
- すぐ実装できるか: `要設計`

### DES-02 purchase candidate TPO の ID ベース化と wear log 適用粒度整理

settings の `user_tpos` を正本にしつつ、wear log へどこまで広げるか決める。purchase candidate 側の名称ベース `tpos: string[]` を将来 `tpo_ids` へ寄せる場合の DB / API / frontend / import-export / 複製 / 色違い追加 / item 化 draft / 表示 fallback / TPO 名変更 / 非表示設定への影響も整理する

- 出典 / 対象箇所: `settings/tpos.md`, `purchase-candidates.md`, 手元タスク
- 関連機能: settings / purchase candidates / wears
- 種別: `設計`
- 優先度: `高`
- 依存関係: current TPO 運用整理
- すぐ実装できるか: `要設計`

### DES-03 colors / seasons / tpos / brand の正規化整理

colors / seasons / tpos / brand の JSON・文字列運用をどこまで正規化するか決める。色名解決 helper を items / outfits / purchase candidates で共通化する必要があるかもあわせて確認する

- 出典 / 対象箇所: `purchase-candidates.md`, `settings/brand-candidates.md`, 手元タスク
- 関連機能: items / purchase candidates / settings
- 種別: `設計`
- 優先度: `中`
- 依存関係: TPO / brand 方針確定
- すぐ実装できるか: `要設計`

### DES-04 実寸自由項目の structured template 昇格

purchase candidate / item の実寸自由項目について、登録データを見て頻出項目名や category ごとの差を確認し、shared template へ段階昇格するか検討する

- 出典 / 対象箇所: `purchase-candidates.md` / `実寸 template 昇格方針`, 手元タスク
- 関連機能: items / purchase candidates
- 種別: `設計`
- 優先度: `中`
- 依存関係: current free-form data 調査
- すぐ実装できるか: `可`

### DES-05 購入検討・買い物メモの期限表示整理

current UI では `sale_ends_at` は「販売終了日」、`discount_ends_at` は「セール終了日」として扱い、買い物メモでは近い方を代表期限として畳んで表示している。UI 表示名、API / DB field、OpenAPI、import/export、shopping memo summary、期限切れ / 期限間近 badge、詳細での個別表示、`sale_ends_at` の rename / alias / deprecate を整理する

- 出典 / 対象箇所: `purchase-candidates.md`, `shopping-memos.md`, `import-export.md`, 手元タスク
- 関連機能: purchase candidates / shopping memos
- 種別: `設計`
- 優先度: `高`
- 依存関係: docs 上の意味固定済み / import-export 互換確認後
- すぐ実装できるか: `要設計`

### DES-06 カテゴリ別 shape / spec 粒度の再判断

bags / pants / skirts / shoes などの category ごとに shape や spec をどこまで持つか整理する

- 出典 / 対象箇所: `items/bags.md`, `items/fashion-accessories.md`, `items/kimono.md`, `items/legwear.md`, `items/outerwear.md`, `items/pants.md`, `items/shoes.md`, `items/skirts.md`, `items/swimwear.md`
- 関連機能: items
- 種別: `設計`
- 優先度: `低`
- 依存関係: 実運用フィードバック
- すぐ実装できるか: `要設計`

### DES-07 import で drop した feedback tag の通知方針整理

current の wear log feedback tag import は lenient import とし、legacy / unknown tag は保存せず import を継続する。後続では、drop した tag の件数や内容を import summary / warning log へ出すか、unknown tag を将来 strict 化するかを判断する。

- 出典 / 対象箇所: `import-export.md`, `wears/wear-logs.md`
- 関連機能: import-export / wear logs
- 種別: `設計`
- 優先度: `中`
- 依存関係: current lenient import 維持
- すぐ実装できるか: `要設計`

### DES-08 楽天 URL の店舗単位 group 化確認

買い物メモの domain group で、楽天を `item.rakuten.co.jp` だけでまとめず店舗単位に分けられるか確認する。楽天 URL の shop id / shop slug 取得可否、他 EC サイトとの差、group 表示名、domain group との優先順位、URL parser helper の必要性を整理する

- 出典 / 対象箇所: 手元タスク, `shopping-memos.md`
- 関連機能: shopping memos / purchase candidates
- 種別: `設計`
- 優先度: `中`
- 依存関係: URL サンプル確認
- すぐ実装できるか: `要設計`

### DES-09 item / purchase candidate のケア・素材系ステータス整理

伸縮性、裏地、透け感、洗濯方法、洗濯表示、アイロン可否、乾燥機可否、クリーニング要否などを item / purchase candidate のどちらに持たせるか、item 化時にどう引き継ぐか、filter / search / import-export / future analysis へどう使うか整理する

- 出典 / 対象箇所: 手元タスク, `items/material-composition.md`, `planning/next-features.md`
- 関連機能: items / purchase candidates
- 種別: `設計`
- 優先度: `低`
- 依存関係: 素材・混率管理方針
- すぐ実装できるか: `要設計`

### DES-10 特定 TPO の初期表示制御

特定 TPO を一覧や選択 UI で初期表示しない設定が必要か整理する。`settings/tpos.md` の inactive 表示とは別論点として、非表示対象、fallback、分析・filter への影響を確認する

- 出典 / 対象箇所: 手元タスク, `settings/tpos.md`
- 関連機能: settings / discovery
- 種別: `設計`
- 優先度: `低`
- 依存関係: TPO 運用整理
- すぐ実装できるか: `要設計`

## ドキュメント整理

### DOC-01 機能単位 docs のフォーマット化 / 重複整理

current / planned / 要再判断 の分け方を揃え、重複説明を減らす

- 出典 / 対象箇所: `planning/next-features.md` / `docs の整合更新`, `wears/weather-docs-reorganization.md`
- 関連機能: docs全体
- 種別: `ドキュメント`
- 優先度: `高`
- 依存関係: 正本 docs の役割定義
- すぐ実装できるか: `可`

### DOC-02 specs index / backlink 整理

index から主要 spec と backlog に辿りやすくする

- 出典 / 対象箇所: `README.md`, `weather-docs-reorganization.md`
- 関連機能: docs navigation
- 種別: `ドキュメント`
- 優先度: `低`
- 依存関係: backlog 作成後
- すぐ実装できるか: `可`

### DOC-03 OpenAPI / import-export / spec の整合点検

spec と OpenAPI と import/export 説明のズレを継続的に減らす

- 出典 / 対象箇所: `import-export.md`, `docs/api/openapi.yaml`, 各 spec
- 関連機能: shared docs
- 種別: `ドキュメント`
- 優先度: `中`
- 依存関係: 実装変更ごとの追従
- すぐ実装できるか: `可`

### DOC-04 画面遷移図作成

item / outfit / purchase candidate / shopping memo / wear log / settings などの主要導線を画面遷移図として整理し、spec index から辿れるようにする

- 出典 / 対象箇所: 手元タスク
- 関連機能: docs navigation
- 種別: `ドキュメント`
- 優先度: `低`
- 依存関係: current 主要導線確認
- すぐ実装できるか: `可`

## 後でやる / deferred

### DEF-01 `shopping_memo_group_adjustments`

group 調整テーブルと UI を後続導入する

- 出典 / 対象箇所: `shopping-memos.md` / `未実装`
- 関連機能: shopping memos
- 種別: `後回し`
- 優先度: `低`
- 依存関係: group adjustment 設計
- すぐ実装できるか: `不可`

### DEF-02 manual group

自動 group とは別に手動 group を持つか決める

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `後回し`
- 優先度: `低`
- 依存関係: DEF-01 と併せて判断
- すぐ実装できるか: `不可`

### DEF-03 weather snapshot 拡張

`forecast_snapshot / observed_snapshot` の保存・export 方針を固める

- 出典 / 対象箇所: `wears/weather-records.md` / `snapshot planned`, `import-export.md`
- 関連機能: weather / import-export
- 種別: `後回し`
- 優先度: `低`
- 依存関係: weather records 設計の成熟
- すぐ実装できるか: `要設計`

### DEF-04 旧天気 API / legacy field の Phase E 以降整理

legacy columns / 互換終了 / export 縮小を Phase E 以降で進める

- 出典 / 対象箇所: `wears/weather-legacy-cleanup.md` / `Phase E 以降`
- 関連機能: weather legacy
- 種別: `後回し`
- 優先度: `低`
- 依存関係: Phase D 完了、migration 判断
- すぐ実装できるか: `不可`

## 重複統合メモ

- 買い物メモの後続項目は、個別の phase 記録ではなく
  - `UI-02`
  - `UI-03`
  - `UI-04`
  - `FEAT-06`
  - `DEF-01`
  - `DEF-02`
    に統合した
- 天気系の phase 記録は、そのまま backlog 項目にせず
  - `BUG-01`
  - `DES-05`
  - `DEF-03`
  - `DEF-04`
    に集約した
- item カテゴリ別の `shape` / `spec` 再判断は、カテゴリごとの細分化をやめて `DES-06` に統合した
- 購入検討 docs の sale 要約表示や比較系の後続は、分析 / 可視化の流れとして `FEAT-05` に近いものは寄せ、shopping memo 追加導線は `FEAT-06` に寄せた
- 手元タスクのうち、native dialog 置き換え、BrandFilter z-index、購入検討削除不可の事前表示、backend test 既存失敗解消は完了済みとして新規追加しない
- 着用履歴の振り返り関連は、カレンダーアイコンの意味整理 (`BUG-05`) と導線改善 (`UI-14`) を分けて管理するが、実装判断は同時に行う
- 着用統計と今季よく着た item は、別々のタスクにせず `FEAT-05` に統合した
- 期限表示と `sale_ends_at` / `discount_ends_at` internal name の再判断は、同じ期限設計として `DES-05` に統合した

## 手元タスクとの対応

- 適宜アイコンを使って視覚化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `UI-01`
- 実寸自由項目入力欄のレイアウト差異
  - 対応状況: 対応済み
  - 対応 backlog / メモ: item / purchase candidate 共通の `ItemSizeDetailsFields` で自由項目の単一値 / 注記配置を template 項目に合わせた
- 伸縮性 / 裏地 / 洗濯方法 / 洗濯表示
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-09`。素材・混率の実装タスクは `FEAT-03`
- セットアップ登録・リンク追加
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `FEAT-01`
- 今季よく着たアイテムの統計
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `FEAT-05`
- アイテム削除
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `FEAT-02`
- コーディネート参考メモ・画像管理、購入検討とのリンク
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `FEAT-08`
- 着用履歴からアイテム単位での着用回数集計
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `FEAT-05`
- 特定TPOを一覧で初期表示しない
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-10`。`settings/tpos.md` の inactive 表示とは別論点
- ログ設計
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DES-01`
- 機能単位のdocsフォーマット化 / 重複整理
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DOC-01`
- 画面遷移図
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DOC-04`
- 正規化
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DES-02`, `DES-03`
- 旧天気API関連のPhase E以降
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DEF-04`
- purchase candidate TPOのIDベース化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-02`
- 色名解決helper共通化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-03`
- 実寸自由項目のtemplate昇格
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-04`
- `sale_ends_at` / `discount_ends_at` のinternal name見直し
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-05`
- 買い物メモの期限表示詳細化
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `UI-02`
- custom dropdown / popover とボトムナビの重なり確認
  - 対応状況: 一部対応済み
  - 対応 backlog / メモ: `UI-06`。BrandFilter z-index は修正済み。viewport 下端 / placement / overlay ルールは残件
- 天気の予報→実績更新時の差分表示
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-11`
- 振り返り未記入時の振り返りありアイコン表示条件修正
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `BUG-05`。`has_feedback` と「振り返りあり」アイコンの意味を `UI-14` とあわせて整理する
- 着用履歴カレンダー凡例の色整理
  - 対応状況: 対応済み
  - 対応 backlog / メモ: 予定は amber の破線 outline、着用済みは indigo の塗り、予報は sky、実績は emerald として凡例と実表示を揃えた
- 着用履歴と天気登録の相互リンク
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-13`
- 着用履歴の振り返り導線改善
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-14`
- アイテムからコーディネートを検索する
  - 対応状況: MVP 対応済み / 残件は backlog 維持
  - 対応 backlog / メモ: `FEAT-07`
- コーディネート作成時のアイテム選択 UI 改善
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-15`
- 楽天URLの店単位 group 化確認
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-08`

## 次に進める候補 3 件

1. `BUG-05` 振り返りありアイコンの意味整理と表示条件修正
   理由: カレンダーアイコンの意味と詳細画面の振り返りセクションの責務が混ざっており、UI-14 とあわせて先に定義すると後続実装が安全になる。
2. `UI-15` コーディネート作成時のアイテム選択 UI 改善
   理由: outfit 作成体験に直結し、item 詳細リンク・選択済み item の見やすさ・季節 / TPO の入力順整理をまとめて改善しやすい。
3. `DOC-01` 機能単位 docs のフォーマット化 / 重複整理
   理由: 他タスクの判断コストを下げやすく、今後の依頼の前提整理になる。

## 運用案

- 実装済み spec には、原則として大きな backlog を本文へ積み上げず、このファイルへリンクする
- 各 spec には
  - current
  - planned
  - 要再判断
    までを最小限に残し、詳細な棚卸しは本ファイルへ寄せる
- 新しい後続タスクを追加するときは
  - 既存 backlog ID と重複しないか確認する
  - `出典 docs / 関連機能 / 優先度 / 依存関係 / すぐ実装できるか`
    を埋める
