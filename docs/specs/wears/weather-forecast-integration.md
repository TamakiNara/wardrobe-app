# Weather Forecast Integration

このファイルは JMA forecast JSON / tsukumijima 予報取得の検討・実装経緯メモです。  
current の予報取得仕様は [weather-fetching.md](./weather-fetching.md) を正本とします。

---

## 役割

- JMA forecast JSON を使った予報取得の知見を残す
- tsukumijima fallback の経緯を残す
- Open-Meteo 導入前後で、forecast provider をどう整理してきたかを追えるようにする

---

## legacy / history

### JMA forecast JSON

- `jma_forecast_office_code` を使って `forecast/{office_code}.json` を取得する
- `jma_forecast_region_code` を対象地域として使う
- 日本語天気文を app `weather_code` へ正規化する
- `raw_weather_text` は画面表示や変換確認に使う
- 気温 block は代表地点 code を返すため、region code 直一致だけでは取得できないケースがある

### tsukumijima

- `forecast_area_code` を使う legacy fallback
- JMA code が未設定だった時期の forecast provider として利用していた
- 既存 `weather_records` の `source_name = tsukumijima` は履歴として残る

---

## 残しておく知見

- JMA forecast JSON の区域 code と気温地点 code が一致しないケースがある
- JMA の日本語天気文から app `weather_code` への正規化ルールは、legacy fallback の変換知見として維持する
- `forecast_area_code` は weather.tsukumijima.net 前提の code であり、Open-Meteo 移行後は主入力から外す

---

## current との関係

- current の本線 forecast provider は Open-Meteo
- JMA forecast JSON は fallback / legacy provider
- tsukumijima は fallback / legacy provider
- provider 優先順位や date-based fetch UI は [weather-fetching.md](./weather-fetching.md) を参照する
