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

- `weather_locations` の export / import は以下を含む
  - `forecast_area_code`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
- 旧 backup に `forecast_area_code` だけがある場合も、そのまま復元できる

### planned

- `forecast_area_code` から JMA コードへの自動変換はまだ行わない
- forecast source の JMA 優先切替は別タスクで進める
