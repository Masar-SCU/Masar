# 10 — Risks & Assumptions

**Document owner:** Abdelrahman Megahed · **Reviewed:** monthly at the team sync

A risk register is only useful if every entry has a **trigger** (how you know it is happening) and an
**owner** (who acts). A list of worries without those is decoration.

Scoring: probability and impact each 1–5; **exposure = P × I**. Anything at exposure ≥ 12 gets a
mitigation that is actively worked, not merely written down.

---

## 1. Top risks

### R-01 · A single person owns all three AI engines · **P4 × I5 = 20**

Ahmed Yousef owns extraction, embeddings and evaluation. In the original plan this was worse — no
backup was named anywhere. An exam week, an illness, or a lost laptop stalls three deliverables.

- **Trigger:** any AI task slips more than 5 days, or Ahmed is unreachable for 3 days.
- **Owner:** Abdelrahman.
- **Mitigation:** Ziad is a named backup and pairs on the AI service client from Slice 6. All model code lives in the repository with a written README, never only on one machine. Every engine has a non-AI fallback, so an unfinished engine degrades the product rather than blocking it.
- **Residual:** evaluation quality would suffer most, since it is the hardest part to hand over.

### R-02 · The two core engines are owned by one person · **P3 × I5 = 15**

Osama owns `GapCalculator`, `ReadinessCalculator` and `RoadmapScheduler` — the features that
**cannot** be cut.

- **Trigger:** Slice 2 or Slice 3 slips by more than a week.
- **Owner:** Abdelrahman.
- **Mitigation:** Mohamed Yasser is the named backup and reviews every PR in these areas. The algorithms are fully specified in [§05](05-features-mvp.md) with worked numeric examples, so a second person can implement them from the document alone. `Domain` has no infrastructure dependencies, making it the easiest code in the project to pick up.

### R-03 · Job posting data cannot be collected legally or in sufficient volume · **P3 × I4 = 12**

Importance weights, regional weighting and RQ2 all depend on the corpus, and many job sites prohibit
scraping in their terms.

- **Trigger:** fewer than 300 postings collected by the end of W17.
- **Owner:** Ahmed Yousef.
- **Mitigation:** [ADR-0003](adr/0003-job-data-sourcing.md) prefers permitted sources — public APIs, openly licensed datasets, and manual collection with per-source terms recorded. **The fallback is already designed:** importance weights come from O\*NET (CC BY 4.0) plus ESCO plus expert judgement, and the blend in [§04 5.3](04-data-model.md#53-importance-weights) simply reweights. Regional weighting is dropped and reported as future work.
- **Note:** this is precisely why large-scale scraping is out of scope. The risk is contained by design rather than mitigated after the fact.

### R-04 · Free hosting tiers change, expire, or throttle · **P3 × I4 = 12**

Verified constraints on common free tiers: web services sleep after inactivity with cold starts up to
roughly 60 s; some free managed Postgres instances **expire 30 days after creation** and provide no
backups; free instances may be restarted at any time.

- **Trigger:** any expiry notice, or a staging outage lasting more than 24 hours.
- **Owner:** Mohamed Salah.
- **Mitigation:** [ADR-0005](adr/0005-zero-budget-hosting.md) prefers providers with no database expiry clause. **A weekly `pg_dump` to a private backup location is non-negotiable** — a free tier with no backups plus an expiry clause is exactly how a project loses its data in April. Demo mode ([§03 10](03-architecture.md#10-demo-mode)) means the defence never depends on any provider. GitHub Student Developer Pack credits are checked as a supplementary option.

### R-05 · Free LLM tier quota or availability changes · **P3 × I3 = 9**

- **Trigger:** sustained 429 responses, or a provider policy change.
- **Owner:** Ziad.
- **Mitigation:** the mentor is 🔵 Should-have, not MVP. A provider-agnostic interface ([ADR-0002](adr/0002-llm-provider.md)) allows a swap in hours. Templated fallback covers every question intent. Embeddings run locally, so **exactly one feature** is exposed to this risk.

### R-06 · Curating 160 skills, 350 resources and 60 projects takes longer than planned · **P4 × I3 = 12**

The most commonly underestimated task in projects like this: unglamorous, large, and easy to defer
until it blocks everything.

- **Trigger:** fewer than 100 skills or 200 resources by the end of W17.
- **Owner:** Mohamed Yasser.
- **Mitigation:** staged targets — 60 skills in Slice 1, 140 by W17. Work is parallelised across four people during the exam period, seeded from O\*NET/ESCO rather than written from scratch, and the admin panel exists specifically to make curation fast. The coverage report ([§05 5.16](05-features-mvp.md#516-admin-content-panel)) surfaces gaps automatically.
- **Fallback:** reduce to 4 careers instead of 6. A complete 4 beats a hollow 6.

### R-07 · Fewer than 15 students available for the usability study · **P3 × I3 = 9**

- **Trigger:** fewer than 8 recruited by the end of W16.
- **Owner:** Yousef Khaled.
- **Mitigation:** recruit early through the department with the supervisor's endorsement, run round 1 during the exam period while students are on campus, and accept remote participation.
- **Fallback:** report a qualitative study with the sample-size limitation stated explicitly in [§09 7](09-evaluation.md#7-threats-to-validity). A small honest study beats an invented large one.

### R-08 · The AI service is publicly reachable on the chosen host · **P2 × I4 = 8**

Some free tiers do not offer private networking. A publicly reachable AI service means anyone can
drain the LLM quota.

- **Trigger:** discovered during Slice 6 deployment.
- **Owner:** Mohamed Salah.
- **Mitigation:** shared-secret header on every request with a constant-time comparison, IP allow-listing where available, rate limiting at the AI service itself in addition to the API, and a monitored request counter.

### R-09 · Department course catalogue is unavailable · **P2 × I3 = 6**

- **Trigger:** not obtained by the end of Slice 7.
- **Owner:** Abdelrahman, with Dr. Hend.
- **Mitigation:** request it in **week 1**, not week 24. This is a dependency on another person's time, which is always the slowest kind. Partial data still supports mapping the ~15 core courses.
- **Fallback:** the feature is cut at contingency position 5, and the novelty claim is reduced accordingly.

### R-10 · Integration fails late because services were built in isolation · **P2 × I5 = 10**

The classic multi-person project failure — and the specific outcome the original horizontal phase plan
would have produced.

- **Trigger:** any slice ending without a working end-to-end path.
- **Owner:** Abdelrahman.
- **Mitigation:** the entire slice structure exists to prevent this. Slice 0 connects all three services in week 1, every slice ends deployed to staging, and the API contract is frozen in week 2 and generated rather than hand-written.

### R-11 · Scope creep · **P4 × I3 = 12**

Eight motivated people will invent features. The original document already listed résumé builders and
interview simulators in two contradictory tiers.

- **Trigger:** any work started that is not in the current slice.
- **Owner:** Abdelrahman.
- **Mitigation:** the priority matrix in [§08 2](08-plan-and-timeline.md#2-priority-matrix--single-source-of-truth) is the single source of truth, and ⚪ Later items are listed explicitly so they read as already-considered-and-deferred rather than as exciting new ideas. Unassigned issues are not scheduled work. Feature freeze on 17 Apr 2027.

### R-12 · Exam periods consume more capacity than assumed · **P4 × I2 = 8**

- **Trigger:** two consecutive weeks below half the expected throughput.
- **Owner:** Abdelrahman.
- **Mitigation:** W15–W17 is already planned at ~40 % capacity with low-coupling work; five weeks of margin sit between feature freeze and the defence; and the contingency cut order is decided in advance.

### R-13 · Gap or roadmap output looks obviously wrong to a reviewer · **P2 × I4 = 8**

The original spec's gap table was internally inconsistent and its roadmap did not follow from its own
gaps. Left unfixed, a committee would have found it within minutes.

- **Trigger:** any inconsistency found in review or usability testing.
- **Owner:** Osama.
- **Mitigation:** severity is a pure function of `priority`, which makes non-monotone ordering impossible ([§05 5.5](05-features-mvp.md#55-skill-gap-analysis--core)). Property-based tests assert monotonicity and prerequisite correctness, expert review (RQ3) checks plausibility, and the worked examples in this documentation set are machine-verified.

### R-14 · A team member leaves or disengages · **P2 × I4 = 8**

- **Trigger:** no contribution for 10 consecutive days.
- **Owner:** Abdelrahman, escalating to Dr. Hend.
- **Mitigation:** every critical workstream has a named backup ([§08 7](08-plan-and-timeline.md#7-raci-by-workstream)), everything lives in the repository rather than on one laptop, and twice-weekly written standups make disengagement visible within days instead of weeks.

---

## 2. Risk summary

Ordered by exposure. The top six are the ones to actually watch.

| ID | Risk | P | I | Exposure | Owner |
|---|---|:-:|:-:|:-:|---|
| R-01 | Single owner for all AI engines | 4 | 5 | **20** | Abdelrahman |
| R-02 | Single owner for the core engines | 3 | 5 | **15** | Abdelrahman |
| R-03 | Job data unavailable | 3 | 4 | **12** | Ahmed Yousef |
| R-04 | Free hosting expires or throttles | 3 | 4 | **12** | Mohamed Salah |
| R-06 | Data curation overruns | 4 | 3 | **12** | Mohamed Yasser |
| R-11 | Scope creep | 4 | 3 | **12** | Abdelrahman |
| R-10 | Late integration failure | 2 | 5 | 10 | Abdelrahman |
| R-05 | LLM tier changes | 3 | 3 | 9 | Ziad |
| R-07 | Too few study participants | 3 | 3 | 9 | Yousef Khaled |
| R-08 | AI service publicly reachable | 2 | 4 | 8 | Mohamed Salah |
| R-12 | Exam capacity loss | 4 | 2 | 8 | Abdelrahman |
| R-13 | Visibly wrong output | 2 | 4 | 8 | Osama |
| R-14 | Member disengages | 2 | 4 | 8 | Abdelrahman |
| R-09 | Course catalogue unavailable | 2 | 3 | 6 | Abdelrahman |

**The two highest risks are about people, not technology.** That is usually true of student projects
and usually absent from their documentation. The mitigation for both is identical: named backups,
everything in the repository, and fallbacks that let an unfinished component degrade the product
rather than stop it.

---

## 3. Assumptions register

Repeated from [§02 5](02-requirements.md#5-assumptions) with owners and verification dates, because an
assumption nobody re-checks is just a hope.

| # | Assumption | Owner | Verify by | If false |
|---|---|---|---|---|
| A1 | Department course list is obtainable | Abdelrahman | W4 | Map ~15 core courses only |
| A2 | A free LLM tier remains available | Ziad | W20 | Templated mentor only |
| A3 | ≥ 500 postings collectible under acceptable terms | Ahmed Yousef | W17 | Taxonomy-only weights; drop regional weighting |
| A4 | ≥ 15 students available for the study | Yousef Khaled | W16 | Qualitative study, limitation stated |
| A5 | ~10 productive hours/week per member | Abdelrahman | W6, then monthly | Cut in contingency order |
| A6 | Free hosting remains sufficient | Mohamed Salah | W2, then monthly | Local demo mode |
| A7 | pgvector is available on the chosen free Postgres | Mohamed Salah | **W1** | Store vectors as `float[]` and compute cosine in application code — viable at 160 rows |
| A8 | Dr. Hend can review roadmaps and labels | Abdelrahman | W20 | One external practitioner reviewer, noted as a limitation |

**A7 is verified in week 1**, before any code depends on it. Discovering in week 18 that the chosen
free Postgres does not support the `vector` extension would be an expensive surprise; discovering it in
week 1 costs an afternoon.

---

## 4. Decision log

Decisions with lasting consequences get an ADR. These are already taken:

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-database-and-vector-store.md) | PostgreSQL + pgvector as the single store | Accepted |
| [0002](adr/0002-llm-provider.md) | Provider-abstracted free-tier LLM | Accepted |
| [0003](adr/0003-job-data-sourcing.md) | Frozen, permitted-source snapshot; no scraping | Accepted |
| [0004](adr/0004-proficiency-scale.md) | 0–5 integer scale, not percentages | Accepted |
| [0005](adr/0005-zero-budget-hosting.md) | Free-tier hosting with mandatory backups | Accepted |
| [0006](adr/0006-deterministic-core.md) | Deterministic core, AI as enhancement | Accepted |

Changing any of these requires a new ADR that supersedes the old one. Do not silently contradict an
accepted decision in code — that is how a team ends up with two conflicting architectures and nobody
able to say which one is current.

---

**Next:** [11 — Glossary](11-glossary.md)
