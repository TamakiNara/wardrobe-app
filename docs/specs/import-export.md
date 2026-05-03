# Import / Export

バックアップと復元の仕様を整理する。  
この docs では、weather 関連については **backup / restore 対象、validation、復元順、旧形式互換** に絞って扱う。

詳細の正本:

- `weather_records` の保存方針:
  - [wears/weather-records.md](./wears/weather-records.md)
- `user_weather_locations` の座標正本や legacy code fields:
  - [settings/weather-locations.md](./settings/weather-locations.md)
- forecast / observed API:
  - [wears/weather-fetching.md](./wears/weather-fetching.md)
- 着用履歴フィードバック:
  - [recommendation/weather-and-feedback.md](./recommendation/weather-and-feedback.md)

---

## 対象

Web UI:

- `/settings/import-export`

weather 関連でここで扱うデータ:

- `weather_locations`
- `weather_records`
- wear log feedback 側の天気関連項目（planned）

---

## current

### weather_locations の roundtrip 対象

current の `user_weather_locations` では、少なくとも以下を export / import 対象に含める。

正本候補:

- `name`
- `latitude`
- `longitude`
- `timezone`
- `is_default`
- `display_order`

legacy / fallback / 旧互換として当面残すもの:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `observation_station_code`
- `observation_station_name`

補足:

- `latitude / longitude / timezone` は Open-Meteo 移行後の正本候補
- legacy code fields は restore 互換のため当面維持する
- 旧 backup に座標がない場合は未設定のまま復元する
- 座標未設定の地域では Open-Meteo forecast / historical は使えない

### weather_locations の validation

- `latitude`
  - nullable
  - `-90..90`
- `longitude`
  - nullable
  - `-180..180`
- `latitude / longitude`
  - 原則セット
- `timezone`
  - nullable
  - IANA timezone 文字列想定
- legacy code fields
  - current 実装に合わせる
  - import では strict にしすぎない

### weather_records の roundtrip 対象

current の `weather_records` では、少なくとも以下を export / import 対象に含める。

- `weather_date`
- `location_id` または restore 用 location reference
- `location_name_snapshot`
- `forecast_area_code_snapshot`
  - legacy として当面残す
- `weather_code`
- `temperature_high`
- `temperature_low`
- `memo`
- `source_type`
- `source_name`
- `source_fetched_at`

current では含めないもの:

- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `precipitation_hours`
- `raw_weather_code`
- `raw_weather_text`
- `forecast_snapshot`
- `observed_snapshot`

理由:

- 現時点では DB 保存していない
- response / UI の参考表示に留めている
- snapshot は planned

### weather_records の source validation

`source_type` current 候補:

- `manual`
- `forecast_api`
- `historical_api`

`source_name` current 候補:

- `manual`
- `open_meteo_jma_forecast`
- `open_meteo_historical`
- `jma_forecast_json`
- `tsukumijima`

補足:

- `source_*` は current では「最後にフォームへ反映した取得元」を表す
- record 全体の厳密な由来ではない
- API 取得後に手修正されている可能性がある
- 詳細の意味は [wears/weather-records.md](./wears/weather-records.md) を正本とする

### weather_code validation

- import 時は current の `WeatherCode` enum / allow-list に合わせる
- 不明な `weather_code` は原則 import error
- 旧値がある場合の fallback は要再判断
- `weather_code` の意味や icon は [wears/weather-records.md](./wears/weather-records.md) と code 定義側を参照する

---

## restore 順序

weather 関連の restore 順序は、少なくとも次を推奨する。

1. `user_weather_locations`
2. `weather_records`
3. wear logs / feedback 側が天気情報を参照する場合は、その後に処理

理由:

- `weather_records.location_id` を復元するため、先に保存済み地域が必要
- 今回だけの地域は `location_id = null` と `location_name_snapshot` で復元できる
- location が見つからない場合でも、snapshot 名で表示できる余地がある

---

## 旧形式との互換

### weather_locations

- 旧 backup に座標がない場合は、未設定のまま復元する
- Open-Meteo 取得は未設定扱いになる
- legacy code fields は当面受ける

### weather_records

- `forecast_area_code_snapshot` は legacy snapshot として当面受ける
- `source_name = tsukumijima` や `source_name = jma_forecast_json` は履歴としてそのまま保持する
- `source_name` の違いだけで既存レコードを書き換えない

---

## planned

### snapshot 採用時の import / export

将来 `forecast_snapshot / observed_snapshot` を採用する場合は、backup / restore 対象に含める。

想定される項目候補:

- `raw_weather_code`
- `raw_weather_text`
- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `precipitation_hours`
- `source_name`
- `source_fetched_at`

整理が必要な点:

- JSON schema version
- validation をどこまで行うか
- 旧 backup との互換をどう保つか
- snapshot を export にそのまま含めるか、正規化して展開するか

補足:

- current では未実装
- 今すぐ schema は決めすぎない

### precipitation 保存時の影響

将来、降水系を保存する場合の第一候補は snapshot に含める案である。

候補比較:

- snapshot に含める
- `weather_records` の直カラムにする
- 別テーブルにする

current の推奨:

- まず snapshot に含める
- 直カラム化は UI / 分析用途が固まってから再判断する

この方針は [wears/weather-records.md](./wears/weather-records.md) と整合させる。

### weather feedback との関係

将来 `was_exposed_to_rain` を扱う場合、それは wear log feedback 側の export / import 対象として整理する。

重要:

- `has_rain_possibility`
  - `weather_code` から導出
  - export しない
- `was_exposed_to_rain`
  - 将来 wear log feedback 側に保存する場合は export 対象
  - `weather_records` ではない

詳細は [recommendation/weather-and-feedback.md](./recommendation/weather-and-feedback.md) を参照する。

---

## pending / 要再判断

- snapshot JSON を export にそのまま含めるか、正規化して別構造へ展開するか
- legacy backup との互換をどの版まで維持するか
- 不明な旧 `weather_code` をどこまで救済するか
- source 履歴を別テーブル化した場合の backup 粒度とデータサイズ
