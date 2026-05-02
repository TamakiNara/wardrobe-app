# Weather Records Specification

日ごとの天気情報を着用記録で使うための仕様を整理する。
今回は weather forecast の移行設計を中心に、`weather_records` と `user_weather_locations` の関係、および source metadata の扱いを明確にする。

---

## 対象

- `weather_records`
- `user_weather_locations`
- 着用記録画面での天気表示

---

## current

MVP では、天気予報の取得元として `weather.tsukumijima.net` を使う。

### user_weather_locations

現行カラム:

- `id`
- `user_id`
- `name`
- `forecast_area_code` nullable
- `latitude` nullable
- `longitude` nullable
- `is_default`
- `display_order`
- `created_at`
- `updated_at`

### weather_records

現行カラム:

- `id`
- `user_id`
- `weather_date`
- `location_id` nullable
- `location_name_snapshot`
- `forecast_area_code_snapshot` nullable
- `weather_code`
- `temperature_high` nullable
- `temperature_low` nullable
- `memo` nullable
- `source_type`
- `source_name`
- `source_fetched_at` nullable
- `created_at`
- `updated_at`

### current source 設計

- 手入力:
  - `source_type = manual`
  - `source_name = manual`
- 予報 API:
  - `source_type = forecast_api`
  - `source_name = tsukumijima`

### current の意味

- `forecast_area_code_snapshot` は、その記録保存時点で使った予報用コードの snapshot
- 保存先の正本は、外部 API の raw code ではなく `weather_code`

---

## planned

### source 設計

気象庁 forecast JSON を使う段階では、以下を使う。

- `source_type = forecast_api`
- `source_name = jma_forecast_json`

### 併存期間

段階移行中は、以下の `source_name` が併存してよい。

- `manual`
- `tsukumijima`
- `jma_forecast_json`

既存レコードの `source_name = tsukumijima` は、履歴として残す。

### forecast area snapshot

- `forecast_area_code_snapshot` は当面維持する
- ただし意味は「その時点で採用した予報区域コードの snapshot」として読む
- 将来 `jma_forecast_region_code` 導入後も、短期的にはこの項目名を維持してよい

### JMA forecast JSON からの変換

保存先の正本は引き続き `weather_code` とする。

方針:

- JMA 数値コードをそのまま保存しない
- 日本語の `weathers` テキストを主に使って `weather_code` へ正規化する
- 未対応パターンは `other` に落とす

直接吸収しやすい例:

- `晴`
- `曇`
- `雨`
- `雪`
- `晴のち曇`
- `曇のち晴`
- `曇のち雨`
- `雨のち曇`
- `晴時々曇`
- `曇時々雨`
- `晴時々雨`

当面 `other` に落としてよい例:

- `雷`
- `霧`
- `雨か雪`
- `雪時々雨`
- `曇一時雪`

`has_rain_possibility` は、現行どおり `weather_code` 派生でよい。

---

## weather_code

MVP 時点で許容する `weather_code` は以下。

- 基本:
  - `sunny`
  - `cloudy`
  - `rain`
  - `snow`
  - `other`
- 複合:
  - `sunny_then_cloudy`
  - `cloudy_then_sunny`
  - `cloudy_then_rain`
  - `rain_then_cloudy`
  - `sunny_with_occasional_clouds`
  - `cloudy_with_occasional_rain`
  - `sunny_with_occasional_rain`

今回の移行設計では、新しい `weather_code` の追加は必須ではない。

---

## forecast_area_code の扱い

### legacy

- `user_weather_locations.forecast_area_code`
- `weather_records.forecast_area_code_snapshot`

は、段階移行中は legacy 扱いにする。

### planned

将来の予報設定正本は以下に寄せる。

- `jma_forecast_region_code`
- `jma_forecast_office_code`

ただし `weather_records` 側では、既存 snapshot 互換を優先して当面 `forecast_area_code_snapshot` を維持してよい。

---

## import / export 影響

### planned

JMA 設計を実装する段階では、backup / restore も以下へ追従する。

- `weather_locations`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
- `weather_records`
  - `source_name = jma_forecast_json`

### 旧 backup 互換

- 旧 backup に `forecast_area_code` しかない場合は、legacy 値として受け入れる
- 実装時は `forecast_area_code -> jma_forecast_region_code` 相当の読み替え fallback を持つ
- 既存 `source_name = tsukumijima` はそのまま取り込めるようにする

---

## 要再判断

- `forecast_area_code_snapshot` を rename するか
- JMA weather text 変換の取りこぼしをどこまで `other` で許容するか
- 週間予報や代表地点気温を `weather_records` へどの時点で取り込むか


---

## 2026-05-02 implementation note

### current

- `user_weather_locations` は `jma_forecast_region_code` / `jma_forecast_office_code` を保持できる
- `weather_records` の source current は引き続き `manual` / `tsukumijima`
- `forecast_area_code_snapshot` は既存互換のため維持する

### planned

- JMA 予報取得へ切り替えた後は `source_name = jma_forecast_json` を使う
- 予報用コードと実績用観測所コードは別物として扱う
