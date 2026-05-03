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
- `雷`
- `霧`
- `強風`
- `晴のち曇`
- `曇のち晴`
- `曇のち雨`
- `雨のち曇`
- `晴時々曇`
- `曇時々雨`
- `晴時々雨`

当面 `other` に落としてよい例:

- `storm` / 荒天
- `雨か雪`
- `雪時々雨`
- `曇一時雪`

`has_rain_possibility` は、現行どおり `weather_code` 派生でよい。

---

### weather_code と raw_weather_text の役割

- `weather_code`
  - アプリ内で保存する正規化値
  - アイコン表示、簡易表示、検索、分析、`has_rain_possibility` 判定に使う
- `raw_weather_text`
  - 取得元の詳細表記を表示用に整形した値
  - forecast API response と frontend state では保持する
  - 取得結果確認や、変換ルール改善の観測用に使う

### JMA 詳細表記の扱い

- JMA の時間帯入り表記は `weather_code` にそのまま保存しない
- 例:
  - `晴れ　夜のはじめ頃　くもり`
  - `weather_code = sunny_then_cloudy`
  - `raw_weather_text = 晴れ 夜のはじめ頃 くもり`
- 表示時は全角スペースを半角スペースへ寄せ、連続スペースを 1 つにまとめる
- JMA の気温は代表地点ベースで返ることがあるため、予報区域 code と直接一致しない場合がある
- 取得時に代表地点を安全に解決できない場合は、気温は `null` のままにする

### 保存方針

- 今回は `raw_weather_text` を DB 保存しない
- `weather_records` の保存先は引き続き `weather_code` / 気温 / source metadata を正本とする
- 将来的に必要になった場合のみ、以下を追加候補として再検討する
  - `raw_weather_text`
  - `source_payload`

## weather_code

MVP 時点で許容する `weather_code` は以下。

- 基本:
  - `sunny`
  - `cloudy`
  - `rain`
  - `snow`
  - `thunder`
  - `fog`
  - `windy`
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

- `user_weather_locations` には `jma_forecast_region_code` / `jma_forecast_office_code` を保持している。
- `weather_records` の source current 値には `manual` / `tsukumijima` / `jma_forecast_json` がある。
- `forecast_area_code_snapshot` は legacy 互換用として残している。

## 2026-05-03 Open-Meteo redesign note

### planned

- forecast / historical の source は、Open-Meteo 系へ寄せる。
- 想定 `source_name` 候補:
  - `open_meteo_jma_forecast`
  - `open_meteo_historical`
- legacy provider の source は履歴互換のため当面残す。

## 2026-05-03 Open-Meteo forecast source note

### current

- forecast では latitude / longitude がある場合に `source_name = open_meteo_jma_forecast` を使う。
- Open-Meteo forecast response では `raw_weather_code` / `precipitation` / `rain_sum` / `snowfall_sum` を補助値として返す。
- これらの補助値は `weather_records` へはまだ保存しない。

## 2026-05-03 Open-Meteo historical source note

### current

- `weather_records` は current では最終保存値だけを持つ。
- Open-Meteo Historical 取得後に保存した場合は historical source を持つ。
- 具体的には `source_type = historical_api` / `source_name = open_meteo_historical` を使う。

## 2026-05-03 forecast vs observed source note

### current

- `weather_records` は current では forecast と observed の snapshot を分離していない。
- 予報取得後に保存した場合は `source_type = forecast_api` / `source_name = open_meteo_jma_forecast` を持つ。
- 実績取得後に保存した場合は `source_type = historical_api` / `source_name = open_meteo_historical` を持つ。
