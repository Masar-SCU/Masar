# 07 — API Contract

**Document owner:** Abdelrahman Megahed · **Status:** Revised <2026-11-15> (atomic roadmap + defect fixes) · **Contract Version:** `2.0.0`

This document specifies the public and internal HTTP API contracts for Masar. Contract version
`2.0.0` transitions the roadmap from 40-hour phase scheduling to the **Atomic Roadmap** and
gamified learning loop ([ADR-0007](adr/0007-atomic-roadmap.md), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)).

---

## 1. Conventions

| Aspect | Rule |
|---|---|
| Base URL | `/api` |
| Format | JSON, `application/json`, UTF-8 |
| Casing | `camelCase` in JSON, `PascalCase` in C#, mapped automatically |
| IDs | Integer surrogate keys for taxonomy rows; **UUID** for students, profiles, units, atoms, exercises, and sessions |
| Dates | ISO 8601 UTC — `2026-09-21T00:00:00Z`. Never a locale-formatted string. |
| Levels | Integer 0–5 for derived integer level $L(s)$; decimal `numeric(3,2)` for continuous level $c(s)$ |
| Scores | Integer 0–100 |
| Pagination | `?page=1&pageSize=20`, response carries `page`, `pageSize`, `totalCount` |
| Auth | `Authorization: Bearer <access token>` (in-memory); refresh token in `HttpOnly; Secure; SameSite=Lax` cookie |
| Correlation | `X-Correlation-Id` echoed on every response |
| Contract source | OpenAPI generated from .NET; TypeScript client generated via tool. Hand-written client types are banned. |

---

## 2. Error envelope

One shape for every error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "dailyGoalMinutes", "message": "Must be one of 10, 20, 30, 45, 60." }
    ],
    "correlationId": "0HN7A2K3P9QRS"
  }
}
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body or query failed validation |
| 401 | `UNAUTHENTICATED` | Missing, expired, or invalid token |
| 403 | `FORBIDDEN` | Authenticated but not permitted (e.g. Student role accessing Admin endpoint) |
| 404 | `NOT_FOUND` | Resource absent, or not owned by the caller (including cross-student access, F-04) |
| 409 | `CONFLICT` | State conflict, e.g. duplicate active session |
| 422 | `PRECONDITION_UNMET` | Valid request, but preconditions missing (e.g. skipping onboarding steps without required prerequisites, F-30) |
| 429 | `RATE_LIMITED` | Rate limit hit; includes `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Unhandled error — never leaks stack trace to client |
| 503 | `DEPENDENCY_UNAVAILABLE` | External dependency down and no fallback applies |

> **404 rather than 403 for another student's resource (F-04).** Returning 403 confirms that another student's private record exists, leaking information. Cross-student access strictly returns 404.

---

## 3. Metadata and system status

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/api/meta` | `200` `{ contractVersion, contentVersion, algorithmVersion }` | Version handshake (F-09) |

---

## 4. Authentication

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, academicYear }` | `201` `{ userId }` — verification email sent |
| POST | `/api/auth/login` | `{ email, password }` | `200` `{ accessToken, expiresIn, role }` + set-cookie `refreshToken` |
| POST | `/api/auth/refresh` | — (reads cookie) | `200` new access token + rotates refresh cookie |
| POST | `/api/auth/logout` | — | `204` clears refresh cookie |
| POST | `/api/auth/verify-email` | `{ token }` | `204` |
| DELETE | `/api/auth/account` | `{ password }` | `202` — hard deletion within 30 days ([NFR-08](02-requirements.md#nfr-08--privacy-and-data-protection)) |

---

## 5. Profile

| Method | Path | Notes |
|---|---|---|
| GET | `/api/profile` | Caller's profile |
| PUT | `/api/profile` | `{ academicYear, hoursPerWeek, dailyGoalMinutes, timezone, careerGoalText }` |
| GET | `/api/profile/completeness` | `{ percentage, missing[] }` |
| GET | `/api/profile/skills` | Caller's rated skills |
| PUT | `/api/profile/skills` | Bulk upsert `[{ skillId, selfLevel, evidenceUrl? }]` |
| DELETE | `/api/profile/skills/{skillId}` | Remove a claim |
| GET | `/api/profile/courses` | Completed courses |
| PUT | `/api/profile/courses` | `[{ courseId, grade?, completedTerm? }]` |
| POST | `/api/profile/courses/derive-skills` | Returns unverified proposals without persisting (US-11 AC2) |
| GET | `/api/profile/onboarding` | `{ step, isCompleted, completedAt }` |
| PUT | `/api/profile/onboarding/step` | `{ step: 1..5 }` — step-gated; returns 422 if prerequisites unmet (F-30) |
| PUT | `/api/profile/consent` | `{ advisorVisibility: bool, researchUse: bool }` (F-31) |

---

## 6. Catalogue

Public cacheable reference data (`Cache-Control: public, max-age=3600`).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/skills?search=&category=&page=` | Search matches aliases |
| GET | `/api/skills/{id}` | Includes prerequisites and related skills |
| GET | `/api/careers` | All 6 careers with summaries |
| GET | `/api/careers/{id}` | Includes tracks and requirement groups |
| GET | `/api/careers/{id}/requirements?trackId=` | Requirements with importance and rationale |
| GET | `/api/courses` | Department catalogue |
| GET | `/api/projects?careerId=&difficulty=` | Stage project nodes |

---

## 7. Assessment, placement and recommendation

| Method | Path | Notes |
|---|---|---|
| POST | `/api/assessments` | Start assessment attempt $\to$ `{ attemptId, questions[] }` (22 Likert items) |
| PUT | `/api/assessments/{id}/answers` | Save Likert answers incrementally |
| POST | `/api/assessments/{id}/submit` | Score and return all 6 ranked careers with baseline reason badges |
| GET | `/api/recommendations` | Latest ranked careers for current profile (always returns all 6 careers) |
| PUT | `/api/profile/target` | `{ careerId, trackId }` — commits committed target |
| POST | `/api/placement` | `{ skillId }` $\to$ starts adaptive diagnostic placement session |
| POST | `/api/placement/{sessionId}/answer` | `{ answerIndex }` $\to$ adaptive step returns next probe or final verified level |

### Example — `POST /api/assessments/{id}/submit`

```json
{
  "mode": "model-first",
  "recommendations": [
    {
      "careerId": 2,
      "name": "Frontend / Full-Stack",
      "matchScore": 74,
      "isActive": true,
      "contentAvailability": 0.92,
      "contentLimited": false,
      "isSelectable": true,
      "breakdown": {
        "constraintStatus": "passed",
        "modelScore": 74,
        "baselineScore": 67,
        "skillFit": 0.58,
        "interestFit": 0.81,
        "coverage": 0.72
      },
      "reasons": [
        { "type": "skill", "detail": "HTML/CSS and JavaScript fit high-importance requirements" },
        { "type": "interest", "detail": "Strong visual and problem-type affinity" }
      ],
      "tracks": [ { "trackId": 4, "name": "React", "isDefault": true } ]
    }
  ]
}
```

---

## 8. Atomic Roadmap, Lessons and Mastery (v2.0.0)

### Endpoint summary

| Method | Path | Notes |
|---|---|---|
| GET | `/api/gap-analysis` | Against committed target; pure read (F-18) |
| GET | `/api/gap-analysis/preview?careerId=&trackId=` | What-if comparison; persists nothing (US-08 AC3) |
| GET | `/api/readiness` | Current readiness score percentage |
| GET | `/api/readiness/history` | Append-only snapshot time series |
| GET | `/api/path` | Path summary (totals, stages, units, projected finish) |
| GET | `/api/path/units/{unitId}` | Unit detail with atom nodes and availability states |
| PUT | `/api/path/mode` | `{ mode: "canonical" \| "prioritized" }` |
| POST | `/api/lessons` | `{ kind: "lesson"\|"review"\|"checkpoint"\|"placement", atomId?, unitId? }` $\to$ `201 { sessionId, contentVersion }` |
| POST | `/api/lessons/{sessionId}/complete` | Authoritative server re-grading with idempotency |
| GET | `/api/reviews/due` | Due count and next review batch |
| POST | `/api/atoms/{atomId}/reset` | Replaces legacy undo; clears atom state and recalculates derived mastery |
| GET | `/api/game/summary` | Total XP, current streak, longest streak, streak freezes |
| PUT | `/api/game/daily-goal` | `{ dailyGoalMinutes: 10\|20\|30\|45\|60 }` |
| POST | `/api/game/exam-pause` | `{ until: "2027-01-14" }` — pause streak during university exams |
| GET | `/api/achievements` | Unlocked achievements (Should) |
| POST | `/api/content-reports` | `{ atomId?, exerciseId?, reason, text? }` |
| GET | `/api/internship-readiness` | Checklist status derived from profile and completed project nodes |

*Legacy endpoint status:* `GET /api/roadmap`, `POST /api/roadmap/regenerate`, and `/api/roadmap/items/**` are **deprecated in v2.0.0** and return HTTP 410 Gone (or an emulation redirect to `/api/path` during transition).

### Example — `GET /api/gap-analysis`

```json
{
  "careerId": 1,
  "careerName": "Backend Development",
  "trackName": ".NET",
  "readinessScore": 65,
  "computedAt": "2026-11-15T09:12:00Z",
  "summary": { "critical": 2, "moderate": 5, "minor": 1, "met": 2, "strengths": 1 },
  "rows": [
    {
      "skillId": 44,
      "canonicalName": "Docker",
      "currentLevel": 0,
      "requiredLevel": 3,
      "gap": 3,
      "importance": 0.65,
      "priority": 1.95,
      "severity": "critical",
      "severityLabel": "Critical",
      "rationale": "Appears in 61% of junior .NET backend postings, and is a prerequisite for CI/CD.",
      "verified": false,
      "atomsRemaining": 18,
      "minutesRemaining": 90,
      "nextAtomId": "a1b2c3d4-0000-0000-0000-000000000001",
      "progressToNextLevel": 0.00
    }
  ]
}
```

### Example — `GET /api/path`

```json
{
  "pathVersion": 1,
  "careerName": "Backend Development",
  "trackName": ".NET",
  "mode": "canonical",
  "totals": {
    "atomsTotal": 612,
    "atomsDone": 142,
    "remainingMinutes": 2350,
    "projectedCompletion": "2027-03-12"
  },
  "stages": [
    {
      "stageId": 1,
      "name": "Foundations",
      "units": [
        {
          "unitId": "u1111111-0000-0000-0000-000000000001",
          "slug": "sql-fundamentals",
          "title": "SQL Fundamentals",
          "state": "available",
          "atomsTotal": 16,
          "atomsDone": 6,
          "minutesRemaining": 50,
          "checkpointState": "locked"
        }
      ]
    }
  ]
}
```

### Example — `POST /api/lessons/{sessionId}/complete`

**Idempotency & Session Semantics:**

- `sessionId` (path) identifies the ephemeral lesson attempt session created via `POST /api/lessons`.
- `idempotencyKey` (body) defaults to `sessionId` if omitted. It enforces database-level uniqueness per student profile.
- Re-submitting an identical trace with the same key returns the cached `200 OK` response with original XP, streak, and readiness deltas, applying zero duplicate state changes. Submitting a conflicting trace with an existing key returns `409 Conflict`.

```json
{
  "idempotencyKey": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "attempts": [
    { "exerciseId": "e1111111-0000-0000-0000-000000000001", "attemptNo": 1, "selected": 2, "msTaken": 4200 },
    { "exerciseId": "e1111111-0000-0000-0000-000000000002", "attemptNo": 1, "selected": [0, 2], "msTaken": 6800 }
  ]
}
```

```json
{
  "accuracy": 1.00,
  "xp": {
    "base": 15,
    "bonus": 5,
    "totalAwarded": 20
  },
  "atomState": "learned",
  "streak": {
    "current": 6,
    "extendedToday": true
  },
  "readiness": {
    "before": 64.60,
    "after": 66.36,
    "delta": 1.76
  },
  "newlyUnlockedAtoms": [
    "a1b2c3d4-0000-0000-0000-000000000002"
  ],
  "achievements": []
}
```

---

## 9. Static content bundle specification (`/content/v{n}/*.json`)

Pre-rendered unit bundles are fetched by the SPA directly from static CDN storage.

### Bundle excerpt: `/content/v1/unit-u1111111.json`

```json
{
  "unitId": "u1111111-0000-0000-0000-000000000001",
  "version": 1,
  "title": "SQL Fundamentals",
  "guidebook": "# SQL Cheat Sheet\n\n- `SELECT ... FROM ... WHERE`\n- `INNER JOIN` matches both sides.",
  "atoms": [
    {
      "atomId": "a1b2c3d4-0000-0000-0000-000000000001",
      "slug": "sql-select-where",
      "title": "Filtering Rows with WHERE",
      "objective": "The student can write a query filtering table rows using comparison operators.",
      "estimatedMinutes": 5,
      "contentMd": "The `WHERE` clause filters rows before grouping or returning results. Comparison operators include `=`, `<>`, `<`, `>`, `<=`, and `>=`.",
      "exercises": [
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000001",
          "type": "multiple_choice",
          "prompt": "Which clause filters rows before aggregation?",
          "options": ["HAVING", "WHERE", "ORDER BY", "GROUP BY"],
          "answerKey": 1,
          "explanation": "WHERE filters rows before aggregation; HAVING filters groups after aggregation."
        },
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000002",
          "type": "fill_blank_tokens",
          "prompt": "Filter users older than 21:",
          "codeTemplate": "SELECT * FROM users ___ age > 21;",
          "tokens": ["WHERE", "HAVING", "FILTER", "WHEN"],
          "answerKey": ["WHERE"],
          "explanation": "WHERE introduces row-level conditions."
        },
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000003",
          "type": "true_false_code",
          "prompt": "Is the following query valid SQL?",
          "code": "SELECT name WHERE age > 18 FROM students;",
          "answerKey": false,
          "explanation": "FROM must precede WHERE in SQL query syntax."
        },
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000004",
          "type": "reorder_tokens",
          "prompt": "Arrange clauses into valid SQL order:",
          "tokens": ["WHERE id = 5", "SELECT *", "LIMIT 1", "FROM accounts"],
          "answerKey": ["SELECT *", "FROM accounts", "WHERE id = 5", "LIMIT 1"],
          "explanation": "Standard SQL order: SELECT, FROM, WHERE, LIMIT."
        },
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000005",
          "type": "match_pairs",
          "prompt": "Match the operator to its meaning:",
          "pairs": [
            { "left": "=", "right": "Equal to" },
            { "left": "<>", "right": "Not equal to" },
            { "left": "LIKE", "right": "Pattern matching" }
          ],
          "explanation": "= tests equality, <> tests inequality, LIKE performs pattern searches."
        },
        {
          "exerciseId": "e1111111-0000-0000-0000-000000000006",
          "type": "predict_output",
          "prompt": "How many rows are returned?",
          "code": "-- Table numbers: [2, 4, 6, 8]\nSELECT * FROM numbers WHERE val > 5;",
          "options": ["1", "2", "3", "4"],
          "answerKey": 1,
          "explanation": "Only rows with values 6 and 8 satisfy val > 5, giving 2 rows."
        }
      ]
    }
  ]
}
```

---

## 10. AI Mentor endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/mentor/messages?page=` | Turn history |
| POST | `/api/mentor/messages` | `{ question }` $\to$ grounded response + atom deep links |
| GET | `/api/mentor/quota` | `{ usedToday, dailyLimit, resetsAt }` |

### Example — `POST /api/mentor/messages`

```json
{
  "messageId": 77,
  "question": "Why should I learn SQL indexing?",
  "answer": "SQL is one of your moderate gaps (level 3 to 4 required for Backend Development .NET). Indexing is essential for query performance on large tables, and it builds directly on your current unit.",
  "mode": "llm",
  "citations": [
    { "key": "gap.sql", "value": "level 3 of 4 required, priority 0.85" }
  ],
  "retrievedAtoms": [
    { "atomId": "a1b2c3d4-0000-0000-0000-000000000010", "title": "B-Tree Indexing in PostgreSQL" }
  ],
  "createdAt": "2026-11-15T09:20:00Z"
}
```

---

## 11. Advisor and admin endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/advisor/cohort/gaps?year=&careerId=` | Advisor | Aggregates only; cells with $k < 5$ suppressed |
| GET | `/api/advisor/cohort/atoms?unitId=&year=` | Advisor | Most-missed atoms; $k \ge 5$ suppression |
| GET | `/api/advisor/cohort/summary` | Advisor | Overall stats, mean readiness |
| GET | `/api/advisor/cohort/export` | Advisor | CSV export of aggregate cohort |
| GET | `/api/advisor/students` | Advisor | Only students with `consent_advisor_visibility = true` |
| POST/PUT/DELETE | `/api/admin/{skills,careers,units,atoms,exercises}` | Admin | Catalogue CRUD |
| POST | `/api/admin/content/validate` | Admin | Validates graph acyclicity, coverage, and schemas |
| POST | `/api/admin/content/publish` | Admin | Exports static bundles (`publish-content`) |
| GET | `/api/admin/reports` | Admin | Student content problem reports queue |
| PUT | `/api/admin/reports/{id}/status` | Admin | Resolve/dismiss issue report |

---

## 12. Internal AI service endpoints

Private service, reachable only from .NET with `X-Masar-Service-Key`.

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/extract-skills` | `{ text, sections? }` | `{ skills: [{ slug, confidence, layer, matchedAlias, isPreferred }] }` |
| POST | `/embed` | `{ texts: string[] }` | `{ vectors: number[][], model, version }` |
| POST | `/recommend` | `{ profile, careers, constraints? }` | `{ recommendations: [...], mode, model }` |
| POST | `/mentor` | `{ question, contextDto }` | `{ answer, citations[], retrievedAtomIds[], model, tokensUsed }` |
| GET | `/ready` | — | `{ status: "ready" \| "loading", model, version }` |
| GET | `/health` | — | `{ status: "ok" }` |

---

## 13. Contract discipline and versioning

1. **Semver governance:** API revisions follow strict Semantic Versioning. Changes after the baseline freeze require an approved ADR and corresponding version bump.
2. **Version `2.0.0`:** Incorporates the Atomic Roadmap, Lesson Player, Gamification, and Static Content Bundles, retiring legacy phase-based scheduler endpoints.
3. **Single source of truth:** The .NET OpenAPI spec generates TypeScript client types automatically in CI. Hand-written types fail CI checks.
4. **Integration verification:** Every endpoint has integration tests verifying 200/201, 401, 403, and 422 paths.

### Changelog

- **v1.0.0 (2026-09-20):** Initial baseline contract frozen at end of Slice 0.
- **v1.1.0 (2026-10-06):** Updated recommendation response shape per ADR-0006.
- **v2.0.0 (2026-11-15):** Complete Atomic Roadmap revision ([ADR-0007](adr/0007-atomic-roadmap.md), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)). Deprecated legacy phase-based roadmap endpoints (`/api/roadmap/**`, `/api/quizzes/**`). Added path navigation (`/api/path`), lesson sessions (`/api/lessons`), gamification (`/api/game/**`), reviews (`/api/reviews/**`), static bundles (`/content/v{n}/**`), and system meta (`/api/meta`). Fixed 403/404 cross-student privacy rules (F-04).

---

**Next:** [08 — Plan & Timeline](08-plan-and-timeline.md)
