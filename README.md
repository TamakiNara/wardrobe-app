# Wardrobe App

服の **アイテム管理** と **コーディネート管理** を目的としたWebアプリです。
ユーザーは服のアイテム（色・形・季節・TPO）を登録し、後にコーディネートとして組み合わせて管理できます。

現在は **アイテム登録・一覧・詳細表示** まで実装されています。

---

# 技術スタック

## Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Backend

- Laravel
- Session Authentication

## BFF

- Next.js API Routes
- Cookie relay
- CSRF relay

## Database

- MySQL

---

# アーキテクチャ

本アプリは **Next.js + Laravel の分離構成**で構築されています。

Browser は直接 Laravel API を呼ばず、**Next.js の BFF (Backend for
Frontend)** を経由します。

    Browser
      ↓
    Next.js (UI + BFF)
      ↓
    Laravel API
      ↓
    MySQL

詳細は以下を参照してください。

    docs/system-architecture.md

---

# 主な機能

## 認証

- ユーザー登録
- ログイン
- ログアウト
- セッション認証

CSRF 対策には Laravel の標準機構を使用しています。

---

## アイテム管理

現在実装されている機能

- アイテム登録
- アイテム一覧
- アイテム詳細

登録可能な情報

- 名前
- カテゴリ
- 形
- カラー（プリセット / カスタム）
- 季節
- TPO

---

# API

詳細仕様は

    docs/api.md

を参照してください。

---

# データベース

詳細は

    docs/database.md

に記載予定です。

---

# ディレクトリ構成

    wardrobe-app
    ├ api        # Laravel API
    ├ web        # Next.js Frontend + BFF
    └ docs
       ├ system-architecture.md
       ├ api.md
       └ database.md (planned)

---

# License

Personal development project.
