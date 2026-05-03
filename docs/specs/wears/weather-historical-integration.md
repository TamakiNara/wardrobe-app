# Weather Historical Integration

実績天気データの取得方針を整理する。
この資料では、予報取得と実績取得でコード体系が異なる前提を明示し、将来の共存設計をまとめる。

---

## 目的

- 予報用コードと実績用観測所コードを混同しない
- `user_weather_locations` に将来的に共存させる情報を整理する
- 実績取得の実装を始める前に、予報側設計との境界を明確にする

---

## current

- 予報取得は `forecast_area_code` を使った forecast API 前提
- 実績取得はまだ未実装
- `latitude` / `longitude` は将来拡張用として nullable のまま持つ

---

## planned

### 予報用コード

予報取得では、将来的に以下を使う。

- `jma_forecast_region_code`
- `jma_forecast_office_code`

### 実績用コード

実績取得では、観測所コードを別で扱う。

候補:

- アメダス観測所コード
- 気象庁最新気象データ CSV の観測所コード

### 共存させたい情報

1 つの `user_weather_locations` に、少なくとも以下を紐付けられる形を目標にする。

- 地域表示名
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- 実績用観測所コード
- 緯度経度

### 前提

- 予報区域と観測所は 1:1 で一致しない
- 予報用の `forecast_area_code` を、そのまま観測所コードとして流用しない
- 実績側の UI や保存処理は、予報側とは別の設計として扱う

---

## source metadata との関係

### 予報

- `source_type = forecast_api`
- `source_name = tsukumijima`
- `source_name = jma_forecast_json`

### 実績

候補:

- `source_type = historical_api`
- `source_name = jma_latest_csv`
- `source_name = jma_past_download`
- `source_name = cultivationdata`

今回は実装しないため、実績側 source 値は planned として扱う。

---

## forecast_area_code の扱い

`forecast_area_code` は予報用 legacy 項目として残す。

- 実績取得の観測所コードとは分離する
- 将来的にも `forecast_area_code` を実績用コードへ流用しない

---

## 要再判断

- 実績側で最初に採用する取得元を `jma_latest_csv` に寄せるか
- 観測所コードを `user_weather_locations` に直接持つか、別テーブルへ分離するか
- 緯度経度から観測所を補助解決するか

---

## 2026-05-03 Open-Meteo redesign note

### planned

- 最新気象データ CSV PoC は本線採用せず、Open-Meteo historical API を本命候補とする。
- historical provider 再設計の詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) に寄せる。
- `observation_station_code` / `observation_station_name` は legacy PoC 扱いとし、将来的には `latitude` / `longitude` を正本とする。

## 2026-05-03 coordinate-primary direction note

### planned

- Open-Meteo historical では location の `latitude` / `longitude` / `timezone` を forecast と同じ基準で使う。
- `POST /api/weather-records/observed` は、`weather_date` と `location_id` から `open_meteo_historical` を取得する前提に寄せる。
- `observation_station_code` / `observation_station_name` は current / legacy PoC の互換情報として残す。

## 2026-05-03 Open-Meteo historical implementation note

### current

- historical / observed 取得 PoC は Open-Meteo Historical API で実装している。
- 対応 endpoint は `POST /api/weather-records/observed`。
- location の `latitude` / `longitude` / `timezone` を使って指定日の daily data を取得する。
- timezone 未設定時は `Asia/Tokyo` を fallback にする。
- daily の `weather_code` / `temperature_2m_max` / `temperature_2m_min` / `precipitation_sum` / `rain_sum` / `snowfall_sum` / `precipitation_hours` を取得する。
- WMO weather code は app `weather_code` に変換して使う。
- `source_type = historical_api` / `source_name = open_meteo_historical`。
- `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考値として返すが、DB 保存はしない。

### planned

- JMA latest CSV fallback は本線に戻さず保留とする。
- 予報値と実績値の snapshot 分離は後続で検討する。

## 2026-05-03 historical date guidance note

### planned

- historical / observed は `過去日` を主対象とする。
- `今日` の historical は未確定値を含む可能性があるため、注意文付きで扱う。
- `未来日` では historical 取得を disabled に寄せる。
