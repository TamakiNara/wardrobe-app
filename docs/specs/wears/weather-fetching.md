# Weather Fetching Specification

天気取得 API の current 正本です。  
Open-Meteo forecast / historical、provider 優先順位、legacy fallback、日付に応じた取得 UI の方針をここにまとめます。

関連 docs:

- [weather-current-status.md](./weather-current-status.md)
- [weather-records.md](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## current

### forecast

- endpoint:
  - `POST /api/weather-records/forecast`
- source:
  - `source_type = forecast_api`
  - `source_name = open_meteo_jma_forecast`
- location:
  - `latitude / longitude / timezone` を使用
- Open-Meteo:
  - daily `weather_code` を代表天気として使う
  - `temperature_2m_max` / `temperature_2m_min` を最高気温 / 最低気温として使う
  - `precipitation` / `rain_sum` / `snowfall_sum` は参考値として扱う
- `raw_weather_text` は使わず、必要なら `raw_weather_code` を補助表示に使う

### observed / historical

- endpoint:
  - `POST /api/weather-records/observed`
- source:
  - `source_type = historical_api`
  - `source_name = open_meteo_historical`
- location:
  - `latitude / longitude / timezone` を使用
- Open-Meteo Historical:
  - daily `weather_code` を代表天気として使う
  - `temperature_2m_max` / `temperature_2m_min` を最高気温 / 最低気温として使う
  - `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考値として扱う
- timezone 未設定時は `Asia/Tokyo` を fallback とする

### 共通方針

- 予報取得・実績取得ともに自動保存しない
- 取得結果はフォーム反映のみ
- 保存時に、フォーム上の最終値を `weather_records` へ保存する
- precipitation 系は current では DB 保存しない
- `user_weather_locations` の座標正本、Geocoding、legacy code fields の正本は [weather locations](../settings/weather-locations.md)
- `weather_records` の保存方針、source metadata、snapshot planned の正本は [weather-records.md](./weather-records.md)

---

## provider fallback

### forecast

1. `latitude / longitude` がある場合:
   - Open-Meteo Forecast を使う
   - `source_name = open_meteo_jma_forecast`
2. `latitude / longitude` がなく、JMA forecast code がある場合:
   - JMA forecast JSON fallback
   - `source_name = jma_forecast_json`
3. `forecast_area_code` がある場合:
   - tsukumijima fallback
   - `source_name = tsukumijima`
4. どれもない場合:
   - 取得不可

### observed

1. `latitude / longitude` がある場合:
   - Open-Meteo Historical を使う
   - `source_name = open_meteo_historical`
2. それ以外:
   - 取得不可

補足:

- JMA latest CSV PoC は current 本線に戻さない
- JMA latest CSV / 観測所コードの経緯は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) に残す

---

## date-based fetch UI

### 未来日

- `予報を取得` を主導線にする
- `実績を取得` は disabled
- 補足:
  - `未来日のため、実績データはまだ取得できません。`

### 今日

- `予報を取得` を主導線にする
- `実績を取得` も可能だが、未確定注意を出す
- 補足:
  - `今日の実績は未確定の値を含む場合があります。必要に応じて翌日以降に再取得してください。`

### 過去日

- `実績を取得` を主導線にする
- `予報を取得` は disabled
- 補足:
  - `過去日は実績データの取得を推奨します。`

---

## weather_code 変換

- Open-Meteo の WMO weather code を app `weather_code` に変換する
- current では daily `weather_code` を代表天気として使う
- `then` / `with_occasional` のような複合天気は current では生成しない
- 必要になったら hourly data から推定する

WMO から app `weather_code` への代表的な変換:

- `0`, `1` -> `sunny`
- `2`, `3` -> `cloudy`
- `45`, `48` -> `fog`
- drizzle / rain / showers 系 -> `rain`
- snow / snow grains / snow showers 系 -> `snow`
- thunderstorm / hail 系 -> `thunder`

---

## legacy

### JMA forecast JSON

- forecast の fallback / legacy provider
- 日本語天気文正規化の知見は残す
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

### tsukumijima

- forecast の fallback / legacy provider
- 既存 `forecast_area_code` を使う
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

### JMA latest CSV PoC

- observed の本線採用はしない
- legacy PoC / history として残す
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## planned

- Open-Meteo hourly を使った複合天気推定
- precipitation 系を DB 保存するかの再判断
- `forecast_snapshot / observed_snapshot` を使って、取得時データと最終保存値を分ける
- source の見せ方や日付別 fetch UI を、実装後の目視確認に基づいて調整する
