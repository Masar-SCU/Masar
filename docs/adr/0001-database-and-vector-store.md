# ADR-0001 — PostgreSQL + pgvector as the single data store

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Abdelrahman, Mohamed Yasser, Osama

---

## Context

Masar stores relational data (users, skills, careers, roadmaps) and vector embeddings (skills,
careers) for semantic matching. The original specification said "SQL Server / PostgreSQL" without
resolving the choice, and did not address vector storage at all.

Constraints that decide this:

- **$0 budget** ([C1](../02-requirements.md#6-constraints)) — no paid database.
- Team knows Entity Framework Core; nobody wants to hand-write vector SQL.
- ~166 embeddings of 384 dimensions. That is a very small vector workload.
- Local development must work with one `docker compose up` ([NFR-14](../02-requirements.md#nfr-14--portability)).

## Options considered

### A — PostgreSQL + pgvector *(chosen)*

- Native `vector(n)` type, cosine/L2/inner-product operators, HNSW and IVFFlat indexes.
- Official .NET support: `Pgvector`, `Pgvector.Dapper`, **`Pgvector.EntityFrameworkCore`**, MIT-licensed.
- Available on multiple free managed hosts, and the `pgvector/pgvector` Docker image makes local
  behaviour identical to production.
- One store means one connection string, one backup, one migration history.

### B — SQL Server 2025 with the native `VECTOR` type

SQL Server 2025 does have a native `vector` type with `VECTOR_DISTANCE`. Rejected because:

- **Maximum 1,998 dimensions** — fine for 384 today, but a ceiling with no upside.
- **B-tree and columnstore indexes are not allowed on vector columns**, and vector columns cannot be
  keys, cannot be compared, and cannot be used in memory-optimised tables.
- `sp_describe_first_result_set` does not correctly report the type, so many clients see `varchar` —
  a class of subtle bug nobody on this team has time to debug.
- It forces SQL Server **2025 specifically**; older free editions have no vector support.
- Free managed SQL Server hosting is materially harder to find than free managed Postgres.

### C — PostgreSQL for relational data + a separate vector database

Rejected: a second service, a second failure mode, a second set of credentials, and a second thing to
keep in sync — all to index 166 vectors. Fails the "what are we deliberately not building" test in
[§03 11](../03-architecture.md#11-what-we-are-deliberately-not-building).

### D — PostgreSQL, with vectors as `float[]` and cosine computed in application code

Kept as the **fallback**, not the primary. At 166 rows a sequential scan is genuinely fast enough. It
becomes the plan if a chosen free host turns out not to permit `CREATE EXTENSION vector`
(assumption [A7](../10-risks-and-assumptions.md#3-assumptions-register)).

## Decision

**PostgreSQL 16 with the pgvector extension, as the single data store.**

- EF Core 10 + Npgsql for relational access.
- `Pgvector.EntityFrameworkCore` for the vector column type.
- HNSW indexes with `vector_cosine_ops` on `skill_embedding` and `career_embedding`.
- Local development uses the `pgvector/pgvector:pg16` image so vector behaviour matches production exactly.

## Consequences

**Positive**

- One store, one backup, one migration history, one connection string.
- Vectors participate in ordinary SQL: a similarity query can `JOIN` and `WHERE` against relational
  columns in one statement, which a separate vector database cannot do.
- No dimension ceiling that matters, and no index restrictions.
- Free managed Postgres with pgvector is available from several providers.

**Negative**

- pgvector must be available on the chosen host. **Verified in week 1** — see A7.
- Behaviour differs slightly between pgvector versions (for example, `NULL` vector distance ordering
  changed between 0.5.1 and 0.7.0). Pin the extension version and record it.

**Neutral**

- Team must learn a small amount of pgvector syntax. Roughly an afternoon.

## Verification

- [ ] **W1** — confirm the chosen free host supports `CREATE EXTENSION vector` (Mohamed Salah)
- [ ] **W1** — record the pgvector version in `docs/03-architecture.md`
- [ ] **W2** — `docker compose up` gives a working local Postgres with the extension enabled
- [ ] **W18** — HNSW index present and used; verify with `EXPLAIN`
