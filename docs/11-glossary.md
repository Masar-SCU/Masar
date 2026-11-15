# 11 — Glossary

**Document owners:** Abdelrahman Megahed, Yousef Khaled · **Status:** Revised <2026-11-15> (atomic roadmap + defect fixes)

Use these exact terms in code, documentation, the UI, and the report. Synonyms are how a team ends up
with `skillGap`, `gapValue` and `deficit` meaning the same thing in three files.

---

## Domain terms

| Term | Definition | Do not call it |
|---|---|---|
| **Skill** | A single learnable technical or professional capability with a canonical name. | competency, ability, tech |
| **Canonical name** | The one display name for a skill. "PostgreSQL", never "Postgres". | title, label |
| **Alias** | An alternative string that maps to a canonical skill. Used by extraction and search. | synonym, tag |
| **Proficiency level** | Integer 0–5 with a written definition. See [ADR-0004](adr/0004-proficiency-scale.md). | percentage, score, rating |
| **Self level** | The level a student claims during onboarding or profile editing. Seed input for assumed atoms. | user level |
| **Calibrated level** | Historical diagnostic level from a quiz. Deprecated/superseded by placement. | verified level, tested level |
| **Effective level** | Derived from atom states (`STUDENT_SKILL_PROGRESS.level_derived` exposed via view `v_effective_level`). **The only level any calculation reads.** | current level in code |
| **Career** | A technology career path, e.g. Backend Development. One of six. | job, role, occupation, position |
| **Track** | A technology variant within a career, e.g. ".NET" inside Backend Development. | specialisation, flavour |
| **Requirement** | A `(skill, required level, importance)` triple attached to a career or track. | need, criterion |
| **Importance** | `0.0–1.0`. How much a skill matters for a career. Blended from postings, taxonomy and expert judgement. | weight, relevance |
| **OR-group** | A requirement group where satisfying one member is sufficient (`any_of`). | alternative, choice |
| **Representative** | The member of an OR-group with the highest satisfaction; the only one reported. Selected once at path creation. | winner, best match |
| **Gap** | `max(0, required − effective)`. An integer 0–5. | deficit, shortfall, missing |
| **Priority** | `gap × importance`. Range 0–5. Drives severity and ordering. | weight, urgency, rank |
| **Severity** | One of Strength · Met · Minor · Moderate · Critical. A pure function of priority. | status, level, colour |
| **Satisfaction** | `min(effective, required) / required`. Range 0–1. | coverage, fulfilment |
| **Readiness** | `100 × Σ imp·min(c, req) / Σ imp·req` using continuous mastery `c(s)`. Headline percentage. | fit score, match, completion |
| **Match score** | `0–100` for how well a career fits a student. Distinct from readiness. | fit, compatibility |
| **Prerequisite** | An edge in the skill DAG (`hard` or `soft`, with `min_level`) or atom DAG. | dependency, requirement |
| **Atom** | The smallest learnable unit: one learning objective, one micro-lesson (≤ 150 words), 3–6 exercises, 3–8 minutes. Objective is one sentence starting "The student can …" and contains no "and". | concept, task, micro-course |
| **Unit** | An ordered group of ~12–25 atoms on one theme (≈ 1–2 h), with a guidebook and a checkpoint at the end. | module, chapter, block |
| **Stage** | A group of units in a path: `Foundations`, `Core`, `Advanced`, `Job-ready`. | tier, level, semester |
| **Atomic Roadmap** | The student's personal path: ordered units of their (career, track) path, atoms filtered by scope and knowledge. Supersedes the old phase-based roadmap. | phase plan, linear roadmap |
| **Lesson** | One interactive play session of an atom (3–6 exercises). Other session kinds: `review`, `placement`, `checkpoint`. | lecture, quiz, drill |
| **Checkpoint** | An end-of-unit test of 8 exercises; also serves as the unit "test-out" mechanism. | midterm, unit exam |
| **Band** | The proficiency level an atom moves the learner toward (1..5). An atom in band *b* is needed to go from level *b−1* to *b*. | difficulty band, skill tier |
| **XP** | Experience points awarded for completing lessons, reviews, checkpoints, and project milestones. | points, score, credits |
| **Streak** | Count of consecutive active local calendar days with XP > 0, bounded by the student's IANA timezone. | daily count, login streak |
| **Daily goal** | Target daily study time in minutes (10, 20, 30, 45, 60 min), derived from weekly study hours. | study quota, daily target |
| **Placement** | Adaptive diagnostic probe (wizard Step 3 or taken later) verifying claimed skills up to level 4. | calibration quiz, entrance test |
| **Review** | Spaced-repetition study session (Leitner boxes 1..5) scheduling previously learned atoms. | flashcards, revision |
| **Assumed** | Atom treated as known because of placement, test-out, course mapping, or a self-claim. Verified or unverified. | skipped, waived |
| **Learned / Shaky** | Atom status: lesson passed with first-try accuracy ≥ 60 % (`learned`) or below 60 % (`shaky`). | completed / weak |
| **Content tier** | Authoring milestone threshold: Tier 1 (≈ 1,000 atoms, W17), Tier 2 (≈ 2,200 atoms, W23), Tier 3 (≈ 4,050 atoms, W28). | release phase, content drop |
| **Published atom** | Atom that has passed automated CI checks and human review; visible to students. | live atom, active atom |
| **Roadmap** | *Superseded / Retired.* See **Atomic Roadmap**. | — |
| **Phase** | *Superseded / Retired.* (Use **Unit** or **Stage**). | — |
| **Roadmap item** | *Superseded / Retired.* (Use **Atom**). | — |
| **Calibration quiz** | *Superseded / Retired.* (Use **Placement** or **Checkpoint**). | — |
| **Capstone** | The final project node of the Job-ready stage, covering ≥ 3 gap skills. | final project, big project |
| **Resource** | A curated external deep-dive link attached to an atom. Never generated. | course, material, content |
| **Project** | A hands-on build recommended for gap coverage and stage completion. | assignment, exercise |
| **Course** | A university course in the department catalogue. | subject, class, module |
| **Coverage level** | The proficiency level a course plausibly delivers. | course level, grade |
| **Snapshot** | One frozen, versioned collection of job postings. | dataset, corpus, scrape |

---

## System terms

| Term | Definition |
|---|---|
| **Baseline** | The deterministic career-ranking algorithm retained for evaluation and as a documented FastAPI fallback; it is not the primary production predictor. |
| **Model-first** | AI is the primary career-ranking mechanism; deterministic logic enforces mandatory recommendation constraints. |
| **Reranker** | The model component that scores candidate careers after semantic scoring and provides the primary ranking signal. |
| **Recommendation service** | The internal FastAPI service that performs embedding, semantic scoring, reranking, mandatory constraints and final recommendation. |
| **Mandatory constraint** | A deterministic condition that the recommendation model is not allowed to violate. |
| **Degraded mode** | Running with the primary recommendation model unavailable while the documented fallback is used. |
| **Demo mode** | `MASAR_DEMO_MODE=true`. Fixed fixtures, zero external calls. |
| **Static content bundle** | Versioned static JSON bundle per unit (`/content/v{n}/unit-{id}.json`) served from static storage for fast, reliable lesson delivery. |
| **Input hash** | Hash of path inputs (path version, mode, or_group_choices, content version, algorithm version) ensuring determinism. |
| **Algorithm version** | Stamped on paths and recommendations so output remains reproducible. |
| **Engine A / B / C / D** | Extraction · Model-first career recommendation · Mentor · Offline content drafting. See [§06](06-ai-engines.md). |
| **Context DTO** | The sanitised, allow-listed object sent to the LLM. Assembled by .NET, re-validated by FastAPI. Contains no student identifiers. |
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
| `OD-` | Open decision | OD-1 |

Cite these in commit messages and test names: `feat(gap): implement severity classification (FR-12)`,
`GapCalculator_Priority_IsMonotone_US04_AC2`.

---

## Terms deliberately avoided

| Avoid | Because | Use |
|---|---|---|
| "AI-powered" as a description of the product | The core is deterministic. The phrase overclaims and invites a question we would then have to walk back. | "AI-assisted" for the mentor; name the specific engine elsewhere |
| Percentages for skill levels | Implies precision self-assessment cannot deliver. [ADR-0004](adr/0004-proficiency-scale.md) | Levels 0–5 |
| "Machine learning" for the gap engine | It is arithmetic. Calling it ML is inaccurate and would not survive one follow-up question. | "Weighted scoring", "deterministic calculation" |
| "Job matching" | Out of scope; we match careers, not vacancies. | "Career matching" |
| "Recommendation engine" for the roadmap | It is a curated path over an atomic graph, not a recommender. | "Atomic roadmap engine", "path builder" |
| "AI-generated content" | Implies unreviewed machine output; content is generated offline and strictly reviewed by humans before publication. | "AI-drafted, human-reviewed content" |
| "Hearts / Lives" | Blocking practice contradicts learning and has no place in a $0 product; mistakes only re-queue exercises. | Re-queuing mistakes during lesson play |

---

**Next:** [12 — References](12-references.md)
