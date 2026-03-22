# wear logs / invalid outfit / status副作用 中間まとめ

## 1. wear logs 基本仕様

### 1.1 目的
wear logs は、クローゼット系Webアプリにおける **「いつ・何を着たか / 着る予定か」** を記録する機能とする。  
MVP では、厳密な監査ログではなく、**予定管理・振り返り・再利用に実用的であること** を優先する。

### 1.2 基本方針
- `planned` / `worn` は **同一レコード** で管理する
- UI は **トグル切替**
- `cancelled` / `skipped` は持たない
- 不要になった予定・誤登録は **削除** で対応する
- wear log は **1レコード = 1着用イベント**
- 状態変更履歴は保持せず、**常に最新保存内容を正** とする

### 1.3 状態切替の挙動
- `worn` から `planned` への差し戻しを許可する
- 再度 `worn` に変更することも許可する
- `planned -> worn -> planned -> worn` のような再変更があっても、履歴は残さず **最終保存状態を正** とする

---

## 2. wear logs の構成

### 2.1 記録単位
- 1 wear log = 1着用イベント
- 同日複数件を許容する
- 時刻は持たず、**`event_date + display_order`** で順序を表現する

### 2.2 並び順
一覧初期並び順は以下とする。
- `event_date desc`
- `display_order asc`

### 2.3 入力ルール
- `source_outfit_id` は **0件または1件**
- `items` は **複数指定可**
- `source_outfit_id` と `items` の **両方未指定は不可**

### 2.4 許可する入力パターン
#### パターンA
- outfit あり
- items なし

→ outfit をベースに記録する

#### パターンB
- outfit なし
- items あり

→ item 単独構成として記録する

#### パターンC
- outfit あり
- items あり

→ outfit をベースにしつつ、**最終的な item 群は items 正本** とする

---

## 3. `source_outfit_id` の意味

`source_outfit_id` は **完全一致したコーデ** ではなく、  
**この wear log を作成する際にベースにした outfit** を表す。

そのため、以下の場合でも `source_outfit_id` は残す。
- outfit ベースで1点追加した場合
- outfit ベースで一部削除した場合
- outfit ベースで差し替えた場合

### 3.1 役割整理
#### outfit の役割
- 元コーデを示す
- 初期 item 群の候補を供給する
- 集計や再利用の基点になる

#### wear_log_items の役割
- 実際に着た item 群を表す
- 履歴表示の正本
- 集計の正本

---

## 4. outfit 選択時の item 展開仕様

### 4.1 初期展開
- outfit 選択時、`outfit_items.sort_order` 順で初期展開する

### 4.2 手動追加
- 手動追加 item は末尾に追加する
- `sort_order` は既存最大値 + 1

### 4.3 手動削除
- 対象 `wear_log_item` を削除する
- 残りの `sort_order` を詰め直す

### 4.4 保存タイミング
MVP では、編集途中の操作ごとに即時保存せず、**保存時に全体更新** する方針とする。

---

## 5. `item_source_type`

### 5.1 採用方針
`wear_log_items` に `item_source_type` を持つ。

### 5.2 値
- `outfit`
- `manual`

### 5.3 意味
`item_source_type` は、**その item が最終構成にどの経路で入ったかの主たる由来** を表す。  
編集操作の全履歴を表すものではない。

### 5.4 重複禁止との関係
- 同一 wear log 内で、同一 `source_item_id` の重複は不可
- 既に存在する item を再度手動追加しようとしても追加しない
- この時、既存の `item_source_type` は変更しない
- 一度削除した item を手動で再追加した場合は `manual` として扱う

---

## 6. snapshot 方針

### 6.1 現時点の合意
- MVP では **snapshot なし** で始める
- `worn` になった時点でも snapshot を固定保存しない
- まずは `source_item_id` / `source_outfit_id` と構成情報を正本にする

### 6.2 理由
- item 情報は outfit ほど頻繁に変わらない想定
- 更新後の item 情報を正とみなしてよい場面が多い
- `source_item_id` が分かれば多くの集計は可能
- カテゴリ変更はレアケースであり、MVP で強く守る優先度が低い

### 6.3 将来拡張余地
必要になった場合、以下の追加余地は残す。
- `item_name_snapshot`
- `category_id_snapshot`
- `category_name_snapshot`
- `outfit_name_snapshot`

---

## 7. 日付・順序

### 7.1 採択内容
- `event_date` 必須
- `display_order` 必須
- 時刻カラムは持たない

### 7.2 display_order の UI 方針
- 追加時は自動採番
- 新規でも編集時でも簡易変更可
- UI は **上下移動**
- 数字直接入力はしない

### 7.3 具体挙動
- 新規作成時: 同じ `event_date` の既存最大 `display_order + 1`
- 編集時: 同日内で上下移動し、保存時に同日内の順序を確定する
- 日付変更時: 変更先日付の末尾へ再採番する想定

---

## 8. wear logs API 方針

### 8.1 API 一覧
- `GET /api/wear-logs`
- `GET /api/wear-logs/{id}`
- `POST /api/wear-logs`
- `PUT /api/wear-logs/{id}`
- `DELETE /api/wear-logs/{id}`

### 8.2 更新 API 方針
- `PATCH /status` のような専用 API は作らない
- `planned / worn` 切替も `PUT` に含める

### 8.3 payload 方針
`POST` / `PUT` はほぼ同一 payload とする。  
**フロントで最終的な `items[]` を組み立てて送る**。

例:

```json
{
  "status": "planned",
  "event_date": "2026-03-21",
  "display_order": 2,
  "source_outfit_id": 10,
  "memo": "雨だったので1枚追加",
  "items": [
    {
      "source_item_id": 101,
      "sort_order": 1,
      "item_source_type": "outfit"
    },
    {
      "source_item_id": 102,
      "sort_order": 2,
      "item_source_type": "outfit"
    },
    {
      "source_item_id": 205,
      "sort_order": 3,
      "item_source_type": "manual"
    }
  ]
}
```

### 8.4 一覧クエリ
- `page`
- `keyword`
- `sort`
- `status`
- `date_from`
- `date_to`

### 8.5 sort 値
- `date_desc`（初期値）
- `date_asc`

### 8.6 保存・更新処理
MVP では、**明細込みの全体更新** を採用する。

更新処理の考え方:
1. wear log 本体更新
2. 既存 `wear_log_items` 削除
3. 新しい `items[]` を再作成
4. トランザクションで一括保存

---

## 9. wear logs バリデーション方針

### 9.1 ヘッダ
- `status`: 必須、`planned` / `worn`
- `event_date`: 必須、日付形式
- `display_order`: 必須、1以上の整数
- `source_outfit_id`: nullable、自分の `active` outfit のみ可
- `memo`: nullable、文字数上限あり

### 9.2 items
- `items`: 必須、配列、1件以上
- `source_item_id`: 必須、自分の `active` item のみ可
- `sort_order`: 必須、1以上の整数、連番想定
- `item_source_type`: 必須、`outfit` / `manual`

### 9.3 重複制御
- 同一 wear log 内で同一 `source_item_id` 重複不可

### 9.4 display_order
- 1以上の整数
- 同一ユーザー・同一 `event_date` 内で重複不可を推奨

---

## 10. invalid outfit の考え方

### 10.1 位置づけ
invalid outfit は、**通常利用導線から除外するが、再利用・復旧・参照はできる状態** として扱う。

### 10.2 invalid になる条件
MVP では、まず以下を主因とする。
- 構成 item のうち1つ以上が `disposed`

### 10.3 invalid の時の扱い
- 通常 outfit 一覧には出さない
- outfit 選択候補に出さない
- wear log / planned 登録の候補に出さない
- invalid outfit 一覧では表示する

---

## 11. invalid outfit 一覧 / 詳細 / 複製

### 11.1 invalid 一覧で持ちたい機能
- 一覧表示
- 検索
- 詳細確認
- 手動復帰（可能な場合のみ）
- **複製して新規 outfit 化**

### 11.2 手動復帰条件
#### 復帰可能
- 構成 item がすべて `active`

#### 復帰不可
- 1件でも `disposed` が残っている

### 11.3 複製の位置づけ
複製は、**invalid outfit を元にした新規 outfit 作成支援機能** とする。  
復旧ではなく、**再作成支援** として扱う。

### 11.4 複製導線
- invalid outfit 一覧 or 詳細から「複製して新規作成」
- 新規 outfit 作成画面へ遷移
- 初期値を引き継いだ状態で開く

### 11.5 複製時に引き継ぐもの
- name
- memo
- season
- tpos
- item 構成順
- その他 outfit 基本情報

### 11.6 引き継がないもの
- id
- status
- created_at
- updated_at
- invalid 理由に紐づく内部状態

### 11.7 name 初期値
- `元名 + （コピー）`

例:
- 通勤セット（コピー）

### 11.8 disposed item の見せ方
- 完全に見えなくはしない
- 元コーデには含まれていたが現在は使えないと分かるようにする
- グレーアウトや警告表示を行う
- 通常選択状態にはしない

### 11.9 警告文たたき台
- 手放したアイテムが含まれているため、そのままでは保存できません
- 使用できないアイテムは除外されています。必要に応じて別のアイテムを追加してください

### 11.10 保存可否
#### 保存可
- 選択 item がすべて `active`
- outfit 作成の最低条件を満たす

#### 保存不可
- `disposed` item が選択状態に残っている
- item が0件
- 名前や基本情報に不備がある

### 11.11 API 方針
複製専用 API は作らず、  
**詳細取得 → フロントで初期値生成 → 通常の outfit 作成 API を利用** とする。

---

## 12. item / outfit の status

### 12.1 items.status
- `active`
- `disposed`

#### 意味
- `active`: 現在所持・通常利用可能
- `disposed`: 手放した / 現在所持していない

### 12.2 outfits.status
- `active`
- `invalid`

#### 意味
- `active`: 通常利用可能
- `invalid`: 構成 item の状態により通常利用できない

### 12.3 命名方針
- 両方とも `status` 列で管理する思想は揃える
- ただし意味が異なるため、状態値は無理に統一しない
  - item: `disposed`
  - outfit: `invalid`

---

## 13. status 変更時副作用

### 13.1 item `active -> disposed`
#### 実行前チェック
- この item を含む `active` outfit があるか
- この item を参照する wear logs があるか

#### 警告文たたき台
- このアイテムを含むコーデがあります
- 手放すと、それらのコーデは利用できなくなります
- 着用履歴には過去の記録として残ります

#### 副作用
1. item.status = `disposed`
2. この item を含む `active` outfit を検索
3. 該当 outfit を `invalid` に更新
4. item は通常一覧・選択候補から除外
5. wear logs は変更しない

### 13.2 item `disposed -> active`
#### 副作用
1. item.status = `active`
2. 通常 item 一覧に復帰
3. outfit / wear log の選択候補に復帰
4. 関連 outfit は **自動復帰しない**

### 13.3 outfit `active -> invalid`
#### 主因
- 構成 item に `disposed` が含まれる

#### 副作用
1. outfit.status = `invalid`
2. 通常 outfit 一覧から除外
3. outfit 選択候補から除外
4. invalid outfit 一覧では表示
5. 既存 wear logs への影響はなし

### 13.4 outfit `invalid -> active`
#### 条件
- 構成 item がすべて `active`

#### 副作用
1. outfit.status = `active`
2. 通常一覧へ復帰
3. 選択候補へ復帰
4. invalid 一覧から除外

---

## 14. wear logs と current status 表示

### 14.1 基本方針
wear logs は **履歴が正本**。  
`disposed` / `invalid` は **補助情報として表示** する。

### 14.2 一覧での扱い
- 原則として current status 詳細は出さない
- 必要なら小さな警告バッジのみ

例:
- `一部アイテム利用不可`
- `元コーデ利用不可`

### 14.3 詳細での扱い
詳細では current status を補助表示してよい。

例:
- 白シャツ `手放したアイテム`
- 通勤セット `現在は利用不可`

### 14.4 API 返却候補
#### 一覧
- `has_disposed_items`: bool
- `source_outfit_status`: `active | invalid | null`

#### 詳細
- item ごとの `source_item_status`: `active | disposed`
- `source_outfit_status`: `active | invalid | null`

### 14.5 意味づけ
- 主表示: 履歴内容
- 補助表示: 現在状態

---

## 15. 実装責務

### 15.1 推奨
状態変更や副作用は、**サービス層 / ユースケース層で一元管理** する。

### 15.2 例
#### ItemStatusService
- item を disposed にする
- item を active に戻す
- 関連 outfit を invalid 化する

#### OutfitStatusService
- invalid 復帰可能判定
- invalid -> active 復帰

### 15.3 モデルイベントに寄せない理由
- どこで何が起きるか見えにくい
- 更新経路が増えると挙動が追いにくい
- テストが書きづらい

---

## 16. テスト観点

### 16.1 wear logs
- outfit + items で登録できる
- items のみで登録できる
- `planned <-> worn` 切替できる
- `worn -> planned -> worn` で最終内容が正
- item 重複はエラー
- invalid outfit / disposed item は指定不可
- `display_order` と `sort_order` が正しく扱われる

### 16.2 item status
- item を disposed にできる
- 関連 active outfit が invalid になる
- wear logs は消えない
- 通常一覧から item が消える
- wear log 候補から item が消える
- item を active に戻しても outfit 自動復帰しない

### 16.3 outfit status
- invalid outfit は通常一覧に出ない
- invalid 一覧には出る
- wear log 候補に出ない
- 構成 item がすべて active なら復帰できる
- disposed item が残っていれば復帰不可

### 16.4 invalid outfit 複製
- invalid outfit から複製導線へ遷移できる
- 初期値が引き継がれる
- name が「（コピー）」付きで入る
- disposed item が通常選択状態で入らない
- 保存すると新しい active outfit が作成される
- 元 invalid outfit はそのまま残る

---

## 17. 未確定課題

### wear logs
- `item_source_type` を DB カラムで正式採用するか最終確定
- `display_order` を UI 上どこまで編集可能にするか細部確定
- keyword 検索対象にタグをいつ含めるか

### snapshot
- 本当に snapshot なしで十分か
- 将来追加する場合、最初に何を足すか

### invalid outfit
- invalid 一覧の絞り込み項目
- invalid 理由の表示粒度
- 複製時にどこまで初期値を引き継ぐか細部確定

### current status 表示
- 一覧で警告バッジを出すかどうか
- 詳細で current status をどの粒度で返すか

---

