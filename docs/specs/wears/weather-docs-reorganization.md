# Weather Docs Reorganization Note

最終更新: 2026-05-03

## 目的

天気機能まわりの docs が増え、Open-Meteo 移行・JMA fallback・保存方針・表示方針のメモが複数ファイル末尾へ追記される形で蓄積している。  
このメモでは、現状の docs の役割、重複、正本候補、縮小候補を整理し、次フェーズでの再編方針を提案する。

今回は提案のみであり、大規模な本文削除・移動・統合作業は行わない。

---

## 確認した docs

- [weather-current-status.md](./weather-current-status.md)
- [weather-records.md](./weather-records.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)
- [weather-locations.md](../settings/weather-locations.md)
- [weather-and-feedback.md](../recommendation/weather-and-feedback.md)
- [import-export.md](../import-export.md)
- [README.md](../README.md)

---

## 現状棚卸し

### weather-current-status.md

現在の役割:
- 天気機能全体の current / planned / pending の入口
- 関連 docs への索引

主に書かれている内容:
- weather_records
- user_weather_locations
- weather_code / icon
- forecast / historical
- Open-Meteo 移行メモ
- カレンダー weather status

中心:
- current と planned のまとめ

課題:
- 入口として有用だが、詳細仕様が入りすぎている
- Open-Meteo forecast / historical、保存方針、カレンダー表示まで末尾メモで重複している

評価:
- 正本として残す
- ただし詳細仕様は他 docs へ寄せ、索引と全体状況に圧縮したい

### weather-records.md

現在の役割:
- `weather_records` と保存方針の正本候補

主に書かれている内容:
- `weather_records` / `user_weather_locations`
- source metadata
- weather_code
- Open-Meteo forecast / historical 保存影響
- snapshot 案
- カレンダー weather status

中心:
- current と planned の両方

課題:
- 保存方針と API 取得方針が混ざっている
- 地域設定や provider 方針のメモも入り込んでいる

評価:
- 正本として残す
- ただし守備範囲を `weather_records` / source / snapshot / precipitation 保存方針へ絞る

### weather-forecast-integration.md

現在の役割:
- 予報取得の経緯メモと current fallback 実装の説明

主に書かれている内容:
- JMA forecast JSON
- tsukumijima fallback
- Open-Meteo forecast PoC note
- provider 優先順位

中心:
- current と legacy の混在

課題:
- JMA / tsukumijima の説明が厚い一方、Open-Meteo current も末尾へ追記されている
- 将来の正本候補としては読み順が逆転している

評価:
- 正本としては残さない方向が自然
- 次フェーズでは legacy / 経緯メモへ縮小したい

### weather-historical-integration.md

現在の役割:
- 実績取得の初期構想メモ

主に書かれている内容:
- JMA latest CSV / observation station
- Open-Meteo historical redesign note
- source metadata

中心:
- planned と legacy が中心

課題:
- 冒頭の current / planned が Open-Meteo current とずれている箇所がある
- JMA latest CSV PoC の経緯メモと Open-Meteo 本線が同居していて読みづらい

評価:
- 正本としては残さない方向が自然
- 次フェーズでは legacy / 経緯メモへ縮小したい

### weather-open-meteo-redesign.md

現在の役割:
- Open-Meteo 移行方針の中核メモ

主に書かれている内容:
- Open-Meteo 採用判断
- latitude / longitude / timezone 正本化
- Geocoding
- forecast / historical PoC
- source / snapshot / calendar status

中心:
- current と planned の混在

課題:
- redesign メモとしては一番情報がまとまっているが、実装済み current もかなり増えた
- 「再設計メモ」の名前のまま正本にするかは再検討余地がある

評価:
- API取得方針の正本候補
- ただし将来的には `weather-fetching.md` へ整理統合する案がある

### weather-locations.md

現在の役割:
- `user_weather_locations` の正本候補

主に書かれている内容:
- `name`
- `latitude` / `longitude` / `timezone`
- Geocoding API
- JMA legacy code
- default location

中心:
- current と planned

課題:
- 地域設定としては十分正本候補
- ただし旧 `forecast_area_code` 前提の説明や JMA 系メモがやや残っている

評価:
- 正本として残す
- 地域設定と location model に守備範囲を絞る

### weather-and-feedback.md

現在の役割:
- 着用履歴フィードバック側の正本

主に書かれている内容:
- feedback tags
- 体感
- 雨体験
- weather status / calendar note の一部

中心:
- planned

課題:
- API 取得や provider 方針の経緯が混ざると主題がぼける

評価:
- 正本として残す
- ただし API / provider 詳細は外し、`was_exposed_to_rain` などフィードバック文脈に限定したい

### import-export.md

現在の役割:
- backup / restore 正本

主に書かれている内容:
- weather location fields
- weather record fields
- source allow-list
- snapshot 案の import/export 影響

中心:
- current と planned

課題:
- 天気 API 方針そのものの説明が少し入り込んでいる

評価:
- 正本として残す
- import / export 影響に限定して整理したい

### README.md

現在の役割:
- specs index

課題:
- weather docs が増えたわりに入口設計は薄い
- `weather-open-meteo-redesign.md` はリンクされているが、役割の違いまでは分からない

評価:
- 正本ではないが、再編後の入口整理に重要

---

## 重複している内容

特に重複が強いもの:

- Open-Meteo を本命にする方針
- `latitude / longitude / timezone`
- Geocoding API
- `forecast_area_code` / JMA codes / observation station code の legacy 扱い
- Open-Meteo forecast / historical
- JMA forecast JSON / tsukumijima fallback
- `source_type / source_name / source_fetched_at`
- precipitation / `rain_sum` / `snowfall_sum`
- `forecast_snapshot` / `observed_snapshot`
- カレンダー weather status

中程度の重複:

- `weather_code`
- `has_rain_possibility`
- `was_exposed_to_rain`
- import/export 影響

重複の傾向:
- `weather-current-status.md` が入口でありながら詳細も抱えている
- `weather-records.md` と `weather-open-meteo-redesign.md` の両方に source / snapshot / precipitation がある
- `weather-forecast-integration.md` と `weather-historical-integration.md` に current 実装と legacy 経緯が混在している

---

## 推奨する正本

### 残すべき正本

- `weather-current-status.md`
  - 役割: 入口・全体状況・current / planned / legacy の索引
- `weather-records.md`
  - 役割: `weather_records` / source / snapshot / precipitation 保存方針
- `weather-locations.md`
  - 役割: `user_weather_locations` / `latitude` / `longitude` / `timezone` / Geocoding / legacy code
- `import-export.md`
  - 役割: backup / restore 正本
- `weather-and-feedback.md`
  - 役割: フィードバック・体感・ `was_exposed_to_rain`

### API取得の正本候補

候補A:
- `weather-open-meteo-redesign.md` をそのまま正本化する

候補B:
- 新規 `weather-fetching.md` を作り、
  - Open-Meteo forecast / historical
  - provider 優先順位
  - JMA / tsukumijima fallback
  - fetch UI date-based guidance
  を集約する

推奨:
- 中期的には候補B
- ただし次フェーズでは、まず `weather-open-meteo-redesign.md` を API取得正本として使い、落ち着いたら `weather-fetching.md` へ改名または再編するのが安全

---

## 縮小・legacy 化したい docs

- `weather-forecast-integration.md`
  - 次フェーズでは JMA forecast JSON / tsukumijima fallback の legacy / 経緯メモへ縮小
- `weather-historical-integration.md`
  - 次フェーズでは JMA latest CSV PoC / observation station の legacy / 経緯メモへ縮小

残し方の方針:
- 削除は急がない
- 先頭に `legacy / history` 的な位置づけを明記
- current の本線説明は API取得正本へ寄せる

---

## weather-display.md を分けるべきか

結論:
- 今すぐは不要

理由:
- まだ「calendar weather status」「detail modal」「dev/weather-preview」が仕様固め段階で、1 ファイル分けるほど確定していない
- 先に API取得・保存方針・地域設定の正本を整えた方が効果が大きい

ただし、次の条件がそろったら分離候補:
- カレンダーセルの天気表示を実装
- 日付詳細モーダルの source バッジを実装
- `/dev/weather-preview` の役割が安定

その時点で `weather-display.md` を作るのは自然

---

## 推奨する最終構成

### 入口

- `weather-current-status.md`
  - 天気機能全体の current / planned / legacy
  - 詳細 docs へのリンク
  - 今後の実装順

### 保存

- `weather-records.md`
  - `weather_records`
  - `weather_code`
  - source
  - precipitation 保存方針
  - snapshot planned

### 地域設定

- `weather-locations.md`
  - `user_weather_locations`
  - `latitude` / `longitude` / `timezone`
  - Geocoding API
  - legacy codes
  - default location

### API取得

- `weather-fetching.md` または整理後の `weather-open-meteo-redesign.md`
  - Open-Meteo forecast / historical
  - provider 優先順位
  - JMA / tsukumijima fallback
  - date-based fetch UI

### フィードバック

- `weather-and-feedback.md`
  - 体感
  - feedback tags
  - `was_exposed_to_rain`
  - 天気データとの関係

### 補助

- `import-export.md`
  - backup / restore
- `weather-forecast-integration.md`
  - legacy / history
- `weather-historical-integration.md`
  - legacy / history

---

## 次フェーズの再編手順

1. `weather-current-status.md` を入口・索引へ圧縮する
2. API取得の正本を `weather-open-meteo-redesign.md` に一時集約する
3. 可能なら新規 `weather-fetching.md` を作り、Open-Meteo / fallback / date-based UI を移す
4. `weather-forecast-integration.md` を JMA forecast JSON / tsukumijima の legacy メモへ縮小する
5. `weather-historical-integration.md` を JMA latest CSV / observation station の legacy メモへ縮小する
6. `weather-records.md` に保存方針・source・snapshot を集約する
7. `weather-locations.md` に地域設定・座標正本・Geocoding を集約する
8. `weather-and-feedback.md` から API取得詳細を外し、フィードバック文脈へ寄せる
9. `import-export.md` は backup / restore 影響だけに整理する
10. `README.md` の weather docs リンクを役割付きで見直す

---

## 判断が必要な点

- 新規 `weather-fetching.md` を今すぐ作るか
  - 推奨: 次フェーズで作る
- `weather-open-meteo-redesign.md` を残すか
  - 推奨: いったん残し、API取得正本として整理した後に縮小判断
- `weather-forecast-integration.md` と `weather-historical-integration.md` を正本で残すか
  - 推奨: 正本ではなく legacy / history メモへ
- `weather-display.md` を今分けるか
  - 推奨: 今は不要
- `weather-current-status.md` の長さ
  - 推奨: 入口 docs として短めに保ち、詳細は他 docs へ送る
- ファイル移動をするか
  - 推奨: まずは既存パス維持で整理し、その後必要なら移動
