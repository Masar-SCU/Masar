# 02 — Requirements

**Document owners:** Abdelrahman Megahed, Yousef Khaled · **Status:** Revised <2026-11-15> (atomic roadmap + defect fixes)

Every requirement has a stable ID. Cite these IDs in commit messages, test names, and the
report. `FR` = functional, `NFR` = non-functional. Priorities: **M** = MVP-critical,
**S** = should-have, **C** = could-have.

---

## 1. Personas

Designing for a named person prevents building for an imaginary average user.

> **Design assumption to validate in usability testing:** The atomic learning format assumes students prefer 5–10 minute bite-sized sessions on mobile or web rather than multi-hour continuous study blocks. This assumption is formally evaluated in the usability study ([§09](09-evaluation.md#5-usability-study)).

### P1 — Mariam, 3rd year, undecided

20, third year, strong in theory courses, no idea what she wants. Has written C++ and Java for
coursework and one small web project. Has heard "AI" and "cybersecurity" are good but cannot
tell them apart in practice. Overwhelmed by roadmap posts on social media.

**Wants:** to be told, with reasons, which two or three paths suit her, and what micro-step to take today.
**Fails today because:** every resource assumes she has already chosen.

### P2 — Omar, 4th year, targeted but unsure

22, fourth year, has decided on backend development and is learning .NET on his own. Does not
know whether he is employable yet, or what he is still missing.

**Wants:** an honest readiness measurement against a real job standard, and a clear, bite-sized daily path to close gaps.
**Fails today because:** job posts list twenty requirements without saying which ones matter most.

### P3 — Dr. Hend, faculty advisor

Supervises many students. Wants to know where the cohort is collectively weak so teaching and
extra sessions can target real gaps, and wants evidence the tool gives sound advice.

**Wants:** a cohort view showing most-failed atoms and units, and confidence that recommendations are defensible.
**Fails today because:** the only available signal is exam grades.

---

## 2. User stories with acceptance criteria

Format: `As a <persona>, I want <capability>, so that <outcome>.`
A story is done only when every criterion passes. These become the E2E test names.

### US-00 — First-time onboarding wizard · *P1, P2* · **M**

> As a first-time student, I want a structured onboarding wizard (personality test → coursework & skills → targeted placement → career fit & path reveal), so that I am guided step-by-step to an actionable plan without being overwhelmed.

- **AC1** Upon first login, I am automatically routed to the Onboarding Wizard, with step state persisted so I can leave and resume without data loss.
- **AC2** **Step 1 (Personality & Preferences):** I complete a 22-item Likert assessment (8 interest, 4 work-style, 7 problem-type, 3 career-intent) evaluating my preferences in under 4 minutes.
- **AC3** **Step 2 (Coursework & Skills):** I select my academic year and completed department courses, which automatically propose foundational skills with course-provenance badges (with manual entry as baseline when mapping data is unavailable), alongside a fast search to add any additional claimed skills on the 0–5 scale in under 3 minutes.
- **AC4** **Step 3 (Targeted Placement):** For up to 2–3 claimed core technical skills, I am offered an adaptive diagnostic placement probe (≤ 5 min, capped at level 4 verified), with a clear option to skip and verify skills later from the path.
- **AC5** **Step 4 (Career Fit & Selection):** I view ranked career recommendations showing both interest fit and skill fit, explore tracks, and select my committed target career in under 2 minutes.
- **AC6** **Step 5 (Weekly Study Goal & Path Reveal):** I select my weekly study commitment in hours per week (1–20 hrs/week; presets: 2, 3, 5, 10 hrs/week; default: 5 hrs/week, with an illustrative daily pacing indicator $\approx 43$ min/day), see my atomic roadmap revealed with projected finish date, and land directly in my first micro-lesson.

### US-01 — Build a skill profile · *P1, P2* · **M**

> As a student, I want to record my skills, courses and interests, so that recommendations reflect me.

- **AC1** I can register with an email and password, and log in.
- **AC2** I can set my academic year and select interests from a fixed list.
- **AC3** I can search the skill catalogue and self-rate any skill on a 0–5 scale, where each level has a written definition visible on screen.
- **AC4** I can mark courses I have completed from my department's course list.
- **AC5** My profile persists across sessions and is editable at any time.
- **AC6** A profile-completeness indicator tells me what is still missing.

### US-02 — Take an adaptive placement probe · *P2* · **S**

> As a student, I want a diagnostic probe on the skills I claim, so my profile is verified rather than guessed.

- **AC1** For claimed core skills with diagnostic items, I can take an adaptive placement probe (up to 8 items).
- **AC2** The result marks atoms up to the tested band as `assumed` (`source = 'placement'`, `verified = true`), capped at level 4.
- **AC3** If the tested level is 2 or more levels below my claim, the system explains this constructively, and gap analysis uses the verified level.
- **AC4** I may retake a placement probe after 7 days; items are sampled without replacement across retakes.
- **AC5** Skipping placement never blocks me — the profile uses self-reported claims marked as unverified.

### US-03 — Discover matching careers · *P1* · **M**

> As a student, I want ranked career suggestions, so that I can narrow six options down to two.

- **AC1** After completing the assessment I see all 6 careers ranked with a match score from 0 to 100.
- **AC2** Each result shows **why** it matched: inspectable baseline terms (`skill_fit`, `interest_fit`, `coverage`) displayed as reason badges.
- **AC3** I can open any career to see its required skills with importance weights.
- **AC4** I can pick any career as my target, including one that was not ranked first.
- **AC5** The ASP.NET backend requests recommendations from the internal FastAPI recommendation service; the frontend never calls the AI service directly. If the primary model pipeline is unavailable, .NET falls back gracefully to unranked career summaries with a retry option.

### US-04 — See my gap · *P1, P2* · **M**

> As a student, I want to see exactly which skills I lack for my target career, so I know what to work on.

- **AC1** I see every required skill with my current integer level $L(s)$, target level, gap, and severity class.
- **AC2** Severity ordering is strictly monotone — no skill with a larger weighted priority is ever classified below one with a smaller priority.
- **AC3** Each gap includes an inspectable rationale and a progress bar showing continuous fractional mastery toward the next level.
- **AC4** I see a single **Career Readiness Score** as a percentage computed from continuous mastery $c(s)$.
- **AC5** Skills where I exceed the target are shown as strengths, not omitted.
- **AC6** The full analysis renders in under 2 seconds ([NFR-01](#nfr-01--performance)).

### US-05 — Get an ordered atomic roadmap · *P1, P2* · **M**

> As a student, I want an ordered path of bite-sized learning units, so I know exactly what to learn next.

- **AC1** I see my roadmap structured as stages and units with estimated minutes and projected completion dates based on my weekly study goal.
- **AC2** No atom or unit is unlocked before its prerequisite skills and hard prerequisite atoms are satisfied.
- **AC3** Canonical unit order is authored and validated in CI, guaranteeing a stable, sensible curriculum.
- **AC4** Each unit ends with an 8-exercise Checkpoint, and each stage concludes with a practical Project node.
- **AC5** The final Job-ready stage ends with a Capstone project covering at least three of my gap skills.
- **AC6** The path is completely deterministic: identical inputs yield an identical unit sequence.

### US-06 — Learn atoms and watch readiness move · *P2* · **M**

> As a student, I want to complete lessons and watch my readiness score increase smoothly, so my effort feels rewarded.

- **AC1** Completing an atom's lesson with $\ge 80\%$ first-try accuracy marks the atom `learned` (and awards the +5 XP bonus); otherwise it is marked `shaky`.
- **AC2** Every completed atom immediately increases my continuous readiness score $c(s)$, providing visible fractional progress.
- **AC3** When band atoms reach the mastery threshold ($\tau = 0.80$), derived integer level $L(s)$ increments, reducing my gap.
- **AC4** Lesson completion is idempotent via `idempotencyKey` and safely queues offline during network hiccups.
- **AC5** I can reset an atom's state (`reset atom`), which cleanly recalculates derived mastery and readiness without side effects.
- **AC6** I can view my readiness history as an append-only time series chart.

### US-07 — Ask the mentor · *P1, P2* · **S**

> As a student, I want to ask questions and get answers grounded in my real learning progress and relevant atoms.

- **AC1** The mentor answers using an allow-listed, sanitised context DTO (target career, current unit, recent atoms, streak).
- **AC2** The mentor retrieves relevant authored atom excerpts to ground explanations and provides clickable deep links to atoms.
- **AC3** When asked something outside its domain it declines politely rather than hallucinating.
- **AC4** When the LLM service is unreachable or times out, a templated explanation is displayed immediately.
- **AC5** No personal identifiers (name, email) are sent to the external model provider.

### US-08 — Compare targets before committing · *P1* · **S**

> As a student, I want to preview a different target career, so I can compare before deciding.

- **AC1** I can select any career and see the resulting readiness score, unit count, and top gaps without changing my saved target.
- **AC2** A side-by-side comparison of two careers is available.
- **AC3** Nothing is persisted until I explicitly confirm the change.

### US-09 — Prepare for an internship · *P2* · **S**

> As a student, I want to know whether I am ready to apply for internships, so I stop guessing.

- **AC1** For my target career I see a clear checklist: required skill thresholds, completed portfolio projects, and CV items.
- **AC2** Each criterion shows met / not met; project criteria derive from completed project nodes in the atomic path.
- **AC3** An overall "internship-ready" state is displayed with specific remaining blockers.

### US-10 — See the cohort's gaps · *P3* · **S**

> As an advisor, I want to see where my students are collectively weak, so I can target teaching.

- **AC1** I see aggregate skill gaps across consenting students as a ranked heatmap.
- **AC2** I can filter by academic year and by target career.
- **AC3** Any cell or cohort smaller than $k = 5$ students is strictly suppressed to protect privacy.
- **AC4** I can export aggregate cohort data as CSV.

### US-11 — Pre-fill from coursework · *P1* · **S**

> As a student, I want my completed courses to pre-fill known atoms, so I do not start from scratch.

- **AC1** Selecting completed department courses proposes unverified assumed atoms mapped from the syllabus.
- **AC2** Proposals are clearly marked as unverified; I confirm or edit each proposal before it applies to my profile.
- **AC3** The course source is displayed on each assumed atom.

### US-12 — Play a micro-lesson · *P1, P2* · **M**

> As a student, I want an engaging, focused lesson experience with immediate feedback, so I learn efficiently in minutes.

- **AC1** The lesson player opens in full-screen focus mode with a segmented progress bar and one exercise at a time.
- **AC2** Exercises include concept cards, multiple choice, code bug prediction, fill-in tokens, and pair matching.
- **AC3** Incorrectly answered exercises are automatically re-queued at the end of the lesson (up to twice).
- **AC4** The sticky bottom sheet gives instant local feedback with an explanation snippet and a "Report a problem" button.
- **AC5** Full keyboard support (Enter to check/continue, Tab/Arrow keys to navigate and select options per WCAG 2.1.4) and screen-reader live regions are supported.
- **AC6** The lesson completion screen displays accuracy, base and bonus XP earned, streak updates, and readiness score gain.

### US-13 — Keep a streak and set a weekly study goal · *P1, P2* · **M**

> As a student, I want to set a weekly study goal and build a learning streak, so I stay motivated to practice consistently.

- **AC1** I can select or adjust a weekly study goal in hours per week (1–20 hrs/week; presets: 2, 3, 5, 10 hrs/week; default 5 hrs/week, with daily pacing indicator $\approx 43$ min/day) from my profile.
- **AC2** Completing any XP-earning session increments my daily streak based on my local calendar day (IANA timezone).
- **AC3** Streak freezes (earned 1 per 7-day streak, maximum 2 held) automatically prevent streak loss for one missed day.
- **AC4** I can activate an Exam-Week Pause for up to 14 consecutive calendar days per semester (max twice per academic year) to protect my streak during exams.

### US-14 — Review what I learned · *P2* · **S**

> As a student, I want spaced review of previous atoms, so I retain what I learned over time.

- **AC1** The "Practice" tab displays the count of atoms currently due for spaced review.
- **AC2** A review session presents up to 8 due atoms scheduled across 5 Leitner boxes (intervals: 1, 3, 7, 14, 30 days).
- **AC3** Answering correctly advances the atom to the next box; answering incorrectly resets it to Box 1.
- **AC4** Due review items or decayed review strength never lower my derived mastery level $L(s)$ or my readiness score.

### US-15 — Test out of a unit · *P2* · **S**

> As a student, I want to test out of material I already know, so I can advance quickly to new topics.

- **AC1** From any unit header, I can attempt an early Checkpoint test-out consisting of 8 sampled exercises.
- **AC2** Passing with $\ge 85\%$ accuracy marks all in-scope atoms of the unit as `assumed` (`source = 'test_out'`, `verified = true`).
- **AC3** If a unit contains unverified assumed atoms and a regular checkpoint score is $< 60\%$, those atoms are reopened.

### US-16 — Browse my path and jump to a unit · *P1, P2* · **M**

> As a student, I want to view my path of learning nodes and easily navigate units, so I always know where I am.

- **AC1** The path renders as a winding vertical graph of nodes grouped into units with state badges (`locked`, `available`, `current`, `learned`, `shaky`, `assumed`).
- **AC2** Node states are communicated using both distinct icons and colors, satisfying accessibility requirements.
- **AC3** List virtualization renders only the current unit $\pm 2$ units, ensuring 60 FPS performance on mobile devices.
- **AC4** I can toggle between `canonical` authored order and `prioritized` mode (re-sorting units within stages by gap priority).

### US-17 — Report a content problem · *P1, P2* · **M**

> As a student, I want to flag errors or typos in exercises, so content issues get fixed quickly.

- **AC1** A "Report a problem" button is accessible on every exercise feedback sheet.
- **AC2** I can pick a reason (`wrong_answer`, `unclear`, `broken_code`, `typo`, `other`) and submit optional notes.
- **AC3** The report submits asynchronously without interrupting the lesson session.

### US-18 — View cohort atom-level analytics · *P3* · **S**

> As an advisor, I want to see which specific atoms and units confuse students most, so I can adjust lectures.

- **AC1** I can view a ranked report of the most-failed atoms and units across the student cohort.
- **AC2** The report supports filtering by academic year and target career.
- **AC3** Any atom with fewer than $k = 5$ student attempts is suppressed to preserve privacy.

---

## 3. Functional requirements

| ID | Requirement | Pri | Story |
|---|---|---|---|
| **Accounts & profile** | | | |
| FR-00 | Persist onboarding wizard state and progress step, enabling seamless resume and step-gated onboarding completion | M | US-00 |
| FR-01 | Register with email + password; passwords stored using modern KDF ([NFR-06](#nfr-06--authentication)) | M | US-01 |
| FR-02 | Log in / log out; sessions via short-lived access token + HttpOnly refresh cookie | M | US-01 |
| FR-03 | Store academic year, interests, timezone, weekly study goal (hours/week), and career goal text | M | US-01, US-13 |
| FR-04 | Self-rate skills on 0–5 scale as initial seed for assumed atoms | M | US-01 |
| FR-05 | Record completed courses from seeded department catalogue | M | US-01, US-11 |
| FR-06 | Compute and display profile completeness as a percentage | M | US-01 |
| FR-07 | Attach portfolio evidence (repository URL) to a project or skill | S | US-09 |
| **Assessment & recommendations** | | | |
| FR-08 | Deliver 22-item Likert interest and preference questionnaire in $\le 4$ minutes | M | US-00 |
| FR-09 | Diagnostic skill assessment | M | US-00, US-02 |
| FR-10 | Rank all 6 careers using AI recommendation service with match score and inspectable reason badges | M | US-03 |
| FR-11 | Let the student select and change committed target career and track | M | US-03 |
| **Gap analysis & readiness** | | | |
| FR-12 | Compute per-skill gap, weighted priority and severity class from derived mastery $L(s)$ | M | US-04 |
| FR-13 | Compute Career Readiness Score from continuous fractional mastery $c(s)$ | M | US-04, US-06 |
| FR-14 | Generate a one-sentence rationale per gap based on posting demand and taxonomy | M | US-04 |
| FR-15 | Preview readiness against a non-committed target career | S | US-08 |
| FR-16 | *Superseded by FR-38 and FR-39.* (Authored canonical path and per-student atomic filtering replace runtime phase generation) | — | — |
| FR-17 | *Superseded by FR-39 and FR-45.* (Atomic path with weekly study goals and unit projected completion dates replaces 40-hour phase packing) | — | — |
| FR-18 | *Superseded by FR-38.* (Deterministic canonical path sequence stamped with algorithm_version and input_hash) | — | — |
| FR-19 | *Superseded by FR-37.* (CI graph validation enforces acyclicity on both skill and atom prerequisite graphs) | — | — |
| **Content & projects** | | | |
| FR-20 | Attach curated free deep-dive resources to atoms (`ATOM_RESOURCE`) | S | US-05 |
| FR-21 | Recommend practical stage project nodes with milestone criteria feeding portfolio | S | US-05, US-09 |
| FR-22 | Stage 4 Capstone project node covering $\ge 3$ gap skills | M | US-05 |
| **Progress & mastery** | | | |
| FR-23 | *Superseded by FR-40 and FR-41.* (Lesson player completion and authoritative server re-grading replace manual checkoff) | — | — |
| FR-24 | *Superseded by FR-42.* (Mastery derived from atom states replaces manual skill-increment rule) | — | — |
| FR-25 | *Superseded by FR-41 and FR-42.* (Incremental recalculation of skill mastery and readiness on lesson completion) | — | — |
| FR-26 | Persist readiness-score history as append-only daily snapshots and render time series | M | US-04, US-06 |
| **AI mentor** | | | |
| FR-27 | Answer questions grounded in student's allow-listed progress context | S | US-07 |
| FR-28 | Show which student data points grounded each answer | S | US-07 |
| FR-29 | Rate-limit mentor requests per user ([NFR-09](#nfr-09--abuse-and-cost-control)) | S | US-07 |
| **Internship & advisor** | | | |
| FR-30 | Internship-readiness checklist per career evaluated from profile and project nodes | S | US-09 |
| FR-31 | Advisor role with cohort gap heatmap | S | US-10 |
| FR-32 | Aggregate views suppress groups smaller than $k = 5$ students | S | US-10, US-18 |
| FR-33 | CSV export of aggregate cohort data | S | US-10 |
| **Administration** | | | |
| FR-34 | Admin CRUD for catalogue, atoms, exercises, and units | M | FR-50 |
| FR-35 | Seed/reset database from versioned seed files | M | — |
| FR-36 | Deterministic demo mode with fixed fixtures and no external network calls | M | — |
| **Atomic Roadmap & Learning Loop (New)** | | | |
| FR-37 | Atom catalogue with skill/unit/band, plus skill and atom prerequisite graphs with cycle detection | M | US-05, US-16 |
| FR-38 | Authored canonical path per (career, track), deterministic, versioned, validated in CI | M | US-05, US-16 |
| FR-39 | Per-student path = canonical path filtered by scope and state; `prioritized` mode at unit level | M | US-05, US-16 |
| FR-40 | Lesson player with MVP exercise types, instant feedback, re-queue of misses | M | US-06, US-12 |
| FR-41 | Authoritative server re-grading and idempotent completion | M | US-06, US-12 |
| FR-42 | Mastery derived from atoms: integer level $L(s)$ for gap, continuous level $c(s)$ for readiness | M | US-04, US-06 |
| FR-43 | Checkpoints and test-out (reopen unverified assumed atoms on checkpoint failure) | S | US-15 |
| FR-44 | Adaptive placement (wizard Step 3, capped at level 4 verified) | S | US-00, US-02 |
| FR-45 | XP, streak (timezone-correct), weekly study goal | M | US-13 |
| FR-46 | Spaced review queue (Leitner boxes 1..5) | S | US-14 |
| FR-47 | Exam-week streak pause (up to 14 days) and streak freezes | S | US-13 |
| FR-48 | Achievements system | C | — |
| FR-49 | Weekly leagues (opt-in, nickname-only) | C | — |
| <a id="fr-50"></a>FR-50 | Content status workflow, reports queue, admin validation | M | US-17 |
| FR-51 | CI content validator (graph, coverage, schema, blind-solve flags) | M | — |
| FR-52 | Mentor retrieval over atoms with deep links; stored explanations for "explain my answer" | S | US-07 |
| FR-53 | Portfolio items and project nodes feeding the internship checklist | S | US-09 |
| FR-54 | Advisor atom-level cohort analytics ($k \ge 5$ suppression) | S | US-18 |

---

## 4. Non-functional requirements

### NFR-01 — Performance

| Operation | Target (95th percentile) |
|---|---|
| Any page interactive | $\le 3$ s on a 3G-class connection |
| Gap analysis for one student | $\le 2$ s |
| Path summary endpoint | $\le 1.5$ s |
| Lesson start (static bundle, cached) | $\le 1$ s |
| Local exercise feedback | $\le 100$ ms |
| Lesson completion round-trip | $\le 1$ s |
| Career recommendation (model-first) | $\le 4$ s (8 s timeout, 1 retry) |
| Career recommendation (baseline fallback) | $\le 500$ ms |
| AI mentor first token | $\le 5$ s (12 s timeout, **no retry**) |

Connect timeout budget is 2 s. On timeout, the system falls back immediately without hanging user experience.

### NFR-02 — Scale

Designed for **500 registered students, 50 concurrent**, tracking up to $500 \times 1,000 = 500,000$ student atom states and derived progress records.

### NFR-03 — Availability

Best-effort on zero-budget infrastructure (ADR-0005):

- Versioned static content bundles (`/content/v{n}/unit-{id}.json`) are served directly from the static host, ensuring lessons start instantly even if the API backend is cold-starting.
- Client-side exercise feedback operates locally; session completions are queued in the browser and retried with identical idempotency keys.
- Free uptime ping warms the backend API during active cohort hours.
- **Demo mode** (FR-36) operates entirely offline with bundled fixtures.

### NFR-04 — Usability

- A new student starts their first lesson in **$\le 10$ minutes** unaided with placement skipped; **$\le 15$ minutes** with placement.
- Gap analysis is available immediately upon career selection ($\approx 9$ minutes without placement).
- Every destructive action is confirmable and reversible (e.g. `reset atom`).
- AI-produced values are visually marked as AI-assisted.
- Verified by usability testing with $\ge 5$ real students ([§09](09-evaluation.md#5-usability-study)).

### NFR-05 — Accessibility

Target **WCAG 2.1 Level AA**:

- Contrast ratio $\ge 4.5:1$ for body text across all playful UI palettes.
- Severity, streak status, and node states are **never communicated by colour alone** — always icon + label + colour.
- Full keyboard navigation (Enter to check/continue, number keys to select options) with visible focus indicators.
- Non-drag tap alternatives for all matching and token-reordering exercises.
- `prefers-reduced-motion` strictly honored: disables confetti, animated transitions, and path motion.
- Code blocks rendered as LTR islands inside RTL layouts; all charts provide accessible table equivalents.

### NFR-06 — Authentication

- ASP.NET Core Identity with **PBKDF2** password hashing or **Argon2id**.
- Short-lived JWT access token kept in memory (15 min lifetime); refresh token stored in an `HttpOnly; Secure; SameSite=Lax` cookie (7 days, rotated on use).
- Minimum 10 characters password checked against common deny list.
- Rate-limited login: 5 attempts per 15 minutes per account and per-IP throttling with generic failure messages.
- Email verification required before student account activation.

### NFR-07 — Authorization

Three roles: `Student`, `Advisor`, `Admin`.

| Rule | Enforcement |
|---|---|
| A student may read and write **only their own** profile, gaps, roadmap, attempts and game state | Server-side ownership check on every request; never trust client IDs |
| An advisor may read **aggregate** cohort data only | Dedicated aggregate endpoints; cell suppression for $k < 5$ |
| An advisor may read an individual profile **only with explicit opt-in** | `consent_advisor_visibility` checked server-side |
| Only an admin may publish catalogue content, validate graphs, or review reports | Role policy on all admin endpoints |
| The AI service is **not publicly routable** | Internal network plus shared-secret header ([§03](03-architecture.md#6-service-to-service-authentication)) |

### NFR-08 — Privacy and data protection

- **Minimisation:** Collect no national ID, address, or phone number.
- **Consent:** Explicit, separate opt-in flags for `consent_advisor_visibility` and `consent_research_use`.
- **Deletion:** A student can delete their account; personal data rows are hard-deleted within 30 days. Only irreversibly anonymised aggregate metrics may remain.
- **Mentor free-text scrubbing:** Student mentor questions are capped at 300 characters, scrubbed via regex for emails, phone numbers, and URLs, and preceded by a visible disclosure.
- **LLM terms disclosure:** Clear student-facing disclosure and consent shown before first mentor interaction explaining external model processing.
- **Transport:** HTTPS everywhere, HSTS enabled.
- **At rest:** Zero plaintext credentials, tokens, connection strings, or secrets in database storage or source control.
- **Logs:** Never log tokens, passwords, or full raw prompt contents. Personal identifiers in server logs are strictly truncated or masked.
- **Telemetry minimisation:** Telemetry records only exercise timing and correctness; no personal free text is logged.

### NFR-09 — Abuse and cost control

- Mentor: 10 requests per user per hour and 200 per day system-wide.
- Offline content drafting uses a **separate dev-only API key and quota**, completely isolated from runtime student traffic.
- Stored per-exercise explanations are used by default for "Explain my answer" (zero LLM calls); external LLM is invoked only upon explicit "Ask the mentor" clicks.
- Strict timeout budgets: connect 2 s; `/recommend` 8 s (1 retry); `/mentor` 12 s (**no retry**); offline fallback immediately on failure.

### NFR-10 — Input handling and injection resistance

- EF Core parameterisation across all queries; no raw SQL string concatenation.
- Request payloads strictly validated against schemas.
- Mentor prompt isolates student text within explicit delimiters and strict system instructions ([§06](06-ai-engines.md#46-prompt-injection-hardening)). Output rendered as plain text.
- File uploads are out of scope for the MVP, which removes an entire attack surface.

### NFR-11 — Maintainability

- Layered architecture: `Api → Application → Domain → Infrastructure`.
- `Domain` contains pure domain logic (`PathBuilder`, `MasteryCalculator`, `XpCalculator`, `StreakCalculator`, `ReviewScheduler`, `AtomGraphValidator`) with zero database or framework dependencies, making it 100% unit-testable.
- All constants ($\tau = 0.80$, XP rewards, Leitner intervals, timeout limits) reside in a single configuration class.

### NFR-12 — Testability

| Layer | Minimum |
|---|---|
| Domain (path, mastery, streak, XP, review, validator) | **$\ge 80\%$ line coverage**, including cycle detection and boundary cases |
| API | Integration tests for every endpoint happy path and 401/403/422 paths |
| AI service | Unit tests for extraction and recommendation against fixed evaluation sets |
| Frontend | Component tests for lesson player, node states, and path virtualisation |
| E2E | One test per user story, named `US-xx` |

### NFR-13 — Internationalisation readiness

- Zero hard-coded English strings in UI components; all text sourced from localization dictionaries.
- Layouts tested with `dir="rtl"`.
- Code snippets formatted as isolated LTR blocks within RTL screens.
- Atom content schema includes `language` attribute (`DEFAULT 'en'`) to support future Arabic micro-lesson translations.

### NFR-14 — Portability

Full stack runs locally via single `docker compose up`. Local PostgreSQL uses `pgvector/pgvector` image to match production behavior.

### NFR-15 — Legal and licensing

- Every seeded data source records licence and attribution obligations ([§04](04-data-model.md#9-seed-data-sources-and-licences)).
- Micro-lessons and exercises feature original phrasing authored by team members and reviewed offline; no copyrighted text is copied. External roadmaps are consulted for topic scope only.
- Curated resource links are links only.
- The repository carries an explicit licence file.

### NFR-16 — Content quality

- Every student-visible atom must be in `published` status, requiring automated CI validation and human domain review.
- Every atom must provide $\ge 3$ validated exercises.
- Advanced atoms (bands 4 and 5) require two independent human reviews before publication.

### NFR-17 — Content versioning and state migration

- `atom.slug` is permanent.
- Material content revisions generate a new atom version with `replaced_by` pointing to the replacement.
- Existing student mastery and attempt history automatically migrate forward; deprecated atoms are hidden from paths but never hard-deleted.

### NFR-18 — Engagement ethics

- Tone is encouraging, plain, and constructive; zero guilt-tripping copy or streak-loss shaming.
- Push/email notifications are strictly opt-in, limited to maximum 1 per day, and observe quiet hours.
- Zero real-money mechanics, paid skips, or artificial timers.
- No social comparison without explicit opt-in; celebratory animations are capped at $\le 3$ seconds.

### NFR-19 — Motion and sound safety

- Adheres to WCAG 2.1 SC 2.3.1 (no flashing $> 3$ per second) and SC 2.3.3 (motion from interactions).
- Confetti, bouncing path nodes, and celebration animations are disabled when `prefers-reduced-motion: reduce` is detected.
- Audio cues are muted by default and require deliberate user activation.

### NFR-20 — Time and timezone handling

- All daily streak, weekly goal tracking, and snapshot boundaries use the student's configured IANA timezone (default `Africa/Cairo`, correctly handling Egypt DST transitions).
- All domain date/time calculations consume an injected `IClock` abstraction; direct calls to `DateTime.Now` or hardcoded UTC offsets are forbidden.

### NFR-21 — Data retention

- Raw `EXERCISE_ATTEMPT` records are retained for **30 days maximum**, after which an automated retention job aggregates them into permanent atom difficulty and discrimination metrics and purges the raw attempt rows.

---

## 5. Assumptions

| # | Assumption | If false |
|---|---|---|
| A1 | The department's course list is obtainable in a usable form | Curriculum mapping degrades to a small hand-entered subset |
| A2 | A free LLM tier remains available at sufficient quota | Mentor falls back to templated explanations |
| A3 | $\ge 500$ job postings can be collected under acceptable terms | Importance weights fall back to O\*NET/ESCO alone |
| A4 | $\ge 15$ students are available for the evaluation study | The study becomes qualitative with sample size limitations stated |
| A5 | All 8 members have ~10 productive hours/week outside exams | Scope reduced strictly along contingency priorities |
| A6 | Free hosting tiers remain sufficient | The demo runs locally in demo mode |
| A7 | Static hosting reliably serves pre-built unit bundles | Bundles served directly by .NET API with local caching |
| A8 | Egypt timezone DST transitions adhere to standard tzdata | System allows manual timezone override in profile settings |
| A9 | Free LLM quota suffices for offline batch content drafting | Batch drafting throttled or supplemented with local quantized models |
| A10 | $\ge 5$ reviewers provide 3.5 h/week for content review | Career scope reduced to 3–4 core careers (R-06) |
| A11 | Students value gamified atomic learning over linear task lists | Usability study (RQ5/RQ8) measures engagement; fallback to simple list view |
| A12 | Static host serves pre-rendered unit content bundles without egress costs | Bundles served via compressed API endpoint |

---

## 6. Constraints

| # | Constraint | Consequence |
|---|---|---|
| C1 | **$0 budget, everything included** | No paid APIs, hosting, or data. Drives ADR-0002 and ADR-0005 |
| C2 | Fixed final defence, **30 June 2027** | Feature freeze ≈ 3.3 weeks (23 days) earlier (Mon 7 Jun 2027); scope is the only flexible variable |
| C3 | Team skill mix is fixed (.NET, React, Python) | No stack changes mid-project |
| C4 | Exam periods reduce capacity | Modelled as low-velocity weeks in [§08](08-plan-and-timeline.md) |
| C5 | No employer partnerships | Job matching stays out of scope |

---

**Next:** [03 — Architecture](03-architecture.md)
