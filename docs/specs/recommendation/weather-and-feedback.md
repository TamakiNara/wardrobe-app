# Weather And Clothing Feedback Planning

着用履歴フィードバックと天気データの関係を整理する正本です。  
Open-Meteo の取得仕様は [weather fetching](../wears/weather-fetching.md)、`weather_records` の保存方針は [weather records](../wears/weather-records.md)、地域設定は [weather locations](../settings/weather-locations.md) を参照してください。

関連 docs:

- [weather current status](../wears/weather-current-status.md)
- [weather records](../wears/weather-records.md)
- [weather fetching](../wears/weather-fetching.md)
- [weather locations](../settings/weather-locations.md)
- [import-export](../import-export.md)

---

## 目的

この docs は、天気そのものの記録ではなく、**その日の服装が実際にどう感じられたか** を整理するための正本である。

主に扱う内容:

- 着用履歴フィードバックと天気データの関係
- 屋外 / 屋内の温度感
- 朝 / 昼 / 夜の暑い・寒い
- TPO / 色合わせ / 気分との一致
- よかったこと / 気になったこと
- `feedback_tags`
- `overall_rating`
- `feedback_memo`
- `was_exposed_to_rain`
- 天気データを推薦・振り返りにどう使うか

扱いすぎないもの:

- Open-Meteo forecast / historical の取得仕様詳細
- `weather_records` の保存構造
- `user_weather_locations` / Geocoding / legacy code fields
- import / export 詳細

---

## current

### 着用履歴の振り返り

current では、着用履歴側に以下の振り返り項目がある前提で整理する。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

これらは、天気そのものではなく **ユーザーが実際に着てどう感じたか** を記録するものとする。

### `wear_logs` 側の意味

着用履歴フィードバックは、コーディネート全体 / その日の服装全体の振り返りとして扱う。

例:

- 屋外では少し寒かった
- 屋内では暑かった
- TPO に合っていた
- 色合わせがよかった
- 気分に合わなかった

current の前提:

- 外部条件は `weather_records` 側
- 体験・評価は `wear_logs` 側

---

## 天気データと体感の違い

### `weather_records`

`weather_records` は、その日の外部条件を表す。

例:

- 天気
- 最高気温
- 最低気温
- 取得元
- 地域

### wear log feedback

着用履歴フィードバックは、自分がどう感じたかを表す。

例:

- 屋外で暑かった / 寒かった
- 屋内で暑かった / 寒かった
- TPO に合っていたか
- 色合わせがよかったか
- 気分に合っていたか
- 雨に当たったか

### 重要な整理

- 気温が低いから必ず寒いとは限らない
- 予報で雨でも、自分が雨に当たったとは限らない
- 天気データと体験データは別概念

---

## `has_rain_possibility` と `was_exposed_to_rain`

### `has_rain_possibility`

- `weather_code` から導出される
- 雨対策が必要かもしれない天気かどうか
- `weather_records` / `weather_code` 側の概念

例:

- `rain`
- `cloudy_with_occasional_rain`
- `thunder`

### `was_exposed_to_rain`

- 実際に雨に当たったか
- 着用履歴フィードバック側の planned 項目
- `weather_records` から自動で決めない
- ユーザーの体験として記録する

候補値:

- `true`
  - 実際に雨に当たった
- `false`
  - 雨可能性はあったが、実際には当たらなかった
- `null`
  - 未記録 / 不明

用途:

- 雨に弱い靴・バッグの分析
- 傘が必要だったかの振り返り
- 雨予報だったが問題なかった日の分析

### current / planned

current:

- `has_rain_possibility` は weather 側で使う
- weather 側の `weather_code` は current では daily 集計由来の暫定値であり、活動時間帯の代表天気とは限らない
- `was_exposed_to_rain` は未実装

planned:

- `was_exposed_to_rain` を wear log feedback 側で扱う
- `weather_records` の source や降水量だけから自動判定しない
- `has_rain_possibility` は、将来は活動時間帯ベースの代表 `weather_code` と hourly 降水情報の両方を見て再設計する余地を残す

---

## `feedback_tags`

`feedback_tags` は、天気取得 API や `weather_code` の詳細ではなく、**体験・評価** を表すタグとして扱う。

### よかったこと

候補:

- `comfortable_all_day`
- `temperature_gap_ready`
- `rain_ready`
- `worked_for_tpo`
- `color_worked_well`
- `mood_matched`

### 気になったこと

候補:

- `morning_cold`
- `day_cold`
- `night_cold`
- `morning_hot`
- `day_hot`
- `night_hot`
- `rain_problem`
- `wind_problem`
- `aircon_cold`
- `heating_hot`
- `too_casual`
- `too_formal`
- `color_mismatch`
- `mood_mismatch`

### 整理方針

- タグは「その日の服装体験」を表す
- API 取得や provider 詳細はここに書きすぎない
- 天気そのものではなく、天気の中でどう感じたか / 何が起きたかを表す

### `overall_rating`

初期は 3 段階程度で十分とする。

例:

- よかった
- 普通
- 微妙

### `feedback_memo`

- 自由記述の補助メモ
- 分析の主軸は固定選択肢とし、メモは補助に留める

---

## `item_feedbacks` との境界

アイテム固有の評価は、`wear_logs.feedback_tags` ではなく将来の `item_feedbacks` 側に分ける方針を維持する。

例:

- 歩きにくい
- 動きにくい
- きつい
- チクチクする
- 重い
- 脱げやすい
- シワになりやすい

### current

- MVP では item feedback は未実装
- 着用履歴全体の振り返りだけ扱う

### planned

- `item_feedbacks`
- item 詳細で傾向表示
- おすすめ時に問題が多い item を避ける

---

## 推薦・分析への使い方

### コーディネート推薦

将来的には、以下を組み合わせて使う想定。

- 天気 / 最高気温 / 最低気温
- 過去の温度感フィードバック
- TPO
- 雨可能性
- `was_exposed_to_rain`
- 連日同じコーディネートを避ける情報

### 改善分析

例:

- この気温帯では暑く感じやすい
- 屋内で寒くなりやすい
- 雨可能性の日に特定の靴で問題が出る
- TPO 不一致が多い
- 色合わせがよかった組み合わせ

### current の位置づけ

current では recommendation 自体は未実装で、まずは後から使えるデータ構造と振り返り入力を優先する。

---

## カレンダー weather status との関係

詳細設計は weather 側 docs に寄せつつ、フィードバック文脈では次だけを整理する。

- カレンダー上では天気状態と振り返り有無を分けて表示する予定
- 振り返り有無は既存の `CircleCheck` でよい
- 天気が実績まで入っているかと、振り返りがあるかは別概念
- 月単位の未完了サマリは current では入れない
  - 外出しなかった日まで入力必須に見えないようにするため

---

## 他 docs との役割分担

- 外部天気データの保存方針:
  - [weather records](../wears/weather-records.md)
- 天気取得 API:
  - [weather fetching](../wears/weather-fetching.md)
- 地域設定:
  - [weather locations](../settings/weather-locations.md)
- 天気機能全体の現在地:
  - [weather current status](../wears/weather-current-status.md)
- backup / restore:
  - [import-export](../import-export.md)

---

## planned

- `was_exposed_to_rain`
- `item_feedbacks`
- weather と feedback の組み合わせによる recommendation / analysis
- 温度感フィードバックを使ったおすすめ改善

---

## pending / 要再判断

- `was_exposed_to_rain` の入力 UI を wear log 側のどこへ置くか
- `feedback_tags` の粒度をどこまで増やすか
- `overall_rating` を 3 段階のままにするか
- item feedback をいつ分離するか
