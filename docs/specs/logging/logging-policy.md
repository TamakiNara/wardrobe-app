# Logging Policy

Wardrobe App におけるログ設計方針を定義する。  
この資料では、アプリケーションログとイベントログの役割を分け、MVP で何を残し、何を残さないかを整理する。

---

## 概要

ログは大きく次の 2 種類に分ける。

- **アプリケーションログ**
  - 障害調査・不具合解析用
- **イベントログ**
  - 状態変更や重要操作の追跡用

MVP では監査ログを過剰に作らず、  
**後で原因確認が必要になりやすい変更だけをイベントとして残す** 方針を採用する。

---

## 基本方針

- 障害調査用ログと業務イベント用ログは分けて考える
- MVP では、すべての操作を記録しない
- イベントログは **状態変化** と **副作用のある操作** を優先する
- 軽微な編集や閲覧操作は原則としてイベントログに残さない
- イベントログの記録は、モデルイベントではなく **サービス層 / ユースケース層** で明示的に行う

---

## ログの種類

## アプリケーションログ

### 用途

- 例外調査
- バリデーション失敗確認
- 認可エラー確認
- API 処理失敗の原因把握

### 特徴

- 開発者向け
- 詳細な技術情報を含む
- UI 向けメッセージとは分離する

---

## イベントログ

### 用途

- 重要な状態変更の追跡
- 副作用発生の確認
- 将来の運用確認

### 特徴

- ドメイン寄りの記録
- 「何が起きたか」を簡潔に残す
- スタックトレースや技術詳細は含めない

---

## アプリケーションログ方針

### 残す対象

#### 1. 例外

- 想定外例外
- 500 系エラー
- トランザクション失敗

#### 2. 重要操作のバリデーション失敗

- item status 変更失敗
- invalid outfit restore 失敗
- 将来の wear log 保存失敗

#### 3. 認可エラー

- 他人データ操作
- 権限外アクセス
- 不正な状態変更リクエスト

---

### アプリケーションログに含めたい情報

#### 共通

- `user_id`
- `route`
- `method`
- `resource_type`
- `resource_id`
- `error_type`
- `message`

#### あるとよい

- `request_id`
- `exception_class`
- `validation_errors`
- `related_ids`

---

### 例

```text
item_status_change_failed
user_id=1
item_id=101
target_status=disposed
reason=validation_error
```

---

## イベントログ方針

### 残す対象

#### item 関連

- `active -> disposed`
- `disposed -> active`

#### outfit 関連

- `active -> invalid`
- `invalid -> active`
- duplicate

#### wear logs 関連（将来）

- 作成
- 更新
- 削除
- `planned -> worn`
- `worn -> planned`

---

## item 関連イベント

### 残す

- item を `disposed` にした
- item を `active` に戻した

### 残さない

- name 変更
- memo 変更
- season / tpo の軽微編集
- spec の軽微編集

### 理由

item の内容編集は頻繁に発生しやすく、  
すべて記録するとノイズが多い。  
一方で `disposed` は outfit / wear logs に影響するため、残す価値が高い。

---

## outfit 関連イベント

### 残す

- outfit が `invalid` になった
- outfit を `active` に復帰した
- outfit を duplicate した

### 補足

`invalid` は自動遷移のため、  
**なぜ invalid になったか** を追えるようにした方がよい。

### 理由の例

- `disposed_item_detected`

### 補助情報の例

- `trigger_item_id`

---

## wear logs 関連イベント（将来）

### 残す候補

- wear log 作成
- wear log 更新
- wear log 削除
- `planned -> worn`
- `worn -> planned`

### 方針

MVP では、詳細な差分監査までは行わない。  
まずは **ヘッダレベルのイベント** を残せれば十分とする。

---

## イベントログに残す最小項目

イベントログは、まず次の形で十分とする。

- `event_type`
- `user_id`
- `resource_type`
- `resource_id`
- `payload_json`
- `created_at`

### resource_type の最小セット

MVP では、`resource_type` は次を想定する。

- `item`
- `outfit`
- `wear_log`
- `purchase_candidate`

`setting` などの追加は将来必要になった時点で検討する。  
現時点では、重要な状態変化や副作用の中心となるリソースに絞る。

---

## event_type の最小セット

MVP では、まず次をイベントログの対象とする。

- `item_disposed`
- `item_reactivated`
- `outfit_invalidated`
- `outfit_restored`
- `outfit_duplicated`
- `purchase_candidate_purchased`

### 将来追加候補

wear logs 実装後は、必要に応じて次を追加検討する。

- `wear_log_created`
- `wear_log_updated`
- `wear_log_deleted`

### 方針

- MVP では、状態変化と副作用の確認に必要な最小セットに絞る
- 軽微な編集履歴は対象にしない
- event type は用途が曖昧なものを増やさず、意味が明確な単位で定義する

---

## payload_json の例

### item_disposed

```json
{
  "from_status": "active",
  "to_status": "disposed"
}
```

### outfit_invalidated

```json
{
  "from_status": "active",
  "to_status": "invalid",
  "reason": "disposed_item_detected",
  "trigger_item_id": 101
}
```

### outfit_duplicated

```json
{
  "source_outfit_id": 10,
  "new_outfit_id": 25
}
```

---

## 今は残さないもの

MVP では、次はイベントログに残さない。

- 一覧閲覧
- 検索条件変更
- ページ遷移
- sort 変更
- detail 表示
- 軽微な name / memo 修正履歴
- UI 上の並び替え途中操作

### 理由

ノイズが多く、運用価値に対してコストが高いため。

---

## 実装方針

### 方針

イベントログは、**サービス層 / ユースケース層で明示的に記録** する。

### 想定例

- `ItemStatusService`
- `OutfitStatusService`
- 将来 `WearLogService`

### 理由

- 副作用の起点が見やすい
- テストしやすい
- モデルイベントに副作用を散らしにくい

---

## event log の目的整理

### 目的の候補

- **監査目的**
  - 誰がいつ何を変えたかを厳密に追う用途
- **ユーザー向け履歴**
  - UI 上で「最近何をしたか」を見せる用途
- **開発 / 保守向け内部ログ**
  - 障害調査や不具合解析の補助
- **ドメインイベント記録**
  - 重要な状態変化や副作用を後から追えるようにする用途

### このアプリでの推奨位置づけ

現時点で優先度が高いのは、**監査ログの厳密保存** や **ユーザー向け履歴 UI** ではなく、
**ドメインイベント記録としての最小 event log** である。

理由:

- item `disposed` が outfit `invalid` を引き起こすなど、副作用を伴う状態変化がある
- restore / duplicate / purchased 化のように、「何が起きたか」を後から確認したい操作がある
- 一方で、全編集履歴や UI 向けタイムラインを今入れるには DB / API / 画面コストが重い

---

## 対象候補の整理

### 価値が高い候補

#### item

- create / update
  - MVP では不要
- `dispose`
- `reactivate`

#### outfit

- create / update
  - MVP では不要
- `invalid`
- `restore`
- `duplicate`

#### wear logs

- create / update / delete
  - MVP では将来拡張で十分
- `planned -> worn`
- `worn -> planned`

#### 購入検討

- create / update
  - MVP では不要
- item 作成成功に伴う `purchased` 化

#### settings

- category visibility 更新
- brand 候補追加 / 編集 / 有効無効切替
  - MVP では不要

### 整理の考え方

- **今ログを残す価値が高いもの**
  - 状態変化そのものが他機能へ影響する操作
  - 自動副作用の起点になる操作
- **MVP では不要なもの**
  - 頻度が高くノイズになりやすい軽微更新
  - 画面で再現しやすい通常 CRUD
- **将来拡張で十分なもの**
  - ユーザー向け履歴 UI を前提にした操作履歴
  - 差分監査や全文変更履歴

---

## 比較

### 1. event log なし

#### メリット

- 現在の MVP をそのまま維持できる
- DB / API / UI の追加コストがない

#### デメリット

- `disposed -> invalid` や `purchased` 化のような副作用を後から追いにくい
- 重要な状態変化の因果関係が docs / 推測頼りになる

### 2. 内部向け最小 event log

#### メリット

- 重要な状態変化と副作用だけを記録できる
- UI を追加しなくても、保守判断の材料になる
- サービス層での明示記録方針と相性がよい

#### デメリット

- event_logs 相当の table 設計は必要
- payload 設計の最小ルールを先に決める必要がある

### 3. ユーザーに見せる履歴も含む event log

#### メリット

- 将来の活動履歴 UI に直結しやすい
- 変更の見える化をしやすい

#### デメリット

- 監査用途と UI 用途が混ざりやすい
- DB / API / UI / 文言設計コストが一気に増える
- 現在の MVP には過剰

---

## 推奨案

現時点の推奨は **「今すぐ実装しない。ただし、将来入れるなら内部向け最小 event log を第一候補にする」** である。

### 推奨理由

- 現在の MVP は event log なしで成立している
- まず必要なのは履歴 UI ではなく、重要な状態変化の因果関係を後から確認できること
- snapshot や event log を同時に広げると、wear logs / purchase_candidates / outfits の責務整理が重くなる

### 第一候補の対象

- `item_disposed`
- `item_reactivated`
- `outfit_invalidated`
- `outfit_restored`
- `outfit_duplicated`
- `purchase_candidate_purchased`

### 現時点で保留にする対象

- wear log の create / update / delete 全件記録
- settings 更新全件記録
- ユーザー向け event timeline

---

## 影響範囲

### DB

- `event_logs` または同等 table の追加
- 最小項目は既存方針どおり `event_type / user_id / resource_type / resource_id / payload_json / created_at`

### API

- MVP では event log API は不要
- 後で管理 UI を作る場合にだけ一覧 API を検討する

### UI

- 現時点では不要
- 将来、管理画面または内部確認画面が必要になったら検討する

### 既存データ移行

- 原則 backfill なしでよい
- 導入時点以後のイベントだけを残す想定で十分

---

## 今やるなら先に決めるべきこと

1. event log を内部向けに限定するか
2. MVP の対象 event_type をどこまで絞るか
3. `purchase_candidate_purchased` を対象に含めるか
4. wear logs の状態変更を event log 対象に入れるか
5. event log の参照 UI を当面作らない前提で進めるか

---

## 今決めるべきこと

- アプリケーションログとイベントログは分ける
- イベントログは状態変化中心にする
- `disposed / invalid / restore / duplicate / purchased` は残す
- 軽微編集や閲覧は残さない
- ログ記録はサービス層で行う

---

## 保留でよいこと

- `event_logs` テーブルを今すぐ作るか
- `payload_json` の厳密 schema
- `request_id` の運用
- 管理画面でログ閲覧するか
- wear logs 実装後の差分粒度
- 外部通知や監視サービス連携

---

## 関連仕様

- item / outfit の状態管理: `docs/data/database.md`
- outfit の仕様: `docs/specs/outfits/create-edit.md`
- wear logs の仕様: `docs/specs/wears/wear-logs.md`
- API 仕様: `docs/api/openapi.yaml`

---

## 現時点のまとめ

MVP のログ設計は、以下の思想で進める。

- **障害解析と業務イベントを分ける**
- **重要な状態変化だけをイベントとして残す**
- **軽微な編集や閲覧は残さない**
- **副作用のある操作を優先して追跡する**
- **実装はサービス層で明示的に行う**
