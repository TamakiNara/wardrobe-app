# System Architecture

```mermaid
flowchart TD
  User[User]
  Browser[Browser]
  Next[Next.js App Router]
  Laravel[Laravel API]
  MySQL[(MySQL)]

  User --> Browser
  Browser --> Next
  Next -->|/api/*| Laravel
  Laravel --> MySQL
```
