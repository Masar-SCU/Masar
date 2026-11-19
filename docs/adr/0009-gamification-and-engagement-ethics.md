# ADR-0009 — Gamification and engagement ethics

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** Abdelrahman, Ziad, Yousef Khaled, Mazen, Osama

---

## Context

Independent self-study platforms in software engineering experience high drop-off rates. Research in educational gamification ([Hamari et al. 2014, Dicheva et al. 2015](../12-references.md#7-knowledge-tracing-spaced-repetition-and-gamification-literature)) demonstrates that well-designed engagement loops (clear goals, transparent progression, immediate feedback, and reward milestones) significantly boost daily practice and retention.

However, popular commercial learning platforms frequently rely on predatory, stress-inducing dark patterns:

1. **Punitive "Lives" / "Hearts":** Locking learners out of practice when they make mistakes, penalizing the very experimentation and debugging central to engineering education.
2. **Aggressive Push Notifications:** Guilt-inducing notifications that create resentment and engagement fatigue.
3. **High-Stakes Leaderboard Stress:** Unfair public ranking ladders that encourage superficial speed over deep comprehension.

Masar requires an engagement framework that motivates continuous daily habit formation while upholding educational ethics and mental well-being.

## Options considered

### A — No gamification (Plain checklist / LMS model)

Present learning materials as a flat list of checkable tasks.

- *Rejected:* Minimal engagement; fails to build the daily study habits critical for bridging the employment gap.

### B — Direct clone of commercial freemium mechanics (Hearts / Lives)

Incorporate a 5-heart system where mistakes deplete lives, requiring waiting periods or micro-purchases.

- *Rejected:* Anti-educational. Engineering requires trial, error, and failure. Penalizing mistakes encourages cheating, discourages difficult exercises, and causes acute student anxiety.

### C — Positive-only, non-punitive engagement mechanics with ethical constraints *(chosen)*

Implement non-punitive mechanics centered on daily consistency (streaks), mastery progression (XP), personalized weekly study targets (1–20 hrs/week), and spaced recall (review queues), strictly excluding lockouts, lives, or manipulative dark patterns.

## Decision

**Implement an ethical, positive-only engagement architecture built on three pillars:**

1. **Experience Points (XP) & Positive Reinforcement:**
   - XP is awarded for active effort: completing an atom (+15 XP base), acing on first attempt (+5 XP bonus for $\ge 80\%$ accuracy), completing a spaced review (+10 XP flat), passing Unit Checkpoints (+50 XP), and submitting accepted Stage Capstone Projects (+100 XP). Replays award +2 XP flat (max 20 XP/day).
   - **Zero XP Deductions:** Mistakes never deduct XP.
2. **Weekly Goals & Streaks:**
   - Students configure a weekly study goal during onboarding (1–20 hours/week; presets: 2, 3, 5, 10 hrs/week; default 5 hours/week $\approx 43$ min/day).
   - A streak increments when the student completes **any qualifying learning session** (at least one lesson, spaced review, or checkpoint that earns XP) within their configured IANA timezone (e.g., `Africa/Cairo`).
   - **Streak Protections:** Students can equip up to 2 streak freezes earned via study milestones. Streaks can be paused for up to 14 days during university exam periods.
3. **Strict Educational Ethics & Accessibility:**
   - **No Lives or Hearts:** Students can retry failed exercises immediately with explanatory feedback. A student is never locked out of learning.
   - **Opt-In Notifications Only:** Progress reminders and weekly digests are strictly opt-in, with user-configured delivery hours and zero guilt-inducing copy.
   - **Accessible Animations:** All celebration animations (confetti, level-up banners) respect the `prefers-reduced-motion` media query (WCAG 2.1 SC 2.3.3) and avoid high-frequency strobing (SC 2.3.1).
   - **Private by Default:** Leaderboards and cohort comparisons are anonymized or strictly opt-in.

## Consequences

### Positive

- **High Student Retention:** Micro-goals and streaks create durable study habits without cognitive fatigue.
- **Psychological Safety:** Encourages experimentation and learning from errors without fear of penalties or lockouts.
- **Ethical Academic Standards:** Demonstrates responsible engineering design suitable for university defense and peer review.

### Negative

- **Reduced Coercive Urgency:** May produce slightly lower short-term check-in metrics compared to predatory dark-pattern mechanics, but yields vastly higher long-term learning quality.
- **Timezone Complexity:** Requires robust backend handling of student IANA timezones and midnight cutoffs for streak calculation.

### Neutral

- XP is an internal engagement currency; it has no monetary value and cannot be traded.

## Verification

- [ ] **W12** — Daily streak evaluation engine verified against edge cases (daylight savings, midnight transitions, streak freezes) (Osama)
- [ ] **W14** — UI celebration components pass WCAG 2.1 SC 2.3.1 and 2.3.3 automated accessibility tests (Mazen)
- [ ] **W16** — User testing (RQ5 / usability) confirms learners report positive motivation and zero lockout anxiety (Yousef Khaled)
