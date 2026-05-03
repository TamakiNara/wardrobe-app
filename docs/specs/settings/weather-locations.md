# Weather Location Settings

天気予報取得で使うユーザーごとの地点設定を整理する。
今回は Open-Meteo 移行を本命にしつつ、legacy コード群を段階的に後退させる前提で、`user_weather_locations` の設計方針をまとめる。

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
- `timezone` nullable
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
- `timezone`
  - Open-Meteo の daily 集計と日付境界に関わる nullable 項目
  - 日本国内利用では通常 `Asia/Tokyo`

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
---

## 2026-05-03 coordinate-primary direction note

### planned

- `user_weather_locations` の正本は、将来的に以下へ寄せる
  - `name`
  - `latitude`
  - `longitude`
  - `timezone`
  - `is_default`
  - `display_order`
- DB 設計は既存テーブル維持案を採用し、新テーブルへの作り直しは行わない
- 新規作成時は `latitude` / `longitude` / `timezone` を UI 上必須にする方向で整理する
- 既存地域は未設定を許容し、編集時や Open-Meteo 取得時に設定を促す
- `timezone` は daily 値の日付境界と集計基準に関わるため、座標と同格の正本項目として扱う
- 日本国内利用では `Asia/Tokyo` を基本値とし、将来は Geocoding API が返す timezone を保存する

### 地域設定 UI の将来方針

- 最終形の本命は Open-Meteo Geocoding API による候補検索 UI
- 短期代替は主要地点 static list とする
- 緯度経度の手入力は開発用または fallback だけに留め、通常ユーザー向けの主導線にはしない

### legacy カラム

- 以下は当面 legacy / fallback / import 互換として残す
  - `forecast_area_code`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
  - `observation_station_code`
  - `observation_station_name`
- 通常 UI の主入力からは段階的に外す
- Open-Meteo 移行後、利用状況を見て削除時期を判断する
---

## 2026-05-03 coordinate groundwork implementation note

### current

- user_weather_locations は次の座標系カラムを保持できる
  - latitude
  - longitude
  - timezone
- DB 上は既存地域互換のため nullable のまま維持する
- 地域設定 UI では、手入力 fallback として 緯度 / 経度 / タイムゾーン を確認・編集できる
- timezone は Open-Meteo の daily 集計と日付境界に関わるため、日本国内では Asia/Tokyo を基本値として案内する

### planned

- 新規地域の主入力は最終的に Open-Meteo Geocoding API による候補検索へ寄せる
- latitude / longitude / timezone は Open-Meteo forecast / historical の正本として使う
- forecast_area_code / jma_forecast_region_code / jma_forecast_office_code / observation_station_code / observation_station_name は legacy / fallback / import-export 互換として当面残す

---

## 2026-05-03 geocoding implementation note

### current

- 地域設定画面には Open-Meteo Geocoding API を使った `地域を検索` 導線がある
- 検索は `/api/settings/weather-locations/geocode` 経由で行う
- 候補選択で以下を自動反映する
  - latitude
  - longitude
  - timezone
- 候補の name は、地域名が空欄のときだけ自動反映する
- 地域名が入力済みのときは、latitude / longitude / timezone だけ更新する
- 緯度 / 経度 / タイムゾーンの手入力欄は fallback として残す
- Geocoding API が失敗しても、手入力で設定を続けられる

### planned

- Geocoding 検索結果そのものは、今回は DB 保存しない
- 将来保存を検討する候補:
  - geocoding_provider
  - geocoding_place_id
  - country
  - admin1
  - admin2
