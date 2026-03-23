# Architecture Decision Log

このドキュメントは、本プロジェクトにおける主要な設計判断とその理由を記録するものです。
日時は厳密な履歴ではなく、設計判断の背景を残すことを目的としています。

---

# BFF (Backend for Frontend) を採用した理由

## Background

Next.js フロントエンドと Laravel API を分離した構成を採用している。
ブラウザから直接 Laravel API を呼ぶ構成も可能だが、認証・CSRF・Cookieの扱いを整理する必要があった。

## Decision

Next.js の API Route (Route Handler) を **BFF 層**として利用する。

    Browser
      ↓
    Next.js (BFF)
      ↓
    Laravel API

## Reason

- Cookie relay を実装しやすい
- CSRF トークン relay を実装できる
- Laravel API を直接公開しなくて済む
- フロントエンドと API の責務分離が明確になる

## Trade-offs

- BFF 層の実装コストが増える
- ルーティングが1段増える

---

# Session Authentication を採用した理由

## Background

Laravel では主に次の認証方式が存在する

- Session Auth
- Sanctum
- Passport (OAuth)

今回のアプリは

- SPA だが同一ドメイン構成
- 個人アプリ規模

であるため、過剰な認証方式は不要だった。

## Decision

Laravel 標準の **Session Authentication** を採用する。

    auth:web
    session
    csrf

## Reason

- Laravel標準機構である
- 実装がシンプル
- BFF 構成との相性が良い
- Cookieベース認証で十分

## Trade-offs

- モバイルアプリとの連携には向かない
- トークンベース認証より柔軟性は低い

---

# `/api/items` を web.php 側に置いた理由

## Background

Laravel の API ルートは通常

    routes/api.php

に配置するが、api.php には `web` ミドルウェアが含まれない。

Session 認証を利用する場合、次が必要になる

- session
- csrf
- cookie

## Decision

`items` API を

    routes/web.php

の

    prefix('api')

配下に配置する。

## Reason

- web ミドルウェアが利用できる
- Session 認証が使える
- CSRF protection が有効になる

## Trade-offs

- Laravel の一般的な API 構成とは異なる
- `future API` を公開する場合は再設計が必要

---

# colors / seasons / tpos を JSON 保存にした理由

## Background

服の属性は次のような構造を持つ

- colors
- seasons
- tpos

これらは正規化して

    item_colors
    item_seasons
    item_tpos

のようなテーブルに分割することも可能である。

## Decision

MVP 段階では JSON カラムとして保存する。

## Reason

- 実装速度を優先できる
- フロントの payload と一致させやすい
- migration や relation の複雑化を避けられる
- 後から正規化しやすい

## Trade-offs

- 検索がしにくい
- 集計が難しい
- DB 正規化のメリットは減る

---

# カスタムカラーを許可した理由

## Background

服の色は

- プリセットカラー
- 任意カラー

の両方が存在する。

プリセットのみだと表現力が不足する。

## Decision

以下の2種類を許可する

- preset color
- custom color

## Reason

- 実際の服の色は多様
- ユーザーの自由度を上げる
- UIでカラーピッカーを使える

## Trade-offs

- カラー検索が難しくなる
- 色分類の統一性は下がる

---

# 季節「オール」を UI 側で排他制御した理由

## Background

季節は

- 春
- 夏
- 秋
- 冬
- オール

という選択肢がある。

「オール」は

    春 + 夏 + 秋 + 冬

と意味が重複する。

## Decision

UI 側で

    オール と 他季節は排他

になるよう制御する。

## Reason

- DB をシンプルに保てる
- API バリデーションが複雑にならない
- UI で直感的に制御できる

## Trade-offs

- UI にロジックが入る

---

# ESLint / Prettier / Husky を導入した理由

## Background

フロントエンドは TypeScript / React を使用している。

コード品質を維持するためには

- Lint
- Format
- Commit hook

が必要になる。

## Decision

次のツールを導入する

- ESLint
- Prettier
- Husky
- lint-staged

## Reason

- コードスタイルの統一
- TypeScript の問題を早期発見
- commit 時の自動チェック
- チーム開発を想定した品質管理

## Trade-offs

- 初期設定のコストがある
