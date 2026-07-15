# GitHub Issues・Projects 運用設計ドラフト

> [!NOTE]
> このファイルは、GitHub Issues・Projects運用を確定するための設計ドラフトです。
> 正本化する場合は、ドラフト固有の説明を削除したうえで既存docsとの役割を整理します。

## 目的

未完了タスク、未決定事項および将来実装候補をGitHub Issuesで管理する。

GitHub Projectsを使用し、Issueの作業状態、優先度および主な対象機能を管理する。

## 役割分担

### 個別仕様書

`docs/specs/**` は、現在有効な仕様と確定した設計判断の正本とする。

### 開発ログ

`docs/dev-log/**` は、作業経緯、調査過程、判断理由、試したこと、採用しなかった案を記録する。

### GitHub Issues

GitHub Issuesは、次の内容の正本とする。

- 未完了タスク
- 未決定事項
- 将来実装候補
- 後で再判断する事項

### GitHub Projects

GitHub Projectsは、Issueの次の情報を管理する。

- 作業状態
- 優先度
- 主な対象機能

## GitHub Project

Project名は `Wardrobe App` とする。

GitHub Projectは1つだけ作成する。

Projectのビューは、TableとBoardを使用する。

## Status

Statusは次の4段階とする。

| 値            | 意味       |
| ------------- | ---------- |
| `Todo`        | 未着手     |
| `In Progress` | 作業中     |
| `In Review`   | レビュー中 |
| `Done`        | 完了       |

## Priority

Priorityは次の3段階とする。

| 値       | 意味                       |
| -------- | -------------------------- |
| `High`   | 優先して着手する           |
| `Medium` | 通常の優先度               |
| `Low`    | 必要性や時期を見て着手する |

Priorityは、GitHub Projectの単一選択フィールドとして管理する。

Issue本文やラベルへ同じ情報を重複して記載しない。

## Area

Areaは、Issueが主に属する対象機能を示す。

Areaは次のとおりとする。

- `Items`
- `Outfits`
- `Wear Logs`
- `Weather`
- `Purchase Candidates`
- `Shopping Memos`
- `Shared`
- `Docs`

`Shared`は、複数機能にまたがる共通処理・共通設計を対象とする。

例:

- 認証
- ログ
- import/export
- 共通ナビゲーション
- 複数画面で使用する共通部品
- 横断的なAPI・DB設計

Areaは、GitHub Projectの単一選択フィールドとして管理する。

複数のAreaに関係するIssueでも、最も中心となるAreaを1つ選択する。

主なAreaを1つに決められない横断Issueは`Shared`とする。

関連する他機能が重要な場合は、Issue本文の関連情報として記載する。

## Label

ラベルは次の4種類とする。

| label     | 対象                                   |
| --------- | -------------------------------------- |
| `bug`     | 意図した仕様どおりに動作しない不具合   |
| `feature` | 新機能または既存機能の改善             |
| `design`  | 実装前に設計判断や仕様判断が必要な事項 |
| `docs`    | docsの作成・更新・整理                 |

ラベルはIssueの性質を表す。

Area、Priority、Statusの代わりには使用しない。

Issueの性質が複数のラベルに該当する場合は、該当するラベルを複数付与する。

UI改善のラベルは原則として`feature`を使用する。

UIか設計かという表示領域だけで判断せず、次の基準で区別する。

- 実装または表示改善を行うタスクは`feature`
- 実装内容を決めるための設計判断が主目的の場合は`design`
- 実装と設計判断の両方を含む場合は、必要に応じて`feature`と`design`を併用する

## Issue番号

`BUG-01`、`UI-14`、`FEAT-02`、`DES-01`のような独自IDは発行しない。

Issue番号を一意な識別子として使用する。
