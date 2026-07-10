# 機能仕様 docs の入口

この README は、`docs/specs/**` にある機能仕様 docs を探すための入口です。
仕様の正本そのものではなく、対象機能ごとにどの docs を読めばよいかを整理します。

## アイテム

- [トップス仕様](./items/tops.md)
  - トップスの入力項目、表示、分類の仕様
- [アンダーウェア仕様](./items/underwear.md)
  - アンダーウェアの分類、入力、扱いの仕様
- [インナー仕様](./items/inner.md)
  - インナーの分類、入力、扱いの仕様
- [アウター仕様](./items/outerwear.md)
  - アウターの分類、入力、扱いの仕様
- [パンツ仕様](./items/pants.md)
  - パンツの分類、入力、扱いの仕様
- [スカート仕様](./items/skirts.md)
  - スカートの分類、入力、扱いの仕様
- [オールインワン仕様](./items/allinone.md)
  - オールインワンの分類、入力、扱いの仕様
- [シューズ仕様](./items/shoes.md)
  - シューズの分類、入力、扱いの仕様
- [レッグウェア仕様](./items/legwear.md)
  - レッグウェアの分類、入力、扱いの仕様
- [バッグ仕様](./items/bags.md)
  - バッグの分類、入力、扱いの仕様
- [ファッション小物仕様](./items/fashion-accessories.md)
  - アクセサリーなど小物系アイテムの仕様
- [着物仕様](./items/kimono.md)
  - 着物系アイテムの分類、入力、扱いの仕様
- [水着仕様](./items/swimwear.md)
  - 水着の分類、入力、扱いの仕様
- [アイテムフォーム構成](./items/form-structure.md)
  - アイテム登録・編集フォームの構成方針
- [アイテム状態管理](./items/status-management.md)
  - 所有中、手放し済みなどの状態管理仕様
- [アイテム削除方針](./items/delete-policy.md)
  - アイテム削除時の扱いと制約
- [アイテム詳細の状態 UI](./items/detail-status-ui.md)
  - アイテム詳細画面での状態表示と操作
- [素材・混率](./items/material-composition.md)
  - 素材構成や混率入力の仕様
- [クローゼット表示](./items/closet-view.md)
  - クローゼット画面でのアイテム表示仕様
- [アイテム一覧の絞り込み](./items/list-filters.md)
  - アイテム一覧の検索、季節、状態などの絞り込み仕様
- [サイズ詳細](./items/size-details.md)
  - サイズ詳細項目の入力・表示仕様
- [同一色バリエーション](./items/duplicate-color-variant.md)
  - アイテム単位の同一色・色違い扱い
- [サムネイルの現在参照](./items/thumbnail-current-reference.md)
  - アイテムサムネイルの参照元と現在画像の扱い
- [サムネイルの肌見え調整](./items/thumbnail-skin-exposure.md)
  - サムネイル生成・表示時の肌見えに関する方針

## コーディネート

- [コーディネート作成・編集](./outfits/create-edit.md)
  - コーディネートの作成、編集、保存条件の仕様
- [コーディネート一覧の絞り込み](./outfits/list-filters.md)
  - 一覧での季節、TPO、使用アイテムなどの絞り込み仕様
- [コーディネート候補アイテムのルール](./outfits/item-candidate-rules.md)
  - コーディネート作成時に選択候補へ出すアイテムの条件

## 着用履歴

- [着用履歴](./wears/wear-logs.md)
  - 予定 / 着用済み、アイテム・コーディネート選択、振り返りの仕様
- [天気とフィードバックの推薦連携](./recommendation/weather-and-feedback.md)
  - 着用履歴、天気、フィードバックを推薦へ使うための仕様

## 天気

- [天気機能の現在地](./wears/weather-current-status.md)
  - 天気機能全体の入口と現状整理
- [天気記録](./wears/weather-records.md)
  - `weather_records` と保存方針
- [天気取得](./wears/weather-fetching.md)
  - Open-Meteo の取得方針
- [Open-Meteo 再設計メモ](./wears/weather-open-meteo-redesign.md)
  - Open-Meteo 移行・再設計の検討メモ
- [旧天気仕様のクリーンアップ](./wears/weather-legacy-cleanup.md)
  - 旧天気仕様の整理・移行に関するメモ
- [天気 docs 再編メモ](./wears/weather-docs-reorganization.md)
  - 天気 docs の整理用メモ

## 設定

- [天気地域設定](./settings/weather-locations.md)
  - 地域設定、座標、Geocoding の仕様
- [ブランド候補設定](./settings/brand-candidates.md)
  - ブランド候補の管理仕様
- [TPO 設定](./settings/tpos.md)
  - TPO の設定と利用方針
- [カテゴリ設定](./settings/category-settings.md)
  - カテゴリ表示や管理の設定仕様
- [カテゴリプリセット選択](./settings/category-preset-selection.md)
  - 初期カテゴリやプリセット選択の仕様

## 購入検討・買い物メモ

- [購入検討](./purchase-candidates.md)
  - 購入候補の状態、画像、アイテム化、期限項目の仕様
- [買い物メモ](./shopping-memos.md)
  - 買い物メモの詳細、グループ、アイテム行、価格計算の仕様

## 探索・一覧共通

- [検索・絞り込み・並び替え](./discovery/search-filter-sort.md)
  - 一覧画面で共通利用する検索、フィルタ、ソートの方針
- [一覧ページネーション](./discovery/list-pagination.md)
  - 一覧のページングや読み込み方針
- [一覧共通ガイドライン](./discovery/list-common-guidelines.md)
  - 一覧 UI に共通する表示・操作方針

## 横断仕様・共通方針

- [import/export](./import-export.md)
  - バックアップ / リストアと portable な値の仕様
- [色サムネイル](./color-thumbnails.md)
  - 色サムネイルの表示・生成方針
- [同一色バリエーション](./duplicate-color-variant.md)
  - 複数機能にまたがる同一色・色違い扱い
- [タグ](./tags.md)
  - タグの扱いと共通利用方針
- [ログ](./logging.md)
  - ログ出力の基本方針
- [ログ出力ポリシー](./logging/logging-policy.md)
  - ログに残す情報、残さない情報の詳細方針
- [エラーメッセージ方針](./error-message-guidelines.md)
  - エラーメッセージの表記・粒度の共通方針
- [グローバルナビゲーション](./navigation/global-navigation.md)
  - 画面間の導線とナビゲーションの仕様
- [ページヘッダー方針](./ui/page-header-guidelines.md)
  - 各画面のページヘッダー設計方針

## タスク管理・計画メモ

- [タスクバックログ](./task-backlog.md)
  - 残件、優先度、判断メモ、試行結果の置き場
- [次機能メモ](./planning/next-features.md)
  - 今後の機能候補や計画メモ
- [設定・カレンダー・着用履歴計画メモ](./settings_calendar_wearlog_codex_plan.md)
  - 設定、カレンダー、着用履歴まわりの計画メモ

## 使い分けの目安

- 機能仕様を探すときは、この README から対象機能の仕様書へ進む
- API のリクエスト / レスポンスは `../api/openapi.yaml` を参照する
- DB 構造や保存対象は `../data/database.md` を参照する
- docs 全体の構造は `../docs-map.md` を参照する
- docs の表記・命名ルールは `../project/docs-writing-guidelines.md` を参照する
- 残件・優先度・判断メモは `./task-backlog.md` を参照する
