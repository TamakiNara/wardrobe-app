# Weather Historical Integration

このファイルは JMA 最新気象データ CSV / 観測所コードによる実績取得の検討・経緯メモです。  
current の実績取得仕様は [weather-fetching.md](./weather-fetching.md) を正本とします。

---

## 役割

- JMA latest CSV PoC の調査結果を残す
- 観測所コードベース設計が重くなった経緯を残す
- Open-Meteo Historical を本線に寄せた判断背景を残す

---

## legacy / history

### JMA latest CSV PoC

- 日最高気温 / 日最低気温 / 日降水量の取得を試した
- `observation_station_code` / `observation_station_name` を location に持つ前提だった
- forecast 用の地域コードとは別体系の観測所コードが必要だった
- 実績取得では `weather_code` 相当の天気情報を取りにくかった

### 観測所コードベース設計で重くなった点

- 地域名と観測所名が一致しない前提になる
- forecast と observed でコード体系が分かれる
- ユーザーに観測所コード設定を求める必要が出る
- provider / source の意味が複雑になる

---

## current との関係

- current の実績取得本線は Open-Meteo Historical
- `POST /api/weather-records/observed` は `latitude / longitude / timezone` を使う
- JMA latest CSV PoC は本線採用しない
- 実績取得の current 仕様は [weather-fetching.md](./weather-fetching.md) を参照する

---

## 残しておく知見

- 観測所コード方式は、将来的な管理ツールや比較検証では再利用余地がある
- ただし current のユーザー向け主導線には採用しない
- `observation_station_code` / `observation_station_name` は legacy PoC として残しうる
