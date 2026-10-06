# 11 — Glossary

Use these exact terms in code, documentation, the UI, and the report. Synonyms are how a team ends up
with `skillGap`, `gapValue` and `deficit` meaning the same thing in three files.

---

## Domain terms

| Term | Definition | Do not call it |
|---|---|---|
| **Skill** | A single learnable technical or professional capability with a canonical name. | competency, ability, tech |
| **Canonical name** | The one display name for a skill. "PostgreSQL", never "Postgres". | title, label |
| **Alias** | An alternative string that maps to a canonical skill. Used by extraction and search. | synonym, tag |
| **Proficiency level** | Integer 0–5 with a written definition. See ADR-0004. | percentage, score, rating |
| **Self level** | The level a student claims. | user level |
| **Calibrated level** | The level a quiz measured. Overrides the self level. | verified level, tested level |
| **Effective level** | `COALESCE(calibrated, self)`. **The only level any calculation reads.** | current level in code |
| **Career** | A technology career path, e.g. Backend Development. One of six. | job, role, occupation, position |
| **Track** | A technology variant within a career, e.g. ".NET" inside Backend Development. | specialisation, flavour |
| **Requirement** | A `(skill, required level, importance)` triple attached to a career or track. | need, criterion |
| **Importance** | `0.0–1.0`. How much a skill matters for a career. Blended from postings, taxonomy and expert judgement. | weight, relevance |
| **OR-group** | A requirement group where satisfying one member is sufficient (`any_of`). | alternative, choice |
| **Representative** | The member of an OR-group with the highest satisfaction; the only one reported. | winner, best match |
| **Gap** | `max(0, required − effective)`. An integer 0–5. | deficit, shortfall, missing |
| **Priority** | `gap × importance`. Range 0–5. Drives severity and ordering. | weight, urgency, rank |
| **Severity** | One of Strength · Met · Minor · Moderate · Critical. A pure function of priority. | status, level, colour |
| **Satisfaction** | `min(effective, required) / required`. Range 0–1. | coverage, fulfilment |
| **Readiness** | `100 × Σ imp·min(cur,req) / Σ imp·req`. The headline percentage. | fit score, match, completion |
| **Match score** | `0–100` for how well a career fits a student. Distinct from readiness. | fit, compatibility |
| **Prerequisite** | An edge in the skill DAG, `hard` or `soft`. | dependency, requirement |
| **Roadmap** | The complete generated plan for one student and one target. | path, plan, curriculum |
| **Phase** | A group of roadmap items with an hour budget and target dates. | stage, step, milestone |
| **Roadmap item** | One `skill: from level → to level` unit of work, with a resource. | task, lesson, module |
| **Capstone** | The final project of a roadmap, covering ≥ 3 gap skills. | final project, big project |
| **Resource** | A curated external link that teaches a skill. Never generated. | course, material, content |
| **Project** | A hands-on build recommended for gap coverage. | assignment, exercise |
| **Course** | A university course in the department catalogue. | subject, class, module |
| **Coverage level** | The proficiency level a course plausibly delivers. | course level, grade |
| **Snapshot** | One frozen, versioned collection of job postings. | dataset, corpus, scrape |

---

## System terms

| Term | Definition |
|---|---|
| **Baseline** | The deterministic career-ranking algorithm retained for evaluation and as a documented FastAPI fallback; it is not the primary production predictor. |
| **Model-first** | AI is the primary career-ranking mechanism; deterministic logic enforces mandatory recommendation constraints. |
| **Reranker** | The model component that scores candidate careers after retrieval and provides the primary ranking signal. |
| **Recommendation service** | The internal FastAPI service that performs embedding, candidate retrieval, reranking, mandatory constraints and final recommendation. |
| **Mandatory constraint** | A deterministic condition that the model is not allowed to violate. |
| **Degraded mode** | Running with the primary recommendation model unavailable while the documented FastAPI fallback is used. |
| **Demo mode** | `MASAR_DEMO_MODE=true`. Fixed fixtures, zero external calls. |
| **Input hash** | Hash of all roadmap inputs. Proves determinism (FR-18). |
| **Algorithm version** | Stamped on each roadmap so old output stays explainable. |
| **Engine A / B / C** | Extraction · Model-first career recommendation · Mentor. See [§06](06-ai-engines.md). |
| **Context DTO** | The sanitised, allow-listed object sent to the LLM. Contains no identifiers. |
| **Slice** | A vertical increment that is demonstrable end to end. See [§08](08-plan-and-timeline.md). |

---

## Identifier conventions

| Prefix | Meaning | Example |
|---|---|---|
| `FR-` | Functional requirement | FR-12 |
| `NFR-` | Non-functional requirement | NFR-05 |
| `US-` | User story | US-04 |
| `AC` | Acceptance criterion within a story | US-04 AC2 |
| `P` | Persona | P2 (Omar) |
| `O` | Project objective | O4 |
| `RQ` | Research question | RQ1 |
| `R-` | Risk | R-03 |
| `A` | Assumption | A7 |
| `C` | Constraint | C1 |
| `ADR-` | Architecture decision record | ADR-0001 |
| `D` | Data-model design decision | D2 |
| `S` | Slice | S3 |

Cite these in commit messages and test names: `feat(gap): implement severity classification (FR-12)`,
`GapCalculator_Priority_IsMonotone_US04_AC2`.

---

## Terms deliberately avoided

| Avoid | Because | Use |
|---|---|---|
| "AI-powered" as a description of the product | The core is deterministic. The phrase overclaims and invites a question we would then have to walk back. | "AI-assisted" for the mentor; name the specific engine elsewhere |
| Percentages for skill levels | Implies precision self-assessment cannot deliver. ADR-0004 | Levels 0–5 |
| "Machine learning" for the gap engine | It is arithmetic. Calling it ML is inaccurate and would not survive one follow-up question. | "Weighted scoring", "deterministic calculation" |
| "Job matching" | Out of scope; we match careers, not vacancies. | "Career matching" |
| "Recommendation engine" for the roadmap | It is a scheduler over a DAG, not a recommender. | "Roadmap scheduler" |

---

**Next:** [12 — References](12-references.md)
