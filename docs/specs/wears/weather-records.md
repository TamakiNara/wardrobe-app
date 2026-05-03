# Weather Records Specification

日ごとの天気情報を着用記録で使うための仕様を整理する。
今回は weather forecast の移行設計を中心に、`weather_records` と `user_weather_locations` の関係、および source metadata の扱いを明確にする。

---

## 対象

- `weather_records`
- `user_weather_locations`
- 着用記録画面での天気表示

---

## current

MVP では、天気予報の取得元として `weather.tsukumijima.net` を使う。

### user_weather_locations

現行カラム:

- `id`
- `user_id`
- `name`
- `forecast_area_code` nullable
- `latitude` nullable
- `longitude` nullable
- `is_default`
- `display_order`
- `created_at`
- `updated_at`

### weather_records

現行カラム:

- `id`
- `user_id`
- `weather_date`
- `location_id` nullable
- `location_name_snapshot`
- `forecast_area_code_snapshot` nullable
- `weather_code`
- `temperature_high` nullable
- `temperature_low` nullable
- `memo` nullable
- `source_type`
- `source_name`
- `source_fetched_at` nullable
- `created_at`
- `updated_at`

### current source 設計

- 手入力:
  - `source_type = manual`
  - `source_name = manual`
- 予報 API:
  - `source_type = forecast_api`
  - `source_name = tsukumijima`

### current の意味

- `forecast_area_code_snapshot` は、その記録保存時点で使った予報用コードの snapshot
- 保存先の正本は、外部 API の raw code ではなく `weather_code`

---

## planned

### source 設計

気象庁 forecast JSON を使う段階では、以下を使う。

- `source_type = forecast_api`
- `source_name = jma_forecast_json`

### 併存期間

段階移行中は、以下の `source_name` が併存してよい。

- `manual`
- `tsukumijima`
- `jma_forecast_json`

既存レコードの `source_name = tsukumijima` は、履歴として残す。

### forecast area snapshot

- `forecast_area_code_snapshot` は当面維持する
- ただし意味は「その時点で採用した予報区域コードの snapshot」として読む
- 将来 `jma_forecast_region_code` 導入後も、短期的にはこの項目名を維持してよい

### JMA forecast JSON からの変換

保存先の正本は引き続き `weather_code` とする。

方針:

- JMA 数値コードをそのまま保存しない
- 日本語の `weathers` テキストを主に使って `weather_code` へ正規化する
- 未対応パターンは `other` に落とす

直接吸収しやすい例:

- `晴`
- `曇`
- `雨`
- `雪`
- `雷`
- `霧`
- `強風`
- `晴のち曇`
- `曇のち晴`
- `曇のち雨`
- `雨のち曇`
- `晴時々曇`
- `曇時々雨`
- `晴時々雨`

当面 `other` に落としてよい例:

- `storm` / 荒天
- `雨か雪`
- `雪時々雨`
- `曇一時雪`

`has_rain_possibility` は、現行どおり `weather_code` 派生でよい。

---

### weather_code と raw_weather_text の役割

- `weather_code`
  - アプリ内で保存する正規化値
  - アイコン表示、簡易表示、検索、分析、`has_rain_possibility` 判定に使う
- `raw_weather_text`
  - 取得元の詳細表記を表示用に整形した値
  - forecast API response と frontend state では保持する
  - 取得結果確認や、変換ルール改善の観測用に使う

### JMA 詳細表記の扱い

- JMA の時間帯入り表記は `weather_code` にそのまま保存しない
- 例:
  - `晴れ　夜のはじめ頃　くもり`
  - `weather_code = sunny_then_cloudy`
  - `raw_weather_text = 晴れ 夜のはじめ頃 くもり`
- 表示時は全角スペースを半角スペースへ寄せ、連続スペースを 1 つにまとめる
- JMA の気温は代表地点ベースで返ることがあるため、予報区域 code と直接一致しない場合がある
- 取得時に代表地点を安全に解決できない場合は、気温は `null` のままにする

### 保存方針

- 今回は `raw_weather_text` を DB 保存しない
- `weather_records` の保存先は引き続き `weather_code` / 気温 / source metadata を正本とする
- 将来的に必要になった場合のみ、以下を追加候補として再検討する
  - `raw_weather_text`
  - `source_payload`

## weather_code

MVP 時点で許容する `weather_code` は以下。

- 基本:
  - `sunny`
  - `cloudy`
  - `rain`
  - `snow`
  - `thunder`
  - `fog`
  - `windy`
  - `other`
- 複合:
  - `sunny_then_cloudy`
  - `cloudy_then_sunny`
  - `cloudy_then_rain`
  - `rain_then_cloudy`
  - `sunny_with_occasional_clouds`
  - `cloudy_with_occasional_rain`
  - `sunny_with_occasional_rain`

今回の移行設計では、新しい `weather_code` の追加は必須ではない。

---

## forecast_area_code の扱い

### legacy

- `user_weather_locations.forecast_area_code`
- `weather_records.forecast_area_code_snapshot`

は、段階移行中は legacy 扱いにする。

### planned

将来の予報設定正本は以下に寄せる。

- `jma_forecast_region_code`
- `jma_forecast_office_code`

ただし `weather_records` 側では、既存 snapshot 互換を優先して当面 `forecast_area_code_snapshot` を維持してよい。

---

## import / export 影響

### planned

JMA 設計を実装する段階では、backup / restore も以下へ追従する。

- `weather_locations`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
- `weather_records`
  - `source_name = jma_forecast_json`

### 旧 backup 互換

- 旧 backup に `forecast_area_code` しかない場合は、legacy 値として受け入れる
- 実装時は `forecast_area_code -> jma_forecast_region_code` 相当の読み替え fallback を持つ
- 既存 `source_name = tsukumijima` はそのまま取り込めるようにする

---

## 要再判断

- `forecast_area_code_snapshot` を rename するか
- JMA weather text 変換の取りこぼしをどこまで `other` で許容するか
- 週間予報や代表地点気温を `weather_records` へどの時点で取り込むか


---

## 2026-05-02 implementation note

### current

- `user_weather_locations` には `jma_forecast_region_code` / `jma_forecast_office_code` を保持している。
- `weather_records` の source current 値には `manual` / `tsukumijima` / `jma_forecast_json` がある。
- `forecast_area_code_snapshot` は legacy 互換用として残している。

## 2026-05-03 Open-Meteo redesign note

### planned

- forecast / historical の source は、Open-Meteo 系へ寄せる。
- 想定 `source_name` 候補:
  - `open_meteo_jma_forecast`
  - `open_meteo_historical`
- legacy provider の source は履歴互換のため当面残す。

## 2026-05-03 Open-Meteo forecast source note

### current

- forecast では latitude / longitude がある場合に `source_name = open_meteo_jma_forecast` を使う。
- Open-Meteo forecast response では `raw_weather_code` / `precipitation` / `rain_sum` / `snowfall_sum` を補助値として返す。
- これらの補助値は `weather_records` へはまだ保存しない。

## 2026-05-03 Open-Meteo historical source note

### current

- `weather_records` は current では最終保存値だけを持つ。
- Open-Meteo Historical 取得後に保存した場合は historical source を持つ。
- 具体的には `source_type = historical_api` / `source_name = open_meteo_historical` を使う。

## 2026-05-03 forecast vs observed source note

### current

- `weather_records` は current では forecast と observed の snapshot を分離していない。
- 予報取得後に保存した場合は `source_type = forecast_api` / `source_name = open_meteo_jma_forecast` を持つ。
- 実績取得後に保存した場合は `source_type = historical_api` / `source_name = open_meteo_historical` を持つ。
- 画面上では対象日付に応じて予報取得 / 実績取得の推奨導線を切り替えるが、保存先は引き続き同じ `weather_records` である。
## 2026-05-03 weather record source redesign note

### current

- `weather_records` は current では「ユーザーが確認して保存した最終表示値」の正本である。
- 予報取得・実績取得はどちらもフォーム反映のみで、自動保存しない。
- 保存時には、その時点のフォーム値を `weather_records` に保存する。
- `source_type` / `source_name` / `source_fetched_at` は、record 全体の厳密な由来ではなく、「最後にフォームへ反映した外部取得元」を表す。
- `memo` や一部の値は手入力で上書きされる可能性がある。
- `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考表示のみで、DB 保存しない。
- `raw_weather_code` / `raw_weather_text` も current では原則として DB 保存しない。

### current のメリット

- 実装が軽く、UI も単純に保てる。
- 保存時の正本が 1 つなので、一覧・詳細・編集画面の扱いが分かりやすい。
- import / export のデータ構造も小さく保てる。

### current のデメリット

- `weather_code` が予報由来、気温が実績由来、`memo` が手入力、というように値の由来が混在し得る。
- `source_*` が record 全体の由来なのか、最後に反映した取得元なのかが分かりにくい。
- 予報値と実績値の差分を後から見返せない。
- 降水量系や raw 値を保存していないため、変換検証や分析用途では情報が弱い。

### options

#### 案A: 現行維持

- `weather_records` に最終保存値だけを持つ。
- `source_*` は「最後にフォームへ反映した外部取得元」として扱う。

長所:

- 実装が最も軽い。
- UI / import-export / 既存 API への影響が少ない。

短所:

- 値の由来が混ざりやすい。
- 予報値と実績値の差分を後から確認しにくい。

#### 案B: weather_records に snapshot JSON を持つ

- `forecast_snapshot` JSON nullable
- `observed_snapshot` JSON nullable

長所:

- 最終保存値と、取得時の forecast / observed 値を分けて保持できる。
- `raw_weather_code` / `raw_weather_text` / precipitation 系も snapshot にまとめやすい。
- import / export で 1 record 単位の復元がしやすい。

短所:

- JSON schema 管理が必要になる。
- current UI では表示しきれない情報が増える。

#### 案C: weather_record_sources 別テーブル

- `weather_record_sources`
  - `weather_record_id`
  - `source_type`
  - `source_name`
  - `source_fetched_at`
  - `payload`
  - `applied_to_record`

長所:

- 複数回取得の履歴を残せる。
- 調査や分析には最も強い。

短所:

- MVP には重い。
- UI / import-export / cleanup がかなり複雑になる。

#### 案D: 値ごとに source を持つ

- `weather_code_source`
- `temperature_source`
- `precipitation_source`

長所:

- 値ごとの由来を厳密に持てる。

短所:

- カラムが増えすぎる。
- 今の個人開発規模では過剰。

### recommended

- 短期は案Aを維持しつつ、`source_*` の意味を「最後にフォームへ反映した外部取得元」として docs に明記する。
- 中期の本命は案Bとする。
- 案Cは分析や監査の必要性が高まってから再検討する。
- 案Dは当面採用しない。

### precipitation 系の推奨方針

- current では参考表示のみを維持し、`weather_records` の直カラムにはまだ保存しない。
- 将来的に保存するなら、まずは `forecast_snapshot` / `observed_snapshot` に含める案を優先する。
- 直カラム追加は、UI と分析用途が固まってから再検討する。

### raw_weather_code / raw_weather_text の推奨方針

- current では DB 保存しない。
- 将来的に保存するなら、直カラムより snapshot または `source_payload` に寄せる方が自然である。
- Open-Meteo は `raw_weather_code`、JMA fallback は `raw_weather_text` を snapshot に保持する案が有力。

### UI impact

- current UI は「最終表示値の編集と保存」を主にする。
- snapshot を導入する場合は、まず詳細画面で小さく以下を表示する案を検討する。
  - 最終保存値
  - 予報取得値
  - 実績取得値
  - source
  - 取得日時
- forecast と observed の差分を前面に出す UI は後続タスクとする。

### pending / 要再判断

- `forecast_snapshot` / `observed_snapshot` を JSON カラムで持つか。
- precipitation 系をいつ保存対象へ上げるか。
- `raw_weather_code` / `raw_weather_text` を snapshot と `source_payload` のどちらへ寄せるか。
- source 履歴を別テーブル化する必要があるか。
## 2026-05-03 calendar weather status note

### current

- `weather_records` は current では最終保存値を持つ record であり、予報値と実績値の snapshot 分離はまだ行わない。
- `source_type` / `source_name` / `source_fetched_at` は record 全体の厳密な由来ではなく、最後にフォームへ反映した取得元を表す。
- カレンダー表示用の weather status は、まず `none` / `forecast` / `observed` / `manual` に分類する。
- `manual` は source としては `manual` のまま残しつつ、カレンダー上では `observed` 寄せに扱ってよい。
- `is_user_edited` は current では持たない。どの項目をどう編集したら true とみなすかが曖昧であり、正確な判定には snapshot または field-level diff が必要になるため。
- precipitation 系や raw 値は current では weather status 判定に使わず、最終保存値と source だけで状態を表す。

### planned

- カレンダーや一覧で使う read model には、将来 `weather_status` / `weather_code` / `has_weather` のような summary を追加する余地がある。
- 予報値と実績値の snapshot を導入した場合に、`is_user_edited` や field-level diff を再検討する。
- 日付詳細モーダルでは `天気アイコン / 天気名 / source status バッジ / 気温` を中心に表示し、必要なら取得元や取得日時を小さく補足する。

### pending / 要再判断

- `manual` を calendar status 上で `observed` と同色にするか、少し muted な別色にするか。
- source status をカレンダーセルでは色のみで表すか、最小限のバッジや marker を足すか。
- precipitation 系や raw 値を将来 weather status summary に含めるか。
