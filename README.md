# Wardrobe App

服のアイテム管理とコーディネート管理を行う Web アプリです。

カテゴリ・カラー・TPO など複数の観点でアイテムを整理し、コーディネートの作成・再利用を可能にしています。

また、着用履歴や検索・フィルタ機能の追加を見据え、データ構造とアーキテクチャの両面で拡張性を重視した設計としています。

---

## 背景・解決したい課題

所有する服の数が増えると、「何を持っているか」「どの組み合わせができるか」「日々の服選びをどう楽にするか」が課題になります。

既存のクローゼット管理アプリも確認しましたが、カテゴリのカスタマイズ性や、コーディネートの再利用といった点で、自分の用途に合うものが少ないと感じました。

そこで、アイテムを複数の観点で整理し、コーディネートとして再利用できる仕組みを持つアプリとして開発しています。あわせて、Laravel + Next.js の実践的な構成で、認証・API 設計・データ設計まで含めて一貫して設計・実装することも本プロジェクトの目的の 1 つです。

---

## 主な機能

### 現在実装している機能

- ユーザー登録 / ログイン / ログアウト
- Laravel セッション認証 + CSRF 対応
- アイテムの登録 / 一覧 / 詳細 / 編集 / 削除
- カテゴリ・カラー・季節・TPO など複数観点でのアイテム管理
- コーディネートの作成 / 編集 / 一覧 / 詳細 / 削除
- カテゴリの表示 ON/OFF 設定
- テスト用 seed ユーザーと sample data による再現性のある検証環境

### 今後実装予定の機能

- 着用履歴（予定 / 実績 / 候補）の記録
- 検索・フィルタ・並び順の強化
- 画像アップロード
- 空状態・エラーメッセージ・ナビゲーションなど UI/UX の整備

---

## 技術構成

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend

- Laravel
- Session Authentication

### BFF

- Next.js Route Handlers / API Routes
- Cookie / CSRF トークンの中継

### Database

- MySQL

### 技術選定の意図

- Next.js: UI と BFF を同居させ、フロントエンドと API 中継の責務分離を行いやすくするため
- Laravel: 認証・バリデーション・データ操作の基盤を活用し、API 設計に集中するため
- BFF 構成: Browser から Laravel API を直接呼ばせず、Cookie / CSRF の扱いを統一するため
- TypeScript: API と UI 間のデータ構造を明確にし、型安全性を高めるため
- Tailwind CSS: コンポーネント単位で素早く UI を試行錯誤するため

---

## アーキテクチャ（簡略）

本アプリは Next.js + Laravel の分離構成で構築しています。

Browser から直接 Laravel API を呼び出すのではなく、Next.js を BFF として介在させることで、認証情報や CSRF トークンの管理を一元化しています。

```text
Browser
  -> Next.js (UI + BFF)
  -> Laravel API
  -> MySQL
```

この構成により、フロントエンドの実装を簡潔に保ちつつ、認証とセキュリティの扱いを統一しています。

---

## こだわった設計

### 1. カテゴリ設計

カテゴリはプリセット（Men / Women / Custom）を基にしつつ、ユーザーごとに表示 ON/OFF を切り替えられる構造としています。マスタデータとユーザー設定を分けることで、初期構成と個別カスタマイズを両立する設計にしています。

### 2. アイテムとコーディネートの分離

アイテムとコーディネートを明確に分離し、コーディネートは複数アイテムの組み合わせとして管理しています。これにより、アイテム単位での管理と、組み合わせとしての再利用を両立しています。

### 3. 着用履歴への拡張を前提とした設計

将来的な着用履歴機能では、記録時点のコーディネート構成を保持することを想定しています。これにより、後から outfit が編集されても、過去の記録を正しく再現できるようにしています。

### 4. BFF 構成による責務分離

Next.js を BFF として置くことで、Cookie や CSRF トークンの取り扱いをフロント側から分離し、セキュリティと実装の見通しを両立しています。

---

## データ設計

本アプリでは、アイテム・コーディネート・カテゴリ設定を中心に、将来の着用履歴へ拡張しやすい構造を意識しています。

ER 図は別ファイルで整理する予定です。ここでは、読み手が全体像をまず理解できる粒度のみを README に載せる方針です。

---

## セットアップ方法（簡略）

### 前提環境

- Node.js
- PHP
- Composer
- MySQL

### 基本手順

```bash
git clone <repository-url>
cd wardrobe-app
```

Backend と Frontend はそれぞれ `api/` と `web/` でセットアップします。詳細な手順とテスト用 seed アカウントは `docs/setup.md` へ分離する方針です。開発を始める前に `git config core.hooksPath .githooks` で Git hook を有効化してください。確認方法や Windows 前提を含む詳細は `docs/setup.md` に記載しています。

---

## 詳細ドキュメント

- ドキュメント入口: `docs/README.md`
- システム構成: `docs/architecture/system-overview.md`
- 認証フロー: `docs/architecture/auth-flow.md`
- 画面遷移図: `docs/architecture/screen-flows.md`
- API 概要: `docs/api/api-overview.md`
- OpenAPI 定義: `docs/api/openapi.yaml`
- データ設計: `docs/data/database.md`
- ER 図メモ: `docs/data/er-diagram.md`
- テスト用 seed データ: `docs/data/test-seed-users.md`
- セットアップ詳細: `docs/setup.md`
- アーキテクチャの判断メモ: `docs/decisions/architecture-decisions.md`

---

## License

Personal development project.
