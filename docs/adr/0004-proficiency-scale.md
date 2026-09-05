# ADR-0004 — 0–5 integer proficiency scale, not percentages

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Abdelrahman, Osama, Yousef Khaled

---

## Context

The original specification expressed every skill level as a percentage: "Python 80 %", "SQL 55 %",
"Docker 20 % → 55 %". Career requirements used percentages too, as did skill importance.

Three problems with that:

1. **False precision.** No student can meaningfully distinguish "SQL 55 %" from "SQL 60 %". The extra
   digits are noise presented as measurement.
2. **Undefined semantics.** What does 55 % of SQL mean? Half the syntax? Half the confidence? Nobody
   can answer, which means two students' 55 % are not comparable — and the whole system rests on
   comparing them.
3. **Invites meaningless arithmetic.** With percentages, "improve Docker by 35 points" looks like a
   sensible operation. It is not, because the underlying quantity has no unit.

There is also a downstream consequence: the original gap table was internally inconsistent
(SQL 55→85 was "Needs Improvement" while Testing 35→60 was "High Priority"), and percentages made that
inconsistency easy to introduce and hard to notice.

## Options considered

### A — Integer 0–5 with written level definitions *(chosen)*

Six behaviourally described levels. The student picks the description that fits.

### B — Keep percentages

Rejected for the reasons above.

### C — Continuous 0.0–1.0 float

Rejected: identical problem to percentages, wearing different clothes.

### D — Three levels: beginner / intermediate / advanced

Rejected: too coarse. Gap analysis needs enough resolution to distinguish "nearly there" from "not
started", and three levels collapse those cases together.

## Decision

**A single integer scale 0–5, with a written definition displayed next to the input, used everywhere:
student levels, career requirements, resource levels, quiz outcomes, and course coverage.**

| Level | Name | Definition shown to the student |
|:-:|---|---|
| 0 | None | I have never used this. |
| 1 | Aware | I know what it is and could describe roughly what it does. |
| 2 | Guided | I have used it by following a tutorial or with help. |
| 3 | Independent | I can use it on my own for a coursework-sized task. |
| 4 | Proficient | I can use it on a substantial project, debug problems, and explain trade-offs. |
| 5 | Advanced | I can teach it, review others' use of it, and reason about its internals. |

### Rules

- Stored as `smallint` with `CHECK (level BETWEEN 0 AND 5)`.
- **The definition text appears beside the input**, not behind a help icon. A rating scale nobody reads produces noise.
- Because requirements share the scale, `gap = required − current` has a real meaning: "levels of improvement needed".
- **Percentages appear only for computed values** — the readiness score and the career match score — where a formula is stated and displayed.
- `importance` remains a `0.0–1.0` float, because it is a **weight**, not a level. Weights are computed, never entered by a human.

## Consequences

**Positive**

- A student can answer honestly and quickly. Six described options is a decision; a percentage slider is a guess.
- `gap` becomes a small integer, which makes `priority = gap × importance` land in a comfortable 0–5 range with readable thresholds.
- Comparable across students, because everyone selected from the same written descriptions.
- Effort estimation becomes tractable: hours per level transition ([§04 7.3](../04-data-model.md#73-hour-estimates)) is a well-defined quantity, whereas "hours per percentage point" is not.
- Quiz calibration maps naturally: items are tagged with the level they probe.

**Negative**

- Less apparent granularity. This is the point, not a cost.
- All examples in the original documents had to be rewritten. Already done.

**Neutral**

- The UI must display six definitions without becoming cluttered. A design task for Yousef Khaled, not a modelling problem.

## Migration from the original examples

| Original | Now |
|---|---|
| Python 80 % / target 90 % | Python 4 / required 4 → gap 0 |
| SQL 55 % / target 85 % | SQL 3 / required 4 → gap 1 |
| Docker 20 % / target 60 % | Docker 0 / required 3 → gap 3 |
| Testing 35 % / target 60 % | Testing 1 / required 3 → gap 2 |

The reworked table in [§05 5.5](../05-features-mvp.md#55-skill-gap-analysis--core) is arithmetically
consistent and machine-verified, which the original was not.

## Verification

- [ ] **W3** — scale definitions in the UI, visible beside the input (Mazen)
- [ ] **W3** — `CHECK` constraints in the migration (Mohamed Yasser)
- [ ] **W5** — gap calculation unit-tested at every level combination, 0–5 × 0–5 (Osama)
- [ ] **W16** — usability testing confirms students can pick a level without hesitation (Yousef Khaled)
