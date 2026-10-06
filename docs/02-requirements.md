# 02 — Requirements

**Document owners:** Abdelrahman Megahed, Yousef Khaled · **Status:** Baseline

Every requirement has a stable ID. Cite these IDs in commit messages, test names, and the
report. `FR` = functional, `NFR` = non-functional. Priorities: **M** = MVP-critical,
**S** = should-have, **C** = could-have.

---

## 1. Personas

Designing for a named person prevents building for an imaginary average user.

### P1 — Mariam, 3rd year, undecided

20, third year, strong in theory courses, no idea what she wants. Has written C++ and Java for
coursework and one small web project. Has heard "AI" and "cybersecurity" are good but cannot
tell them apart in practice. Overwhelmed by roadmap posts on social media.

**Wants:** to be told, with reasons, which two or three paths suit her, and what to do this month.
**Fails today because:** every resource assumes she has already chosen.

### P2 — Omar, 4th year, targeted but unsure

22, fourth year, has decided on backend development and is learning .NET on his own. Does not
know whether he is employable yet, or what he is still missing.

**Wants:** an honest readiness measurement against a real job standard, and a ranked list of what to fix first.
**Fails today because:** job posts list twenty requirements without saying which ones matter most.

### P3 — Dr. Hend, faculty advisor

Supervises many students. Wants to know where the cohort is collectively weak so teaching and
extra sessions can target real gaps, and wants evidence the tool gives sound advice.

**Wants:** a cohort view, and confidence that the recommendations are defensible.
**Fails today because:** the only available signal is exam grades.

---

## 2. User stories with acceptance criteria

Format: `As a <persona>, I want <capability>, so that <outcome>.`
A story is done only when every criterion passes. These become the E2E test names.

### US-00 — First-time onboarding wizard · *P1, P2* · **M**

> As a first-time student, I want a structured onboarding wizard (personality test → coursework & skills → targeted calibration → career fit & roadmap), so that I am guided step-by-step to an actionable plan without being overwhelmed.

- **AC1** Upon first login, I am automatically routed to the Onboarding Wizard, with step state persisted so I can leave and resume without data loss.
- **AC2** **Step 1 (Personality & Preferences):** I complete a 15–20 question Likert assessment evaluating my interests, problem-solving preferences, and work styles in under 5 minutes.
- **AC3** **Step 2 (Coursework & Skills):** I select my academic year and completed department courses, which automatically propose foundational skills with clear course-provenance badges, alongside a fast search to add any additional claimed skills on the 0–5 scale.
- **AC4** **Step 3 (Targeted Calibration):** For my top 2–3 claimed core technical skills with available quiz banks, I am offered a focused diagnostic quiz (5–8 questions each) to verify my baseline, with a clear option to calibrate remaining skills later.
- **AC5** **Step 4 (Career Fit & Selection):** I view ranked career recommendations showing both interest fit and skill fit, explore tracks, and select my committed target career.
- **AC6** **Step 5 (Roadmap Plan):** I enter my available weekly study hours, and the system generates my prerequisite-ordered roadmap and capstone project, seamlessly landing me on my active dashboard.

### US-01 — Build a skill profile · *P1, P2* · **M**

> As a student, I want to record my skills, courses and interests, so that recommendations reflect me.

- **AC1** I can register with an email and password, and log in.
- **AC2** I can set my academic year and select interests from a fixed list.
- **AC3** I can search the skill catalogue and self-rate any skill on a 0–5 scale, where each level has a written definition visible on screen.
- **AC4** I can mark courses I have completed from my department's course list.
- **AC5** My profile persists across sessions and is editable at any time.
- **AC6** A profile-completeness indicator tells me what is still missing.

### US-02 — Calibrate a claimed skill · *P2* · **M**

> As a student, I want a short quiz on the skills I claim, so my profile is not just an opinion.

- **AC1** For any claimed skill that has a quiz, I can take a 5–8 question quiz.
- **AC2** The result produces a *calibrated* level shown next to my *self-reported* level.
- **AC3** If the two differ by 2 levels or more, the system says so plainly, and gap analysis uses the calibrated value.
- **AC4** I may retake a quiz after 7 days; the most recent result wins.
- **AC5** Skipping calibration never blocks me — the profile still works with self-reported levels, flagged as unverified.

### US-03 — Discover matching careers · *P1* · **M**

> As a student, I want ranked career suggestions, so that I can narrow six options down to two.

- **AC1** After completing the assessment I see all 6 careers ranked with a match score from 0 to 100.
- **AC2** Each result shows **why** it matched: the specific skills and interests that contributed.
- **AC3** I can open any career to see its required skills with importance weights.
- **AC4** I can pick any career as my target, including one that was not ranked first.
- **AC5** The ASP.NET backend requests recommendations from the internal FastAPI recommendation service; the frontend never calls the AI service directly. If primary model inference fails while FastAPI remains available, the documented deterministic fallback may be used and the result is marked as degraded.

### US-04 — See my gap · *P1, P2* · **M**

> As a student, I want to see exactly which skills I lack for my target career, so I know what to work on.

- **AC1** I see every required skill with my level, the target level, the gap, and a severity class.
- **AC2** Severity ordering is consistent — no skill with a larger weighted gap is ever ranked below one with a smaller weighted gap.
- **AC3** Each gap has a one-sentence explanation of why it matters for that career.
- **AC4** I see a single **Career Readiness Score** as a percentage.
- **AC5** Skills where I exceed the target are shown as strengths, not omitted.
- **AC6** The full analysis renders in under 2 seconds ([NFR-01](#nfr-01--performance)).

### US-05 — Get an ordered plan · *P1, P2* · **M**

> As a student, I want a sequenced plan with a weekly time budget, so I can actually start.

- **AC1** I enter my available hours per week and the plan is scheduled against it.
- **AC2** The plan is split into phases, each with an estimated hour cost and a target date.
- **AC3** No item ever appears before its prerequisites.
- **AC4** Each item links to at least one curated, free resource.
- **AC5** The plan ends with a capstone project covering at least three of my gap skills.
- **AC6** Regenerating the plan with unchanged inputs produces an identical plan (determinism).

### US-06 — Track progress and re-plan · *P2* · **M**

> As a student, I want to mark items complete and watch the plan adapt, so effort feels rewarded.

- **AC1** I can mark any roadmap item complete, with a completion date.
- **AC2** Completion raises the relevant skill level by a documented rule and updates the readiness score.
- **AC3** The roadmap recalculates and reveals newly unblocked items.
- **AC4** I can see my readiness-score history as a chart over time.
- **AC5** I can undo a completion, and all derived values revert.

### US-07 — Ask the mentor · *P1, P2* · **S**

> As a student, I want to ask questions and get answers about *my* situation, not generic advice.

- **AC1** The mentor answers using my profile, target career, gaps and roadmap as context.
- **AC2** Answers reference which of my data points they used (e.g. "your Docker level is 1/5").
- **AC3** When asked something outside its knowledge it says so instead of inventing an answer.
- **AC4** When the LLM is unavailable, a templated explanation is shown instead of an error.
- **AC5** No other student's data can ever appear in my answers.

### US-08 — Compare targets before committing · *P1* · **S**

> As a student, I want to preview a different target career, so I can compare before deciding.

- **AC1** I can select any career and see the resulting readiness score and top 5 gaps without changing my saved target.
- **AC2** A side-by-side comparison of two careers is available.
- **AC3** Nothing is persisted until I explicitly confirm the change.

### US-09 — Prepare for an internship · *P2* · **S**

> As a student, I want to know whether I am ready to apply, so I stop guessing.

- **AC1** For my target career I see a checklist: minimum skill thresholds, portfolio projects, CV items.
- **AC2** Each item shows met / not met, derived from my actual profile.
- **AC3** An overall "internship-ready" state is shown, with the specific blockers listed.

### US-10 — See the cohort's gaps · *P3* · **S**

> As an advisor, I want to see where my students are collectively weak, so I can target teaching.

- **AC1** I see aggregate skill gaps across all consenting students as a ranked heatmap.
- **AC2** I can filter by academic year and by target career.
- **AC3** Individual students are **not** identifiable unless they explicitly opted in.
- **AC4** I can export the aggregate view as CSV.

### US-11 — Pre-fill from coursework · *P1* · **S**

> As a student, I want my completed courses to pre-fill skills, so I don't start from zero.

- **AC1** Selecting completed courses proposes skill levels derived from the course→skill map.
- **AC2** Proposals are clearly marked as proposals; I confirm or edit each one.
- **AC3** The source of each proposal is visible (e.g. "from CS302 Database Systems").

---

## 3. Functional requirements

| ID | Requirement | Pri | Story |
|---|---|---|---|
| **Accounts & profile** | | | |
| FR-00 | Persist onboarding wizard state and progress step, enabling seamless resume and step-gated onboarding completion | M | US-00 |
| FR-01 | Register with email + password; passwords stored using a modern KDF (see [NFR-06](#nfr-06--authentication)) | M | US-01 |
| FR-02 | Log in / log out; sessions via short-lived access token + refresh token | M | US-01 |
| FR-03 | Store academic year, interests, and career goal text | M | US-01 |
| FR-04 | Self-rate skills on the 0–5 [proficiency scale](04-data-model.md#3-the-proficiency-scale) | M | US-01 |
| FR-05 | Record completed courses from a seeded department course list | M | US-01, US-11 |
| FR-06 | Compute and display profile completeness as a percentage | M | US-01 |
| FR-07 | Attach evidence (repository or certificate URL) to a skill claim | S | — |
| **Assessment & calibration** | | | |
| FR-08 | Deliver an interest + preference questionnaire | M | US-03 |
| FR-09 | Deliver per-skill calibration quizzes and store calibrated levels | M | US-02 |
| FR-10 | Rank all careers using the AI recommendation service with a 0–100 model-driven match score and per-career reasons, subject to mandatory constraints | M | US-03 |
| FR-11 | Let the student set, and later change, a target career | M | US-03 |
| **Gap & roadmap** | | | |
| FR-12 | Compute per-skill gap, weighted priority and severity class | M | US-04 |
| FR-13 | Compute the Career Readiness Score | M | US-04 |
| FR-14 | Generate a one-sentence rationale per gap | M | US-04 |
| FR-15 | Preview readiness against a non-committed target career | S | US-08 |
| FR-16 | Generate a prerequisite-ordered roadmap from the gap set | M | US-05 |
| FR-17 | Pack roadmap items into phases against an hours-per-week budget, with dates | M | US-05 |
| FR-18 | Guarantee determinism: identical inputs produce an identical roadmap | M | US-05 |
| FR-19 | Detect and reject cycles in the prerequisite graph at seed time | M | US-05 |
| **Content** | | | |
| FR-20 | Attach ≥ 1 curated free resource to every roadmap item | M | US-05 |
| FR-21 | Recommend projects selected by gap coverage | M | US-05 |
| FR-22 | Select one capstone project covering ≥ 3 gap skills | M | US-05 |
| **Progress** | | | |
| FR-23 | Mark roadmap items complete / incomplete | M | US-06 |
| FR-24 | Apply the documented skill-increment rule on completion | M | US-06 |
| FR-25 | Recalculate gap, readiness and roadmap after any progress change | M | US-06 |
| FR-26 | Persist readiness-score history and render it as a time series | M | US-06 |
| **AI mentor** | | | |
| FR-27 | Answer questions grounded in the student's own data (RAG) | S | US-07 |
| FR-28 | Show which student data points grounded each answer | S | US-07 |
| FR-29 | Rate-limit mentor requests per user ([NFR-09](#nfr-09--abuse-and-cost-control)) | S | US-07 |
| **Internship & advisor** | | | |
| FR-30 | Internship-readiness checklist per career, evaluated from the profile | S | US-09 |
| FR-31 | Advisor role with a cohort gap heatmap | S | US-10 |
| FR-32 | Aggregate views suppress groups smaller than 5 students | S | US-10 |
| FR-33 | CSV export of aggregate cohort data | S | US-10 |
| **Administration** | | | |
| FR-34 | Admin CRUD for careers, skills, resources, projects and quiz items | M | — |
| FR-35 | Seed/reset the database from versioned seed files | M | — |
| FR-36 | Deterministic demo mode with fixed fixtures and no external calls | M | — |

---

## 4. Non-functional requirements

These were entirely absent from the original specification. A supervisor will ask for them, and
several (security, privacy) cannot be retrofitted late without rework.

### NFR-01 — Performance

| Operation | Target (95th percentile) |
|---|---|
| Any page interactive | ≤ 3 s on a 3G-class connection |
| Gap analysis for one student | ≤ 2 s |
| Roadmap generation | ≤ 3 s |
| Career recommendation (model-first) | ≤ 4 s |
| Career recommendation (baseline only) | ≤ 500 ms |
| AI mentor first token | ≤ 5 s |

Rationale: gap analysis and roadmap generation are pure computation over a few hundred rows, so
anything slower indicates an N+1 query problem. Career embeddings are computed at seed time and
cached — never per request.

### NFR-02 — Scale

Designed for **500 registered students, 50 concurrent**. That is the realistic size of one
faculty cohort. Do not build for a million users; do not write code that breaks at 500.

### NFR-03 — Availability

Best-effort. Free hosting tiers sleep when idle (ADR-0005),
so the first request after an idle period may take up to 60 s. Therefore:

- A visible loading state, never a blank screen or a raw timeout error.
- A scheduled warm-up before any demo or review session.
- **Demo mode** (FR-36) runs entirely locally, so the defence never depends on a third party.

### NFR-04 — Usability

- A new student reaches their first gap analysis in **≤ 10 minutes** without help.
- Every destructive action is confirmable and reversible.
- Every AI-produced value is visually marked as AI-produced.
- Verified by usability testing with ≥ 5 real students ([§09](09-evaluation.md#5-usability-study)).

### NFR-05 — Accessibility

Target **WCAG 2.1 Level AA**:

- Contrast ratio ≥ 4.5:1 for body text.
- Full keyboard navigation with visible focus indicators.
- All form inputs have programmatically associated labels.
- **Severity and status are never communicated by colour alone** — always colour *plus* text or icon. This directly affects the gap table, the most important screen in the product.
- Meaningful images have alt text; decorative images are hidden from assistive technology.
- Every chart has an accessible table equivalent.

### NFR-06 — Authentication

- ASP.NET Core Identity with **PBKDF2** password hashing (framework default) or **Argon2id**. Never a bare hash.
- **JWT access token, 15-minute lifetime**; refresh token, 7 days, rotated on use and revocable.
- Passwords: minimum 10 characters, checked against a common-password deny list.
- Login rate-limited to **5 attempts per 15 minutes per account**, with a generic failure message that does not reveal whether the email exists.
- Email verification before an account is treated as belonging to a real student.

### NFR-07 — Authorization

Three roles: `Student`, `Advisor`, `Admin`.

| Rule | Enforcement |
|---|---|
| A student may read and write **only their own** profile, gaps, roadmap and progress | Server-side ownership check on every request; never trust an ID sent by the client |
| An advisor may read **aggregate** cohort data only | Separate endpoints that return aggregates, never rows |
| An advisor may read an individual profile **only with explicit opt-in** | Consent flag checked server-side |
| Only an admin may write catalogue content | Role policy on all admin endpoints |
| The AI service is **not publicly routable** | Internal network plus a shared-secret header; see [§03](03-architecture.md#6-service-to-service-authentication) |

> Every endpoint is deny-by-default. A missing authorization attribute is a review blocker.

### NFR-08 — Privacy and data protection

Student skill data is sensitive: it is a record of what a person *cannot* do.

- **Minimisation.** Collect nothing that no feature consumes. No national ID, no address, no phone number.
- **Consent.** Separate, revocable opt-in for (a) advisor visibility of the individual profile and (b) inclusion of the student's data in the evaluation study.
- **Deletion.** A student can delete their account; personal rows are hard-deleted within 30 days. Only irreversibly anonymised aggregates may remain.
- **Third-party AI.** The mentor prompt carries only explicitly allow-listed, relevant computed student-context fields required for grounded responses (for example target career, readiness, gaps, strengths, roadmap context, rationale, and recent completions). It never carries the student’s name, email, student ID, university identity unless explicitly required by the project, or uncontrolled/free-form personal profile text. The `Sanitised Context DTO` is the enforcement boundary. See [§06](06-ai-engines.md#44-privacy-in-the-mentor-prompt).
- **Transport.** HTTPS everywhere, HSTS enabled.
- **At rest.** No plaintext credentials, tokens, or secrets in the database or the repository.
- **Logs.** Never log tokens, passwords, or full prompt contents. Personal identifiers in logs are truncated.

### NFR-09 — Abuse and cost control

The budget is **$0**, so an unbounded loop against a free tier is an outage.

- Mentor: **10 requests per user per hour** and **200 per day system-wide**, enforced server-side.
- Embeddings for catalogue content are generated **at seed time only** and cached in the database.
- All external AI calls: 20-second timeout, at most 2 retries with exponential backoff, then the fallback path.
- A daily call counter is exposed on an admin page so the ceiling is visible before it is hit.

### NFR-10 — Input handling and injection resistance

- All queries through EF Core parameterisation. No string-concatenated SQL.
- Every request body validated against an explicit schema; unknown fields rejected.
- Output encoded on render; React's default escaping is never bypassed with `dangerouslySetInnerHTML`.
- **Prompt injection:** any student free text placed in an LLM prompt is treated as untrusted data, wrapped in explicit delimiters, and preceded by a system instruction stating that content inside the delimiters is data and never instructions. Mentor output is rendered as plain text, never as HTML. Detail in [§06](06-ai-engines.md#45-prompt-injection-hardening).
- File uploads are out of scope for the MVP, which removes an entire attack surface.

### NFR-11 — Maintainability

- Backend layered `Api → Application → Domain → Infrastructure`. The gap and scheduler algorithms live in `Domain` with **no framework or database dependency**, so they are unit-testable in isolation.
- All tuning constants (severity thresholds, scoring weights, increment rules) live in one configuration class, never as scattered literals.
- Public methods on domain services carry documentation comments.
- Every merged PR leaves `main` green.

### NFR-12 — Testability

| Layer | Minimum |
|---|---|
| Domain (gap, readiness, scheduler) | **≥ 80 % line coverage**, including cycle detection and tie-breaking |
| API | Integration tests for every endpoint's happy path plus its 401/403 paths |
| AI service | Unit tests for extraction and matching against a fixed labelled set |
| Frontend | Component tests for the gap table and the roadmap view |
| E2E | One test per MVP user story, named `US-xx` |

### NFR-13 — Internationalisation readiness

The project title is bilingual, so Arabic support will be asked about.

- All UI strings come from resource files. **Zero hard-coded user-visible English inside components.**
- Layout tested with `dir="rtl"`; no hard-coded left/right offsets where logical properties work.
- Dates and numbers formatted through the platform locale API.
- Shipping an Arabic translation is **not** an MVP commitment. Being *able* to add one without refactoring is.

### NFR-14 — Portability

Runs locally with a single `docker compose up`, database included. No team member should need
cloud access to develop. Local Postgres uses the `pgvector/pgvector` image so vector behaviour
matches production.

### NFR-15 — Legal and licensing

- Every seeded data source records its licence and required attribution ([§04](04-data-model.md#9-seed-data-sources-and-licences)).
- Curated resources are **links only**; no third-party content is copied.
- The repository carries an explicit licence file.
- Model weights are used only under licences permitting this use (Apache-2.0 / MIT).

---

## 5. Assumptions

Each of these, if false, changes the plan. Tracked in [§10](10-risks-and-assumptions.md).

| # | Assumption | If false |
|---|---|---|
| A1 | The department's course list is obtainable in a usable form | Curriculum mapping degrades to a small hand-entered subset |
| A2 | A free LLM tier remains available at sufficient quota | Mentor falls back to templated explanations |
| A3 | ≥ 500 job postings can be collected for the 6 careers under acceptable terms | Importance weights fall back to O\*NET/ESCO alone and regional weighting is dropped only for that insufficient-corpus fallback; it is reported as future work |
| A4 | ≥ 15 students are available for the evaluation study | The study becomes qualitative, with the sample-size limitation stated |
| A5 | All 8 members have ~10 productive hours/week outside exam periods | Should-have features are cut in priority order |
| A6 | Free hosting tiers remain sufficient | The demo runs from a local machine in demo mode |

---

## 6. Constraints

| # | Constraint | Consequence |
|---|---|---|
| C1 | **$0 budget, everything included** | No paid APIs, hosting, or data. Drives ADR-0002 and ADR-0005 |
| C2 | Fixed final review, **20 May 2027** | Feature freeze 4 weeks earlier; scope is the only flexible variable |
| C3 | Team skill mix is fixed (.NET, React, Python) | No stack changes mid-project |
| C4 | Exam periods reduce capacity | Modelled as low-velocity weeks in [§08](08-plan-and-timeline.md) |
| C5 | No employer partnerships | Job matching stays out of scope |

---

**Next:** [03 — Architecture](03-architecture.md)
