# 07 — API Contract

**Document owner:** Abdelrahman Megahed · **Status:** Frozen at the end of Slice 0

This contract is frozen early on purpose. Once it exists, frontend and backend can work in parallel
for weeks without blocking each other, which is the only way 8 people avoid queueing behind one
another. Changes after the freeze require a PR that updates this document and the generated client
in the same commit.

---

## 1. Conventions

| Aspect | Rule |
|---|---|
| Base URL | `/api` |
| Format | JSON, `application/json`, UTF-8 |
| Casing | `camelCase` in JSON, `PascalCase` in C#, mapped automatically |
| IDs | Integer surrogate keys for catalogue rows; **GUID** for users and profiles so they are not enumerable |
| Dates | ISO 8601 UTC — `2026-09-21T00:00:00Z`. Never a locale-formatted string. |
| Levels | Integer 0–5, never a percentage |
| Scores | Integer 0–100 |
| Pagination | `?page=1&pageSize=20`, response carries `page`, `pageSize`, `totalCount` |
| Auth | `Authorization: Bearer <access token>` |
| Correlation | `X-Correlation-Id` echoed on every response |
| Contract source | OpenAPI generated from the .NET project; the TypeScript client is generated from that. Hand-written client types are banned — they drift silently. |

---

## 2. Error envelope

One shape for every error, so the client has exactly one error path to handle:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "hoursPerWeek", "message": "Must be between 1 and 60." }
    ],
    "correlationId": "0HN7A2K3P9QRS"
  }
}
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body or query failed validation |
| 401 | `UNAUTHENTICATED` | Missing, expired, or invalid token |
| 403 | `FORBIDDEN` | Authenticated but not permitted — including cross-student access |
| 404 | `NOT_FOUND` | Resource absent, or not owned by the caller |
| 409 | `CONFLICT` | State conflict, e.g. re-submitting a completed assessment |
| 422 | `PRECONDITION_UNMET` | Valid request, but prerequisites missing (e.g. no target career set) |
| 429 | `RATE_LIMITED` | Rate limit hit; includes `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unhandled — never leaks a stack trace to the client |
| 503 | `DEPENDENCY_UNAVAILABLE` | A required dependency is down and no fallback applies |

> **404 rather than 403 for another student's resource.** Returning 403 confirms that the resource
> exists, which leaks information. Both are handled identically in the client.

---

## 3. Authentication

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, academicYear }` | `201` `{ userId }` — verification email sent |
| POST | `/api/auth/login` | `{ email, password }` | `200` `{ accessToken, refreshToken, expiresIn, role }` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `200` new token pair — old refresh token invalidated |
| POST | `/api/auth/logout` | `{ refreshToken }` | `204` |
| POST | `/api/auth/verify-email` | `{ token }` | `204` |
| DELETE | `/api/auth/account` | `{ password }` | `202` — deletion scheduled ([NFR-08](02-requirements.md#nfr-08--privacy-and-data-protection)) |

Rules: access token TTL 900 s; refresh tokens rotate on use; login is rate-limited to 5 per 15
minutes per account, and failures always return the same generic message so the endpoint cannot be
used to enumerate registered emails ([NFR-06](02-requirements.md#nfr-06--authentication)).

---

## 4. Profile

| Method | Path | Notes |
|---|---|---|
| GET | `/api/profile` | The caller's own profile. Never accepts an ID parameter. |
| PUT | `/api/profile` | `{ academicYear, hoursPerWeek, careerGoalText, interests[] }` |
| GET | `/api/profile/completeness` | `{ percentage, missing[] }` |
| GET | `/api/profile/skills` | The caller's rated skills |
| PUT | `/api/profile/skills` | Bulk upsert `[{ skillId, selfLevel, evidenceUrl? }]` |
| DELETE | `/api/profile/skills/{skillId}` | Remove a claim |
| GET | `/api/profile/courses` | Completed courses |
| PUT | `/api/profile/courses` | `[{ courseId, grade?, completedTerm? }]` |
| POST | `/api/profile/courses/derive-skills` | Returns **proposals**, persists nothing (US-11 AC2) |
| PUT | `/api/profile/consent` | `{ advisorVisibility: bool, researchUse: bool }` |

**There is no `/api/profile/{id}`.** Identity comes from the token, so a whole class of
authorization bug is structurally impossible rather than guarded against
([NFR-07](02-requirements.md#nfr-07--authorization)).

### Example — `PUT /api/profile/skills`

```json
{
  "skills": [
    { "skillId": 12, "selfLevel": 4 },
    { "skillId": 31, "selfLevel": 3, "evidenceUrl": "https://github.com/omar/api-demo" },
    { "skillId": 44, "selfLevel": 0 }
  ]
}
```

```json
{
  "updated": 3,
  "skills": [
    { "skillId": 12, "canonicalName": "C# / .NET", "selfLevel": 4,
      "calibratedLevel": null, "effectiveLevel": 4, "source": "self", "verified": false }
  ]
}
```

---

## 5. Catalogue

Public read-only reference data. Cacheable; `Cache-Control: public, max-age=3600`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/skills?search=&category=&page=` | **Search matches aliases** — "Postgres" finds "PostgreSQL" |
| GET | `/api/skills/{id}` | Includes prerequisites and related skills |
| GET | `/api/careers` | All 6 with summaries |
| GET | `/api/careers/{id}` | Includes tracks and requirement groups |
| GET | `/api/careers/{id}/requirements?trackId=` | Requirements with importance and rationale |
| GET | `/api/courses` | Department catalogue |
| GET | `/api/resources?skillId=&level=` | Curated resources |
| GET | `/api/projects?careerId=&difficulty=` | Project catalogue |

---

## 6. Assessment and recommendation

| Method | Path | Notes |
|---|---|---|
| POST | `/api/assessments` | Start an attempt → `{ attemptId, questions[] }` |
| PUT | `/api/assessments/{id}/answers` | Save answers incrementally, so a lost connection does not lose progress |
| POST | `/api/assessments/{id}/submit` | Score and return ranked careers |
| GET | `/api/assessments/latest` | Most recent completed attempt |
| GET | `/api/recommendations` | Ranked careers from the current profile |
| PUT | `/api/profile/target` | `{ careerId, trackId }` — sets the target |
| GET | `/api/quizzes/{skillId}` | Calibration items for one skill |
| POST | `/api/quizzes/{skillId}/submit` | `{ answers[] }` → calibrated level |

### Example — `POST /api/assessments/{id}/submit`

```json
{
  "mode": "hybrid",
  "recommendations": [
    {
      "careerId": 2,
      "name": "Frontend / Full-Stack",
      "matchScore": 69,
      "breakdown": { "skillFit": 0.58, "interestFit": 0.81, "coverage": 0.72, "semantic": 0.74 },
      "reasons": [
        { "type": "skill",    "detail": "HTML/CSS at level 3 matches a high-importance requirement" },
        { "type": "interest", "detail": "Your visual and analytical interests align with this path" }
      ],
      "tracks": [ { "trackId": 4, "name": "React", "isDefault": true } ]
    }
  ]
}
```

`mode` is `"hybrid"` or `"baseline"`, so the client can honestly display degraded state
([§05 5.4](05-features-mvp.md#54-career-recommendation)).

---

## 7. Gap, roadmap and progress

| Method | Path | Notes |
|---|---|---|
| GET | `/api/gap-analysis` | Against the saved target |
| GET | `/api/gap-analysis/preview?careerId=&trackId=` | What-if; persists nothing (US-08 AC3) |
| GET | `/api/readiness` | Current score |
| GET | `/api/readiness/history` | Snapshot series for the trend chart |
| GET | `/api/roadmap` | Current roadmap; generated on demand if absent |
| POST | `/api/roadmap/regenerate` | Force regeneration; no-op if `inputHash` is unchanged |
| GET | `/api/roadmap/items/{id}` | Item detail with resources |
| PUT | `/api/roadmap/items/{id}/status` | `{ status: "pending" \| "in_progress" \| "completed" }` |
| DELETE | `/api/roadmap/items/{id}/status` | Undo a completion (US-06 AC5) |
| GET | `/api/projects/recommended` | Gap-ranked projects plus the selected capstone |
| GET | `/api/internship-readiness` | Checklist state |

### Example — `GET /api/gap-analysis`

```json
{
  "careerId": 1,
  "careerName": "Backend Development",
  "trackName": ".NET",
  "readinessScore": 65,
  "computedAt": "2026-10-15T09:12:00Z",
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
      "rationale": "Appears in 61% of junior .NET backend postings, and is a prerequisite for CI/CD, also in your gap list.",
      "verified": false,
      "postingFrequency": 0.61
    }
  ]
}
```

Note `severityLabel` alongside `severity`: the client displays text, never colour alone
([NFR-05](02-requirements.md#nfr-05--accessibility)). `priority` is returned so the explainability
panel can show the arithmetic rather than restate the conclusion.

### Example — `GET /api/roadmap`

```json
{
  "roadmapId": 88,
  "careerName": "Backend Development",
  "trackName": ".NET",
  "hoursPerWeek": 8,
  "generatedAt": "2026-09-20T18:00:00Z",
  "algorithmVersion": "1.0.0",
  "inputHash": "b1946ac9",
  "totalHours": 148,
  "estimatedWeeks": 18.5,
  "estimatedCompletion": "2027-01-30",
  "phases": [
    {
      "sequence": 1,
      "title": "Data foundations",
      "estimatedHours": 29,
      "targetStartDate": "2026-09-21",
      "targetEndDate": "2026-10-16",
      "items": [
        {
          "itemId": 501,
          "sequence": 1,
          "skillId": 19,
          "skillName": "Relational DB Design",
          "fromLevel": 2,
          "toLevel": 3,
          "estimatedHours": 9,
          "status": "pending",
          "primaryResource": {
            "resourceId": 210,
            "title": "Database Design Fundamentals",
            "url": "https://example.org/db-design",
            "type": "docs",
            "estimatedHours": 9,
            "isFree": true
          },
          "blockedBy": []
        }
      ]
    }
  ],
  "capstone": {
    "projectId": 12,
    "title": "Containerised .NET API with CI",
    "estimatedHours": 30,
    "coveredGapSkills": ["Docker", "Testing", "CI/CD", "REST API Design", "SQL"]
  }
}
```

`blockedBy` is what lets the UI explain ordering to a student without issuing a second request.

---

## 8. Mentor

| Method | Path | Notes |
|---|---|---|
| GET | `/api/mentor/messages?page=` | Conversation history |
| POST | `/api/mentor/messages` | `{ question }` → answer with citations |
| GET | `/api/mentor/quota` | `{ used, limit, resetsAt }` |

```json
{
  "messageId": 77,
  "question": "Why should I learn Docker?",
  "answer": "Docker is your largest gap: you are at level 0 and this career needs level 3 …",
  "mode": "llm",
  "citations": [
    { "key": "gap.docker",   "value": "level 0 of 3, priority 1.95" },
    { "key": "posting.freq", "value": "61% of junior .NET postings" }
  ],
  "createdAt": "2026-10-15T09:20:00Z"
}
```

`mode` is `"llm"` or `"template"`, and `citations` satisfy FR-28. Requests are rate-limited per
[NFR-09](02-requirements.md#nfr-09--abuse-and-cost-control); a 429 carries `Retry-After`.

---

## 9. Advisor and admin

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/advisor/cohort/gaps?year=&careerId=` | Advisor | Aggregates only; cells with n < 5 suppressed |
| GET | `/api/advisor/cohort/summary` | Advisor | Counts, mean readiness, target distribution |
| GET | `/api/advisor/cohort/export` | Advisor | CSV of the aggregate view |
| GET | `/api/advisor/students` | Advisor | **Only** students who opted in |
| POST/PUT/DELETE | `/api/admin/{skills,careers,resources,projects,quiz-items,courses}` | Admin | Content CRUD |
| POST | `/api/admin/validate-prerequisites` | Admin | Cycle check; returns the offending edges |
| POST | `/api/admin/seed/reset` | Admin | **Blocked in production** |
| GET | `/api/admin/coverage-report` | Admin | Skills with no resource, careers with no project, skills with no quiz |
| GET | `/api/admin/ai-usage` | Admin | Daily call counts against the cap |

Aggregate endpoints return no student identifiers under any parameter combination. Suppression is
applied inside the query, not in the client.

---

## 10. Internal AI service endpoints

Not publicly routable. Requires `X-Masar-Service-Key`
([§03 6](03-architecture.md#6-service-to-service-authentication)).

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/extract-skills` | `{ text, sections? }` | `{ skills: [{ slug, confidence, layer, matchedAlias }] }` |
| POST | `/embed` | `{ texts: string[] }` | `{ vectors: number[][], model, version }` |
| POST | `/match` | `{ profileText, careerIds[] }` | `{ similarities: [{ careerId, score }] }` |
| POST | `/mentor` | `{ question, context }` | `{ answer, citations[], model, tokensUsed }` |
| GET | `/health` | — | `{ status: "ok" }` |
| GET | `/ready` | — | `{ status: "ready" \| "loading", model, version }` |

The `context` object on `/mentor` is the sanitised allow-listed DTO from
[§06 4.4](06-ai-engines.md#44-privacy-in-the-mentor-prompt). The AI service never receives a user ID
and has no way to load additional data, so it cannot widen its own context even if instructed to.

---

## 11. Contract discipline

1. **The .NET project is the single source of truth.** OpenAPI is generated from it; the TypeScript client is generated from that document. Nobody hand-writes a request type.
2. **CI fails if the generated client is stale.** The regenerate step runs in CI and the build fails on a diff, so drift is caught at the PR rather than at integration.
3. **Additive changes only after the freeze.** Adding an optional field is fine. Renaming or removing one requires updating this document, the client, and the affected frontend code in a single PR.
4. **Every endpoint gets an integration test** covering 200, 401 and 403 ([NFR-12](02-requirements.md#nfr-12--testability)).
5. **The response examples in this document are the contract.** If the implementation disagrees, one of the two is a bug — and this document arbitrates.

---

**Next:** [08 — Plan & Timeline](08-plan-and-timeline.md)
