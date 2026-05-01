# Weather And Clothing Feedback Planning

このメモは、着用履歴・コーディネートに対する天気予報連動機能と服装フィードバック機能の設計整理用です。

対象:

- 天気情報
- 着用履歴フィードバック
- コーディネートの適温条件
- 将来のおすすめ候補に使うための前提データ

今回は実装方針の整理のみを扱い、DB migration / API / UI 実装は含みません。

---

## 目的

単にその日の天気を表示するのではなく、次の情報を後から活用できるようにすることを目的とします。

- その日の天気
- 最高気温 / 最低気温
- 室内外の体感
- 雨・風・湿気・冷暖房などの環境
- 実際に着てどうだったか

将来的な利用先:

- 今日の天気に合うコーディネート候補の提示
- 過去に快適だったコーディネートの再利用
- 寒かった / 暑かった / TPO に合わなかったコーディネートの回避
- 直近で着たコーディネートの回避

MVP ではおすすめ機能そのものは作り込まず、後から推薦に使えるデータ構造と入力導線を優先します。

---

## current

### wear_logs

現状の `wear_logs` はかなり薄い構造です。

- `user_id`
- `status`
- `event_date`
- `display_order`
- `source_outfit_id`
- `memo`

関連:

- `wear_log_items` は item の構成情報のみを保持
- 天気、地域、快適性、評価タグの概念は未実装

### outfits

現状の `outfits` は次のような構造です。

- `name`
- `memo`
- `seasons`
- `tpos`
- `tpo_ids`

適温条件や天気適性はまだ持っていません。

### import/export

現状の backup / restore は `wear_logs` を対象に含みますが、天気や服装フィードバック用のフィールドや関連テーブルはありません。

### 手動天気登録 MVP の実装状況

現行実装では、手動天気登録の MVP として次を持つ。

- `user_weather_locations`
  - ユーザーごとの天気用地域管理
- `weather_records`
  - `日付 × 地域` 単位の天気記録
- 天気登録画面
  - `/wear-logs/weather?date=YYYY-MM-DD`
- 着用履歴カレンダーの日付詳細モーダルからの導線
- 着用履歴詳細での `この日の天気` 表示
- import / export 対応

一方で、次はまだ未実装のままとする。

- 予報 API / 過去天気 API 連携
- 自動取得 / 自動保存
- wear log と weather record の明示的関連テーブル

---

## 大きな分離方針

天気予報連動機能は、次の責務を混ぜずに分けて考えます。

1. 天気情報
   - 日付・地域ごとの天気、最高気温、最低気温
   - 予報 / 実績を分ける
2. 着用履歴
   - その日に実際に着た item / outfit の記録
3. 服装フィードバック
   - 実際に着て快適だったか、困ったことがあったか
4. コーディネート条件
   - そのコーディネートが向いている気温帯や天気条件
5. API 連携
   - 天気予報 API から補助入力として値を取得する

推奨:

- 天気と着用履歴は混ぜすぎない
- 予報と実績は分ける
- API は補助入力であり、自動保存しない

---

## Phase 分け

### Phase 1: 手動天気入力

- 指定した日付に対して天気情報を手入力で登録
- 天気、最高気温、最低気温、地域を保持
- API がなくても成立させる

推奨:

- 着用履歴登録フォームとは分離
- カレンダーから自然に遷移できる専用画面寄り

### Phase 2: 着用履歴フィードバック

- 実際に着てどうだったかを着用履歴に記録
- 固定選択肢を中心にしつつ、任意メモを補助で持つ

### Phase 3: コーディネート側の適温条件

- コーディネートに気温帯・雨向きなどの条件を持たせる

### Phase 4: API 連携

- 地域をもとに予報 API を取得
- 取得結果を入力欄へ反映
- ユーザー確認後に保存

### Phase 5: おすすめ候補表示

- 天気、過去の着用履歴、評価、直近着用状況をもとに候補を出す

---

## 天気情報の持ち方

### 推奨方針

天気情報は着用履歴そのものとは分離します。

理由:

- 同じ日付に複数の着用履歴がありうる
- 天気は外部環境情報であり、服装記録そのものではない
- 後から天気だけ編集 / API 再取得する可能性がある
- 予報値と実績値を分けたい

### 持ちたい情報

- 日付
- 地域
- 天気
- 最高気温
- 最低気温
- 降水情報（planned）
- 予報か実績か
- 取得元・取得時刻（planned）
- メモ（任意）

### 予報 / 実績

推奨:

- 予報と実績は別概念として扱う
- API で取得するのは基本的に予報
- 着用後に振り返る体感は実績 / フィードバック側で扱う

### ユーザーには予報 / 実績を意識させない方針

内部設計では

- 予報
- 過去天気 / 実績相当
- 手入力

を分けて扱います。

ただし、ユーザー向け UI では原則として `予報` / `実績` の違いを強く意識させません。

想定するユーザー操作:

1. 日付を選ぶ
2. 地域を選ぶ
3. `天気を取得` を押す
4. 入力欄に反映された内容を確認する
5. 必要なら手修正する
6. 保存する

推奨:

- UI 文言は `天気を取得` または `この日の天気を取得` に寄せる
- 日付に応じた取得元の切り替えは内部で吸収する
- API 取得結果は自動保存せず、入力欄へ反映してユーザー確認後に保存する
- API 取得に失敗しても手入力で登録できるようにする

---

## 地域管理

### 要件

- ユーザーはデフォルト地域を持つ
- よく使う地域を複数登録できる
- 天気登録時に、それ以外の地域も一時選択できる
- 通勤 / 移動 / 旅行に対応できる
- API 取得を考慮して、地域コードや将来の緯度経度を持てる余地を残す

### 着用履歴との関係

推奨:

- 着用履歴は 1 件のまま
- 関連地域は複数持てるようにする

例:

- `primary_location`
- `secondary_locations`

または

- `locations[]`

要再判断:

- おすすめ判定時に主地域だけを見るか
- 複数地域の気温差をどう扱うか

API 連携を見据えた地域情報の候補:

- 表示名
- 地域コード
- 緯度経度、または将来取得できる余地
- デフォルトフラグ
- 表示順

補足:

- 天気予報 API では一次細分区域等コードが必要
- 過去天気 API では緯度経度が必要になる可能性がある
- そのため、地域設計では両方の可能性を考慮する

---

## 服装フィードバック

### 現在の実装状況

- `wear_logs` 直持ちの MVP を実装済み
- 対象フィールド:
  - `outdoor_temperature_feel`
  - `indoor_temperature_feel`
  - `overall_rating`
  - `feedback_tags`
  - `feedback_memo`
- `feedback_tags` は allow-list で検証する
- `feedback_tags` の重複は保存時 / import 時に一意化する
- `feedback_tags` が空配列になった場合は `null` として扱う
- 初期実装では **コーディネート全体 / その日の服装全体** の評価のみを対象とする
- 個別 item 評価は `wear_logs` や `wear_log_items` には持たせず、将来の `item_feedbacks` に分離する前提を維持する

### 持ちたいカテゴリ

1. 温度感
2. 時間帯体感
3. 天気・環境
4. 着心地・動きやすさ
5. TPO・見た目
6. 総合評価
7. メモ

### 温度感

最初から屋外 / 屋内を分ける前提にします。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`

候補:

- 寒い
- 少し寒い
- ちょうどいい
- 少し暑い
- 暑い

### 時間帯フィードバックタグ

候補:

- 朝寒い
- 昼寒い
- 夜寒い
- 朝暑い
- 昼暑い
- 夜暑い

推奨:

- タグ方式
- 複数選択可
- 問題があった時間帯だけ記録する

### 天気・環境タグ

候補:

- 雨で困った
- 風で困った
- 冷房で寒かった
- 暖房で暑かった

### 着心地・動きやすさタグ

候補:

- 現時点では、これらは **コーディネート全体評価より個別 item 評価に向く** ため、`wear_logs.feedback_tags` の主要候補からは外す
- 将来的には `item_feedbacks` で扱う

### TPO・見た目タグ

候補:

- TPO に合わなかった
- きちんとしすぎた
- カジュアルすぎた
- 色合わせが微妙だった
- 気分に合わなかった

### 総合評価

初期は 3 段階で十分です。

- よかった
- 普通
- 微妙

### メモ

自由記述メモは任意で保持します。分析の主軸は固定選択肢とし、メモは補助とします。

### 全体評価に残す項目

`wear_logs` に直持ちする全体評価として残す候補:

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

`feedback_tags` に残す全体評価向きタグ:

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
- `tpo_mismatch`
- `too_formal`
- `too_casual`
- `color_mismatch`
- `mood_mismatch`

整理方針:

- その日の服装全体が、気温・天気・TPO・見た目に対してどうだったかは `wear_logs` に残す
- 「どの item が原因だったか」を主に知りたいタグは `wear_logs` から外し、将来の `item_feedbacks` へ寄せる
- 失敗回避だけでなく、良かったコーディネートの再利用にも使えるよう、プラス評価タグも持てるようにする

---

## フィードバックのデータ構造比較

### 案A: wear_logs に直接追加

例:

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

長所:

- 実装が軽い
- import/export も単純
- 1 wear log = 1 feedback の前提に合う

短所:

- `wear_logs` が太くなる
- 将来分離したくなったときにやや窮屈

### 案B: wear_log_feedbacks を別テーブル化

長所:

- 着用履歴本体と評価を分離できる
- 将来拡張しやすい

短所:

- 実装、API、テスト、import/export が増える
- MVP では少し重い

### 推奨

MVP の初期判断としては **案A 寄り**です。

ただし、命名は将来分離可能な粒度を意識します。

### 個別 item 評価の保存先再整理

前提:

- 個別 item への評価は、その日限りの一時情報ではなく継続的な評価として蓄積したい
- 例:
  - この靴は歩きにくい
  - このニットはチクチクする
  - このスカートは動きにくい
  - このバッグは重い

推奨:

- 個別 item 評価は `wear_log_items` に持たせない
- 将来的に `item_feedbacks` のような **items 紐づきテーブル** で持つ

想定テーブル案:

#### `item_feedbacks`

- `id`
- `user_id`
- `item_id`
- `wear_log_id` nullable
- `feedback_date`
- `feedback_tags`
- `rating` nullable
- `memo`
- `created_at`
- `updated_at`

ポイント:

- `item_id` は必須
- `wear_log_id` は nullable
  - 着用履歴から発生した評価なら `wear_log_id` を持つ
  - item 詳細から直接追加した評価なら `wear_log_id` は null
- `feedback_date` を持つ
- item 詳細で履歴として見られる
- 将来的に item ごとの統計に使える

この方針により、

- コーディネート全体評価は `wear_logs`
- 個別 item 評価は `item_feedbacks`

と責務を分ける。

### wear_logs 直持ち案の詳細整理

初期実装では、**コーディネート全体の服装フィードバック** を `wear_logs` に直接持つ案を第一候補とします。

理由:

- 1 wear log = 1日の着用振り返り、という粒度に合う
- 既存の着用履歴登録 / 編集 / 詳細導線へ自然に載せやすい
- backup / restore、OpenAPI、一覧 / 詳細の組み込みが比較的軽い
- MVP 段階では、フィードバックだけを独立更新・集計する要求がまだ強くない

許容するトレードオフ:

- `wear_logs` はやや太くなる
- 将来、評価履歴のバージョン管理や複数回振り返りをしたくなると窮屈

現時点の推奨:

- まずは全体評価を `wear_logs` 直持ちで入れる
- 個別 item 評価は MVP では入れず、将来の `item_feedbacks` へ回す
- 物理名・論理名・enum 値は将来の分離後も意味が崩れないようにする

### 追加カラム案

#### `outdoor_temperature_feel`

- 論理名: 屋外の温度感
- 意味:
  - 外を歩いたとき、移動中、屋外滞在時に寒かったか・暑かったか
- 型候補:
  - nullable string enum

#### `indoor_temperature_feel`

- 論理名: 屋内の温度感
- 意味:
  - 室内、職場、店舗、電車内などで寒かったか・暑かったか
- 型候補:
  - nullable string enum

#### `overall_rating`

- 論理名: 総合評価
- 意味:
  - その日の服装全体がよかったか、普通か、微妙だったか
- 型候補:
  - nullable string enum

#### `feedback_tags`

- 論理名: フィードバックタグ
- 意味:
  - その日の服装全体でよかったこと・気になったことを固定タグで複数記録する
- 型候補:
  - nullable JSON array

#### `feedback_memo`

- 論理名: フィードバックメモ
- 意味:
  - 固定タグで表現しきれない振り返りを自由記述で残す
- 型候補:
  - nullable text

### 温度感 enum 案

`outdoor_temperature_feel` / `indoor_temperature_feel` 共通:

- `cold`
  - 表示名: 寒い
- `slightly_cold`
  - 表示名: 少し寒い
- `comfortable`
  - 表示名: ちょうどいい
- `slightly_hot`
  - 表示名: 少し暑い
- `hot`
  - 表示名: 暑い

評価:

- 内部値は意味が明確で、将来の集計にも使いやすい
- `comfortable` は「ネガティブではない基準点」として残す価値がある

### 総合評価 enum 案

- `good`
  - 表示名: よかった
- `neutral`
  - 表示名: 普通
- `bad`
  - 表示名: 微妙

評価:

- MVP として十分軽い
- 点数化せずにおすすめ候補の基礎スコアへ変換しやすい

### feedback_tags 定義案

#### 時間帯

- `morning_cold`
  - 表示名: 朝寒い
  - 意味: 朝の移動・外出時に寒かった
- `day_cold`
  - 表示名: 昼寒い
  - 意味: 日中に寒かった
- `night_cold`
  - 表示名: 夜寒い
  - 意味: 夜の帰宅時などに寒かった
- `morning_hot`
  - 表示名: 朝暑い
  - 意味: 朝から暑かった
- `day_hot`
  - 表示名: 昼暑い
  - 意味: 日中に暑かった
- `night_hot`
  - 表示名: 夜暑い
  - 意味: 夜でも暑かった

#### 天気・環境

- `rain_problem`
  - 表示名: 雨で困った
  - 意味: 雨で靴・裾・アウターなどに問題があった
- `wind_problem`
  - 表示名: 風で困った
  - 意味: 風で寒い、スカートが扱いづらい、髪型や服装が崩れたなど
- `aircon_cold`
  - 表示名: 冷房で寒かった
  - 意味: 室内や電車内の冷房で寒かった
- `heating_hot`
  - 表示名: 暖房で暑かった
  - 意味: 暖房で暑く感じた

#### プラス評価

- `comfortable_all_day`
  - 表示名: 一日快適だった
  - 意味: その日の服装全体で快適に過ごせた
- `temperature_gap_ready`
  - 表示名: 寒暖差に対応できた
  - 意味: 羽織りや重ね着、脱ぎ着などで寒暖差に対応しやすかった
- `worked_for_tpo`
  - 表示名: TPOに合っていた
  - 意味: 仕事・外出・予定などの場面に合っていた
- `color_worked_well`
  - 表示名: 色合わせがよかった
  - 意味: 色の組み合わせがしっくりきた
- `rain_ready`
  - 表示名: 雨でも問題なかった
  - 意味: 雨の日でも靴・裾・アウターなどに困らなかった

#### TPO・見た目

- `worked_for_tpo`
  - 表示名: TPOに合っていた
  - 意味: 仕事・外出・予定などの場面に合っていた
- `too_formal`
  - 表示名: きちんとしすぎた
  - 意味: 場面に対してフォーマルすぎた
- `too_casual`
  - 表示名: カジュアルすぎた
  - 意味: 場面に対してカジュアルすぎた
- `color_worked_well`
  - 表示名: 色合わせがよかった
  - 意味: 色の組み合わせがしっくりきた
- `color_mismatch`
  - 表示名: 色合わせが微妙だった
  - 意味: 色の組み合わせがしっくりこなかった
- `mood_matched`
  - 表示名: 気分に合っていた
  - 意味: その日の気分に服装が合っていた
- `mood_mismatch`
  - 表示名: 気分と合わなかった
  - 意味: その日の気分に服装が合わなかった
- `tpo_mismatch`
  - 表示名: TPOに合わなかった
  - 意味: 方向性が分からない失敗としては使えるが、MVP UI では `too_casual` / `worked_for_tpo` / `too_formal` を優先し、`tpo_mismatch` は要再判断に回す

評価:

- 内部値は snake_case に統一する
- 表示名はネガティブ情報中心を基本にしつつ、再利用に効くプラス評価も最小限持つ
- カテゴリ分けは UI 表示用であり、保存時は単一配列で十分
- `hard_to_walk` など個別 item 原因を主に表すタグは `wear_logs.feedback_tags` から外す

### wear_logs 向きプラス評価の追加候補

以下は候補として残し、MVP で最初から入れるかは要再判断とする。

- `aircon_ready`
  - 表示名: 冷房対策できた
- `temperature_gap_ready`
  - 表示名: 寒暖差に対応できた
- `looked_good`
  - 表示名: 見た目がよかった

### 将来の `item_feedbacks` 向きタグ

以下は `wear_logs` ではなく、将来の `item_feedbacks` 向きとして扱う。

- `hard_to_walk`
  - 表示名: 歩きにくかった
- `hard_to_move`
  - 表示名: 動きにくかった
- `tightness`
  - 表示名: 締め付けが気になった
- `sheerness_problem`
  - 表示名: 透け感が気になった
- `itchy`
  - 表示名: チクチクした
- `heavy`
  - 表示名: 重かった
- `slips_off`
  - 表示名: 脱げやすい / ずれやすい
- `wrinkles_easily`
  - 表示名: シワになりやすい

### 将来の `item_feedbacks` 向きプラス評価

- `easy_to_walk`
  - 表示名: 歩きやすかった
- `easy_to_move`
  - 表示名: 動きやすかった
- `comfortable_fit`
  - 表示名: 着心地がよかった
- `skin_friendly`
  - 表示名: 肌あたりがよかった
- `lightweight`
  - 表示名: 軽かった
- `stays_in_place`
  - 表示名: ずれにくかった
- `wrinkle_resistant`
  - 表示名: シワになりにくかった

理由:

- 特定の item に起因することが多い
- 同じ item を別コーデで使った時にも再利用しやすい
- item 詳細で履歴や傾向として見せやすい

### MVP 実装範囲の最終整理

#### MVP で `wear_logs` に持つ項目

MVP では、以下を `wear_logs` に直接持つ前提で確定する。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

この段階では、あくまで **コーディネート全体 / その日の服装全体** に対する振り返りを記録する。個別 item 評価は MVP 対象外とする。

#### MVP で `feedback_tags` に残すタグ

保存先は単一の `feedback_tags` 配列でよいが、UI では次のグループに分けて見せる。

**よかった点**

- `comfortable_all_day`
- `temperature_gap_ready`
- `rain_ready`

**気になった点: 時間帯**

- `morning_cold`
- `day_cold`
- `night_cold`
- `morning_hot`
- `day_hot`
- `night_hot`

**気になった点: 天気・環境**

- `rain_problem`
- `wind_problem`
- `aircon_cold`
- `heating_hot`

**評価スケール由来で保存するタグ**

- `worked_for_tpo`
- `too_casual`
- `too_formal`
- `color_worked_well`
- `color_mismatch`
- `mood_matched`
- `mood_mismatch`

ここでは `worked_for_tpo` / `color_worked_well` も `feedback_tags` に保存するが、UI 上は単純な「よかった点チップ」ではなく、対になる評価 UI から入力する前提とする。

#### タグではなく専用カラムにした方がよい項目

次はタグではなく、専用カラムで持つ方がよい。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_memo`

理由:

- 選択肢が固定で意味が明確
- 将来の集計や推薦に直接使いやすい
- タグ配列に混ぜるより validation と UI が整理しやすい

#### UI 上で左右方向・対になる選択肢に向く項目

以下は単純な複数選択 chip よりも、方向性が分かる UI の方が自然。

- 屋外の温度感
  - `cold` ← `slightly_cold` ← `comfortable` → `slightly_hot` → `hot`
- 屋内の温度感
  - `cold` ← `slightly_cold` ← `comfortable` → `slightly_hot` → `hot`
- 朝 / 昼 / 夜の体感
  - `寒い` / `暑い`
  - 未選択は「問題なし / 記録なし」として扱う
- TPO
  - `too_casual` / `worked_for_tpo` / `too_formal`
- 色合わせ
  - `color_mismatch` / 未選択 / `color_worked_well`
- 気分との一致
  - `mood_mismatch` / 未選択 / `mood_matched`

#### 「よかった点」 / 「気になった点」の整理

MVP では、UI 上の見せ方と保存上の扱いを分ける。

- 保存先
  - すべて `feedback_tags` の単一配列
- UI 表示
  - `よかった点`
  - `気になった点`
  - `TPO・見た目の評価`
    のように意味単位で分ける

整理方針:

- `comfortable_all_day` / `temperature_gap_ready` / `rain_ready`
  - 「よかった点」へ置く
  - `temperature_gap_ready` は UI 表示を「寒暖差に対応できた」に寄せる
- `worked_for_tpo` / `too_casual` / `too_formal`
  - TPO スケールとして見せる
- `color_worked_well` / `color_mismatch`
  - 色合わせスケールとして見せる
- `mood_matched` / `mood_mismatch`
  - 気分スケールとして見せる
- `tpo_mismatch`
  - 方向性が曖昧なため MVP では採用せず、要再判断に残す

#### `item_feedbacks` に回す項目

次の項目はコーディネート全体ではなく、特定 item への継続的な評価として扱う方が自然なため、MVP の `wear_logs.feedback_tags` には入れない。

- `hard_to_walk`
- `hard_to_move`
- `tightness`
- `sheerness_problem`
- `itchy`
- `heavy`
- `slips_off`
- `wrinkles_easily`
- `easy_to_walk`
- `easy_to_move`
- `comfortable_fit`
- `skin_friendly`
- `lightweight`
- `stays_in_place`
- `wrinkle_resistant`

これらは将来の `item_feedbacks` に回し、item 詳細やおすすめ機能で再利用する。

### validation 方針

#### enum 系

- `outdoor_temperature_feel`
  - nullable
  - 許可値は 5 値のみ
- `indoor_temperature_feel`
  - nullable
  - 許可値は 5 値のみ
- `overall_rating`
  - nullable
  - 許可値は 3 値のみ

#### `feedback_tags`

- nullable array
- 要素は string
- 許可値は定義済みタグのみ
- 重複タグは不可、または保存前に normalize で一意化

推奨:

- API validation では `distinct` と allow-list を併用する
- 返却順は UI カテゴリ順を維持できると見やすいが、保存上は単純配列でよい

### 別テーブル化の将来余地

将来 `wear_log_feedbacks` へ切り出したくなる兆候:

- 同じ wear log に複数回の振り返りを持ちたい
- フィードバックだけを独立更新・監査したい
- タグや温度感を別軸で大量集計したい
- 天気情報とフィードバックを明確に別 API で更新したい

ただし MVP では、そこまでの要件はまだ強くないため後回しでよいです。

### wear_log_items の責務整理

`wear_log_items` は、あくまで「その着用履歴に含まれる item 構成」を表すテーブルとする。

責務:

- `wear_log_id`
- `source_item_id`
- `item_source_type`
- `sort_order`

評価:

- 持たない
- 必要なら将来 `item_feedbacks` を `wear_log_id` 経由で関連づける

### UI 案

セクション名候補:

- `服装の振り返り`
- `着心地・振り返り`

推奨は `服装の振り返り` です。意味が広く、TPO や見た目も含めやすいためです。

MVP の入力対象:

- コーディネート全体評価のみ
- プラス評価タグは、まず再利用に効く最小限のみを候補とする

入力方法:

- 屋外の温度感
  - chip / segmented button
- 屋内の温度感
  - chip / segmented button
- 総合評価
  - chip / segmented button
- フィードバックタグ
  - カテゴリごとの複数選択 chip
- フィードバックメモ
  - 任意 textarea

入力負荷を下げる案:

- 温度感と総合評価は常時表示
- タグ群は `気になったことを記録する` 配下で展開
- タグカテゴリ自体も必要なら折りたたみ可能にする

推奨:

- 初期表示は軽く保つ
- ただし「隠しすぎて存在に気づけない」は避ける
- そのため、温度感 / 総合評価は常時表示、タグ群だけ段階表示がよい
- プラス評価タグも同じ `feedback_tags` に混在させるが、UI では「よかった点」として別グループ表示してもよい

将来案:

- 着用履歴フォームで、着用 item ごとに `気づき` を追加できるようにする
- ただし MVP では個別 item 評価 UI は入れない

### 表示方針

#### 着用履歴詳細

表示候補:

- 屋外の温度感
- 屋内の温度感
- 総合評価
- フィードバックタグ全件
- フィードバックメモ

推奨:

- すべて表示

#### 着用履歴一覧

表示候補:

- 総合評価
- 主要タグのみ

推奨:

- 総合評価は 1 つ見せる
- タグは最大 2〜3 件までの省略表示
- 温度感は一覧では必須でない

#### カレンダー

MVP:

- 表示しない

将来:

- 評価アイコン程度を検討

### import/export 影響

`wear_logs` 直持ちにする場合、次を backup / restore 対象へ追加する必要があります。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

利点:

- `wear_logs` レコード内で完結するため、別テーブルを増やすより roundtrip は単純

注意:

- enum 値の allow-list を import validation 側にも揃える
- `feedback_tags` の unknown 値をどう扱うかは方針統一が必要

将来 `item_feedbacks` を追加した場合:

- 別テーブルとして export/import 対象に加える
- `wear_log_id` nullable 前提の roundtrip を考慮する

### OpenAPI / docs 影響

更新対象見込み:

- wear log create / update request
- wear log detail response
- import/export spec
- wear log spec
- recommendation / weather planning spec

### seed / test data 影響

影響対象:

- wear log feature tests
- backup / restore tests
- 一覧 / 詳細 / 新規 / 編集の frontend tests
- sample / test user seed の wear log データ

推奨:

- 初期 seed には「フィードバックなし」と「フィードバックあり」を少数混ぜる
- タグは代表例を 1〜2 件ずつに抑え、過剰に盛り込まない
- 個別 item 評価は MVP では seed 不要
- プラス評価タグも 1 件程度の代表例に抑える

### 実装タスク分解

1. `wear_logs` 追加カラムの migration 設計
2. model cast / enum allow-list / validation 追加
3. create / update / detail API 追加
4. frontend type 追加
5. wear log 新規 / 編集フォームへ `服装の振り返り` セクション追加
6. wear log 詳細表示追加
7. 一覧への軽量表示追加
8. import/export 対応
9. docs / OpenAPI 更新
10. seed / feature tests / UI tests 更新

将来タスク:

- `item_feedbacks` の migration / API / UI / import-export / 一覧集計

---

## コーディネート側の適温条件

将来的に `outfits` 側へ持ちたい候補:

- `min_temperature`
- `max_temperature`
- `rain_suitable`
- `air_conditioning_suitable`（planned）
- `heating_sensitive`（planned）
- `wind_suitable`（planned）
- `humidity_suitable`（planned）

MVP では次の最小構成が候補です。

- `min_temperature`
- `max_temperature`
- `rain_suitable`

要再判断:

- 手動で設定した適温条件と、着用実績から得た評価をどう併用するか

---

## API 連携

利用候補:

- [天気予報 API（livedoor 天気互換）](https://weather.tsukumijima.net/api/forecast/city/{一次細分区域等コード})
- [地域コード一覧](https://weather.tsukumijima.net/primary_area.xml)

この API は基本的に **予報取得用** として扱います。

過去天気 / 実績相当の候補:

- 気象庁の過去データ
- Open-Meteo Historical Weather API など

想定:

- 登録済み地域をもとに API 取得
- 天気登録画面で `取得` ボタンを押す
- 取得結果を入力欄に反映
- ユーザーが確認して保存

原則:

- API 結果は自動保存しない
- 取得失敗時も手入力できる
- 予報値と実績値を混ぜない
- 過去天気 API で取得した値も、公式に手入力された実績と完全に同一視しない

取得候補:

- `forecasts[].date`
- `telop`
- `temperature.max.celsius`
- `temperature.min.celsius`
- `chanceOfRain`
- `location`
- `publicTime`

### API 取得元の内部切り替え

基本案:

- 今日・未来日
  - 天気予報 API を使う
- 昨日以前
  - 過去天気 API / historical API を使う

MVP での扱い:

- API 連携前は手入力のみ
- API 連携後は `天気を取得` ボタンで内部的に取得元を選ぶ
- 今日については当面 `forecast_api` 扱いでよい
- 夜以降は historical を優先するかなどの高度な切り替えは後回しにする

### weather_records の source メタデータ案

ユーザー向け表示とは別に、内部メタデータとして取得元を持てるようにする想定です。

候補フィールド:

- `source_type`
  - `manual`
  - `forecast_api`
  - `historical_api`
- `source_name`
  - `tsukumijima`
  - `open_meteo`
  - `jma`
  - `manual`
- `source_fetched_at`
  - API 取得日時
- `source_payload`
  - 必要なら元レスポンスの一部または要約
  - MVP では不要でもよい
- `user_edited`
  - API 取得後にユーザーが手修正したかどうか
  - MVP では不要でもよいが将来検討対象

注意:

- `record_kind` と `source_type` をどう分けるかは要再判断
- これらは内部メタデータであり、ユーザー向け UI では直接見せすぎない

### 予報 / 実績 / 手入力の内部整理

#### manual

ユーザーが手入力した天気情報。

#### forecast_api

予報 API から取得した天気情報。未来日・今日の登録補助に使う。

#### historical_api

過去天気 API から取得した天気情報。過去日の登録補助に使う。

共通方針:

- `forecast_api` / `historical_api` で取得した値も、保存前にユーザーが確認する
- 保存後は着用履歴やフィードバックと紐づけて利用できる
- 後から手修正できるようにする

---

## 着用履歴 UI との関係

### 天気登録画面

導線候補:

- 着用履歴カレンダーの日付をクリック
- 天気未登録なら `天気を登録`
- 専用画面へ遷移

推奨:

- モーダルより専用画面寄り

理由:

- 項目が増えても対応しやすい
- API 連携を入れやすい
- 後から編集しやすい

### 着用履歴登録フォームとの分離

推奨:

- 天気登録と着用履歴登録は切り離す

理由:

- 天気だけ先に登録したいことがある
- 着用履歴は後で登録することがある
- 同じ日付の複数着用履歴で天気を共有できる余地がある

ただし、着用履歴登録時にその日の天気情報を参照表示できる余地は残します。

フィードバック側の方針は維持します。

- 天気情報と服装フィードバックは分ける
- 天気は外部環境情報
- フィードバックは実際に着た体感・評価
- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- 時間帯タグ・環境タグ・着心地タグ・TPO タグは固定選択肢中心

---

## 詳細 / 一覧 / カレンダー表示

### 詳細画面

将来的に表示したい情報:

- 天気情報
- 地域
- 屋外 / 屋内の温度感
- 総合評価
- フィードバックタグ
- メモ

### 一覧

軽量表示候補:

- 総合評価
- 主要タグ
- 天気 / 気温の簡易表示

### カレンダー

MVP では詰め込みすぎない方針とし、将来の候補として次を残します。

- 天気アイコン
- 評価アイコン
- 天気登録有無

---

## MVP 範囲

### MVP に含める候補

- 天気の手動登録
- 地域管理の最低限
- 着用履歴フィードバック
- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- フィードバックタグ
- 総合評価
- メモ
- コーディネート適温条件の最低限
- 将来 API 取得に拡張しやすいデータ構造

### MVP から外す候補

- API 連携
- 自動おすすめ
- トップ画面おすすめ
- 自動学習
- 点数計算
- 自由タグ化
- 体感の自動推定
- 予報 / 実績の高度な自動切り替え
- API 取得元の完全な網羅

補足:

- MVP ではまず手入力登録を優先する
- 毎日の実績手入力は負担が大きいため、過去天気 API の検討余地は残す

---

## import/export 影響

現行実装では、`wear_logs` 直持ちの服装フィードバックを backup / restore 対象に含めています。

- `outdoor_temperature_feel`
- `indoor_temperature_feel`
- `overall_rating`
- `feedback_tags`
- `feedback_memo`

validation 方針:

- enum 値は allow-list で検証する
- `feedback_tags` の unknown 値がある場合は import を失敗させる
- `feedback_tags` の重複は import 時にも正規化して一意化する
- `feedback_tags` が空配列になった場合は `null` として扱う

今後、次のいずれかを追加した時点で backup / restore の追加拡張が必要になります。

- 天気情報テーブル
- 地域関連テーブル
- `wear_logs` へのフィードバック項目追加
- `outfits` への適温条件追加

設計上の注意:

- 天気情報
- 服装フィードバック
- 着用履歴本体

を import/export でも混同しない

---

## OpenAPI / docs 影響

今後更新対象になる見込み:

- `docs/specs/wears/wear-logs.md`
- `docs/specs/outfits/create-edit.md`
- `docs/specs/import-export.md`
- `docs/api/openapi.yaml`

必要なら将来:

- 地域管理用 spec
- 天気登録画面 spec

を別途追加します。

---

## 実装順序の推奨

1. 天気・フィードバックの責務分離を docs で固定
2. 手動天気入力のデータ構造を決める
3. 着用履歴フィードバックのデータ構造を決める
4. 地域管理の最小構成を決める
5. 着用履歴詳細での表示対象を決める
6. コーディネート適温条件の最小構成を決める
7. import/export / OpenAPI 影響を整理する
8. その後に UI / API / migration を段階実装する

---

## 要再判断

- 天気情報を日付単位で持つか、日付 x 地域単位で持つか
- 1 wear log に複数地域をどう紐づけるか
- 服装フィードバックを `wear_logs` 直持ちにするか、別テーブル化するか
- `outfits` に持つ適温条件の粒度
- おすすめ候補のスコアリングをどこまで手動条件に寄せるか
- API 予報値をどの時点で履歴に保存するか
- `record_kind` と `source_type` をどう切り分けるか
- 今日の天気取得を常に `forecast_api` でよいか、時間帯によって `historical_api` を優先するか
- 過去天気 API の取得値をどこまで「実績相当」と見なすか
- 複数地域がある日のおすすめ判定で、主地域のみを見るか、地域差を集約するか

---

## まとめ

- 天気と着用履歴は混ぜすぎない
- 予報と実績は分ける
- API は補助入力であり、自動保存しない
- 地域は複数扱える余地を残す
- 着用履歴は地域ごとに分割しない
- 屋外 / 屋内の温度感は最初から含める方向がよい
- 問題があった時間帯や環境をタグで軽く記録できる構造がよい
- おすすめ機能は MVP 外だが、データ構造は将来利用を前提に設計する
