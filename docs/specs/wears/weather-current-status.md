# Weather Current Status

天気機能全体の current / planned / legacy を短く把握するための入口です。  
詳細仕様は各正本 docs を参照してください。

関連 docs:

- [weather-records.md](./weather-records.md)
- [weather-fetching.md](./weather-fetching.md)
- [weather locations](../settings/weather-locations.md)
- [weather and feedback](../recommendation/weather-and-feedback.md)
- [import-export](../import-export.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)
- [weather-forecast-integration.md](./weather-forecast-integration.md)
- [weather-historical-integration.md](./weather-historical-integration.md)

---

## current

### 手動天気登録

- `weather_records` を正本として、日付 x 地域の天気を登録する
- 予報取得・実績取得はフォーム反映のみで、自動保存はしない
- 保存時に、ユーザーが確認した最終値を `weather_records` へ保存する

### 取得系

- 予報取得の本線は Open-Meteo Forecast
- 実績取得の本線は Open-Meteo Historical
- どちらも `latitude / longitude / timezone` を使う
- 取得仕様の正本は [weather-fetching.md](./weather-fetching.md)

### 保存方針

- `weather_records` は current では最終保存値を持つ
- `source_type / source_name / source_fetched_at` は、最後にフォームへ反映した取得元を表す
- precipitation 系は参考表示のみで、まだ DB 保存しない
- 保存方針の正本は [weather-records.md](./weather-records.md)

### 地域設定

- `user_weather_locations` は座標正本へ移行中
- `latitude / longitude / timezone` を主入力として扱う
- Open-Meteo Geocoding API による候補検索で位置情報を反映できる
- 地域設定の正本は [weather locations](../settings/weather-locations.md)

### weather_code / icon / preview

- `weather_code` は app 内部の正規化値として維持する
- Open-Meteo WMO code は app `weather_code` へ変換する
- JMA 天気文変換は legacy / fallback 確認として残す
- `/dev/weather-preview` は weather_code / icon / Open-Meteo WMO code 変換の目視確認用

---

## planned

- `forecast_snapshot / observed_snapshot` の導入
- precipitation 系の保存
- カレンダー weather status 表示
- Open-Meteo hourly を使った複合天気推定
- `was_exposed_to_rain` などのフィードバック拡張

---

## legacy

- JMA forecast JSON
- tsukumijima fallback
- JMA latest CSV PoC
- `forecast_area_code` / `jma_forecast_region_code` / `jma_forecast_office_code` / `observation_station_code` などの legacy code fields

legacy / history の詳細:

- [weather-forecast-integration.md](./weather-forecast-integration.md)
- [weather-historical-integration.md](./weather-historical-integration.md)

---

## 今後の実装順

1. `weather_records` の snapshot 方針を固める
2. precipitation 系の保存方針を決める
3. カレンダー weather status の API / UI を実装する
4. Open-Meteo hourly を使う複合天気推定が本当に必要か再判断する
5. legacy forecast / historical docs をさらに history メモへ縮小する
