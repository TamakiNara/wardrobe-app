# Auth Flow

このアプリは **Cookieベースのセッション認証 + CSRF保護** を使用する。

## Authentication Sequence

```mermaid
sequenceDiagram
  participant Client as Client (Browser / API Client)
  participant Laravel as Laravel API

  Client->>Laravel: GET /csrf-cookie
  Laravel-->>Client: Set-Cookie(XSRF-TOKEN, laravel-session)

  Client->>Laravel: POST /api/register
  Note right of Client: Header: X-CSRF-TOKEN
  Laravel-->>Client: 201 Created

  Client->>Laravel: POST /api/login
  Note right of Client: Header: X-CSRF-TOKEN
  Laravel-->>Client: 200 OK

  Client->>Laravel: GET /api/me
  Laravel-->>Client: 200 User Info

  Client->>Laravel: POST /api/logout
  Note right of Client: Header: X-CSRF-TOKEN
  Laravel-->>Client: 200 OK
```

## Flow Summary

1. `GET /csrf-cookie`  
  CSRFトークンとセッションCookieを取得

2. `POST /api/register`  
  ユーザー登録（登録後はログイン状態）

3. `POST /api/login`  
  メールアドレスとパスワードでログイン

4. `GET /api/me`  
  ログイン中ユーザー情報取得

5. `POST /api/logout`  
  セッション破棄
