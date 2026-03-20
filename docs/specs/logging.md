# Logging Guidelines

本アプリでは、障害調査・動作確認・将来的な運用を見据えて、ログ出力方針を統一する。
本ドキュメントでは、何をログに残すか、何をログに残さないか、どの粒度で出力するか、将来の拡張方針を定義する。

---

## 目的

- 障害調査しやすいログ出力方針を統一する
- 画面向けメッセージと内部ログの役割を分ける
- 将来の監査ログや request id 連携へ拡張できる前提を整える

---

## 基本方針

### 1. まずは障害調査しやすいことを優先する

現段階では、監査ログや分析用ログよりも、「保存に失敗した」「取得に失敗した」などの調査ができることを優先する。

### 2. 成功ログは主要操作に限定する

すべての成功操作を記録するとログ量が増えすぎるため、主要な更新処理のみ記録する。

### 3. 機密情報はログに出さない

パスワード、Cookie、CSRFトークンなどの機密情報はログ出力しない。

### 4. ユーザー向けメッセージと内部ログは分ける

画面には簡潔なエラーメッセージを表示し、詳細な原因は内部ログで追えるようにする。

---

## ログの種類

### アプリケーションログ

障害調査や例外確認のためのログ。

対象例:

- API 処理失敗
- 例外発生
- 外部通信失敗
- バリデーションエラー（必要に応じて）

### イベントログ

主要なユーザー操作を記録するログ。

対象例:

- category settings updated
- item created
- item updated
- item deleted
- outfit created
- outfit updated
- outfit deleted

### 監査ログ

誰がいつ何を変更したかを厳密に残すログ。

現段階では未実装とし、必要になった時点で別途検討する。

---

## 必ず残すログ

### 1. 例外ログ

例外発生時は必ずログを残す。

含めたい情報:

- timestamp
- route / endpoint
- user_id（取得可能な場合）
- exception class
- error message

### 2. API失敗ログ

主な API で保存・取得に失敗した場合は warning または error を残す。

対象:

- login / logout / me
- categories fetch
- settings save
- item create / update / delete
- outfit create / update / delete

### 3. 画像アップロード失敗ログ（将来）

画像関連は失敗時に切り分けしづらいため、導入時は失敗ログを必ず残す。

---

## 残すと便利なログ

### 成功イベントログ

現段階では以下のみを推奨する。

- settings_categories_updated
- item_created
- item_updated
- outfit_created
- outfit_updated

削除系も可能なら残す。

---

## ログに含める情報

### 共通

- event name
- timestamp
- user_id（取得可能な場合）
- target id（item_id, outfit_id など）
- route / endpoint

### 失敗時

- exception class
- error message
- request id（導入する場合）
- 入力値のうち安全な範囲

---

## ログに含めない情報

以下はログに出力しない。

- password
- cookie
- csrf token
- session id
- 認証ヘッダ
- 画像バイナリ
- 必要以上に長い自由入力テキスト

必要に応じて、メモや URL も全文ではなく ID ベースで追跡できる設計を優先する。

---

## ログレベル方針

### info

正常系の主要イベントログ

例:

- item created
- outfit updated
- settings saved

### warning

想定内だが確認が必要な失敗

例:

- validation failed
- unauthorized access
- requested data not found

### error

処理失敗や例外

例:

- database error
- unexpected exception
- external service failure

---

## 初期実装での対象範囲

### 対象にする

- 例外ログ
- API失敗ログ
- 一部成功イベントログ

### 対象にしない

- 変更前後差分の保存
- 専用ログテーブル
- ログ閲覧画面
- 監査ログ

---

## 実装メモ

### Laravel

- 基本は Laravel の logging を利用する
- controller / service 層で主要イベントを出力する
- exception handler で例外を一元的に拾う

### Frontend

- ユーザー向けには簡潔なエラーメッセージを表示する
- 必要に応じて request id や失敗状態を保持する
- console 出力は開発中のみに留め、運用ログとは分ける

---

## 将来の拡張

必要になった場合は次を検討する。

- audit_logs テーブル
- 変更前後差分の保存
- 着用履歴の変更ログ
- request id の全リクエスト付与
- ログ閲覧用管理画面

---

## 現時点の要約

本アプリでは、まず以下を満たすことをログ設計の目標とする。

- 失敗時に原因を追える
- 主要操作を最小限追える
- 機密情報を出さない
- 将来、監査ログへ拡張できる

---

## 関連資料

- `docs/specs/error-message-guidelines.md`
- `docs/security/web-security.md`
- `docs/project/implementation-notes.md`
