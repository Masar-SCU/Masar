# ADR-0007 — Atomic Roadmap replaces phase-based scheduling

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** Abdelrahman, Osama, Mohamed Yasser, Ziad, Ahmed Yousef, Mazen, Yousef Khaled, Mohamed Salah · **Extends:** [ADR-0006](0006-model-based-recommendation.md)

---

## Context

The initial Masar design organized student learning paths into coarse, calendar-oriented phases (e.g., Phase 1 Foundations, Phase 2 Core, Phase 3 Advanced), assuming 40 hours of study per phase and tracking progress via subjective percentages and coarse resource links.

This approach presented critical educational and architectural flaws:

1. **Passive and Unpaced:** Students were presented with generic lists of external links (documentation, video courses) with no micro-pacing, resulting in cognitive overload and high dropout rates.
2. **Coarse Progress Feedback:** Progress only updated upon finishing massive phase blocks, providing no sense of daily accomplishment or momentum.
3. **Weak Mastery Verification:** Progress was self-reported without item-level verification, decoupling perceived advancement from actual capability.
4. **Rigid Calendar Assumptions:** The fixed 40-hour block structure failed to adapt to varying student pacing, available time, or prior knowledge.

To achieve Masar's core goal of guiding computer science students to industry readiness, the roadmap requires a granular, prerequisite-aware structure that supports daily practice and transparent, objective mastery tracking.

## Options considered

### A — Keep coarse phase-based scheduling

Retain the 3–4 phase structure with external resources and phase completion checkboxes.

- *Rejected:* Does not solve the drop-out problem, provides poor feedback granularity, and lacks verifiable mastery.

### B — Runtime dynamic DAG sequencing

A runtime AI or graph algorithm dynamically assembles a unique atomic path for every student on every request from an unconstrained pool of atoms.

- *Rejected:* High computational complexity, unpredictable learning trajectories, severe risk of breaking pedagogical progression, and lack of deterministic reproducibility across cohorts.

### C — Authored canonical DAG with deterministic pruning and placement *(chosen)*

Curricula are authored as structured, canonical sequences of Units, Sections, and Atoms (~4,050 atoms across supported careers). Prerequisites are explicitly defined. Onboarding placement assessments and checkpoint test-outs deterministically mark mastered atoms as `assumed_known`, pruning the active learning path while preserving the canonical pedagogical sequence.

## Decision

**Replace phase-based scheduling with an Atomic Roadmap: a deterministic, prerequisite-aware directed acyclic graph (DAG) of micro-lessons and units.**

1. **Hierarchy:** Career $\to$ Stage (Foundations, Core, Specialization) $\to$ Unit (e.g., "Relational Modeling") $\to$ Section $\to$ Atom (micro-lesson, 3–8 minutes).
2. **Deterministic Sequencing:** The learning sequence within each unit and across prerequisite chains is canonical and authored. Path generation (`/api/path`) is 100% deterministic:
   - Atoms marked `assumed_known` or `completed` are skipped.
   - The first uncompleted atom whose prerequisites are fully satisfied is designated `in_progress`.
   - Remaining downstream atoms are marked `locked`.
3. **Mastery Derivation:** Skill proficiency levels (0–5, per [ADR-0004](0004-proficiency-scale.md)) are derived mathematically from atom states ($m_b \ge 0.80$), eliminating manual percentage inputs.
4. **API Evolution:** Supersedes legacy phase endpoints (`/api/roadmap`, FR-16..19); introduces API v2 path endpoints (`/api/path`, `/api/lessons/**`).

## Consequences

### Positive

- **High Daily Engagement:** Granular 3–8 minute atoms lower activation energy, enabling daily habit formation.
- **Verifiable Mastery:** Every atom requires active exercise completion, guaranteeing demonstrated capability.
- **Deterministic & Fast:** Path calculation requires no LLM calls and executes in < 50 ms.
- **Smooth Readiness Progression:** Derived continuous mastery $c(s)$ rewards every single completed atom with immediate, visible progress.

### Negative

- **Significant Authoring Effort:** Designing ~4,050 atoms requires a scalable drafting pipeline ([ADR-0008](0008-content-authoring-pipeline.md)) and team authoring commitments.
- **Breaking Contract Change:** Deprecates coarse phase endpoints in favor of API v2.

### Neutral

- The 0–5 proficiency scale is preserved as the high-level representation for careers, gaps, and placement.

## Verification

- [ ] **W10** — Path generator unit tests confirm prerequisite gating and topological ordering across all career DAGs (Osama)
- [ ] **W12** — Placement assessment algorithm correctly marks band atoms as `assumed_known` without violating dependencies (Osama)
- [ ] **W18** — End-to-end path traversal from onboarding to Stage 1 completion validated in staging (Abdelrahman)
- [ ] **W23** — RQ3 evaluation: external faculty and industry review of atomic roadmap pedagogical validity (Ahmed Yousef)
