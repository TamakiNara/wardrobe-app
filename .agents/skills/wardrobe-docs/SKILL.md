---
name: wardrobe-docs
description: Use this skill when creating, updating, reviewing, or reorganizing docs in the wardrobe-app repository.
---

# wardrobe-app docs 更新ルール

この skill は、wardrobe-app repository で docs を作成・更新・整理するときに使う。

## 最初に確認する docs

docs を作成・更新する前に、必要に応じて以下を確認する。

- `docs/README.md`
- `docs/docs-map.md`
- `docs/project/docs-writing-guidelines.md`

## 基本方針

- docs の本文・見出し・分類名は、原則として日本語で書く。
- 機能名は日本語を主にし、必要な場合だけ英語の内部名を括弧で補足する。
- 画面名は日本語を主にし、必要な場合だけ route を括弧で補足する。
- API field、DB column、route、file path、status 値、型名は、コード上の名称を backtick で囲んで書く。
- `current` / `planned` / `legacy` を見出しとして安易に使わず、`現在の仕様` / `今後対応` / `旧仕様（legacy）` などに寄せる。

## 正本の見方

- 機能仕様: `docs/specs/**`
- API 契約: `docs/api/openapi.yaml`
- API 方針: `docs/api/api-overview.md`
- DB schema / 保存責務: `docs/data/database.md`
- import/export: `docs/specs/import-export.md`
- 残件・優先度・判断メモ: `docs/specs/task-backlog.md`
- 作業ログ・引き継ぎ: `docs/project/implementation-notes.md`

## 注意

- 詳細な表記・命名ルールは `docs/project/docs-writing-guidelines.md` を正本とする。
- この skill に詳細ルールを重複して増やしすぎない。
- `docs/docs-map.md` は構造の地図であり、仕様正本ではない。
- `docs/specs/task-backlog.md` は仕様正本ではなく、残件・優先度・判断メモ・試行結果を置く場所として扱う。
- docs 更新時は、仕様・API・DB・テスト観点のうち、どこに影響があるかを確認する。
