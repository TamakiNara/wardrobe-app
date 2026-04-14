---
name: pre-commit-checks
description: commit 前に必要な lint、format、test、hook、Windows 側確認を整理して実施する。
---

# pre-commit checks Skill

## 目的

commit 前に必要な整形、lint、test、hook 確認の漏れを防ぐ。
特に web 側の prettier、WSL / bash で不安定な場合の Windows 側確認、stage ずれを防ぐ。

## 基本方針

- 変更を加えたら、commit 前に最低限必要な確認を行う
- docs / OpenAPI / 実装 / test のいずれかを変えた場合は、関連差分の更新漏れがないか確認する
- 変更範囲に関係ない大規模修正は行わない

## 必須確認

- api: PHPコード整形と軽いテストを通す
- web: lint と format check を通す
- `docs/api/openapi.yaml` を変更した場合は YAML と整合を確認する
- commit やコミットメッセージ提案の前に、`.githooks/pre-commit` の実行内容を確認し、必要なら同等コマンドを先に実行する
- web に変更がある場合、`npm run lint` だけでなく `npx prettier --check .` も事前に実行する
- seed / category master / migration / test dataset に関わる変更では、テストコマンド案内時に `php artisan migrate` / `php artisan db:seed --class=TestDatasetSeeder` または `php artisan migrate:fresh --seed` の要否もあわせて案内する

## stage / working tree の注意

- 整形コマンドで修正が入った場合は、その差分を再 stage してから commit する
- `prettier --write` を実行した後は、index と working tree がずれるため、対象ファイルを必ず `git add` し直してから commit する
- pre-commit で `Code style issues found` が出た場合は、まず hook が指摘したファイルに対して `prettier --check` を再現し、必要ならそのファイル群だけ `prettier --write` して再 stage する

## WSL / bash で不安定な場合

bash / WSL 側で `node` や `npx` の実行結果が不安定な場合は、Windows 側の `cmd.exe /c` で `npm run lint` と `npx prettier --check .` を確認する。

## 主要確認コマンド

- api: `php vendor/bin/pint --test`
- api: `php artisan test`
- web: `npm run lint`
- web: `npx prettier --check .`
- web (Windows 側確認): `cmd.exe /c "cd /d C:\DEV\wardrobe-app\web && npm run lint"`
- web (Windows 側確認): `cmd.exe /c "cd /d C:\DEV\wardrobe-app\web && npx prettier --check ."`

## Git hooks

- このリポジトリでは `core.hooksPath=.githooks` を使用する
- commit 前チェックは `.githooks/pre-commit` を前提とする
- `.githooks/pre-commit` は web 変更時に staged files ではなく `web` 全体へ `npx prettier --check .` を実行する前提で扱う
- hook の変更時は README または docs のセットアップ手順も必要に応じて更新する
- pre-commit は repo 全体の既存負債ではなく、原則として今回変更した範囲を中心に確認する
