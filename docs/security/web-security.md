# Web Security Notes

## 目的

この資料は、Wardrobe App のウェブアプリケーションに対する
セキュリティ対策の現状と今後の課題を整理するためのメモです。

整理の軸は IPA 「安全なウェブサイトの作り方」を参考にします。

参考:

- IPA「安全なウェブサイトの作り方」
  - https://www.ipa.go.jp/security/vuln/websecurity/about.html

補足:

- この資料はコードベース確認時点の現状整理です
- 公式な脆弱性診断結果ではありません

---

## 総評

現状は Laravel / Eloquent を素直に使っているため、
**SQL インジェクションのリスクは比較的低い** です。

ただし、IPA の観点では次が主な課題です。

1. CSRF 例外の見直し
2. items / outfits の入力値バリデーション強化
3. login / register のレート制限追加
4. セキュリティヘッダと Cookie 設定の整理

---

## 現状の要点

### できていること

- 認証系は FormRequest を利用している
- items / outfits / settings で Laravel の `validate()` を使っている
- DB アクセスはほぼ Eloquent / Query Builder 経由
- `where('user_id', ...)` で所有者制限をかけている
- ログイン、登録成功時にセッションを再生成している
- BFF 経由で Cookie と CSRF トークンを Laravel に渡している

### 気になること

- `api/items*` と `api/outfits*` が CSRF 検証対象外
- items の `category` `shape` に allowlist バリデーションがない
- colors / spec の形式検証が不足
- login / register に明示的なレート制限が見当たらない
- 本番向けの Cookie / HTTPS / ヘッダ方針が docs 化されていない

---

## IPA 観点での整理

### SQLインジェクション

現状:

- raw SQL をほとんど使っていない
- Eloquent / Query Builder が中心

評価:

- 現状リスクは低め

今後の対策:

- raw SQL の文字列連結を禁止
- 動的ソート列やフィルタ項目は allowlist 化

---

### OSコマンド・インジェクション

現状:

- リクエスト処理で OS コマンド実行は確認していない

今後の対策:

- 画像処理などを追加するときは shell 実行を避ける
- 必要時は引数を allowlist で制御する

---

### パス名パラメータの未チェック / ディレクトリ・トラバーサル

現状:

- ユーザー入力でファイルパスを直接扱う実装はほぼない

今後の対策:

- アップロード機能追加時はファイル名をサーバー側で生成する
- パスの直接連結を避ける

---

### セッション管理の不備

現状:

- 認証成功時のセッション再生成あり
- ログアウト時の invalidate / token 再生成あり
- 再ログイン時の `CSRF token mismatch` が未解消

今後の対策:

- CSRF Cookie の再取得タイミングを修正する
- 本番での Secure / SameSite / HttpOnly 方針を整理する

---

### クロスサイト・スクリプティング

現状:

- React / Next.js の自動エスケープが主体
- `dangerouslySetInnerHTML` の常用は確認していない

今後の対策:

- HTML 埋め込み時は sanitize を必須化
- URL 表示時は `javascript:` スキームを拒否する

---

### CSRF

現状:

- auth 系では BFF が CSRF を取得して転送
- `items` / `outfits` は Laravel 側で CSRF 例外

評価:

- **最優先で見直したい項目**

今後の対策:

- state-changing API を CSRF 例外から外す
- BFF からの POST / PUT / DELETE を CSRF 付きで統一

---

### HTTPヘッダ・インジェクション

現状:

- ヘッダ値をユーザー入力から直接組み立てる実装は確認していない

今後の対策:

- `Location` `Set-Cookie` `Content-Disposition` を動的生成する際は改行混入を防ぐ

---

### メールヘッダ・インジェクション

現状:

- 現時点でメール送信機能は確認していない

今後の対策:

- 問い合わせやパスワードリセット追加時はフレームワークのメール API を使う

---

### クリックジャッキング

現状:

- `X-Frame-Options` や `CSP frame-ancestors` の方針が未整理

今後の対策:

- `X-Frame-Options: DENY` または `SAMEORIGIN`
- 可能なら `Content-Security-Policy: frame-ancestors 'none'`

---

### バッファオーバーフロー

現状:

- PHP / TypeScript 主体のため直接的なリスクは低い

今後の対策:

- ネイティブ拡張や画像処理ライブラリ追加時は脳弱性情報を綴続確認する

---

### アクセス制御や認可制御の欠落

現状:

- `items` / `outfits` は `user_id` で所有者制限
- `outfits` では `item_id` の所有者確認を追加で実施

今後の対策:

- 更新系 API は ownership check を必須化
- 認可テストを追加する

---

## IPA 第2章寄りの運用・全体対策

### 入力値検証

- 型検証はあるが、業務ルールの allowlist 検証が不足
- `category` `shape` `season` `tpo` `hex` `spec.tops.*` の厳格化が必要

### レート制限 / ブルートフォース対策

- login / register に throttle 追加を検討する

### セキュリティヘッダ

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

の標準セットを決める。

### Cookie / HTTPS

- 本番では HTTPS 前提
- `Secure` `HttpOnly` `SameSite` を整理

### ログ・監査

- ログイン失敗
- 権限エラー
- バリデーション異常の多発
- 予期しない 5xx

を監視対象にする。

### 依存パッケージ管理

- `composer audit`
- `npm audit`
- Dependabot などの導入検討

---

## 直近の優先課題

### High

1. `items` / `outfits` の CSRF 例外を見直す
2. 認証 API にレート制限を追加する
3. items 入力の allowlist バリデーションを強化する
4. 他人データへのアクセス防止テストを追加する

### Medium

1. セキュリティヘッダ方針を決める
2. Cookie / HTTPS の本番設定を docs 化する
3. spec / color / category の形式検証を厳格化する

### Low

1. 監査ログ方針の整理
2. パッケージ脆弱性チェックの定常化
3. ファイルアップロード / 画像処理追加時のセキュリティ指針追加

---

## 実装タスク候補

- Laravel の CSRF 例外設定を見直す
- login / register に throttle を追加する
- `Item` / `Outfit` 用 FormRequest を導入する
- category / shape / spec のルールを Request クラスに集約する
- 認可テストを追加する
- BFF / Laravel のセキュリティヘッダ方針を決める

---

## 関連資料

- `docs/project/implementation-notes.md`
- `docs/architecture/auth-flow.md`
- `docs/architecture/system-overview.md`
- `docs/specs/settings/category-settings.md`
