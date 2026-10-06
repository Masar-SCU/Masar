# ADR-0006 — Model-Based Recommendation with Deterministic Foundations
**Status:** Accepted · **Date:** 2026-10-06 · **Deciders:** All

---

## Context

The original documents contradicted each other on the role of AI:
- `masar_full_specification.md`: "AI is the **core intelligence engine** powering Masar."
- `masar_project_document.tex`: "The **AI is an enabling component**, not the product itself."

The earlier decision therefore made deterministic code responsible for every decision that had to be
correct, ordered, or explainable, including career matching. That was useful for reliability, but it
made the career recommendation contribution a deterministic baseline with AI only as an enhancement.

The current architecture separates these concerns more precisely. Career prediction and ranking are
now model-first, while deterministic logic remains responsible for decisions that must obey explicit
hard rules or preserve guaranteed correctness, such as mandatory recommendation constraints, gap
classification, readiness calculation, and prerequisite-aware roadmap ordering.

The deterministic recommendation baseline is retained as an evaluation benchmark and as a documented
fallback. It is not the normal production predictor.

## Decision

> **AI provides the primary intelligence for career prediction and ranking. Deterministic logic enforces
> mandatory recommendation constraints and provides a documented fallback; deterministic foundation logic
> continues to own gap analysis, readiness, and prerequisite-aware roadmap ordering.**

### Ownership by concern

| **Concern** | **Owner** | **Why** |
|---|---|---|
| Skill extraction from free text | **AI / semantic pipeline** | Unstructured input; no compact rule set generalises well |
| Career matching | **Model-first AI recommendation service** | Career prediction is the primary AI contribution and is evaluated against the deterministic baseline |
| Mandatory career constraints | **Deterministic inside FastAPI** | Hard requirements must not be violated by the model |
| Deterministic recommendation baseline | **Deterministic inside FastAPI** | Reproducible benchmark and documented fallback |
| Gap classification | **Deterministic** | Must be reproducible and explainable to a student |
| Roadmap ordering | **Deterministic** | Prerequisites require guaranteed ordering |
| Readiness scoring | **Deterministic** | It is a stated formula; there is nothing to infer |
| Resource selection | **Curated database** | Resources must be valid and controlled |
| Gap rationale text | **Templates over stored data** | Must always render without hallucinated facts |
| Conversational mentoring | **AI, owned by Ahmed Yousef** | Natural language over data already computed; AI-side mentor logic stays inside FastAPI while UI/.NET request integration remain outside it |

### Recommendation pipeline

The complete career recommendation computation runs inside FastAPI:

```text
Student profile + candidate careers
        ↓
     Embedder
        ↓
Candidate Retrieval
        ↓
     Reranker
        ↓
Mandatory Constraints
        ↓
Final Recommendation
```

The .NET backend owns application state, public APIs, and database access. It loads the persisted career
embeddings and supplies the required candidate data/vectors to FastAPI. It does not calculate the career
recommendation score and does not perform candidate retrieval or reranking. FastAPI performs those operations
without direct PostgreSQL access.

### Evaluation and fallback

The deterministic recommendation baseline remains implemented inside FastAPI for two purposes:

1. **Evaluation:** RQ1 compares the model-first pipeline against the deterministic baseline.
2. **Fallback:** if primary model inference cannot complete, FastAPI can return a recommendation in
   `mode: "fallback"`.

The fallback is therefore part of the reliability design, not the normal ranking path.

## Rationale

**Model contribution.** Career prediction is the project's AI contribution and should be evaluated as
such rather than hidden behind a fixed weighted hybrid formula.

**Reliability.** Mandatory constraints, gap analysis, readiness, and prerequisite ordering remain
deterministic. A model cannot silently override a hard requirement or produce an invalid roadmap order.

**Explainability.** The system can distinguish between model-driven career ranking and deterministic
rules. This makes it possible to explain which part of the result came from the model and which part
was enforced by a rule.

**Testability.** The deterministic foundations remain directly unit-testable. The model-first recommendation
pipeline is evaluated with ranking metrics against a reproducible baseline rather than being assumed to
be correct.

**Graceful degradation.** If the model service is unavailable, FastAPI can use the deterministic
recommendation baseline. The rest of the deterministic foundations continues to work independently.

**Honest claims.** The project can accurately describe career recommendation as model-first while
still stating that gap analysis and roadmap ordering are deterministic and that the baseline is retained
for evaluation/fallback.

## Consequences

### Positive

- Career recommendation has a clear model-first AI contribution.
- Mandatory recommendation constraints remain deterministic and enforceable.
- Gap analysis, readiness, and roadmap ordering remain reproducible and explainable.
- The deterministic recommendation baseline remains available for RQ1 and service degradation.
- All career-prediction computation stays inside FastAPI rather than being split between FastAPI and .NET.

### Negative

- The project must maintain both the model-first recommendation pipeline and the deterministic baseline.
- Model quality must be evaluated empirically; the system cannot rely on a fixed formula as its primary
  predictor.
- FastAPI carries additional responsibility for embedding, candidate retrieval, reranking, constraints,
  and fallback execution.

### Neutral

- The deterministic foundations are not removed. They remain the authority for gap analysis, readiness, and
  prerequisite-aware roadmap generation.
- The deterministic recommendation baseline remains part of the implementation and evaluation, but it
  is no longer the production ranking mechanism.

## Language rules that follow

| **Do not say** | **Say** |
|---|---|
| "Deterministic code ranks careers in production" | "The model-first recommendation service ranks careers in production" |
| "AI generates the student's roadmap" | "A prerequisite-aware deterministic scheduler generates the roadmap" |
| "AI determines the student's gaps" | "Deterministic gap analysis determines the student's gaps" |
| "The .NET backend calculates the recommendation score" | "FastAPI performs the career recommendation computation" |
| "The baseline is the normal predictor" | "The baseline is retained for evaluation and fallback" |

## Verification

- **W6** — gap analysis and readiness demonstrably work with the AI service stopped
- **W10** — roadmap generation demonstrably works with the AI service stopped
- **W21** — an integration test asserts that stopping the AI service degrades recommendation rather than
  breaking the system
- **W23** — the model-first recommendation pipeline and deterministic fallback are evaluated separately
- **W31** — the report uses the agreed model-first/deterministic-foundations language throughout
