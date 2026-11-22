# 07 — API Contract

**Document owner:** Abdelrahman Megahed · **Status:** Revised <2026-11-19> (pre-W9 freeze target <2027-01-18>) · **Contract Version:** `2.1.0`

This document specifies the public and internal HTTP API contracts for Masar. Contract version
`2.1.0` transitions the roadmap from 40-hour phase scheduling to the **Atomic Roadmap** and
gamified learning loop ([ADR-0007](adr/0007-atomic-roadmap.md), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)),
reconciling all cross-document conventions, numeric types, static bundle URLs, and endpoint definitions.

---

## 1. Conventions

| Aspect | Rule |
|---|---|
| Base URL | `/api` |
| Format | JSON, `application/json; charset=utf-8` |
| Error format | RFC 9457 ProblemDetails, `application/problem+json` |
| Casing | `camelCase` in JSON, `PascalCase` in C#, mapped automatically |
| IDs | Integer surrogate keys for taxonomy rows; **UUID** for students, profiles, units, atoms, exercises, sessions, and jobs |
| Dates | ISO 8601 UTC — `2026-09-21T00:00:00Z`. Never a locale-formatted string. |
| Levels | Derived integer level $L(s)$ in `0–5` ([ADR-0004](adr/0004-proficiency-scale.md)); continuous level $c(s)$ is `numeric(3,2)` in `[0.00, 5.00]` |
| Scores | `matchScore`: integer `0–100`; `readinessScore`: decimal `numeric(5,2)` in `[0.00, 100.00]` |
| Pagination | Offset pagination (`?page=1&pageSize=20`, max `100`): `{ items, page, pageSize, totalCount, hasNextPage }`. Cursor pagination for append-only streams (`GET /api/mentor/messages?beforeId=&limit=20`, max `50`): `{ items, nextBeforeId, hasMore }`. |
| Caching | Public catalogues: `Cache-Control: public, max-age=3600` + strong `ETag`. Student pure reads (`GET /api/path`, `GET /api/gap-analysis`, `GET /api/readiness`): `Cache-Control: private, no-cache` + `ETag` (`If-None-Match` → `304 Not Modified`). Static CDN bundles: `Cache-Control: public, max-age=31536000, immutable`. |
| Auth & CSRF | Access token: 15-min Bearer JWT (in-memory). Refresh token: 7-day rotating `HttpOnly; Secure; SameSite=Lax; Path=/api/auth` cookie (or `SameSite=None; Secure` on cross-domain free-tier hosting per [ADR-0005](adr/0005-zero-budget-hosting.md)). Cookie-authenticated endpoints (`POST /api/auth/refresh`, `POST /api/auth/logout`) MUST require header `X-Masar-Client: web` and strict server-side `Origin` allow-list validation. |
| Correlation | `X-Correlation-Id` echoed on every response |
| Contract source | OpenAPI generated from .NET; TypeScript client generated via tool. Hand-written client types are banned. |

---

## 2. Error envelope

All errors conform to **RFC 9457 ProblemDetails** (`application/problem+json`):

```json
{
  "type": "https://masar.app/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "detail": "One or more fields are invalid.",
  "details": [
    { "field": "hoursPerWeek", "message": "Must be between 1 and 20." }
  ],
  "correlationId": "0HN7A2K3P9QRS"
}
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body or query failed validation |
| 401 | `UNAUTHENTICATED` | Missing, expired, or invalid token |
| 403 | `FORBIDDEN` | Authenticated but not permitted (e.g. Student role accessing Admin endpoint) |
| 404 | `NOT_FOUND` | Resource absent, or not owned by caller (cross-student access strictly returns 404 per F-04) |
| 409 | `CONFLICT` | State conflict, duplicate active session, conflicting idempotency payload hash, or `CONTENT_VERSION_MISMATCH` |
| 410 | `ENDPOINT_DEPRECATED` | Legacy endpoint retired; includes `Link: </api/path>; rel="successor-version"` |
| 422 | `PRECONDITION_UNMET` | Valid request, but preconditions missing (e.g. onboarding step-gating F-30, `CAREER_CONTENT_LIMITED`, `PLACEMENT_COOLDOWN_ACTIVE` with `nextEligibleAt`, or exam pause limit exceeded) |
| 429 | `RATE_LIMITED` | Rate limit hit; includes `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Unhandled error — never leaks stack trace to client |
| 503 | `DEPENDENCY_UNAVAILABLE` | External dependency down and no fallback applies |

> **404 rather than 403 for another student's resource (F-04).** Returning 403 confirms that another student's private record exists, leaking information. Cross-student access strictly returns 404.

---

## 3. Metadata and system status

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/api/meta` | `200` `{ contractVersion, contentVersion, algorithmVersion, demoMode }` | Version handshake and offline demo status (F-09) |
| GET | `/api/health` | `200` `{ status: "ok", timestamp }` | Liveness probe for container orchestration |
| GET | `/api/ready` | `200` \| `503` `{ status, database, aiService, contentHost }` | Readiness probe verifying dependencies |

---

## 4. Authentication

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, academicYear }` | `201` `{ userId }` | Verification email sent |
| POST | `/api/auth/login` | `{ email, password }` | `200` `{ accessToken, expiresIn, role }` | Sets `refreshToken` cookie |
| POST | `/api/auth/refresh` | — | `200` `{ accessToken, expiresIn, role }` | Rotates refresh cookie; requires `X-Masar-Client: web` |
| POST | `/api/auth/logout` | — | `204` | Clears refresh cookie; requires `X-Masar-Client: web` |
| POST | `/api/auth/verify-email` | `{ token }` | `204` | Confirms email verification |
| POST | `/api/auth/resend-verification` | `{ email }` | `202` | Triggers new verification email |
| POST | `/api/auth/forgot-password` | `{ email }` | `202` | Triggers password reset email |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | `204` | Consumes token and updates password |
| PUT | `/api/auth/password` | `{ currentPassword, newPassword }` | `204` | Authenticated password change |
| DELETE | `/api/auth/account` | `{ password }` | `202` | Hard deletion within 30 days ([NFR-08](02-requirements.md#nfr-08--privacy-and-data-protection)) |

---

## 5. Profile, preferences and consent

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/profile` | — | `200` `StudentProfile` | Includes `hoursPerWeek` and derived `dailyGoalMinutes` |
| PUT | `/api/profile` | `{ academicYear, hoursPerWeek, timezone, careerGoalText, interests }` | `200` `StudentProfile` | `hoursPerWeek` (`1..20`, presets `2, 3, 5, 10`, default `5`) is authoritative; `dailyGoalMinutes` is derived |
| GET | `/api/profile/completeness` | — | `200` `{ percentage, missing[] }` | Onboarding progress |
| GET | `/api/profile/skills` | — | `200` `SkillClaim[]` | Rated skills |
| PUT | `/api/profile/skills` | `SkillClaimInput[]` | `200` `{ updated, skills }` | Full replace of student skill claims |
| PATCH | `/api/profile/skills` | `SkillClaimInput[]` | `200` `{ updated, skills }` | Partial bulk upsert of skill claims |
| DELETE | `/api/profile/skills/{skillId}` | — | `204` | Removes a single claim |
| GET | `/api/profile/courses` | — | `200` `CourseRecord[]` | Completed academic courses |
| PUT | `/api/profile/courses` | `CourseRecordInput[]` | `200` `CourseRecord[]` | Full replace of completed courses |
| PATCH | `/api/profile/courses` | `CourseRecordInput[]` | `200` `CourseRecord[]` | Partial bulk upsert of completed courses |
| POST | `/api/profile/courses/derive-skills` | — | `200` `SkillProposal[]` | Unverified proposals without persisting (US-11 AC2) |
| GET | `/api/profile/onboarding` | — | `200` `OnboardingProgress` | Current onboarding state |
| PUT | `/api/profile/onboarding/step` | `{ step: 1..5 }` | `200` `OnboardingProgress` | Step-gated; returns 422 if prerequisites unmet (F-30) |
| GET | `/api/profile/consent` | — | `200` `ConsentPreferences` | Current consent flags |
| PUT | `/api/profile/consent` | `{ advisorVisibility, researchUse }` | `200` `ConsentPreferences` | Updates consent flags (F-31) |
| GET | `/api/profile/notifications` | — | `200` `NotificationPreferences` | Opt-in notification flags |
| PUT | `/api/profile/notifications` | `{ emailStreakReminders, emailWeeklyDigest }` | `200` `NotificationPreferences` | Defaults `false` per OD-4 & [ADR-0009](adr/0009-gamification-and-engagement-ethics.md) |

---

## 6. Catalogue

Public cacheable reference data (`Cache-Control: public, max-age=3600`).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/skills?search=&category=&page=1&pageSize=20` | Search matches canonical names and aliases |
| GET | `/api/skills/{id}` | Includes prerequisites and related skills |
| GET | `/api/careers` | All 6 careers with summaries |
| GET | `/api/careers/{id}` | Includes tracks and requirement groups |
| GET | `/api/careers/{id}/requirements?trackId=` | Requirements with importance and rationale |
| GET | `/api/courses` | Faculty course catalogue |
| GET | `/api/projects?careerId=&difficulty=` | Stage project catalogue |

---

## 7. Assessment, adaptive placement and recommendation

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| POST | `/api/assessments` | — | `201` `{ attemptId, questions[] }` | Starts assessment (22 Likert items) |
| PUT | `/api/assessments/{id}/answers` | `{ answers: [{ questionId, value }] }` | `200` | Saves Likert answers incrementally |
| POST | `/api/assessments/{id}/submit` | — | `200` `RecommendationResponseDto` | Scores and ranks all 6 careers with match scores and badges |
| GET | `/api/recommendations` | — | `200` `RecommendationResponseDto` | Latest recommendations (`mode: "model-first" \| "fallback" \| "unavailable"`, `lowConfidence`) |
| PUT | `/api/profile/target` | `{ careerId, trackId, requirementGroupChoices? }` | `200` | Commits student target; returns 422 `CAREER_CONTENT_LIMITED` if unready |
| POST | `/api/placement` | `{ skillId }` | `201` `{ sessionId, skillId, maxExercises: 8, currentExercise }` | Keyless adaptive probe; returns 422 `PLACEMENT_COOLDOWN_ACTIVE` if < 7 days |
| GET | `/api/placement/{sessionId}` | — | `200` `{ sessionId, skillId, isFinal, currentExercise, verifiedLevel? }` | Resumes active diagnostic session |
| POST | `/api/placement/{sessionId}/answer` | `{ exerciseId, answer, msTaken }` | `200` `{ isFinal, verifiedLevel?, nextExercise? }` | Adaptive step returning next probe or verified level |

---

## 8. Atomic Roadmap, lessons, mastery, projects and gamification

### 8.1 Path and unit progression

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/gap-analysis` | — | `200` `GapAnalysisResponse` | Against committed target; pure read (F-18) |
| GET | `/api/gap-analysis/preview?careerId=&trackId=` | — | `200` `GapAnalysisResponse` | What-if comparison; persists nothing (US-08 AC3) |
| GET | `/api/readiness` | — | `200` `{ score }` | Decimal `numeric(5,2)` in `[0.00, 100.00]` |
| GET | `/api/readiness/history` | — | `200` `ReadinessSnapshot[]` | Append-only snapshot time series |
| GET | `/api/path` | — | `200` `PathResponse` | Path summary, totals, stages, units (`bundleUrl`, `displayState`, `canTestOut`) |
| GET | `/api/path/units/{unitId}` | — | `200` `PathUnitDetail` | Unit detail with atom nodes and 6 derived UI states |
| GET | `/api/path/preferences` | — | `200` `PathPreferences` | Current `STUDENT_PATH_PREFS` (`any_of` OR-group selections) |
| PUT | `/api/path/preferences` | `{ requirementGroupChoices: [{ groupId, selectedSkillId }] }` | `200` `PathPreferences` | Updates elective track choices |
| PUT | `/api/path/mode` | `{ mode: "canonical" \| "prioritized" }` | `200` `{ mode }` | Toggles path ordering mode |

### 8.2 Lesson loop and spaced repetition

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| POST | `/api/lessons` | `{ kind, atomId?, unitId? }` | `201` `CreateLessonSessionResponse` | `kind: "lesson"\|"review"\|"checkpoint"\|"test_out"\|"replay"`. Lessons return `bundleUrl`; checkpoints return keyless `exercises[]`. |
| POST | `/api/lessons/{sessionId}/complete` | `{ idempotencyKey?, attempts: [{ exerciseId, attemptNo, answer, msTaken }] }` | `200` `LessonSessionCompletionResponse` | Authoritative server re-grading with idempotency; returns 409 on version mismatch |
| GET | `/api/reviews/due` | — | `200` `ReviewsDueResponse` | Due count and next review batch (Leitner 5-box queue) |
| POST | `/api/atoms/{atomId}/reset` | — | `200` `ResetAtomStateResponse` | Clears atom state and recalculates derived mastery |

### 8.3 Stage capstone projects and portfolio

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/profile/projects` | — | `200` `StudentProjectDto[]` | Enrolled and completed stage projects |
| POST | `/api/projects/{projectId}/start` | — | `201` `StudentProjectDto` | Enrolls student in capstone project |
| PUT | `/api/projects/{projectId}/milestones/{milestoneId}` | `{ completed, note? }` | `200` `ProjectMilestoneDto` | Updates milestone checklist |
| POST | `/api/projects/{projectId}/submit` | `{ repoUrl, liveUrl?, reflection? }` | `200` `SubmitProjectResponse` | Submits project; awards `+100 XP` and creates `STUDENT_PORTFOLIO_ITEM` |

### 8.4 Gamification and student wellbeing

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/game/summary` | — | `200` `GameSummaryResponse` | Total XP, streak, freezes, `hoursPerWeek`, `dailyGoalMinutes`, `minutesCompletedThisWeek`, `examPause` |
| PUT | `/api/game/weekly-goal` | `{ hoursPerWeek: 1..20 }` | `200` `WeeklyGoalResponse` | Presets `2, 3, 5, 10`; updates derived `dailyGoalMinutes` |
| POST | `/api/game/exam-pause` | `{ until: "YYYY-MM-DD" }` | `200` `ExamPauseResponse` | Pauses streak during exams (max 2 pauses/year, $\le 3$ weeks each) |
| DELETE | `/api/game/exam-pause` | — | `204` | Cancels active exam pause early |
| GET | `/api/achievements` | — | `200` `AchievementDto[]` | Unlocked achievements |
| POST | `/api/content-reports` | `{ atomId?, exerciseId?, reason, text? }` | `201` | Submits student problem report |
| GET | `/api/internship-readiness` | — | `200` `InternshipReadinessResponse` | Checklist status derived from profile and completed project nodes |

*Legacy endpoint status:* `GET /api/roadmap`, `POST /api/roadmap/regenerate`, and `/api/roadmap/items/**` return HTTP **410 Gone** (`ENDPOINT_DEPRECATED`) with `Link: </api/path>; rel="successor-version"`.

---

## 9. Static content bundle specification (`/content/v{n}/*.json`)

Pre-rendered unit bundles are fetched by the SPA directly from static CDN storage. Checkpoint and placement exercises are evaluated strictly server-side and are **never** exported into public static bundles ([ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)).

- **Canonical URL:** `/content/v{contentVersion}/units/{unitSlug}.{hash}.json`
- **Cache Header:** `Cache-Control: public, max-age=31536000, immutable`

### The 8 Canonical Exercise Types & Answer Shapes

| Type | Discriminator `type` | Client Answer Shape | Notes |
|---|---|---|---|
| Multiple Choice | `multiple_choice` | `{ type: "multiple_choice", selectedIndex: number }` | Single option selected |
| Fill in the Blank | `fill_blank_tokens` | `{ type: "fill_blank_tokens", selectedTokenIndices: number[] }` | Tokens placed into slots |
| True / False Code | `true_false_code` | `{ type: "true_false_code", selected: boolean }` | Boolean evaluation of code |
| Reorder Tokens | `reorder_tokens` | `{ type: "reorder_tokens", orderedTokenIds: string[] }` | Tokens arranged in correct sequence |
| Match Pairs | `match_pairs` | `{ type: "match_pairs", pairs: [{ leftId, rightId }] }` | Associative pair matching |
| Predict Output | `predict_output` | `{ type: "predict_output", selectedIndex: number }` | Output prediction from snippet |
| Spot the Defect | `spot_defect` | `{ type: "spot_defect", selectedLine: number }` | Line number containing bug |
| Multi-Select | `multi_select` | `{ type: "multi_select", selectedIndices: number[] }` | Multiple correct options |

---

## 10. AI Mentor endpoints

| Method | Path | Body / Query | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/mentor/messages?beforeId=&limit=20` | `beforeId?: string, limit?: 1..50` | `200` `CursorPagedResponse<MentorMessage>` | Cursor-paginated turn history |
| POST | `/api/mentor/messages` | `{ question, context?: { atomId?, exerciseId?, unitId? } }` | `200` `MentorMessage` | Grounded pedagogical response + citations |
| GET | `/api/mentor/quota` | — | `200` `MentorQuotaResponse` | `{ usedThisHour, hourlyLimit: 10, usedToday, dailyLimit, resetsAt }` |

---

## 11. Advisor and admin endpoints

| Method | Path | Role | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/advisor/cohort/gaps?year=&careerId=` | Advisor | `200` `CohortGapResponse` | Aggregates only; cells with $k < 5$ return `{ suppressed: true, studentCount: null, meanLevel: null }` (CSV exports `"<5"`) |
| GET | `/api/advisor/cohort/atoms?unitId=&year=` | Advisor | `200` `CohortAtomsResponse` | Most-missed atoms with $k \ge 5$ suppression |
| GET | `/api/advisor/cohort/summary` | Advisor | `200` `CohortSummaryResponse` | Overall stats, mean readiness |
| GET | `/api/advisor/cohort/export` | Advisor | `200` (CSV) | CSV export of aggregate cohort |
| GET | `/api/advisor/students` | Advisor | `200` `StudentListResponse` | Only students with `consent_advisor_visibility = true` |
| POST/PUT/DELETE | `/api/admin/{skills,careers,units,atoms,exercises}` | Admin | `200` \| `201` \| `204` | Catalogue CRUD |
| POST | `/api/admin/content/validate` | Admin | `200` `ValidationReport` | Validates graph acyclicity, coverage, and schemas |
| POST | `/api/admin/content/publish` | Admin | `202` `{ jobId, status: "queued" }` | Triggers async static bundle generation (`{ unitId? }`) |
| GET | `/api/admin/content/publish/{jobId}` | Admin | `200` `ContentPublishJobResponse` | Polls bundle publishing status |
| GET | `/api/admin/reports?status=&reason=&page=1&pageSize=20` | Admin | `200` `PagedResponse<ContentReportDto>` | Filterable content reports queue |
| PUT | `/api/admin/reports/{id}/status` | Admin | `200` | Resolve/dismiss problem report |

---

## 12. Internal AI service endpoints

Private service, reachable only from .NET backend with `X-Masar-Service-Key`.

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/extract-skills` | `{ text, sections? }` | `{ skills: [{ slug, confidence, layer, matchedAlias, isPreferred }] }` |
| POST | `/embed` | `{ texts: string[] }` | `{ vectors: number[][], model, version }` |
| POST | `/recommend` | `{ profile, careers, careerEmbeddings, constraints? }` | `{ recommendations: [...], mode: "model-first" \| "fallback", lowConfidence: bool, model }` |
| POST | `/mentor` | `{ question, contextDto }` | `{ answer, citations[], retrievedAtomIds[], model, tokensUsed }` |
| GET | `/ready` | — | `{ status: "ready" \| "loading", model, version }` |
| GET | `/health` | — | `{ status: "ok" }` |

---

## 13. Contract discipline and versioning

1. **Semver governance:** API revisions follow strict Semantic Versioning. Changes after the baseline freeze require an approved ADR and corresponding version bump.
2. **Version `2.1.0`:** Incorporates pre-W9 freeze reconciliation: RFC 9457 `ProblemDetails`, canonical bundle URLs, `hoursPerWeek` goal authority, 8 canonical exercise types, keyless assessments, Stage Capstone Projects, `STUDENT_PATH_PREFS`, opt-in notifications, early exam-pause cancellation, `.NET` health and ready probes, and cursor-paginated mentor history.
3. **Single source of truth:** The .NET OpenAPI spec generates TypeScript client types automatically in CI once all endpoints are implemented across Slices 1–5. In Slice 0, `src/frontend/src/types/api.ts` serves as the frozen baseline client contract reconciled against this document until full backend controller generation is integrated.

### Changelog

| Version | Date | Summary |
|---|---|---|
| `1.0.0` | `2026-09-20` | Initial baseline contract frozen at end of Slice 0. |
| `1.1.0` | `2026-10-06` | Updated recommendation response shape per [ADR-0006](adr/0006-model-based-recommendation.md). |
| `2.0.0` | `2026-11-15` | Complete Atomic Roadmap revision ([ADR-0007](adr/0007-atomic-roadmap.md), [ADR-0010](adr/0010-lesson-grading-authority-and-content-delivery.md)). Deprecated legacy phase-based roadmap endpoints (`/api/roadmap/**`). Added path navigation (`/api/path`), lesson sessions (`/api/lessons`), gamification (`/api/game/**`), reviews (`/api/reviews/**`), static bundles (`/content/v{n}/**`), and system meta (`/api/meta`). Fixed 403/404 cross-student privacy rules (F-04). |
| `2.1.0` | `2026-11-19` | Pre-W9 contract freeze reconciliation. Upgraded error format to RFC 9457 `ProblemDetails`. Reconciled static bundle paths to `/content/v{contentVersion}/units/{unitSlug}.{hash}.json`. Clarified `hoursPerWeek` goal authority (`1..20`) and read-only derived `dailyGoalMinutes`. Standardized 8 canonical exercise types and discriminated union `ExerciseAnswer`. Keyless checkpoint and placement payloads (PR #41 #7). Added Stage Capstone Projects (`/api/profile/projects`), `STUDENT_PATH_PREFS` (`/api/path/preferences`), opt-in notifications (`/api/profile/notifications`), early exam-pause cancellation (`DELETE /api/game/exam-pause`), `.NET` `/api/health` & `/api/ready` + `demoMode`, cursor-paginated AI Mentor, explicit Advisor $k < 5$ suppression objects, and `202 Accepted` async content publishing. |

---

**Next:** [08 — Plan & Timeline](08-plan-and-timeline.md)
