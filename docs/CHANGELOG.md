# Masar Documentation Revision Changelog

**Revision Date:** 2026-11-17 · **Baseline Specification Version:** 2.0.0 · **Lead Architect:** Abdelrahman Megahed

This document provides a comprehensive audit trail of all defect corrections (Part A: F-01 to F-41), architectural improvements (Part B: B.1 to B.14), the major pedagogical overhaul to an Atomic Roadmap (Part C), and the alignment fixes addressing PR #41 peer reviews.

---

## 0. Peer Review Alignment & Timeline Re-baseline (2026-11-17)

Following technical peer review from Ziad Ahmed (`ziad-Ahmed401`) on PR #41, twelve specification alignments and a master timeline re-baseline were executed:

1. **Roadmap Stages Alignment ([ADR-0007](adr/0007-atomic-roadmap.md)):** Unified stage enumeration to the 4 canonical stages (`Foundations`, `Core`, `Advanced`, `Job-ready`) indexed 1..4 across `04-data-model.md`, `05-features-mvp.md`, and `07-api-contract.md`.
2. **Atom Corpus Milestone Targets ([ADR-0008](adr/0008-content-authoring-pipeline.md)):** Aligned targets to Tier 1 = ~1,000 atoms (Foundations + Backend .NET track), Tier 2 = ~2,200 cumulative atoms (Frontend + Data Engineering), and Tier 3 = ~4,050 cumulative atoms.
3. **Exam Streak Pause Duration ([13 §6](13-learning-experience.md#6-gamification-and-engagement-rules)):** Capped exam streak pause to 14 consecutive days to match FR-47 and US-13.
4. **XP Economy Calibration ([05 §5.18](05-features-mvp.md#518-gamification)):** Synchronized XP reward values across all specifications: Lesson 15 XP (+5 first-pass bonus for $\ge 80\%$), Review 10 XP, Unit Checkpoint 50 XP, Stage Project 100 XP.
5. **Mastery State Constraint Alignment ([ADR-0007](adr/0007-atomic-roadmap.md), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)):** Replaced informal `assumed_known`/`completed` terminology with canonical states `learned`, `shaky`, and `assumed` strictly matching PostgreSQL constraint `CHECK (status IN ('learned', 'shaky', 'assumed'))`.
6. **API Route Parameterization ([03 §7.2](03-architecture.md#72-path-and-lesson-flow--static-content-with-authoritative-re-grading), [05 §5.9](05-features-mvp.md#59-lessons-mastery-and-progress), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)):** Standardized completion route references to canonical `POST /api/lessons/{sessionId}/complete`.
7. **Assessment Integrity & Key Exposure ([ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)):** Explicitly limited static client bundling with answer keys to low-stakes formative practice; high-stakes Unit Checkpoints and Placement Test-Outs omit answer keys from client payloads and evaluate strictly server-side.
8. **Blind-Solve Verification Protocol ([14 §2](14-content-pipeline.md#2-five-stage-pipeline-architecture)):** Mandated that 100% of individual exercises where the blind solver disagreed with the declared key require human review and resolution before sign-off.
9. **LLM Provider Quota Scope ([ADR-0002](adr/0002-llm-provider.md), [06 §1](06-ai-engines.md#1-position-of-ai-in-masar)):** Clarified that the AI Mentor (Engine C) is the sole *runtime/user-facing* LLM consumer, while offline content drafting (Engine D) operates strictly as a development-time tool using developer API quotas.
10. **Checkpoint Passing Accuracy ([13 §3](13-learning-experience.md#3-path-screen-specification), [13 §6](13-learning-experience.md#6-gamification-and-engagement-rules)):** Harmonized passing accuracy to $\ge 75\%$ (6 of 8 exercises correct), matching `05-features-mvp.md` §5.2.
11. **Unit Checkpoint vs. Stage Capstone Distinction ([13 §3](13-learning-experience.md#3-path-screen-specification)):** Distinctly separated Unit Checkpoints (end of 3–5 atom units, 8 questions, +50 XP) from Stage Capstone Projects (end of stage, portfolio build, +100 XP).
12. **Payload Property Casing ([ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)):** Standardized payload fields to `camelCase` (`atomId`, `sessionId`, `durationSeconds`, `attempts`).
13. **Master Timeline Re-baseline ([08-plan-and-timeline.md](08-plan-and-timeline.md)):** Re-baselined execution from scratch starting **Tuesday 17 November 2026** through **Wednesday 30 June 2027 (32 weeks / 225 days)**, establishing S0–S10 vertical slices with feature freeze on Sun 7 June 2027.

---

## 1. Executive Summary of Changes

On 15 November 2026, the Masar engineering documentation underwent a comprehensive architectural and pedagogical overhaul:

1. **Resolved 41 Documented Defects (F-01 through F-41):** Eliminated internal contradictions, fixed arithmetic errors, unified terminology, added missing constraints, and restored consistency across project schedules, data models, requirements, and evaluation protocols.
2. **Transitioned from Coarse Phases to an Atomic Roadmap (Part C):** Replaced passive, unpaced 40-hour phase scheduling with an active, prerequisite-aware directed acyclic graph (DAG) of ~4,050 micro-lessons (atoms, 3–8 minutes each), complete with unit guidebooks, stage checkpoints, and milestone projects.
3. **Derived Mathematical Mastery:** Replaced subjective percentage inputs with an objective continuous mastery metric $c(s)$ derived directly from completed learning atoms, preserving the 0–5 integer proficiency scale while making progress smooth and encouraging.
4. **Separated Deterministic Core from AI Services:** Clarified that the daily learning loop (path sequencing, lesson grading, mastery derivation, and readiness calculation) is **100% deterministic with zero AI calls**, reserving AI for candidate career recommendation (FastAPI), job skill extraction (offline), content drafting (offline CLI), and retrieval-augmented mentoring.
5. **Authored New Architecture & Experience Specifications:** Added `13-learning-experience.md`, `14-content-pipeline.md`, `15-open-decisions.md`, and four new Architecture Decision Records (`ADR-0007` through `ADR-0010`).

---

## 2. Audit of Defect Fixes (Part A: F-01 to F-41)

### A1. Direct Contradictions and Arithmetic Bugs

- **F-01 (Done):** Replaced legacy calibration quiz references across `01-project-overview.md` and `05-features-mvp.md` with the unified 20-item onboarding placement assessment and stage checkpoints.
- **F-02 (Done):** Shortened and re-scoped NFR-04 in `02-requirements.md` and `13-learning-experience.md`: first lesson started $\le 10$ min unaided (placement skipped), $\le 15$ min with placement.
- **F-03 (Done):** Corrected feature-freeze margin in `02-requirements.md` (C2) and `08-plan-and-timeline.md`: 17 April 2027 to 20 May 2027 is verified as exactly **33 days $\approx 4.7$ weeks** (not 5 weeks).
- **F-04 (Done):** Fixed error code semantics in `07-api-contract.md` §2: removed "including cross-student access" from HTTP 403; confirmed cross-student resource access returns HTTP 404 to prevent resource existence leakage.
- **F-05 (Done):** Recomputed and corrected career recommendation worked example in `05-features-mvp.md` §5.4: baseline formula yields Frontend 67, Backend 59, Data 57, AI/ML 52, DevOps 34, Cyber 30. Model-first scoring yields Frontend 74, AI/ML 72, Backend 71, Data 69, DevOps 52, Cyber 44, correctly demonstrating how the model reorders AI/ML above Backend.
- **F-06 (Done):** Fixed circular dependency between Onboarding Wizard and Curriculum Mapping in `05-features-mvp.md` and `08-plan-and-timeline.md`: manual skill entry is the baseline; course pre-fill is an optional enhancement.
- **F-07 (Done):** Verified and corrected Abdelrahman's RACI count in `08-plan-and-timeline.md` §7: updated from 11 rows to exactly **8 rows**.
- **F-08 (Done):** Reconciled diagnostic pool counts: placement assessment items are drawn directly from authored atom probe pools (at least 1 diagnostic exercise per skill band).
- **F-09 (Done):** Bumped API contract version to `2.0.0` in `07-api-contract.md`, added `GET /api/meta` endpoint, and introduced formal API contract changelog.

### A2. Algorithm and Data Model Defects

- **F-10 (Done):** Resolved calibration vs. progress contradiction in `04-data-model.md` and `05-features-mvp.md`: student proficiency is derived directly from completed atoms, updating dynamically upon lesson completion.
- **F-11 (Done):** Replaced conflicting hour estimation formulas in `04-data-model.md` §7.3 with concrete atom-based estimates (3–8 minutes per atom, total hours = atoms $\times$ 5 min / 60).
- **F-12 (Done):** Added PostgreSQL 15+ `UNIQUE NULLS NOT DISTINCT` constraint to `user_career_target` in `04-data-model.md` to prevent duplicate active career selections.
- **F-13 (Done):** Specified case-insensitive unique indexes using `LOWER(TRIM(name))` across skills, careers, and course entities in `04-data-model.md`.
- **F-14 (Done):** Documented default required-level rule in `04-data-model.md` and `05-features-mvp.md`: missing skill levels default to Level 3 (Independent) for primary skills and Level 2 for secondary skills, reproducing all 11 Omar examples.
- **F-15 (Done):** Added explicit `status` enum (`draft`, `reviewed`, `approved`, `published`, `archived`) to content entities in `04-data-model.md`.
- **F-16 (Done):** Clarified decimal precision for weights ($0.00$–$1.00$) and continuous readiness scores ($0.0\%$–$100.0\%$) in `04-data-model.md` and `05-features-mvp.md`.
- **F-17 (Done):** Updated assessment timing in `05-features-mvp.md` and `06-ai-engines.md`: 20 Likert items require $\le 4$ minutes.
- **F-18 (Done):** Replaced coarse phase completion progress bars with continuous readiness and unit completion rings in `05-features-mvp.md`.
- **F-19 (Done):** Unified resource taxonomy in `04-data-model.md`: external documentation links serve as supplementary references alongside core interactive atoms.
- **F-20 (Done):** Added database indices on foreign keys (`user_id`, `career_id`, `atom_id`) and search vectors in `04-data-model.md`.
- **F-21 (Done):** Clarified prerequisite cycle detection: validated at content compilation time via topological sort (Kahn's algorithm) in CI and at runtime in .NET.

### A3. Architecture and AI Engine Defects

- **F-22 (Done):** Introduced 30-item evaluation dev-set in `06-ai-engines.md` and `09-evaluation.md` for hyperparameter tuning separate from test sets.
- **F-23 (Done):** Formally specified mandatory recommendation constraints in `06-ai-engines.md` §3.2 (domain filtering, excluded careers, minimum content threshold $\ge 80\%$ published atoms).
- **F-24 (Done):** Specified Sentence-BERT embedding dimension (384-d, `all-MiniLM-L6-v2`) and cosine distance metrics in `06-ai-engines.md`.
- **F-25 (Done):** Grounded AI Mentor RAG (Engine C) in authored atom content, retrieving relevant atom explanations and injecting strict prompt delimiters.
- **F-26 (Done):** Added Addendum to `ADR-0001` detailing pgvector usage for candidate persistence and offline atom retrieval.
- **F-27 (Done):** Specified cold-start mitigations and loading states across `03-architecture.md` and `13-learning-experience.md`.
- **F-28 (Done):** Added Addendum to `ADR-0002` detailing LLM data-use terms review, student privacy disclosure, and developer quota isolation.
- **F-29 (Done):** Added `Engine D` (Offline Content Drafting) to `06-ai-engines.md` with independent quota and validation gates.

### A4. Plan, Evaluation, and Scope Defects

- **F-30 (Done):** Re-baselined plan in `08-plan-and-timeline.md` as of Sunday 15 November 2026 (Week 9), noting Mid-Term Review (W6, 1 Nov) is completed.
- **F-31 (Done):** Added `status` column with `to be confirmed by Abdelrahman` across all slices in `08-plan-and-timeline.md`.
- **F-32 (Done):** Formally inserted Exam Block (W15–W17, 40% capacity) into `08-plan-and-timeline.md`.
- **F-33 (Done):** Added Risk `R-15` (Content Authoring Bottleneck, score 25) as top critical risk in `10-risks-and-assumptions.md`.
- **F-34 (Done):** Re-balanced team RACI matrix in `08-plan-and-timeline.md` §7, delegating content tooling to Mohamed Salah and UI review to Mazen/Ziad.
- **F-35 (Done):** Updated `09-evaluation.md` with bootstrap 95% confidence intervals, content audit protocols (RQ3), and mentor grounding metrics (RQ4).
- **F-36 (Done):** Added comparative analysis of gamified learning platforms (Duolingo, Khan Academy, Codecademy, boot.dev) to `01-project-overview.md` §6.
- **F-37 (Done):** Qualified novelty claims in `01-project-overview.md` §5: softened to "we are not aware of... literature check scheduled (12 §7)".
- **F-38 (Done):** Renumbered sections 1–12 and added explicit HTML anchors (`<a id="rq1">` through `<a id="rq8">`) in `09-evaluation.md`.
- **F-39 (Done):** Reconciled labor market snapshot wording in `01-project-overview.md`: clarified snapshot is dated and refreshing is a documented offline procedure.
- **F-40 (Done):** Enhanced `scripts/check-links.py` to index HTML anchor tags and integrated Mermaid syntax validation in CI documentation checks.
- **F-41 (Done):** Recomputed data volume table in `04-data-model.md` §11: atomic roadmap expands database size to 100–400 MB; established 30-day raw attempt retention policy.

---

## 3. Improvements Implemented (Part B: B.1 to B.14)

- **B.1 (Core):** Atomic knowledge graph with unit checkpoints and placement diagnostics ([05 §5.6](05-features-mvp.md#56-atomic-roadmap--core), [13](13-learning-experience.md)).
- **B.2 (Core):** Derived continuous mastery $c(s) = L(s) + \min(1, m_{L+1}/0.80)$ ensuring every completed atom rewards the learner ([05 §5.7](05-features-mvp.md#57-career-readiness-score)).
- **B.3 (Should):** Spaced repetition review queue using a 3-box Leitner model in the Practice tab ([05 §5.19](05-features-mvp.md#519-review-and-retention)).
- **B.4 (Should):** Course-to-atom curriculum mapping, enabling granular gap analysis against academic coursework ([05 §5.11](05-features-mvp.md#511-university-curriculum-mapping)).
- **B.5 (Should):** Anonymized advisor cohort analytics identifying high-failure bottleneck atoms ($k \ge 5$) ([05 §5.13](05-features-mvp.md#atom-level-cohort-analytics)).
- **B.6 (Should):** Retrieval-augmented AI mentor grounded in authored learning atoms with deep links ([06 §4](06-ai-engines.md#4-engine-c--context-aware-ai-mentor-rag)).
- **B.7 (Should):** Content immutability and versioning rules: permanent atom slugs with `replaced_by` version pointers ([04 §7.2](04-data-model.md#72-atoms-and-learning-units)).
- **B.8 (Should):** Static JSON unit content bundles served from global CDN for sub-100ms lesson transitions ([03 §7.2](03-architecture.md#72-path-and-lesson-flow--static-content-with-authoritative-re-grading), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)).
- **B.9 (Could):** Interactive "What-If" career explorer allowing students to simulate career pivots without altering active profiles ([05 §5.14](05-features-mvp.md#514-what-if-target-comparison)).
- **B.10 (Could):** Egyptian tech internship readiness checklist evaluating portfolio requirements ([05 §5.12](05-features-mvp.md#512-internship-readiness-checklist)).
- **B.11 (Core):** Positive-only gamification engine: XP, streaks, customizable daily goals, and zero punitive lockout mechanics ([05 §5.18](05-features-mvp.md#518-gamification), [ADR-0009](adr/0009-gamification-and-engagement-ethics.md)).
- **B.12 (Core):** Focus-mode Lesson Player supporting multiple exercise modalities with instant local evaluation and authoritative re-grading ([05 §5.17](05-features-mvp.md#517-lesson-player), [13 §4](13-learning-experience.md#4-lesson-player-specification)).
- **B.13 (Core):** Offline content drafting CLI (`content-cli`) with automated blind-solve testing ([14 §2](14-content-pipeline.md#2-five-stage-pipeline-architecture), [ADR-0008](adr/0008-content-authoring-pipeline.md)).
- **B.14 (Core):** Milestone portfolio projects modeled as stage terminal nodes on the path ([05 §5.8](05-features-mvp.md#58-project-recommendations)).

---

## 4. Documentation Inventory & Revision Status

| File | Status | Summary of Changes |
|---|---|---|
| `docs/01-project-overview.md` | Revised | Added revision note, updated problem P4, rewrote O5/O6, added O10, softened contribution #2, expanded related work with gamified systems, balanced team roles. |
| `docs/02-requirements.md` | Revised | Rewrote US-00/02/05/06; added US-12..18; superseded FR-16..19 & FR-23..25; added FR-37..54; updated NFRs; updated C2 to 33 days. |
| `docs/03-architecture.md` | Revised | Updated stack table; added static CDN bundle delivery; documented `PathBuilder` and `MasteryCalculator`; updated sequence diagrams and cold-start mitigations. |
| `docs/04-data-model.md` | Revised | Added D5, D6; updated ER diagram; added `UNIQUE NULLS NOT DISTINCT`; lower index; atom entity schema; recomputed volume table (100–400 MB). |
| `docs/05-features-mvp.md` | Revised | Updated feature index (5.0–5.20); corrected worked examples; added Atomic Roadmap, continuous readiness formula, Lesson Player, Gamification, and Spaced Review. |
| `docs/06-ai-engines.md` | Revised | Added Engine D; refined Engine B semantic scoring and constraints; added atom retrieval to Engine C; separated dev authoring quotas. |
| `docs/07-api-contract.md` | Revised | Bumped to `v2.0.0`; fixed 403/404 error semantics; added path, lesson, review, game, meta, and content admin endpoints; added changelog. |
| `docs/08-plan-and-timeline.md` | Revised | Re-baselined at W9; updated slice plan with S3′, S4′, Exam Block, S5′; added confirmation status column; updated contingency order. |
| `docs/09-evaluation.md` | Revised | Renumbered 1–12; added short anchors `<a id="rq1">`..`<a id="rq8">`; added bootstrap 95% CI, RQ3 content audit, RQ4 mentor audit, RQ7/RQ8 exploratory studies. |
| `docs/10-risks-and-assumptions.md` | Revised | Added R-15 (content bottleneck, score 25) through R-24; updated summary table; logged ADR-0007..0010. |
| `docs/11-glossary.md` | Revised | Added atomic concepts (Atom, Unit, Stage, XP, Streak, Daily Goal); marked retired terms (Phase, Roadmap item, Calibration quiz); banned deceptive terms. |
| `docs/12-references.md` | Revised | Added citations for knowledge tracing, spaced repetition, gamification, and related systems ([23]–[38]); updated footer navigation link. |
| `docs/13-learning-experience.md` | **Created** | Comprehensive learning experience specification: design principles, mobile IA, path screen, lesson player, onboarding, gamification, WCAG accessibility, telemetry. |
| `docs/14-content-pipeline.md` | **Created** | Offline content authoring pipeline specification: 5-stage lifecycle, blind-solve CI test, zero-hallucination link policy, content tiers, team re-balance. |
| `docs/15-open-decisions.md` | **Created** | Open decisions register detailing OD-1 through OD-10 with options, default fallbacks, owners, and resolution deadlines. |
| `docs/adr/0001-database-and-vector-store.md` | Revised | Added Addendum 2026-11-15 (F-26: pgvector persistence and offline atom retrieval scope). |
| `docs/adr/0002-llm-provider.md` | Revised | Added Addendum 2026-11-15 (F-28: data-use terms review, student consent, offline dev quota). |
| `docs/adr/0004-proficiency-scale.md` | Revised | Added header link and Addendum 2026-11-15 (canonical integer scale vs. continuous derived mastery). |
| `docs/adr/0005-zero-budget-hosting.md` | Revised | Added Addendum 2026-11-15 (static CDN bundle distribution, keep-alive pings, open decisions OD-5 & OD-9). |
| `docs/adr/0006-model-based-recommendation.md` | Revised | Added header link and Addendum 2026-11-15 (semantic profile scoring, mandatory constraints, extension by ADR-0007). |
| `docs/adr/0007-atomic-roadmap.md` | **Created** | ADR-0007: Atomic Roadmap replaces phase-based scheduling. |
| `docs/adr/0008-content-authoring-pipeline.md` | **Created** | ADR-0008: Content authoring pipeline: LLM-assisted drafts, CI validation, human review. |
| `docs/adr/0009-gamification-and-engagement-ethics.md` | **Created** | ADR-0009: Gamification and engagement ethics. |
| `docs/adr/0010-lesson-grading-authority-and-content-delivery.md` | **Created** | ADR-0010: Lesson grading authority and static content delivery. |
| `docs/adr/README.md` | Revised | Indexed ADR-0007 through ADR-0010. |
| `scripts/check-links.py` | Revised | Enhanced markdown link validation with HTML anchor (`<a id="...">`) support. |
| `docs/CHANGELOG.md` | **Created** | Full audit record of revision process. |

---

*End of Revision Changelog.*
