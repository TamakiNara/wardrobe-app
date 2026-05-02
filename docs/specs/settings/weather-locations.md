# Weather Location Settings

天気予報取得で使うユーザーごとの地点設定を整理する。
今回は `weather.tsukumijima.net` から気象庁 forecast JSON へ段階移行する前提で、`user_weather_locations` の設計方針をまとめる。

---

## 目的

- ユーザーが使う地域表示名と、予報取得用コードの責務を分ける
- `forecast_area_code` の legacy 化方針を明確にする
- 将来の予報用コードと実績用観測所コードの共存余地を残す

---

## current

設定画面:

- `/settings/weather-locations`

現行の `user_weather_locations` は、予報用設定として以下を持つ。

- `name`
- `forecast_area_code` nullable
- `latitude` nullable
- `longitude` nullable
- `is_default`
- `display_order`

### current の意味

- `name`
  - ユーザー向け表示名
  - 例: `川口`, `さいたま`, `大阪市内`
- `forecast_area_code`
  - 予報取得 API 用コードとして使っている
  - MVP では `weather.tsukumijima.net` の city code 前提
- `latitude` / `longitude`
  - 実績取得や位置ベース処理を想定した nullable 項目

### current の課題

- `forecast_area_code` が表示用地域コードなのか取得用コードなのか曖昧
- 現行の選択肢には、将来的な JMA `class10` 相当と `office code` 相当が混在しうる
- weather.tsukumijima.net 前提のコード設計をそのまま JMA へ持ち込むと意味が崩れる

---

## planned

### 推奨カラム

将来の正本設計では、JMA 用に役割を分ける。

- `jma_forecast_region_code`
- `jma_forecast_office_code`

### 役割

- `jma_forecast_region_code`
  - ユーザーが設定 UI で選ぶ予報区域コード
  - 第一候補は `class10`
  - 一次細分区域がない地域では `office code` 自体を許容する
- `jma_forecast_office_code`
  - `forecast/{office_code}.json` を取得するためのコード
  - `area.json` から region の親を解決して保持する

### 想定する最終形

- `name`
- `jma_forecast_region_code` nullable
- `jma_forecast_office_code` nullable
- `latitude` nullable
- `longitude` nullable
- `is_default`
- `display_order`

### UI 方針

- 設定画面では引き続き `予報区域` という表現でよい
- ユーザーにはコード値を見せず、地域名ベースの選択肢を見せる
- ユーザーが選ぶのは `region`
- 実際の取得時に backend が `office code` を使う

### 地域名と予報区域名のズレ

生活上の地域名と予報区域名は一致しない場合がある。

例:

- 表示名: `川口`
- 予報区域: `埼玉県南部`

このズレは異常ではなく、気象庁予報の粒度によるものとして扱う。

---

## forecast_area_code の扱い

### legacy

`forecast_area_code` は当面残すが、legacy 扱いにする。

- 既存 UI
- 既存 API
- 既存 backup / restore
- 既存 `weather_records.forecast_area_code_snapshot`

との互換のために維持する。

### 移行中の読み替え

JMA へ切り替える初期段階では、既存 `forecast_area_code` を以下のように扱う。

- `class10` 相当なら `jma_forecast_region_code` とみなし、親 `office code` を解決する
- `office code` 相当なら `jma_forecast_office_code` とみなし、必要に応じて region 相当値を補う

### 重要な整理

- `forecast_area_code` は最終的な正本カラムではない
- 新設計では `forecast_area_code` に tsukumijima city code と JMA code を混在させない

---

## 実績取得との関係

予報と実績ではコード体系が異なる前提にする。

共存させたい情報:

- 地域表示名
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- 実績用観測所コード
- `latitude`
- `longitude`

今回は予報側のみを設計対象とし、観測所コードは将来追加でよい。

---

## 要再判断

- `jma_forecast_region_code` を常に `class10` に寄せるか
- `forecast_area_code` からの自動移行ロジックを DB 保存時に持つか、取得時 resolver に寄せるか
- 地域設定 UI で `川口 -> 埼玉県南部` のようなズレ説明をどこまで出すか

---

## 変更時の影響先

- `user_weather_locations`
- 地域設定 UI
- import / export
- forecast fetch service
- `weather_records` の snapshot 設計


---

## 2026-05-02 implementation note

### current

- `user_weather_locations` は以下を保持できる
  - `forecast_area_code` nullable
  - `jma_forecast_region_code` nullable
  - `jma_forecast_office_code` nullable
- 地域設定 UI の主入力は `JMA予報区域`
- `forecast_area_code` は weather.tsukumijima.net 用の legacy code として保持するが、通常 UI の入力欄には出さない
- legacy `forecast_area_code` だけが残っている地域は、補助表示で `旧API用コードあり` として扱う

### planned

- forecast 取得側は、`jma_forecast_region_code` / `jma_forecast_office_code` が両方ある場合に JMA forecast JSON を優先する
- JMA コードがなく legacy `forecast_area_code` がある地域は、段階移行中の fallback として tsukumijima を使う

---

## 2026-05-03 Open-Meteo redesign note

### planned

- 地域設定の正本は、将来的に `latitude` / `longitude` / `timezone` へ寄せる
- `forecast_area_code` / `jma_forecast_region_code` / `jma_forecast_office_code` / `observation_station_code` は段階移行中の legacy 候補として扱う
- 地域登録 UI は Open-Meteo Geocoding API による候補検索を第一候補に再設計する
- 詳細は [weather-open-meteo-redesign.md](../wears/weather-open-meteo-redesign.md) を参照する