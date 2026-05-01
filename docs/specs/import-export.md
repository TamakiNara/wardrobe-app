# インポート・エクスポート

## 概要

データをバックアップ・復元するための機能です。

Web UI:

- `/settings/import-export`
- 設定画面からエクスポート / インポートを実行できます

対象データ:

- アイテム（`items`）
- 購入検討（`purchase_candidates`）
- コーディネート（`outfits`）
- 着用履歴（`wear_logs`）
- TPO設定（`user_tpos`）
- ブランド候補（`user_brands`）
- カテゴリ表示設定（`visible_category_ids`）
- 表示・初期値設定（`user_preferences`）
- 天気の地域設定（`weather_locations`）
- 天気記録（`weather_records`）

対象範囲:

- ログインユーザーのデータのみを対象にします
- 他ユーザーのデータは含まれません
- import 実行時も、ログイン中のユーザーの対象データのみ削除して復元します

## エクスポート

エンドポイント:

- `GET /api/export`

説明:

- 全対象データを JSON で取得します
- 画像は Base64 で JSON に含まれます

レスポンス例:

```json
{
  "version": 1,
  "exported_at": "2026-04-24T12:34:56+09:00",
  "owner": {
    "user_id": 1
  },
  "user_tpos": [],
  "user_brands": [],
  "visible_category_ids": [],
  "user_preferences": {
    "currentSeason": null,
    "defaultWearLogStatus": null,
    "calendarWeekStart": null,
    "skinTonePreset": "neutral_medium"
  },
  "items": [],
  "purchase_candidates": [],
  "outfits": [],
  "wear_logs": [],
  "weather_locations": [],
  "weather_records": []
}
```

- `purchase_candidates` では `release_date` / `sale_ends_at` / `discount_ends_at` / `sheerness` / `shape` も export / import 対象に含める
- `items.colors[*].custom_label` も export / import 対象に含める
- `items.sheerness` も export / import 対象に含める
- `underwear` item / purchase candidate も通常データと同じく export / import 対象に含める
- `underwear / bra` の `underbust` / `top_bust`、`underwear / shorts` の `waist` / `hip` / `rise` も通常の `size_details.structured` として export / import 対象に含める
- `wear_logs` の服装フィードバック
  - `outdoor_temperature_feel`
  - `indoor_temperature_feel`
  - `overall_rating`
  - `feedback_tags`
  - `feedback_memo`
    も export / import 対象に含める
- `user_tpos`
  - `name`
  - `sort_order`
  - `is_active`
  - `is_preset`
    も export / import 対象に含める
- `user_brands`
  - `name`
  - `kana`
  - `is_active`
    も export / import 対象に含める
- `visible_category_ids`
  - ユーザーごとのカテゴリ表示設定
    も export / import 対象に含める
- `user_preferences`
  - `currentSeason`
  - `defaultWearLogStatus`
  - `calendarWeekStart`
  - `skinTonePreset`
    も export / import 対象に含める
- `weather_locations`
  - `name`
  - `forecast_area_code`
  - `latitude`
  - `longitude`
  - `is_default`
  - `display_order`
    も export / import 対象に含める
- `weather_records`
  - `weather_date`
  - `location_id`
  - `location_name_snapshot`
  - `forecast_area_code_snapshot`
  - `weather_code`
  - `temperature_high`
  - `temperature_low`
  - `memo`
  - `source_type`
  - `source_name`
  - `source_fetched_at`
    も export / import 対象に含める

注意:

- 画像を Base64 で含むため、ファイルサイズが大きくなる場合があります

## インポート

エンドポイント:

- `POST /api/import`

説明:

- エクスポートした JSON を使ってデータを復元します

重要:

- import を実行すると、現在の対象データはすべて削除されます
- 復元後の ID は再採番されます
- `shape` / `spec` はエクスポート時の値をそのまま使います
- 画像もあわせて復元されます
- バックアップファイルは、現在ログイン中のユーザーへ復元します
- `owner.user_id` はバックアップ作成元のメタデータとして保持しますが、現在ユーザーとの一致は必須にしません
- 復元に失敗した場合、既存データは削除されません
- `owner.user_id` を含まない古い形式のバックアップファイルも復元できます
- `user_tpos` を含むバックアップでは、任意 TPO 定義も復元します
- `user_tpos` を含まない古いバックアップでも、`items` / `purchase_candidates` / `outfits` の `tpos` 名称から不足分の TPO を補完して復元します
  - `tpos` は文字列配列のほか、古い形式の `{ name: ... }` / `{ tpo: ... }` も受け付けます
- `user_brands` を含むバックアップでは、ブランド候補も復元します
- `user_brands` を含まない古いバックアップでは、ブランド候補は復元できません
  - 読み仮名（`kana`）を含むブランド候補を確実に戻すには、`user_brands` を含む新しい形式のバックアップが必要です
- `visible_category_ids` を含むバックアップでは、カテゴリ表示設定も復元します
- `visible_category_ids` を含まない古いバックアップでは、現在ユーザーのカテゴリ表示設定は上書きしません
  - すでに明示的な表示設定がある場合のみ、`items` / `purchase_candidates` に含まれるカテゴリを追加で ON にします
- `user_preferences` を含むバックアップでは、表示・初期値設定も復元します
- `user_preferences` を含まない古いバックアップでは、表示・初期値設定は完全には復元できません
- 古い `wear_logs.feedback_tags` は import 時に current 値へ正規化します
  - `temperature_matched` → `temperature_gap_ready`
  - `felt_confident` → `mood_matched`
  - `humidity_uncomfortable` は削除済みタグのため復元時に除外します
- 古い `weather_condition=storm` は import 時に `other` へ正規化します
- 復元後の `underwear` は通常一覧には出さず、専用一覧に表示します
- `weather_locations` を先に復元し、その後 `weather_records.location_id` を新しい地域 ID へ張り替えます
- `weather_records.location_id` は nullable です
  - 保存済み地域は新しい地域 ID へ張り替えます
  - 一時地域は `location_id = null` のまま復元します
- 不正な `weather_code` は復元できません
- `temperature_high < temperature_low` の天気記録は復元できません

着用履歴の参照:

- `wear_logs.source_outfit_id` は import 時に新しい outfit ID へ張り替えます
- `wear_logs.items[*].source_item_id` は import 時に新しい item ID へ張り替えます
- 復元対象に存在しない item / outfit を参照している着用履歴は復元できません

## 注意事項

- import すると現在のデータはすべて消えます
- `version` が異なるバックアップファイルは失敗する可能性があります
- 古いバックアップファイルは互換性がない可能性があります
- 画像が多い場合は処理時間が長くなることがあります

## 推奨フロー

1. `GET /api/export` でバックアップを取得する
2. JSON ファイルを安全な場所に保存する
3. 必要なときに `POST /api/import` で復元する

## 制限事項

- 差分更新はできません
- ZIP 形式ではなく JSON のみです

### purchase candidate の複数サイズ候補

- `purchase_candidates` では `alternate_size_label` / `alternate_size_note` / `alternate_size_details` も export / import 対象に含める
- item-draft は引き続き第1候補だけを item 側へ渡す

### weather record の互換

- export は `weather_code` を正として出力します。
- import も `weather_code` を正として受け付けます。
- 旧 backup 互換として `weather_condition` があれば読み込み時だけ `weather_code` へ fallback します。
- `weather_condition=storm` は import 時に `other` へ正規化します。
- `primary_weather` / `has_rain_possibility` / icon は `weather_code` 定義から導出するため、backup data には保存しません。
