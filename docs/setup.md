# セットアップ

README には概要のみを載せ、ここには実際に開発環境を起動するための手順をまとめます。

---

## 前提環境

- Node.js
- npm
- PHP 8.2+
- Composer
- MySQL （または Laravel の sqlite 初期設定を使ったローカル検証）

---

## リポジトリ取得

```bash
git clone <repository-url>
cd wardrobe-app
```

---

## Git hooks （pre-commit）の初期設定

このリポジトリでは `core.hooksPath=.githooks` を使用します。`git clone` 後の初回セットアップで、以下を 1 度実行して Git hook を有効化してください。

```bash
git config core.hooksPath .githooks
```

有効化を確認するときは、以下で読み出し元と設定値を確認します。

```bash
git config --show-origin --get core.hooksPath
```

実行結果で `.githooks` が返り、その読み出し元が現在のリポジトリまたはグローバル Git 設定であることを確認してください。

Windows 環境では、`.githooks/pre-commit` は Bash スクリプトなので Git for Windows / Git Bash で動作する前提です。PowerShell 単体や `cmd.exe` 単体で hook を実行する運用は想定していません。

### `pre-commit` が実際に動いているかの確認

最初の 1 回だけ確認したい場合は、`.githooks/pre-commit` に一時的に `echo` と `exit 1` を追記し、テスト用の commit を実行します。

```bash
# .githooks/pre-commit に一時的に追記
echo "[pre-commit] test hook"
exit 1

# 適当な変更を staged したうえで確認
git commit -m "test"
```

`[pre-commit] test hook` が表示され、commit が失敗すれば hook は有効です。確認後は必ず一時追記した `echo` と `exit 1` を元に戻してください。

### hook をスキップする場合

一時的に hook をスキップしたい場合は `git commit --no-verify` を使えます。ただし、通常は `.githooks/pre-commit` のチェックを通す運用を前提とします。

---

## Backend （Laravel）

### 1. 依存パッケージのインストール

```bash
cd api
composer install
```

### 2. `.env` の作成

`api/.env.example` を `api/.env` にコピーします。

補足:

- macOS / Linux: `cp .env.example .env`
- Windows PowerShell: `Copy-Item .env.example .env`

- 初期の `.env.example` は sqlite 寄りの設定です
- MySQL を使う場合は `DB_CONNECTION` `DB_HOST` `DB_PORT` `DB_DATABASE` `DB_USERNAME` `DB_PASSWORD` を環境に合わせて調整します

MySQL の例:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wardrobe_app
DB_USERNAME=root
DB_PASSWORD=
```

### 3. アプリケーションキー生成

```bash
php artisan key:generate
```

### 4. migration / seed

```bash
php artisan migrate:fresh --seed
```

再度テスト用ユーザーと sample data だけを入れ直したい場合は以下を使います。

```bash
php artisan db:seed --class=TestDatasetSeeder
```


補足:

- `TestDatasetSeeder` は category group / category master / category preset も含むため、`migrate:fresh --seed` 後だけでなく、途中で sample data を入れ直す場合でもそのまま実行できます
- `standard-user@example.com` のアイテムが 0 件になるなど、カテゴリ表示設定の整合が崩れた場合は、あらためてこの Seeder を再実行してください


### 5. Laravel サーバ起動

```bash
php artisan serve
```

既定では `http://localhost:8000` で起動します。

---

## Frontend （Next.js）

### 1. 依存パッケージのインストール

```bash
cd web
npm install
```

### 2. `web/.env.local` の作成

Next.js 側では `web/.env.local` を作成し、以下の環境変数を設定します。

```env
LARAVEL_BASE_URL=http://127.0.0.1:8000
LARAVEL_API_BASE_URL=http://127.0.0.1:8000
```

補足:

- `web/.env.example` はまだ用意していないため、現状は手動作成を前提とします
- `LARAVEL_BASE_URL`: BFF が Laravel へリクエストするときの基準 URL
- `LARAVEL_API_BASE_URL`: server component や `me` 取得などで Laravel へ直接リクエストするときの基準 URL
- `NEXT_APP_URL` は現状のローカル開発では必須ではありません


実機確認の補足:

- スマホから LAN IP で Next.js を開く場合でも、`LARAVEL_BASE_URL` / `LARAVEL_API_BASE_URL` は Next.js サーバから見える Laravel の URL を指します
- `php artisan serve` の既定を使うなら `http://127.0.0.1:8000` のままで構いません
- 実機から開く URL は `http://<PCのLAN IP>:3000` を使い、`web/.env.local` 側は Laravel 側の接続先だけを設定するのが基本です


### 3. Next.js サーバ起動

```bash
npm run dev
```

既定では `http://localhost:3000` で起動します。

---

## テスト用アカウント

`php artisan migrate:fresh --seed` で以下のアカウントが作成されます。

- `empty-user@example.com`
  - Item 0 件 / Outfits 0 件 / 初期状態確認用
- `standard-user@example.com`
  - Item 7 件 / Outfits 3 件 / 標準的な画面確認用
- `large-user@example.com`
  - Item 36 件 / Outfits 12 件 / 多件数データ確認用

- デフォルトパスワード: `password123`
- env 上書き: `TEST_SEED_USER_PASSWORD`

詳細は `docs/data/test-seed-users.md` を参照してください。

---

## 動作確認コマンド

Backend:

```bash
cd api
php artisan test
```

Frontend:

```bash
cd web
npm test
npm run lint
```

---

## 関連資料

- `README.md`
- `docs/data/test-seed-users.md`
- `docs/data/database.md`
- `docs/data/er-diagram.md`
- `docs/architecture/system-overview.md`
