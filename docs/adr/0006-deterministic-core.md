# ADR-0006 — Deterministic core, AI as enhancement

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** All

---

## Context

The original documents contradicted each other on the role of AI:

- `masar_full_specification.md`: "AI is the **core intelligence engine** powering Masar."
- `masar_project_document.tex`: "The **AI is an enabling component**, not the product itself."

And within the same specification, §10.5 and §10.6 walked the stronger claim back: "the underlying
skill ordering should remain controlled by the system's prerequisite graph", and "maintain a curated
database of resources rather than asking an LLM to generate URLs."

The practical consequence was worse than the inconsistency. The priority matrix marked **Semantic
Career Matching** and **Job-Skill NLP Extraction** as 🔴 MVP-Core — "the product is NOT demonstrable
without these" — which meant the entire demo depended on the two least predictable components, both
owned by one person, both requiring data that did not yet exist.

## Decision

> **AI provides intelligence for interpretation and matching. Deterministic code owns every decision
> that must be correct, ordered, or explainable.**

### Ownership by concern

| Concern | Owner | Why |
|---|---|---|
| Skill extraction from free text | **AI** | Unstructured input; no rule set generalises |
| Career matching | **Deterministic baseline + AI re-rank** | Baseline guarantees an answer; AI improves ranking |
| Gap classification | **Deterministic** | Must be reproducible and explainable to a student |
| Roadmap ordering | **Deterministic** | An LLM cannot be trusted to respect prerequisites |
| Readiness scoring | **Deterministic** | It is a stated formula; there is nothing to infer |
| Resource selection | **Curated database** | An LLM will confidently produce dead URLs |
| Gap rationale text | **Templates over stored data** | Must always render, cost nothing, and never hallucinate |
| Conversational mentoring | **AI** | Natural language over data already computed |

### Tier consequences

| Feature | Was | Now | Reason |
|---|---|---|---|
| Semantic Career Matching | 🔴 Core | 🟡 MVP (enhancer) | Baseline produces a ranking without it |
| Job-Skill NLP Extraction | 🔴 Core | 🟡 MVP (offline) | Runs at seed time; taxonomy weights are the fallback |
| AI Mentor | 🟡 MVP | 🔵 Should | Valuable, but never blocks a core flow |
| Skill-Gap Analysis | 🔴 Core | 🔴 Core | Unchanged — and now genuinely dependency-free |
| Roadmap Generation | 🔴 Core | 🔴 Core | Unchanged — and now genuinely dependency-free |

**The two 🔴 Core features make zero AI calls.** That is the substance of this decision.

## Rationale

**Reliability.** The demo on 20 May 2027 cannot fail because a free-tier quota reset, a model was
deprecated, or a network path was slow. Two features carry the project's value, and neither touches the
network beyond the database.

**Explainability.** A committee will ask "why did it recommend that?". A deterministic formula has an
answer that can be shown on screen ([§05 5.15](../05-features-mvp.md#515-explainability-panel)). An
LLM's ordering decision does not.

**Correctness.** Prerequisite ordering has a right answer. A topological sort produces it every time;
a language model produces it usually. "Usually" is not acceptable for the feature the project is named
after.

**Testability.** Pure functions over plain objects reach the 80 % coverage target in
[NFR-12](../02-requirements.md#nfr-12--testability) without mocking an external service. Property-based
tests can assert monotonicity and prerequisite correctness — impossible against a model.

**Honest claims.** Saying "AI-powered career guidance" when the core is arithmetic invites one follow-up
question that forces an embarrassing retreat. Saying "deterministic gap analysis with AI-assisted
matching and explanation" is accurate, more specific, and cannot be undermined.

**It does not reduce the AI contribution.** Three engines still exist, and each is now *measured*
([§09](../09-evaluation.md)) rather than asserted. A measured improvement from semantic re-ranking is a
stronger contribution than an unmeasured claim that the system "uses AI".

## Consequences

**Positive**

- No MVP-core feature can fail because of AI.
- Every AI component has a documented fallback ([§06 7](../06-ai-engines.md#7-fallbacks-and-graceful-degradation)).
- Core features are fast (no network hop), reproducible, and unit-testable.
- The AI contribution becomes an empirical claim rather than a marketing one.
- The project's exposure to free-tier quotas is confined to one should-have feature.

**Negative**

- Fallback paths are extra code. Roughly 200 lines total, and they are the code that makes the demo safe.
- "Deterministic gap analysis" sounds less impressive in a title than "AI-powered". Accuracy is worth more than the adjective.

**Neutral**

- Both a baseline and a hybrid path must be maintained. This is also what makes
  [RQ1](../09-evaluation.md#rq1--does-semantic-matching-beat-keyword-matching) answerable at all, so it
  is a cost that buys a result.

## Language rules that follow

| Do not say | Say |
|---|---|
| "AI-powered career guidance system" | "Career guidance with AI-assisted matching and mentoring" |
| "Machine learning determines your gaps" | "Weighted scoring determines your gaps" |
| "AI generates your roadmap" | "A prerequisite-aware scheduler generates your roadmap" |
| "AI recommends resources" | "Curated resources are matched to your roadmap" |

See [§11](../11-glossary.md#terms-deliberately-avoided).

## Verification

- [ ] **W6** — gap analysis and readiness demonstrably work with the AI service stopped
- [ ] **W10** — roadmap generation demonstrably works with the AI service stopped
- [ ] **W21** — an integration test asserts that stopping the AI service degrades rather than breaks the system
- [ ] **W23** — every fallback path has a test
- [ ] **W31** — the report uses the agreed language throughout
