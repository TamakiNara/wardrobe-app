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

- `user_weather_locations` は `jma_forecast_region_code` / `jma_forecast_office_code` を保持できる
- `weather_records` の source current は `manual` / `tsukumijima` / `jma_forecast_json`
- `forecast_area_code_snapshot` は既存互換のため維持する

### planned

- JMA forecast JSON を使った取得結果は `source_name = jma_forecast_json` を使う
- 予報用コードと実績用観測所コードは別物として扱う

---

## 2026-05-03 Open-Meteo redesign note

### planned

- forecast / historical の source は、将来的に Open-Meteo 系へ寄せることを第一候補とする
- 想定する `source_name` 候補は以下
  - `open_meteo_jma_forecast`
  - `open_meteo_historical`
  - `manual`
- `jma_forecast_json` / `tsukumijima` / `jma_latest_csv` は current または legacy として当面共存しうる
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) を参照する
---

## 2026-05-03 Open-Meteo forecast source note

### current

- forecast 取得で latitude / longitude がある地域は `source_name = open_meteo_jma_forecast` を使う
- Open-Meteo forecast response では `raw_weather_code` / `precipitation` / `rain_sum` / `snowfall_sum` を参考値として返せる
- これらの参考値は今回は weather_records 本体へ保存しない

### planned

- precipitation 系の保存が必要になった場合は、`precipitation_amount` などのカラム追加を別途検討する
- Open-Meteo historical を導入した場合は `source_name = open_meteo_historical` を observed 側の本命候補とする
---

## 2026-05-03 Open-Meteo historical source note

### current

- `weather_records` 自体は最終保存値を持つ current 設計を維持する
- Open-Meteo Historical の取得結果はフォーム反映のみで、自動保存しない
- ユーザーが保存した場合は `source_type = historical_api` / `source_name = open_meteo_historical` を保存する
- `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は今回の PoC では `weather_records` に保存しない

### planned

- forecast snapshot / observed snapshot の分離は将来検討する
- precipitation 系の保存が必要になった場合は `weather_records` の拡張を別途検討する
