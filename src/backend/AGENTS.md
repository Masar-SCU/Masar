# Masar Backend Service — Agent Guide

This document provides specialized guidelines, build commands, architectural rules, and security practices for the **Masar Backend Service** (`src/backend`).

---

## 1. Stack & Architecture

* **Framework**: .NET 10.0 (LTS, supported through November 2028), C# 13.
* **Architecture Pattern**: Clean Architecture with domain-centric separation of concerns.
* **Database**: PostgreSQL 16 with `pgvector` extension, managed via Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`).
* **Authentication**: ASP.NET Core JWT Bearer authentication with refresh token rotation.
* **Testing Stack**: xUnit, FluentAssertions, and Microsoft.AspNetCore.Mvc.Testing.

### Project Layout

```text
src/backend/
├── Masar.sln
├── docker-compose.yml
├── src/
│   ├── Masar.Domain/           # Pure domain entities, value objects, domain logic (zero external dependencies)
│   ├── Masar.Application/      # CQRS handlers, service interfaces, DTOs, business workflows
│   ├── Masar.Infrastructure/   # EF Core DbContext, migrations, pgvector repositories, external clients
│   └── Masar.Api/              # ASP.NET Core controllers, middleware, dependency injection setup
└── tests/
    ├── Masar.Domain.Tests/     # Domain unit tests (XP, mastery, streak calculations)
    └── Masar.Application.Tests/# Application workflow and command/query handler unit tests
```

---

## 2. Build, Format & Test Commands

Run all commands from either the repository root or `src/backend`:

```bash
# Restore NuGet dependencies
dotnet restore src/backend/Masar.sln

# Verify code formatting (fails CI if unformatted)
dotnet format src/backend/Masar.sln --verify-no-changes

# Auto-format codebase
dotnet format src/backend/Masar.sln

# Build solution in Release configuration
dotnet build src/backend/Masar.sln --configuration Release

# Execute all unit tests
dotnet test src/backend/Masar.sln --configuration Release --verbosity normal

# Apply database migrations
dotnet ef database update \
  --project src/backend/src/Masar.Infrastructure \
  --startup-project src/backend/src/Masar.Api
```

---

## 3. C# & Clean Architecture Guidelines

* **Modern C# 13 Idioms**: Use file-scoped namespaces, primary constructors for dependency injection, collection expressions (`[ ... ]`), and pattern matching.
* **Nullability**: Nullable reference types are strictly enforced (`<Nullable>enable</Nullable>`). Avoid null-forgiving operators (`!`) unless backed by explicit assertions.
* **Dependency Direction**:
  * `Domain` has zero dependencies on other layers or database libraries.
  * `Application` depends only on `Domain`.
  * `Infrastructure` and `Api` implement and host `Application` interfaces.
* **JSON Serialization**: Enforce `JsonNamingPolicy.CamelCase` for all API inputs and outputs:
  * Property names must match `camelCase` (e.g., `atomId`, `sessionId`, `durationSeconds`, `attempts`).
* **Asynchronous Execution**: All I/O operations must be fully asynchronous (`async Task<T>`) and accept a `CancellationToken ct` parameter passed through to database calls.

---

## 4. Domain & Business Rules

* **Mastery States**: Database constraints enforce that atom mastery values must strictly be one of:
  * `'learned'`: Fully mastered through lessons or verified placement.
  * `'shaky'`: Failed review, incomplete retention, or low confidence.
  * `'assumed'`: Bypassed via placement test-out or verified course credit.
* **XP & Gamification Progression**:
  * Standard lesson completion: 15 XP base (+5 XP bonus for score $\ge 80\%$).
  * Spaced repetition review: 10 XP base (+5 XP bonus for score $\ge 80\%$).
  * Unit checkpoint completion: 50 XP.
  * Stage capstone project: 100 XP.
  * Lesson replay: 2 XP flat.
* **Exam Streak Protection**: Students may pause their daily streak during exam periods for up to 14 consecutive calendar days per semester without losing accumulated streak counts.

---

## 5. Security & Invariants

* **Tenant & Student Isolation**:
  * Never trust client-provided IDs for student ownership.
  * Always extract the authenticated user identity via `User.FindFirstValue(ClaimTypes.NameIdentifier)`.
  * If a student requests a resource belonging to another student, return HTTP `404 Not Found` (never `403 Forbidden`) to prevent resource enumeration.
* **Grading Authority**:
  * Formative lesson practice allows interactive client-side checks for instant feedback.
  * High-stakes Unit Checkpoints and Placement Test-Outs evaluate answers strictly server-side; answer keys must never be returned in API payloads.
* **Secret Configuration**:
  * Local connection strings and JWT signing keys belong exclusively in `appsettings.Development.json` or .NET User Secrets.
  * Base `appsettings.json` must omit secrets to ensure unconfigured deployments fail immediately at startup.
