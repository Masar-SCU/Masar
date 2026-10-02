# Masar — Backend baseline

Clean architecture: `Masar.Domain` ← `Masar.Application` ← (`Masar.Infrastructure`, `Masar.Api`).
Postgres via `pgvector/pgvector`.

Targets **.NET 10** (LTS, supported through November 2028). .NET 9 is STS and reaches end of
support November 10, 2026 — with this project running through May 2027, .NET 10 was the only
version that stays supported for the whole timeline. `dotnet --version` should report `10.x`.

## 1. Start Postgres

```bash
docker compose up -d
```

This exposes Postgres on `localhost:5433` (see `docker-compose.yml`; the connection string in
`appsettings.Development.json` already points at it).

## 2. Run

```bash
dotnet build
dotnet run --project src/Masar.Api
```

Swagger opens at `/swagger`. At this stage it lists no endpoints — that's expected. This PR is
the clean-architecture skeleton and the Postgres/EF Core wiring; nothing is built on top of it yet.

## What this PR proves

- The four projects (`Domain`, `Application`, `Infrastructure`, `Api`) reference each other in the
  correct direction and the solution builds.
- `MasarDbContext` resolves through DI and connects to Postgres (`AddInfrastructure` in
  `Masar.Infrastructure/DependencyInjection.cs`).
- The cross-cutting pieces from the API contract are in place before any endpoint needs them: the
  `X-Correlation-Id` middleware and the error-envelope exception middleware (§1–2 of
  `07-api-contract.md`), plus a MediatR validation pipeline behavior wired through
  `Masar.Application/DependencyInjection.cs`.

## What's deliberately not here yet

- No entities, no migrations — `MasarDbContext` has no `DbSet`s yet.
- No endpoints, no controllers.
- Everything auth-related (register/login/refresh/logout/verify-email/delete account), and
  everything past it (profile, catalogue, gap analysis, roadmap, mentor), lands in follow-up PRs.

## Layer cheat sheet

| Change you want to make | File(s) to touch |
|---|---|
| New entity / business rule | `Masar.Domain/Entities/` |
| New table / EF mapping | `Masar.Infrastructure/Persistence/Configurations/` + a migration |
| New endpoint | `Masar.Api/Controllers/` — thin: parse request → send command → map result |
| New use case | `Masar.Application/<Feature>/Commands|Queries/` — command/query + validator + handler |
| New external dependency (email, JWT, etc.) | Define the interface in `Masar.Application/Common/Interfaces/`, implement it in `Masar.Infrastructure`, register it in `Masar.Infrastructure/DependencyInjection.cs` |
