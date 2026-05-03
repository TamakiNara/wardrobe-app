# Import / Export

バックアップと復元の仕様を整理する。
今回は weather forecast の移行設計に関係する項目に絞って、JMA forecast JSON 移行時の互換方針を追記する。

---

## 対象

Web UI:

- `/settings/import-export`

今回の観点で扱うデータ:

- `weather_locations`
- `weather_records`

補足:

- `weather_records` 自体の保存方針や source metadata の意味は [wears/weather-records.md](./wears/weather-records.md) を正本とする
- `user_weather_locations` の座標正本や legacy code fields の意味は [settings/weather-locations.md](./settings/weather-locations.md) を正本とする

---

## current

現行 backup では、少なくとも以下を export / import 対象に含める。

### weather_locations

- `name`
- `forecast_area_code`
- `latitude`
- `longitude`
- `is_default`
- `display_order`

### weather_records

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
- `weather_code` の current allow-list には `thunder` / `fog` / `windy` も含む

---

## planned

気象庁 forecast JSON へ切り替える段階では、backup / restore も以下へ追従する。

### weather_locations

追加候補:

- `jma_forecast_region_code`
- `jma_forecast_office_code`

### weather_records

想定される追加変更:

- `source_name = jma_forecast_json` を許容する

---

## 旧 backup 互換

### forecast_area_code

- 旧 backup に `forecast_area_code` しかない場合は、legacy 値として受け入れる
- 実装時は `forecast_area_code -> jma_forecast_region_code` 相当の読み替え fallback を持つ
- `forecast_area_code` は deprecated でも、当面 import では受理する

### source_name

段階移行中の import validation では、以下を許容する。

- `manual`
- `tsukumijima`
- `jma_forecast_json`

既存 `weather_records` の `source_name = tsukumijima` は移行対象ではなく、履歴としてそのまま保持する。

---

## 復元時の扱い

- `weather_records` の既存データは履歴としてそのまま復元する
- `source_name` の違いで既存レコードを書き換えない
- `forecast_area_code_snapshot` は当面そのまま受け入れる

---

## 要再判断

- JMA 専用カラム追加時に backup version を上げるか
- `forecast_area_code_snapshot` の rename を import/export へいつ反映するか
- legacy backup を何 version 先まで互換維持するか


---

## 2026-05-02 implementation note

### current

- `weather_locations` の export / import は以下を含んでいる。
  - `forecast_area_code`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
  - `observation_station_code`
  - `observation_station_name`
- old backup でも legacy code を復元できる。

## 2026-05-03 Open-Meteo redesign note

### planned

- `weather_locations` の正本は将来的に `latitude` / `longitude` / `timezone` を中心にする。
- `forecast_area_code` / `jma_forecast_region_code` / `jma_forecast_office_code` / `observation_station_code` / `observation_station_name` は legacy restore 用に当面残す。
- Open-Meteo 用の backup / restore 互換を整える。

## 2026-05-03 coordinate-primary direction note

### planned

- `latitude` / `longitude` / `timezone` を今後の weather location backup / restore 正本にする。
- 旧 backup に座標がなくても、未設定のまま Open-Meteo 非対応地域として復元できるようにする。
- import validation 候補は以下とする。
  - latitude range
  - longitude range
  - timezone string

## 2026-05-03 coordinate groundwork implementation note

### current

- weather location の import / export は `latitude` / `longitude` / `timezone` を roundtrip できる。
- 旧 backup に `timezone` がなくても `null` として復元できる。
- latitude / longitude は片方だけの payload を validation error にする。
## 2026-05-03 weather record source redesign note

### current

- `weather_records` の export / import は current では最終保存値だけを対象にする。
- `source_type` / `source_name` / `source_fetched_at` も current の record 値として roundtrip する。
- precipitation 系、`raw_weather_code`、`raw_weather_text` は export / import 対象に含めない。

### planned

- `forecast_snapshot` / `observed_snapshot` を採用する場合は、backup / restore 対象に含める。
- snapshot を含める場合は JSON schema version を持つ前提で validation を設計する。
- `source_name` allow-list には current の
  - `manual`
  - `open_meteo_jma_forecast`
  - `open_meteo_historical`
  - `jma_forecast_json`
  - `tsukumijima`
  を含める想定で整理する。

### pending / 要再判断

- snapshot JSON を export にそのまま含めるか、正規化して別構造へ展開するか。
- legacy backup との互換をどの版まで維持するか。
- source 履歴を別テーブル化した場合の backup 粒度とデータサイズ。
