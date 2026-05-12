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

- 棚卸しした docs 由来タスク: **31件**
- 種別別件数:
  - `bug`: 2
  - `ui`: 10
  - `feature`: 6
  - `design`: 6
  - `docs`: 3
  - `deferred`: 4
- 優先度案:
  - `high`: 6
  - `medium`: 16
  - `low`: 9

## バグ / 違和感

| ID     | タスク名                                             | 内容                                                                     | 出典 docs / section                                                                                    | 関連機能  | 種別 | 優先度 | 依存関係        | すぐ実装できるか |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------- | ---- | ------ | --------------- | ---------------- |
| BUG-01 | 天気 docs の current / planned / legacy 食い違い解消 | 天気 docs 群で current / planned / legacy の説明がずれる箇所を再整理する | `wears/weather-docs-reorganization.md`, `wears/weather-current-status.md`, `wears/weather-fetching.md` | weather   | bug  | medium | docs 整理       | yes              |
| BUG-02 | 着用履歴の日詳細モーダルの情報密度見直し             | row ごとのサムネイル位置や情報密度の違和感を見直す                       | `wears/wear-logs.md` / `要再判断`                                                                      | wear logs | bug  | medium | current UI 確認 | yes              |

## UI改善

| ID    | タスク名                                                       | 内容                                                                                                                                                                                                                                                                                                                                                                                                     | 出典 docs / section                                                                                                                                                           | 関連機能                             | 種別 | 優先度 | 依存関係                                       | すぐ実装できるか |
| ----- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---- | ------ | ---------------------------------------------- | ---------------- |
| UI-01 | 画面横断のアイコン活用方針統一                                 | 重いラベルを減らし、Lucide などの icon 利用を横断で揃える                                                                                                                                                                                                                                                                                                                                                | `duplicate-color-variant.md` / `アイコン候補`, `purchase-candidates.md` / `アイコン候補`, `navigation/global-navigation.md`                                                   | shared ui                            | ui   | medium | shared UI ルール整理                           | yes              |
| UI-02 | 買い物メモ詳細の表示改善                                       | 期限表示詳細化、比較しやすさ、情報密度の再調整                                                                                                                                                                                                                                                                                                                                                           | `shopping-memos.md` / `未実装 / planned`                                                                                                                                      | shopping memos                       | ui   | high   | current 表示仕様の維持                         | yes              |
| UI-03 | 買い物メモ追加モードの選択中候補可視化                         | 現在選択中の候補をより分かりやすく見せる                                                                                                                                                                                                                                                                                                                                                                 | `shopping-memos.md` / `未実装 / planned`                                                                                                                                      | shopping memos                       | ui   | medium | 現行 bulk add UI 維持                          | yes              |
| UI-04 | closed memo の補足表示と操作ロック見せ方                       | `終了済みのメモです` 補足や disabled 表示をどう見せるか決める                                                                                                                                                                                                                                                                                                                                            | `shopping-memos.md` / `status / edge cases`                                                                                                                                   | shopping memos                       | ui   | medium | closed 方針整理                                | needs design     |
| UI-05 | item サムネイルの dedicated mode / 簡略化再判断                | 極小サイズ時の簡略化や `allinone + bottoms` の dedicated mode 化を判断する                                                                                                                                                                                                                                                                                                                               | `items/thumbnail-current-reference.md`, `items/thumbnail-skin-exposure.md`                                                                                                    | items thumbnails                     | ui   | low    | current サムネイル責務維持                     | needs design     |
| UI-06 | custom dropdown / popover とボトムナビの重なり確認             | fixed bottom nav / safe-area と dropdown / popover が干渉しないかを確認し、画面下部の選択肢が見えているのに押せない状態を防ぐ。ColorSelect は current で対応済みだが、他の custom select / combobox / popover / dropdown menu / date picker / modal 内 select / mobile bottom sheet 的 UI でも同観点の確認を行う                                                                                         | 手元タスク, ColorSelect dropdown と bottom nav 干渉修正の運用メモ                                                                                                             | shared ui / navigation               | ui   | low    | 新しい dropdown / popover UI の追加時          | yes              |
| UI-07 | native confirm のアプリ内確認 UI への置き換え                  | `window.confirm()` を使っている重要操作を棚卸しし、削除・解除・復元・設定変更などはアプリ内確認 UI へ段階置き換えする。item delete / purchase candidate delete / outfit delete / wear log delete / weather record delete / weather location delete / shopping memo item remove / item dispose / settings categories は current で対応済みとし、残る native dialog は alert / prompt の別論点へ分離する。 | `items/delete-policy.md`, `purchase-candidates.md`, `outfits/create-edit.md`, `wears/wear-logs.md`, `items/status-management.md`, 手元確認メモ, `web/src` の confirm 使用箇所 | shared ui / destructive actions      | ui   | medium | 主要 confirm UI 置き換え完了                   | yes              |
| UI-08 | 購入検討削除前に買い物メモ所属による削除不可状態を事前表示する | current では DELETE 実行後に backend `422` で削除不可が分かるため、purchase candidate detail / edit response に `is_used_in_shopping_memos` や `shopping_memo_count` を追加する案を第一候補として、編集画面の削除セクションで disabled 表示や補足文を出せるようにする。案A: detail / edit response に所属情報を含める。案B: delete-check API を追加する。案C: 常時注意文だけ表示する。推奨は案A。        | `purchase-candidates.md`, `shopping-memos.md`                                                                                                                                 | purchase candidates / shopping memos | ui   | medium | backend 422 実装済み / response 拡張方針判断   | needs design     |
| UI-09 | 詳細画面ヘッダーのレイアウトテンプレート整理                   | 詳細画面の header / actions / footer 相当の配置ルールを整理し、`EntityDetailHeader` の `actions` にはコンパクトな操作群だけを置き、削除確認 UI・warning・補足文のような横幅を取る UI はヘッダー下段またはページ側の独立エリアへ逃がす方針を正本化する。item / outfit / purchase candidate / shopping memo へ展開できるテンプレートとしてまとめる。                                                       | `ui/page-header-guidelines.md`, `items/delete-policy.md`, `outfits/create-edit.md`, 各 detail page current 実装                                                               | shared detail header                 | ui   | medium | current detail header 棚卸し / confirm UI 方針 | yes              |
| UI-10 | 401 alert + login redirect のアプリ内通知化                    | `window.alert()` を使って `401` / セッション切れ / ログイン再要求を通知している箇所を棚卸しし、画面内通知・ログイン導線へ置き換える。削除確認などの native confirm 置き換えとは別タスクとして扱う。                                                                                                                                                                                                      | `web/src` の alert 使用箇所, 手元確認メモ                                                                                                                                     | auth / error notification            | ui   | medium | 401 alert 棚卸し / UX 整理                     | yes              |
| UI-11 | import-export 復元確認 prompt の UI 置き換え                   | `window.prompt()` を使っていたバックアップ復元前の確認を、確認文字列入力つきの画面内 UI へ置き換える。current では `バックアップから復元する` 押下後に確認 UI を開き、`インポート` と一致した場合だけ `復元する` を実行できる。                                                                                                                                                                          | `import-export.md`, `web/src/app/settings/import-export/page.tsx`                                                                                                             | import-export / destructive restore  | ui   | medium | current 復元確認 UI 実装済み                   | yes              |

## 機能追加

| ID      | タスク名                 | 内容                                                                             | 出典 docs / section                                                                                        | 関連機能                             | 種別    | 優先度 | 依存関係                | すぐ実装できるか |
| ------- | ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------- | ------ | ----------------------- | ---------------- |
| FEAT-01 | セットアップリンク機能   | `セットアップ可` を超えて、関連 item のリンク管理まで扱う                        | `tags.md` / `セットアップリンク機能`                                                                       | tags / items                         | feature | low    | タグ運用の実績確認      | needs design     |
| FEAT-02 | item 状態管理の完成      | `disposed` / `reactivate` / delete の役割分担を完成させる                        | `planning/next-features.md` / `item状態管理の完成`, `items/status-management.md`, `items/delete-policy.md` | items                                | feature | high   | current status 方針維持 | needs design     |
| FEAT-03 | 素材・混率管理           | 素材明細 + 混率を item / purchase candidate へ導入する                           | `planning/next-features.md` / `素材・混率管理`, `items/material-composition.md`                            | items / purchase candidates          | feature | high   | DB / API 設計確定       | needs design     |
| FEAT-04 | 検索・絞り込み強化       | 状態・雨対応・ブランド・色・素材などの filter を段階追加する                     | `planning/next-features.md` / `検索・絞り込み強化`, `discovery/list-common-guidelines.md`                  | discovery                            | feature | medium | 素材・状態・TPO 設計    | needs design     |
| FEAT-05 | 分析・可視化 / 着用統計  | 今季よく着た item、着用回数、未着用期間などを集計する                            | `planning/next-features.md` / `分析・可視化`                                                               | home / wears                         | feature | medium | wear logs 定義の固定    | needs design     |
| FEAT-06 | 買い物メモ追加導線の拡張 | 詳細内追加、購入検討詳細からの単体追加、新規 memo 作成して即追加をまとめて進める | `shopping-memos.md` / `未実装 / planned`, `後続タスク`                                                     | shopping memos / purchase candidates | feature | medium | current bulk add 安定化 | yes              |

## 設計整理

| ID     | タスク名                                                      | 内容                                                                                                                                                        | 出典 docs / section                                                                                                                                                                      | 関連機能                               | 種別   | 優先度 | 依存関係                                         | すぐ実装できるか |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------ | ------ | ------------------------------------------------ | ---------------- |
| DES-01 | ログ設計 / エラー設計                                         | 何を残すか、どの粒度で残すかを実装前提に落とし込む                                                                                                          | `logging/logging-policy.md`, `discovery/list-common-guidelines.md`                                                                                                                       | shared backend                         | design | medium | current logging 方針確認                         | needs design     |
| DES-02 | purchase candidate TPO の ID ベース化と wear log 適用粒度整理 | settings の `user_tpos` を正本にしつつ、wear log へどこまで広げるか決める                                                                                   | `settings/tpos.md`, `purchase-candidates.md`                                                                                                                                             | settings / purchase candidates / wears | design | high   | current TPO 運用整理                             | needs design     |
| DES-03 | colors / seasons / tpos / brand の正規化整理                  | colors / seasons / tpos / brand の JSON・文字列運用をどこまで正規化するか決める                                                                             | `purchase-candidates.md`, `settings/brand-candidates.md`                                                                                                                                 | items / purchase candidates / settings | design | medium | TPO / brand 方針確定                             | needs design     |
| DES-04 | 実寸自由項目の structured template 昇格                       | 頻出の自由項目を shared template へ段階昇格する                                                                                                             | `purchase-candidates.md` / `実寸 template 昇格方針`                                                                                                                                      | items / purchase candidates            | design | medium | current free-form data 調査                      | yes              |
| DES-05 | `sale_ends_at` / `discount_ends_at` internal name 見直し      | `sale_ends_at` が current UI 上の `販売終了日` と直感的に一致しない問題を整理し、短期は docs / OpenAPI で意味固定、中長期で rename / deprecate を再判断する | `purchase-candidates.md`, `shopping-memos.md`, `import-export.md`                                                                                                                        | purchase candidates / shopping memos   | design | high   | docs 上の意味固定済み / import-export 互換確認後 | needs design     |
| DES-06 | カテゴリ別 shape / spec 粒度の再判断                          | bags / pants / skirts / shoes などの category ごとに shape や spec をどこまで持つか整理する                                                                 | `items/bags.md`, `items/fashion-accessories.md`, `items/kimono.md`, `items/legwear.md`, `items/outerwear.md`, `items/pants.md`, `items/shoes.md`, `items/skirts.md`, `items/swimwear.md` | items                                  | design | low    | 実運用フィードバック                             | needs design     |

## docs整理

| ID     | タスク名                                  | 内容                                                          | 出典 docs / section                                                                     | 関連機能        | 種別 | 優先度 | 依存関係             | すぐ実装できるか |
| ------ | ----------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------- | ---- | ------ | -------------------- | ---------------- |
| DOC-01 | 機能単位 docs のフォーマット化 / 重複整理 | current / planned / 要再判断 の分け方を揃え、重複説明を減らす | `planning/next-features.md` / `docs の整合更新`, `wears/weather-docs-reorganization.md` | docs全体        | docs | high   | 正本 docs の役割定義 | yes              |
| DOC-02 | specs index / backlink 整理               | index から主要 spec と backlog に辿りやすくする               | `README.md`, `weather-docs-reorganization.md`                                           | docs navigation | docs | low    | backlog 作成後       | yes              |
| DOC-03 | OpenAPI / import-export / spec の整合点検 | spec と OpenAPI と import/export 説明のズレを継続的に減らす   | `import-export.md`, `docs/api/openapi.yaml`, 各 spec                                    | shared docs     | docs | medium | 実装変更ごとの追従   | yes              |

## 後でやる / deferred

| ID     | タスク名                                      | 内容                                                                | 出典 docs / section                                                 | 関連機能                | 種別     | 優先度 | 依存関係                     | すぐ実装できるか |
| ------ | --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------- | -------- | ------ | ---------------------------- | ---------------- |
| DEF-01 | `shopping_memo_group_adjustments`             | group 調整テーブルと UI を後続導入する                              | `shopping-memos.md` / `未実装`                                      | shopping memos          | deferred | low    | group adjustment 設計        | no               |
| DEF-02 | manual group                                  | 自動 group とは別に手動 group を持つか決める                        | `shopping-memos.md` / `未実装 / planned`                            | shopping memos          | deferred | low    | DEF-01 と併せて判断          | no               |
| DEF-03 | weather snapshot 拡張                         | `forecast_snapshot / observed_snapshot` の保存・export 方針を固める | `wears/weather-records.md` / `snapshot planned`, `import-export.md` | weather / import-export | deferred | low    | weather records 設計の成熟   | needs design     |
| DEF-04 | 旧天気 API / legacy field の Phase E 以降整理 | legacy columns / 互換終了 / export 縮小を Phase E 以降で進める      | `wears/weather-legacy-cleanup.md` / `Phase E 以降`                  | weather legacy          | deferred | low    | Phase D 完了、migration 判断 | no               |

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

## 手元タスクとの対応

| 手元タスク                                                | 対応状況           | 対応 backlog / メモ                                                                            |
| --------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| 適宜アイコンを使って視覚化                                | docs 明記あり      | `UI-01`                                                                                        |
| 伸縮性 / 裏地 / 洗濯方法 / 洗濯表示                       | 一部のみ docs 明記 | `FEAT-03` に近い。`裏地` は明記あり、`伸縮性 / 洗濯方法 / 洗濯表示` は docs 未明記で要追加整理 |
| セットアップ登録・リンク追加                              | docs 明記あり      | `FEAT-01`                                                                                      |
| 今季よく着たアイテムの統計                                | docs 明記あり      | `FEAT-05`                                                                                      |
| アイテム削除                                              | docs 明記あり      | `FEAT-02`                                                                                      |
| コーディネート参考メモ・画像管理、購入検討とのリンク      | docs 未明記        | 要確認。必要なら新規 spec 化                                                                   |
| 着用履歴からアイテム単位での着用回数集計                  | docs 明記あり      | `FEAT-05`                                                                                      |
| 特定TPOを一覧で初期表示しない                             | docs 未明記        | 要確認。`settings/tpos.md` の inactive 表示とは別論点                                          |
| ログ設計                                                  | docs 明記あり      | `DES-01`                                                                                       |
| 機能単位のdocsフォーマット化 / 重複整理                   | docs 明記あり      | `DOC-01`                                                                                       |
| 画面遷移図                                                | docs 未明記        | 要確認。必要なら docs タスクとして独立追加                                                     |
| 正規化                                                    | docs 明記あり      | `DES-02`, `DES-03`                                                                             |
| 旧天気API関連のPhase E以降                                | docs 明記あり      | `DEF-04`                                                                                       |
| purchase candidate TPOのIDベース化                        | docs 明記あり      | `DES-02`                                                                                       |
| 色名解決helper共通化                                      | 近い論点あり       | `DES-03` に近い。色名 helper 自体は docs で独立明記が薄く、要確認                              |
| 実寸自由項目のtemplate昇格                                | docs 明記あり      | `DES-04`                                                                                       |
| `sale_ends_at` / `discount_ends_at` のinternal name見直し | docs 明記あり      | `DES-05`                                                                                       |
| 買い物メモの期限表示詳細化                                | docs 明記あり      | `UI-02`                                                                                        |
| custom dropdown / popover とボトムナビの重なり確認        | docs 明記あり      | `UI-06`                                                                                        |

## 次に進める候補 5 件

1. `DOC-01` 機能単位 docs のフォーマット化 / 重複整理  
   理由: 他タスクの判断コストを下げやすく、今後の依頼の前提整理になる。
2. `DES-05` `sale_ends_at` / `discount_ends_at` internal name 見直し  
   理由: 購入検討と買い物メモの期限表示ルールの曖昧さを減らせる。
3. `FEAT-02` item 状態管理の完成  
   理由: delete / disposed / reactivate の境界が広く影響し、先に固める価値が高い。
4. `DES-02` purchase candidate TPO の ID ベース化と wear log 適用粒度整理  
   理由: settings / item / outfit / wear log の横断前提になる。
5. `FEAT-03` 素材・混率管理  
   理由: item / purchase candidate の保存構造拡張として独立性が高く、後続の検索・分析にもつながる。

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
