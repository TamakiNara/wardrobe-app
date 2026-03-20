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
LARAVEL_BASE_URL=http://localhost:8000
LARAVEL_API_BASE_URL=http://localhost:8000
NEXT_APP_URL=http://localhost:3000
```

補足:

- `web/.env.example` はまだ用意していないため、現状は手動作成を前提とします
- `LARAVEL_BASE_URL`: BFF が Laravel へリクエストするときの基準 URL
- `LARAVEL_API_BASE_URL`: `me` 取得など一部処理で参照する URL
- `NEXT_APP_URL`: ページ内の absolute URL 生成に利用

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
