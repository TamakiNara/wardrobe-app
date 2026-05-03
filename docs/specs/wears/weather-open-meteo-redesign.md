# Open-Meteo Redesign Note

このファイルは、天気 API を Open-Meteo 中心へ再設計した経緯・比較・移行方針のメモです。  
current の取得仕様は [weather-fetching.md](./weather-fetching.md)、地域設定は [weather locations](../settings/weather-locations.md)、保存方針は [weather-records.md](./weather-records.md)、backup / restore は [import-export](../import-export.md) を正本とします。

関連 docs:

- [weather current status](./weather-current-status.md)
- [weather fetching](./weather-fetching.md)
- [weather records](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [import-export](../import-export.md)

最終更新: 2026-05-03

---

## 目的

天気 API 方針を、`JMA forecast JSON + 気象庁最新 CSV` 中心の案から `Open-Meteo Forecast / Historical` 中心へ寄せた理由を残す。  
このメモで扱うのは比較・採用理由・移行方針であり、current の endpoint や保存構造の詳細は各正本 docs に委ねる。

---

## 背景

以前は、以下を組み合わせる案を本命候補として検討していた。

- forecast:
  - JMA forecast JSON
- observed:
  - 気象庁の最新気象データ CSV

ただし、実装を進めると次の複雑さが明確になった。

- 予報区域と、ユーザーが日常的に使う地域名が一致しない
- JMA forecast JSON の天気区域と気温代表地点 code が一致しない場合がある
- 実績取得は予報区域ではなく観測所 code ベースになる
- 地域名と観測地点名が一致しない
- 地域設定 UI に観測所 code を持ち込む必要があり、入力が重くなる
- 実績側では `weather_code` 相当の代表天気を扱いづらい
- forecast / observed で source と code 体系が分かれ、保存方針も複雑化する

このため、forecast / observed を `latitude / longitude / timezone` で揃えやすい Open-Meteo を本命候補へ切り替えた。

---

## 比較した案

### JMA forecast JSON + 気象庁最新 CSV

長所:

- 公式データに近い
- forecast と observed の元データを個別に確認しやすい

短所:

- 予報区域、気温代表地点、観測所 code が分かれる
- 地域設定 UI が重くなる
- forecast / observed を同じ地点設定で扱いにくい
- `weather_code` への変換が複雑

判断:

- 調査価値はあったが、本線採用はしない

### Open-Meteo JMA Forecast / Historical

長所:

- `latitude / longitude / timezone` を軸に forecast / historical を統一しやすい
- Geocoding API と組み合わせると地域設定 UI を自然にできる
- daily / hourly で必要な項目を取得しやすい
- WMO weather code を app `weather_code` に変換する方針をとりやすい

短所:

- weather code は WMO ベースで、日本語の天気文そのものではない
- free tier / 商用利用条件は継続確認が必要

判断:

- current の本命候補として採用する

### Weathernews WxTech

長所:

- 国内天気 API として魅力がある
- 実務向けには情報量が多い

短所:

- 個人開発には料金・契約面が重い
- 現状スコープでは導入コストが高い

判断:

- 現段階では採用しない

### Visual Crossing / Tomorrow.io などのグローバル候補

長所:

- forecast / historical / geocoding をまとめて扱える候補がある
- API としては扱いやすいものもある

短所:

- 日本国内の weather code / 表示 / timezone 文脈では Open-Meteo JMA の方が今回の用途に合う
- 料金や契約、表示仕様の比較コストが追加で必要

判断:

- 比較候補としては残すが、現時点では第一候補にしない

---

## 採用方針

- Open-Meteo を本命候補にする
- 地域設定の正本を `latitude / longitude / timezone` に寄せる
- forecast / historical を同じ地域設定で扱う
- Geocoding API を使って、地域名から座標を設定しやすくする
- JMA forecast JSON / tsukumijima / JMA latest CSV は legacy / fallback / 経緯メモ扱いにする

current の正本参照先:

- forecast / observed API:
  - [weather-fetching.md](./weather-fetching.md)
- 地域設定:
  - [weather locations](../settings/weather-locations.md)
- `weather_records` の保存方針:
  - [weather-records.md](./weather-records.md)
- backup / restore:
  - [import-export](../import-export.md)

---

## 旧 API 検討メモ

### JMA forecast JSON / tsukumijima

#### JMA forecast JSON

- `forecast/{office_code}.json` の `{office_code}` は office code 前提
- ユーザーが選ぶ予報区域 code と、取得用 office code は別になる
- 天気区域と気温代表地点 code が一致しない場合がある
- JMA 天気文の正規化では、時間帯入り表記、`raw_weather_text`、全角スペース整形などの知見が必要だった
- 気象庁サイト由来の JSON だが、安定 API というより Web 表示用 JSON として扱う方が自然だった
- 現在は Open-Meteo 本線により legacy / fallback 扱い

#### tsukumijima

- livedoor 天気互換 API として利用していた
- `forecast_area_code` は tsukumijima 用 legacy code
- 現在は Open-Meteo 本線により fallback / legacy 扱い
- 将来的には削除候補

### JMA latest CSV / 観測所コード

- 実績取得候補として検討した
- 公式寄りのデータではあるが、CSV 取得・文字コード・複数ファイル取得の扱いが重い
- 実績取得は予報区域ではなく観測所 code ベースになる
- 地域名と観測地点が一致しない
- `observation_station_code` / `observation_station_name` が必要になり、地域設定 UI が複雑化した
- `weather_code` 相当の代表天気を扱いづらい
- Open-Meteo Historical に寄せることで、forecast / observed を `latitude / longitude / timezone` で統一できる
- そのため本線採用しない判断になった
- JMA latest CSV PoC は別ブランチへ退避済みで、本線には戻さない

---

## legacy 実装の扱い

### JMA forecast JSON

- current では残すが、本線ではない
- Open-Meteo で取得できないケースの fallback / legacy provider として扱う
- 日本語天気文の正規化知見は、legacy fallback の保守や比較材料として残す

### tsukumijima

- forecast fallback として履歴を残す
- `source_name = tsukumijima` の既存データはそのまま扱う
- 利用状況を見て削除を再判断する

### JMA latest CSV PoC

- 本線採用しない
- legacy PoC / history として知見のみ残す
- `observation_station_code` / `observation_station_name` は当面 import / export 互換のため残す

---

## 移行ステップ

1. 地域設定の正本を `latitude / longitude / timezone` に寄せる
2. Geocoding API で座標設定を補助する
3. Open-Meteo forecast PoC を実装する
4. Open-Meteo historical PoC を実装する
5. fetch endpoint を Open-Meteo 優先へ寄せる
6. legacy 実装を fallback / history へ縮小する
7. 利用状況を見て不要カラム削除を再判断する

補足:

- current では 1〜5 は概ね実施済み
- 6 以降は docs / UI / import-export 整理と利用状況確認を含む

---

## 今後の判断ポイント

- Open-Meteo の free tier / 商用利用条件をどの段階で再確認するか
- Open-Meteo JMA endpoint と generic forecast endpoint のどちらを長期正本にするか
- `forecast_snapshot / observed_snapshot` をどの段階で導入するか
- precipitation 系を snapshot に含めるか、直カラム化まで進めるか
- legacy code fields をいつ UI 主導線から外し、いつ削除判断するか
- JMA fallback をどこまで残すか
