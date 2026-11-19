# 10 — Risks & Assumptions

**Document owner:** Abdelrahman Megahed · **Status:** Revised <2026-11-15> (atomic roadmap + defect fixes) · **Reviewed:** monthly at team sync

A risk register is only useful if every entry has a **trigger** (how you know it is happening) and an
**owner** (who acts). A list of worries without those is decoration.

Scoring: probability and impact each 1–5; **exposure = P × I**. Anything at exposure $\ge 12$ gets a
mitigation that is actively worked, not merely written down.

---

## 1. Top risks

### R-15 · Content volume for ~4,050 atoms overwhelms team capacity · **P5 × I5 = 25**

Hand-authoring 4,050 micro-lessons and ~16,000 exercises at 20 min/atom would require ~1,350 hours, which is completely impossible for an 8-person team.

- **Trigger:** $< 600$ published atoms by W17, or $< 1,500$ published atoms by W23.
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Execute the offline content factory pipeline ([14 — Content Pipeline](14-content-pipeline.md)): LLM-assisted drafting with strict schema constraints, automated blind-solve validation, and human review ($\approx 4$ min/atom review budget, $\approx 3.5$ h/week across 5 reviewers). Tooling owned by Mohamed Salah.
- **Fallback (R-06):** Reduce full content depth to 3–4 core careers (Backend .NET, Frontend/Full-Stack, Data), providing outlines for remaining careers. Stated honestly in the final report.

### R-01 · Single person owns all runtime AI services · **P4 × I5 = 20**

Ahmed Yousef owns extraction, sentence embeddings, recommendation, and AI mentor intelligence. In the original plan, no backup was named anywhere.

- **Trigger:** Any AI deliverable slips $> 5$ days, or Ahmed is unreachable for 3 days.
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Ziad pairs on the AI service client. Content factory CLI tooling is transferred to Mohamed Salah ([F-33](10-risks-and-assumptions.md)). Open Decision OD-6 nominates Mohamed Yasser or Mohamed Salah for read access and reviews on FastAPI code from Slice 6.
- **Residual:** A second AI-capable developer remains a known gap; recommendation fallback inside FastAPI protects the core demo.

### R-16 · LLM-drafted learning content contains subtle errors or hallucinations · **P4 × I4 = 16**

AI-drafted micro-lessons could introduce subtle conceptual bugs, incorrect code outputs, or flawed exercise keys.

- **Trigger:** Exercise error reports $> 5\%$ in pilot or blind-solve disagreement $> 10\%$.
- **Owner:** Ahmed Yousef (checks) · Mohamed Yasser (curation).
- **Mitigation:** Automated CI blind-solve validation (second model pass answers without the key; discrepancies flagged); automated code syntax/execution check in CI; strict human review checklist; double human review on level 4–5 atoms; in-player "Report a problem" button ([FR-50](02-requirements.md#fr-50)). External URLs are rejected by CI.

### R-17 · Mid-project architecture redesign at Week 9 creates execution churn · **P4 × I4 = 16**

Transitioning from phase scheduling to the Duolingo-style atomic roadmap at W9 requires schema migrations, API contract changes, and UI redesign.

- **Trigger:** S3′ deliverables slip past W11 (5 Dec 2026).
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Re-baseline plan (§08 §0); freeze API contract v2.0.0 by W10 ([ADR-0007](adr/0007-atomic-roadmap.md)); zero parallel legacy maintenance (clean cutover). Pilot unit (`sql-fundamentals`) verifies the complete vertical loop before mass authoring.

### R-02 · Single person owns core domain calculators · **P3 × I5 = 15**

Osama owns `PathBuilder`, `MasteryCalculator`, `GapCalculator`, `ReadinessCalculator`, `XpCalculator`, and `StreakCalculator`.

- **Trigger:** S3′ or S4′ domain deliverables slip $> 7$ days.
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Mohamed Yasser is the named consulted backup and reviews all PRs. Domain classes are pure functions over plain objects with an injected `IClock` and zero I/O dependencies, making them fully documented and unit-testable.

### R-03 · Job posting data cannot be collected legally or in sufficient volume · **P3 × I4 = 12**

- **Trigger:** Fewer than 300 postings collected by end of W17.
- **Owner:** Ahmed Yousef.
- **Mitigation:** [ADR-0003](adr/0003-job-data-sourcing.md) uses permitted public APIs and open datasets. If corpus collection lags, importance weights fall back to O\*NET and ESCO taxonomies plus expert review. Regional weighting is dropped only in that fallback.

<a id="r-04"></a>

### R-04 · Free hosting tiers sleep, expire, or throttle · **P3 × I4 = 12**

Free web services sleep after inactivity (up to 60 s cold start); managed databases may lack automated backups.

- **Trigger:** Service cold-start latency $> 10$ s, or database expiry warning.
- **Owner:** Mohamed Salah.
- **Mitigation:** Pre-rendered static content bundles (`/content/v{n}/*.json`) served from static CDN (Cloudflare Pages / Vercel), ensuring lessons start instantly ([ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)). Client evaluates exercises locally; automated uptime ping keeps backend warm during cohort hours. Weekly automated `pg_dump` backups; offline demo mode ([ADR-0005](adr/0005-zero-budget-hosting.md)).

### R-06 · Curation of deep-dive resources and projects overruns · **P4 × I3 = 12**

- **Trigger:** Fewer than 100 resources or 20 projects by W17.
- **Owner:** Mohamed Yasser.
- **Mitigation:** Scope contained to ~250 deep-dive links (optional reading attached to atoms) and 40–60 stage projects. Resources are curated links only (never LLM-generated).

### R-11 · Scope creep beyond core learning loop · **P4 × I3 = 12**

- **Trigger:** Unassigned issues created or non-core feature development started.
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Strict priority matrix in [§08 2](08-plan-and-timeline.md#2-priority-matrix--single-source-of-truth). Leagues, quests, and complex resume builders are designated ⚪ Later/Could and cut first. Feature freeze on Mon 7 Jun 2027 is non-negotiable.

### R-18 · Frontend team overloaded by gamified interactive components · **P3 × I4 = 12**

Building the winding path, interactive exercise types, XP animations, and review queue could overwhelm frontend capacity.

- **Trigger:** Lesson player prototype not interactive by W11.
- **Owner:** Ziad (Lead Frontend).
- **Mitigation:** Radix headless primitives; path nodes use standard CSS/SVG; list virtualisation via TanStack Virtual renders current unit $\pm 2$ only; non-executing structured exercises avoid code sandbox complexity; leagues and quests deferred to Could-have.

### R-19 · Host cold starts degrade the micro-lesson experience · **P4 × I3 = 12**

A 60 s host wake-up destroys the feeling of a fast 5-minute Duolingo-style lesson.

- **Trigger:** Lesson loading screen $> 2$ s on mobile.
- **Owner:** Mohamed Salah · Ziad.
- **Mitigation:** Static bundles pre-fetched and cached locally; lesson sessions start immediately against cached content; answer evaluation is instant on client; completion requests queue locally and retry with idempotency keys; uptime keep-alive ping.

### R-20 · Content licensing and third-party copyright claims · **P3 × I4 = 12**

- **Trigger:** Content similarity check matches external copyrighted roadmap text.
- **Owner:** Abdelrahman Megahed.
- **Mitigation:** Original phrasing mandatory across all atoms ([NFR-15](02-requirements.md#nfr-15--legal-and-licensing)). External roadmaps referenced for topic scope only; review checklist explicitly checks originality.

### R-21 · Free-tier RAM exceeded by Python ML runtime · **P3 × I4 = 12**

FastAPI + PyTorch + sentence-transformers could exceed the 512 MB memory limit of free container hosting (F-27).

- **Trigger:** Container RSS exceeds 450 MB in CI staging.
- **Owner:** Ahmed Yousef.
- **Mitigation:** Use ONNX Runtime or 8-bit quantized models; load a single shared embedding model; precompute all static career and atom embeddings at seed time; profile container peak RSS in CI.

### R-22 · LLM free-tier terms allow training on user inputs · **P3 × I4 = 12**

- **Trigger:** Provider privacy terms state free-tier API inputs may be used for model training (F-28).
- **Owner:** Ahmed Yousef.
- **Mitigation:** Strict allow-list Sanitised Context DTO assembled in .NET strips all personal identifiers; student question scrubbed for emails, phone numbers, and URLs; student-facing disclosure and consent shown before first mentor interaction ([NFR-08](02-requirements.md#nfr-08--privacy-and-data-protection)).

### R-05 · Free LLM tier quota exhaustion or throttling · **P3 × I3 = 9**

- **Trigger:** 429 quota errors from provider.
- **Owner:** Ahmed Yousef.
- **Mitigation:** Mentor is Should-have. Provider-abstracted adapter ([ADR-0002](adr/0002-llm-provider.md)); daily system cap of 200 calls; stored exercise explanations handle "explain my answer" with 0 LLM calls; templated fallback handles all intents.

### R-07 · Fewer than 15 students available for usability study · **P3 × I3 = 9**

- **Trigger:** $< 8$ students recruited by W16.
- **Owner:** Yousef Khaled.
- **Mitigation:** Department recruitment endorsed by Dr. Hend; Round 1 scheduled during W15–W17 exams while students are on campus.

<a id="r-08"></a>

### R-08 · AI service publicly reachable on free hosting · **P2 × I4 = 8**

- **Trigger:** AI endpoint responds to unauthenticated public requests.
- **Owner:** Mohamed Salah.
- **Mitigation:** Private container networking; `X-Masar-Service-Key` constant-time verification; IP allow-listing where available.

### R-23 · Streak and daily goal timezone / DST bugs · **P3 × I2 = 6**

- **Trigger:** Students report lost streaks due to UTC vs local date mismatch.
- **Owner:** Osama.
- **Mitigation:** All date boundaries computed using student's IANA timezone (default `Africa/Cairo`) and injected `IClock` abstraction ([NFR-20](02-requirements.md#nfr-20--time-and-timezone-handling)); automated unit tests cover Egypt DST transition dates.

### R-24 · Database storage growth from exercise attempts · **P2 × I3 = 6**

- **Trigger:** Database volume exceeds 300 MB on free 1 GB tier.
- **Owner:** Mohamed Salah.
- **Mitigation:** Automated scheduled retention job purges raw `EXERCISE_ATTEMPT` records older than 30 days after aggregating them into permanent difficulty metrics ([NFR-21](02-requirements.md#nfr-21--data-retention)).

---

## 2. Risk summary

Ordered by exposure ($P \times I$):

| ID | Risk | P | I | Exposure | Owner |
|---|---|:---:|:---:|:---:|---|
| **R-15** | Content volume for ~4,050 atoms overwhelms capacity | 5 | 5 | **25** | Abdelrahman |
| **R-01** | Single person owns all runtime AI services | 4 | 5 | **20** | Abdelrahman |
| **R-16** | LLM-drafted content errors or hallucinations | 4 | 4 | **16** | Ahmed Yousef |
| **R-17** | Mid-project architecture redesign at W9 | 4 | 4 | **16** | Abdelrahman |
| **R-02** | Single person owns core domain calculators | 3 | 5 | **15** | Abdelrahman |
| **R-03** | Job posting data unavailable legally or in volume | 3 | 4 | **12** | Ahmed Yousef |
| **R-04** | Free hosting expires, sleeps, or throttles | 3 | 4 | **12** | Mohamed Salah |
| **R-06** | Curation of resources and projects overruns | 4 | 3 | **12** | Mohamed Yasser |
| **R-11** | Scope creep beyond core learning loop | 4 | 3 | **12** | Abdelrahman |
| **R-18** | Frontend overloaded by gamified UI | 3 | 4 | **12** | Ziad |
| **R-19** | Host cold starts degrade micro-lesson UX | 4 | 3 | **12** | Mohamed Salah |
| **R-20** | Content licensing and accidental copying | 3 | 4 | **12** | Abdelrahman |
| **R-21** | Free-tier RAM exceeded by Python ML runtime | 3 | 4 | **12** | Ahmed Yousef |
| **R-22** | LLM free-tier data-use terms | 3 | 4 | **12** | Ahmed Yousef |
| **R-10** | Integration fails late | 2 | 5 | 10 | Abdelrahman |
| **R-05** | Free LLM quota exhaustion | 3 | 3 | 9 | Ahmed Yousef |
| **R-07** | Fewer than 15 usability participants | 3 | 3 | 9 | Yousef Khaled |
| **R-08** | AI service publicly reachable | 2 | 4 | 8 | Mohamed Salah |
| **R-12** | Exam capacity reduction | 4 | 2 | 8 | Abdelrahman |
| **R-13** | Output looks visibly wrong to reviewer | 2 | 4 | 8 | Osama |
| **R-14** | Team member disengages | 2 | 4 | 8 | Abdelrahman |
| **R-23** | Streak and timezone / DST bugs | 3 | 2 | 6 | Osama |
| **R-24** | DB growth from exercise attempts | 2 | 3 | 6 | Mohamed Salah |
| **R-09** | Course catalogue unavailable | 2 | 3 | 6 | Abdelrahman |

---

## 3. Assumptions register

| # | Assumption | Owner | Verify by | If false |
|---|---|---|---|---|
| A1 | Department course list is obtainable | Abdelrahman | W4 | Map ~15 core courses only |
| A2 | Free LLM tier remains available | Ahmed Yousef | W20 | Templated mentor fallback |
| A3 | $\ge 500$ postings collectible under acceptable terms | Ahmed Yousef | W17 | Taxonomy-only weights; drop regional weighting |
| A4 | $\ge 15$ students available for usability study | Yousef Khaled | W16 | Qualitative study, sample size limitation stated |
| A5 | ~10 productive hours/week per member outside exams | Abdelrahman | Monthly | Cut scope in contingency order |
| A6 | Free hosting remains sufficient | Mohamed Salah | Monthly | Run local demo mode |
| A7 | pgvector available on free Postgres | Mohamed Salah | **W1** | Store vectors as `float[]` and compute in app code |
| A8 | Dr. Hend reviews roadmaps and labels | Abdelrahman | W20 | External practitioner reviewer |
| A9 | Free LLM quota suffices for offline batch content drafting | Ahmed Yousef | **W10** | Throttle drafting batches; use quantized local models |
| A10 | $\ge 5$ reviewers provide 3.5 h/week for content review | Abdelrahman | **W12** | Reduce full depth to 3–4 core careers (R-06) |
| A11 | Students value gamified atomic learning over linear task lists | Yousef Khaled | W16 | Usability study (RQ5/RQ8) tests engagement; toggleable plain list |
| A12 | Static CDN host serves pre-rendered unit content bundles without egress costs | Mohamed Salah | **W11** | Serve compressed bundles via .NET API endpoint |

---

## 4. Decision log

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-database-and-vector-store.md) | PostgreSQL + pgvector as single relational and vector store | Accepted (Addendum 2026-11-15) |
| [0002](adr/0002-llm-provider.md) | Provider-abstracted free-tier LLM with privacy allow-list | Accepted (Addendum 2026-11-15) |
| [0003](adr/0003-job-data-sourcing.md) | Frozen, permitted-source job snapshot; no scraping | Accepted |
| [0004](adr/0004-proficiency-scale.md) | 0–5 integer proficiency scale, not percentages | Accepted (Extended by ADR-0007) |
| [0005](adr/0005-zero-budget-hosting.md) | Free-tier hosting with mandatory backups and demo mode | Accepted (Addendum 2026-11-15) |
| [0006](adr/0006-model-based-recommendation.md) | Model-based career recommendation in FastAPI with fallback | Accepted (Extended by ADR-0007) |
| [0007](adr/0007-atomic-roadmap.md) | Atomic Roadmap replaces phase-based scheduling | **Accepted (2026-11-15)** |
| [0008](adr/0008-content-authoring-pipeline.md) | Offline LLM-assisted drafting with CI checks and human review | **Accepted (2026-11-15)** |
| [0009](adr/0009-gamification-and-engagement-ethics.md) | Gamification mechanics and engagement ethics | **Accepted (2026-11-15)** |
| [0010](adr/0010-lesson-grading-authority-and-content-delivery.md) | Authoritative server re-grading and static content bundles | **Accepted (2026-11-15)** |

---

**Next:** [11 — Glossary](11-glossary.md)
