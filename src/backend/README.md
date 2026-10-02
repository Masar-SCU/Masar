# Masar — Backend baseline

Clean architecture: `Masar.Domain` ← `Masar.Application` ← (`Masar.Infrastructure`, `Masar.Api`).
Postgres via `pgvector/pgvector`. Auth is fully implemented per `07-api-contract.md` §3.

Targets **.NET 10** (LTS, supported through November 2028). .NET 9 is STS and reaches end of
support November 10, 2026 — with this project running through May 2027, .NET 10 was the only
version that stays supported for the whole timeline. `dotnet --version` should report `10.x`.

## 1. Start Postgres

```bash
docker compose up -d
```

This exposes Postgres on `localhost:5433` (see `docker-compose.yml`). The connection string lives
in `appsettings.Development.json` only — deliberately absent from the base `appsettings.json`, so a
staging/production deployment with no connection string configured fails fast at startup instead of
silently working against nothing.

## 2. Set the JWT secret (never committed)

```bash
cd src/Masar.Api
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "replace-with-a-long-random-string-at-least-32-chars"
```

`Jwt:Issuer`, `Jwt:Audience` and the token lifetimes already have defaults in `appsettings.json`.

## 3. Create the database schema

With the `dotnet-ef` tool installed (`dotnet tool install --global dotnet-ef` if you don't have it),
from the repo root:

```bash
dotnet ef database update \
  --project src/Masar.Infrastructure \
  --startup-project src/Masar.Api
```

The `InitialCreate` migration (creating `users` and `refresh_tokens`) is already committed — you're
just applying it, not generating a new one.

## 4. Run

```bash
dotnet build
dotnet run --project src/Masar.Api
```

Swagger opens at `/swagger`. Try the flow in order:

1. `POST /api/auth/register` — the verification link is logged to the console (`ConsoleEmailSender`
   stands in for real email until Infrastructure gets an SMTP implementation). The token itself is
   never logged (NFR-08) — read it straight from the database if you need it for local testing:
   `SELECT email_verification_token FROM users WHERE email = '...';`
2. `POST /api/auth/verify-email` with that token.
3. `POST /api/auth/login` — returns `accessToken` (900s TTL) and `refreshToken`.
4. `POST /api/auth/refresh` — rotates the refresh token; the old one stops working immediately.
5. `POST /api/auth/logout` — revokes the presented refresh token.
6. `DELETE /api/auth/account` (with `Authorization: Bearer <accessToken>`) — schedules deletion,
   returns 202. Login and refresh both reject the account immediately afterward (NFR-08); the row
   itself isn't hard-deleted yet — see "What's deliberately not here yet."

## What this PR proves

- `User` and `RefreshToken` entities, mapped via EF Core configurations, with a committed
  `InitialCreate` migration.
- All six auth endpoints from `07-api-contract.md` §3: register, login, refresh, logout,
  verify-email, delete account.
- Refresh token rotation: single-use, hashed at rest (SHA-256), reuse of an already-rotated token
  is rejected rather than silently accepted.
- Passwords hashed with BCrypt, never stored or logged in plaintext.
- The contract's error envelope (§2) is now enforced consistently everywhere a response can fail —
  not just thrown `ApiException`s, but `[ApiController]`'s own automatic model-binding failures too
  (`ConfigureApiBehaviorOptions` in `Program.cs`), with validation field names camelCased to match
  the rest of the contract.
- NFR-08 (privacy): no verification tokens in logs, HSTS enabled outside Development, accounts
  scheduled for deletion are rejected at login and refresh immediately.
- Unit tests for the domain entities (`User`, `RefreshToken`) and the auth command handlers
  (`Register`, `Login`, `Refresh`), the latter against faked repository/service interfaces — no
  database or HTTP involved.

## What's deliberately not here yet

- **Hard deletion.** `DELETE /api/auth/account` schedules deletion and blocks further login/refresh,
  but nothing yet purges the row after the 30-day window NFR-08 requires — needs a background job,
  tracked separately.
- **Real email delivery.** `IEmailSender` has one interface; swap `ConsoleEmailSender` for an
  SMTP/SendGrid implementation later with no changes elsewhere.
- **True per-account rate limiting.** Login's rate limit is IP-partitioned, not
  per-account — the latter needs the email out of the request body, which means enabling body
  buffering ahead of the rate limiter.
- Everything past auth: profile, catalogue, gap analysis, roadmap, mentor.

## Layer cheat sheet

| Change you want to make                    | File(s) to touch                                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New entity / business rule                 | `Masar.Domain/Entities/`                                                                                                                                             |
| New table / EF mapping                     | `Masar.Infrastructure/Persistence/Configurations/` + a migration                                                                                                     |
| New endpoint                               | `Masar.Api/Controllers/` — thin: parse request → send command → map result                                                                                           |
| New use case                               | `Masar.Application/Feature/Commands\|Queries/` — command/query + validator + handler                                                                                 |
| New external dependency (email, JWT, etc.) | Define the interface in `Masar.Application/Common/Interfaces/`, implement it in `Masar.Infrastructure`, register it in `Masar.Infrastructure/DependencyInjection.cs` |
