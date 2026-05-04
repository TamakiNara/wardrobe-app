# Weather Current Status

このファイルは、天気機能全体の現在地と関連 docs への入口です。  
詳細仕様は各正本 docs を参照してください。

---

## current summary

- 手動天気登録がある
- 地域設定は `latitude / longitude / timezone` を Open-Meteo 向け正本へ移行中
- Open-Meteo Geocoding API で位置情報を設定できる
- 予報取得は Open-Meteo Forecast が本線
- 実績取得は Open-Meteo Historical が本線
- `weather_records` は current では最終保存値を持つ
- `weather_code` / icon / `/dev/weather-preview` がある
- 取得は自動保存せず、フォーム反映のみ
- カレンダー weather status を表示し、`none / forecast / observed / manual` を区別できる
- カレンダーでは天気アイコンを主表示にし、source 状態は色で表す
- カレンダー凡例では `Sun` を代表アイコンにして、予報 / 実績 / 振り返りありを説明する
- `manual` はカレンダーセルでは observed 寄せで扱い、凡例には出さない
- 振り返りありは slate / neutral 系の書き込みアイコンで補助表示する
- 同日に複数地域の天気がある場合は、status 優先の上で default location、次に `display_order`、最後に `id` 順で代表天気を選ぶ
- 日付詳細モーダルでは、天気ごとに `予報 / 実績 / 手入力` の status バッジを表示する
- `manual` は表示上 observed 寄せで扱う
- `is_user_edited` は current では入れない
- 月単位の未完了サマリは current では入れない

---

## planned summary

- `forecast_snapshot / observed_snapshot`
- precipitation 保存
- hourly から複合天気を推定するか再判断
- `was_exposed_to_rain`
- legacy カラム削除判断

---

## legacy / history

- JMA forecast JSON
- tsukumijima fallback
- JMA latest CSV PoC
- `forecast_area_code`
- JMA code fields
- observation station fields

legacy / history の詳細:

- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## docs map

- [weather-fetching.md](./weather-fetching.md)
  - forecast / observed API 取得
- [weather-records.md](./weather-records.md)
  - `weather_records` と保存方針
- [weather locations](../settings/weather-locations.md)
  - 地域設定・座標正本・Geocoding
- [weather and feedback](../recommendation/weather-and-feedback.md)
  - 着用履歴フィードバックと天気データの関係
- [import-export](../import-export.md)
  - backup / restore
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)
  - Open-Meteo 移行検討・旧 API 検討メモ
- [weather-docs-reorganization.md](./weather-docs-reorganization.md)
  - docs 再編メモ

---

## 推奨実装順

1. 日付詳細モーダルの天気状態バッジ
2. precipitation 保存方針の再判断
3. snapshot PoC の要否判断
4. legacy fallback の利用状況確認
5. hourly を使った天気表現の改善検討
