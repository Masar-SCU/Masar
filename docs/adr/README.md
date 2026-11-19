# Architecture Decision Records

An ADR records a decision that is expensive to reverse, together with the reasoning and the options
rejected. The point is that in April nobody has to reconstruct why a choice was made, and nobody
quietly re-litigates it.

## Index

| # | Decision | Status | Why it matters |
|---|---|---|---|
| [0001](0001-database-and-vector-store.md) | PostgreSQL + pgvector as the single store | Accepted | Resolves the unspecified "SQL Server / PostgreSQL" and the unaddressed vector storage question |
| [0002](0002-llm-provider.md) | Provider-abstracted free-tier LLM | Accepted | $0 budget, and free tiers change faster than the project runs |
| [0003](0003-job-data-sourcing.md) | Frozen, permitted-source snapshot; no scraping | Accepted | Removes the legal, technical and reproducibility risk from the critical path |
| [0004](0004-proficiency-scale.md) | 0–5 integer scale, not percentages | Accepted | Removes false precision and makes gap arithmetic meaningful |
| [0005](0005-zero-budget-hosting.md) | Free-tier hosting with mandatory backups | Accepted | Free tiers sleep, expire and lack backups; design for it |
| [0006](0006-model-based-recommendation.md) | Model-first career recommendation through FastAPI; deterministic logic limited to mandatory constraints and documented fallback | Accepted | Resolves the AI-role contradiction while keeping hard constraints, reliability, and reproducibility under deterministic control |
| [0007](0007-atomic-roadmap.md) | Atomic Roadmap replaces phase-based scheduling | Accepted | Replaces coarse, unpaced time blocks with granular units and micro-lessons (~4,050 atoms) anchored to prerequisite DAG |
| [0008](0008-content-authoring-pipeline.md) | Content authoring pipeline: LLM-assisted drafts, CI validation, human review | Accepted | Solves content authoring cost while guaranteeing accuracy, schema validity, and verified non-hallucinated resources |
| [0009](0009-gamification-and-engagement-ethics.md) | Gamification and engagement ethics | Accepted | Introduces XP, streaks, daily goals, and Leitner reviews while prohibiting predatory/stressful dark patterns (no blocking hearts/lives) |
| [0010](0010-lesson-grading-authority-and-content-delivery.md) | Lesson grading authority and static content delivery | Accepted | Instant client-side exercise feedback with authoritative backend re-grading, anti-cheat validation, and CDN bundle distribution |

## When to write one

Write an ADR when a decision:

- is expensive to reverse (database, language, hosting, core algorithm shape),
- has been argued about more than once,
- resolves a contradiction between existing documents, or
- would look arbitrary to someone reading the code in six months.

Do **not** write one for naming, formatting, library minor versions, or anything a code comment covers.

## Format

```markdown
# ADR-NNNN — Short imperative title

**Status:** Proposed | Accepted | Superseded by ADR-NNNN
**Date:** YYYY-MM-DD · **Deciders:** names

## Context
The forces at play: constraints, requirements, and what makes this a real decision.

## Options considered
Each option with its actual trade-offs. Include the rejected ones — a decision with
no rejected alternatives was not a decision.

## Decision
What we are doing, stated plainly.

## Consequences
Positive, negative, and neutral. The negative section is the one that earns trust.

## Verification
Dated checklist items with owners, so the decision is confirmed rather than assumed.
```

## Rules

1. **Never edit an accepted ADR to change its decision.** Write a new one that supersedes it, and mark
   the old one `Superseded by ADR-NNNN`. The history is the value.
2. Numbers are permanent. Never reuse or renumber.
3. Every ADR ends with a **Verification** section. A decision nobody checks is a guess with formatting.
4. Link ADRs from the documents they affect, so a reader encountering a surprising choice finds the reason immediately.
