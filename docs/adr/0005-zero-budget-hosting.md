# ADR-0005 — Free-tier hosting with mandatory backups

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Abdelrahman, Mohamed Salah

---

## Context

Budget is **$0 for everything** ([C1](../02-requirements.md#6-constraints)). The system needs a static
site, two services, and a Postgres database with pgvector, in two environments (staging and production).

Free tiers have real, documented limitations that must be designed around rather than discovered:

- **Web services sleep when idle**, with cold starts of up to roughly 60 seconds on the first request.
- Some free managed Postgres instances **expire 30 days after creation**, with a short grace period, and
  then are deleted along with all data.
- Free databases commonly provide **no backups** and no managed connection pooling.
- Instances may be restarted by the provider at any time.
- Storage caps around 1 GB are typical — irrelevant here, since the full dataset is well under 100 MB
  ([§04 11](../04-data-model.md#11-data-volume-at-mvp)).

## Decision

**Use free tiers, but treat them as unreliable infrastructure and design accordingly.**

### Provider selection criteria, in order

1. **No credit card required**, so an accidental charge is structurally impossible.
2. **No database expiry clause.** A database that deletes itself after 30 days is disqualifying for a 35-week project.
3. **pgvector available** ([A7](../10-risks-and-assumptions.md#3-assumptions-register)).
4. Private networking, or at least an internal-only service option, for the AI service ([R-08](../10-risks-and-assumptions.md#r-08--the-ai-service-is-publicly-reachable-on-the-chosen-host--p2--i4--8)).
5. Docker image deployment, so the local and deployed environments match.
6. GitHub integration for automatic deploys from `main`.

Candidate options to evaluate in W1–W2, including the **GitHub Student Developer Pack**, which grants
students hosting and infrastructure credits and is the best available route to a tier without expiry
clauses. Record the final choice in `docs/03-architecture.md` once verified.

### Non-negotiable mitigations

These are requirements, not suggestions. A free tier with no backups and a possible expiry clause is
exactly how a project loses eight months of data in April.

| Mitigation | Detail | Owner |
|---|---|---|
| **Weekly `pg_dump`** | Automated, committed to a private backup location, retained for at least 8 weeks. Verified by a restore rehearsal in Slice 10. | Mohamed Salah |
| **Seed scripts are the source of truth** | All catalogue content is reproducible from versioned files in `seed/`. Losing the database costs an hour, not the project. | Mohamed Yasser |
| **Demo mode** | Runs entirely locally with no external calls ([§03 10](../03-architecture.md#10-demo-mode)). The defence never depends on a provider. | Mohamed Salah |
| **Scheduled warm-up** | Before any review or demo, hit the deployed endpoints to eliminate cold starts. | Mohamed Salah |
| **Cold-start UI** | A visible loading state on first request, never a blank screen or a raw timeout. | Ziad |
| **Expiry calendar reminders** | If any provider has a time limit, set a reminder at 50 % and 80 % of the window. | Mohamed Salah |

### Environment topology

| Environment | Purpose | Deploy trigger |
|---|---|---|
| **Local** | Development | `docker compose up` |
| **Staging** | Continuous verification, always current | Auto from `main` |
| **Production** | Reviews and the defence | Manual promotion from a git tag |

Separate databases per environment. Staging is reset freely; production is never pointed at a reset
script — the endpoint is blocked outright in production
([§07 9](../07-api-contract.md#9-advisor-and-admin)).

## Consequences

**Positive**

- Zero cost, with no possibility of an accidental bill.
- The team learns real deployment, which is worth having in the report.
- Designing for an unreliable platform produces genuinely better failure handling than designing for a
  reliable one — the loading states and demo mode exist *because* of these constraints.

**Negative**

- Cold starts make the first request slow. Mitigated by warm-ups and honest UI, and stated in
  [NFR-03](../02-requirements.md#nfr-03--availability).
- No managed backups, so backup discipline is entirely on us.
- Providers may change terms mid-project. Tracked as [R-04](../10-risks-and-assumptions.md#r-04--free-hosting-tiers-change-expire-or-throttle--p3--i4--12).

**Neutral**

- Migration to a paid tier later is a configuration change, since everything is containerised.

## Verification

- [ ] **W1** — provider selected against all six criteria; pgvector confirmed (Mohamed Salah)
- [ ] **W1** — confirm no database expiry clause, or set calendar reminders if one exists
- [ ] **W2** — staging deployed and auto-deploying from `main`
- [ ] **W2** — first `pg_dump` taken and stored
- [ ] **W6** — warm-up procedure documented and rehearsed before the mid-term review
- [ ] **W28** — **restore rehearsal**: destroy a staging database and rebuild it from a dump plus seed scripts
