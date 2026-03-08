# System Architecture

## Overview

Wardrobe App は **Next.js + Laravel の分離構成**で構築された Web アプリです。

Next.js は

- UI
- BFF (Backend for Frontend)

を担当し、

Laravel は

- API
- 認証
- DB操作

を担当します。

---

## High Level Architecture

```mermaid
flowchart TD
  User[User]
  Browser[Browser]
  Next[Next.js App Router / BFF]
  Laravel[Laravel API]
  MySQL[(MySQL)]

  User --> Browser
  Browser --> Next
  Next -->|/api/*| Laravel
  Laravel --> MySQL
