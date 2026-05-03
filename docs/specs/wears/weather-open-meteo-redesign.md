# Open-Meteo JMA API 再設計メモ

このファイルは、天気 API を Open-Meteo 中心へ再設計した経緯・比較・移行方針のメモです。  
current の取得仕様は [weather-fetching.md](./weather-fetching.md)、地域設定は [weather locations](../settings/weather-locations.md)、保存方針は [weather-records.md](./weather-records.md) を正本とします。

関連 docs:

- [weather current status](./weather-current-status.md)
- [weather fetching](./weather-fetching.md)
- [weather records](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [import-export](../import-export.md)
- [weather-forecast-integration.md](./weather-forecast-integration.md)
- [weather-historical-integration.md](./weather-historical-integration.md)

最終更新: 2026-05-03

---

## 目的

天気 API 方針を、JMA forecast JSON + 気象庁最新 CSV 中心から、Open-Meteo JMA Forecast / Historical 中心へ再設計する。

このメモで残すもの:

- なぜ Open-Meteo に寄せたか
- 比較した案
- 採用方針
- 移行ステップ
- legacy 実装の扱い
- 今後の判断ポイント

このメモで詳細を書きすぎないもの:

- forecast / observed endpoint の current 詳細
- `user_weather_locations` の current 詳細
- `weather_records` の保存方針
- import / export 詳細

---

## 背景

JMA forecast JSON + 気象庁最新 CSV を組み合わせる案では、次の複雑さが大きかった。

- 予報区域と生活上の地域名が一致しない
- JMA forecast JSON の天気区域と気温地点が一致しない
- 実績取得では観測所コードベースになる
- 予報と実績でコード体系が分かれる
- 観測地点コードをユーザーに設定させる必要がある
- 実績取得では `weather_code` 相当をきれいに揃えにくい

その結果、地域設定、取得元、保存方針、UI 説明が複雑になりやすかった。

また、

- JMA latest CSV PoC は本線採用しない
- Weathernews WxTech は個人開発には料金・契約面で重い

という判断もあり、Open-Meteo を本命候補に寄せる方針に転換した。

---

## 比較した案

### JMA forecast JSON + 気象庁最新 CSV

長所:

- 取得元としての説明がしやすい
- JMA 天気文や観測所データの粒度を直接扱える

短所:

- 予報区域・代表地点・観測所コードが分かれる
- 地域設定 UI が重くなりやすい
- forecast / observed を同じ location model で扱いにくい

結論:

- 一度は検討・PoC を行ったが、本命にはしない

### Open-Meteo JMA Forecast / Historical

長所:

- `latitude / longitude / timezone` を軸に forecast / historical を揃えやすい
- 地域設定を座標正本へ寄せやすい
- Geocoding API と合わせると地点設定 UI を軽くしやすい
- daily / hourly の同系統データで weather code、気温、降水系を扱える

短所:

- weather code は WMO ベースで、app `weather_code` への変換が必要
- free tier / 商用利用条件は JMA 公式とは別軸で確認が必要

結論:

- 本命候補として採用する

### Weathernews WxTech

長所:

- 国内天気情報として魅力的
- 実務用途では強い候補になりうる

短所:

- 個人開発には料金・契約面が重い
- 現段階では導入コストが高い

結論:

- 今回は対象外

### Visual Crossing / Tomorrow.io などのグローバル候補

長所:

- forecast / historical / geocoding がまとまっていることが多い
- API 製品としては使いやすい候補がある

短所:

- 日本向け weather code / 表示 / 日常運用の観点では Open-Meteo JMA の方が今回の用途に合いやすい
- 料金や制限の比較が別途必要

結論:

- 比較候補としては残すが、現時点の第一候補ではない

---

## 採用方針

### 結論

- Open-Meteo を本命候補にする
- 地域設定の正本を `latitude / longitude / timezone` に寄せる
- forecast / historical を同じ地域設定で扱う
- JMA forecast JSON / tsukumijima / JMA latest CSV は legacy / fallback / 経緯メモ扱いにする

### current 正本への参照

- forecast / observed の current 取得仕様:
  - [weather-fetching.md](./weather-fetching.md)
- `latitude / longitude / timezone`、Geocoding、legacy code fields の current 仕様:
  - [weather locations](../settings/weather-locations.md)
- `weather_records` の source / snapshot / precipitation 方針:
  - [weather-records.md](./weather-records.md)
- backup / restore の current 仕様:
  - [import-export](../import-export.md)

---

## legacy 実装の扱い

### JMA forecast JSON

- current 実装としては残る
- ただし本命ではなく fallback / legacy 候補
- 日本語天気文正規化や fallback の知見は残す

### tsukumijima

- forecast fallback として当面残す
- `forecast_area_code` 互換のため legacy 扱いで維持する
- 利用が減った段階で削除を再判断する

### JMA latest CSV PoC

- 本線採用しない
- legacy PoC / history として残す
- 観測所コードベースが重かった知見は保持する

---

## 移行ステップ

1. 地域設定の正本を `latitude / longitude / timezone` に寄せる
2. Geocoding API を通常導線にする
3. Open-Meteo forecast PoC を実装する
4. Open-Meteo historical PoC を実装する
5. fetch endpoint を Open-Meteo 優先へ寄せる
6. legacy 実装を fallback / history へ縮小する
7. 利用状況を見て不要カラム削除を再判断する

補足:

- current では 1〜5 は概ね到達済み
- 6 以降は docs / UI / import-export 整理を含めて段階的に進める

---

## 今後の判断ポイント

- Open-Meteo の free tier / 商用利用条件をどの段階でどう扱うか
- Open-Meteo JMA endpoint と generic forecast endpoint のどちらを長期正本にするか
- `forecast_snapshot / observed_snapshot` をどの時点で導入するか
- precipitation 系を snapshot に含めるか、直カラム化するか
- legacy code fields をいつ UI 主導線から外し切るか
- JMA fallback をどこまで維持するか

---

## 残す経緯メモ

詳細な JMA / fallback の経緯は以下へ残す。

- forecast 側:
  - [weather-forecast-integration.md](./weather-forecast-integration.md)
- historical 側:
  - [weather-historical-integration.md](./weather-historical-integration.md)

このファイル自体は、Open-Meteo へ寄せた理由と移行方針を短く追えるメモとして維持する。
