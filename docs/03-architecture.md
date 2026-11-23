# 03 — Architecture

**Document owner:** Abdelrahman Megahed · **Status:** Revised <2026-11-15> (atomic roadmap + defect fixes)

---

## 1. Technology stack

| Layer | Choice | Why | Owner |
|---|---|---|---|
| Frontend | **React 19 + TypeScript + Vite** | Team's existing skill; TypeScript makes the [API contract](07-api-contract.md) enforceable at compile time | Ziad, Mazen |
| UI & Components | **Tailwind CSS + Radix UI primitives** | Radix provides accessible headless primitives ([NFR-05](02-requirements.md#nfr-05--accessibility)); consistent playful palette without trade-dress copying | Yousef K. |
| Client State & Caching | **TanStack Query v5** | Caches path summaries, manages optimistic updates, and queues offline lesson completions | Ziad |
| Path Virtualization | **TanStack Virtual** | Virtualizes vertical path rendering to current unit $\pm 2$, ensuring 60 FPS on mobile | Mazen |
| Motion & Animation | **Tailwind / CSS Transitions** | Lightweight micro-animations strictly respecting `prefers-reduced-motion` ([NFR-19](02-requirements.md#nfr-19--motion-and-sound-safety)); no heavy animation runtimes | Yousef K. |
| Static Content Delivery| **Static JSON Bundles on Cloudflare Pages / Vercel** | Delivers `/content/v{contentVersion}/units/{unitSlug}.{hash}.json` directly to the client; lessons start instantly even during API cold starts | Mohamed Salah |
| Backend | **ASP.NET Core 10 Web API (C#)** | Team's primary backend skill; active LTS release; high performance | Osama, Mohamed Y. |
| ORM | **EF Core 10 + Npgsql** | Migrations, type-safe queries, `Pgvector.EntityFrameworkCore` | Mohamed Y. |
| Database | **PostgreSQL 16 + pgvector** | Unified relational and vector store ([ADR-0001](adr/0001-database-and-vector-store.md)) | Mohamed Y. |
| AI Service | **Python 3.12 + FastAPI** | Embeddings, semantic scoring, reranking, and mentor RAG | Ahmed Y. |
| Embeddings | **sentence-transformers `all-MiniLM-L6-v2`** — 384 dimensions, ~23 M parameters, Apache-2.0 | Runs on CPU; precomputes catalogue and atom embeddings; peak RSS kept $\le 450$ MB | Ahmed Y. |
| LLM Provider | **Free-tier hosted API**, provider-abstracted ([ADR-0002](adr/0002-llm-provider.md)) | $0 budget; separate quotas for runtime mentor vs offline content drafting | Ahmed Y. |
| Content Factory Tooling | **Python CLI (`tools/content-factory/`)** | Offline CLI for LLM-assisted drafting and blind-solve checks; completely outside runtime | Mohamed Salah |
| Containers & CI/CD | **Docker + docker compose · GitHub Actions** | Local parity ([NFR-14](02-requirements.md#nfr-14--portability)) and automated CI verification | Mohamed Salah |
| Hosting & Uptime | Free tiers ([ADR-0005](adr/0005-zero-budget-hosting.md)) + scheduled keep-alive ping | $0 budget hosting with uptime ping during cohort active hours | Mohamed Salah |

---

## 2. Why three services and not one

The split is drawn on a **language and isolation boundary, not a scalability boundary**:

- **.NET owns all application state, public API endpoints, authoritative re-grading, and auth.** It is the only service that talks to PostgreSQL. It executes pure domain logic (`PathBuilder`, `MasteryCalculator`, `XpCalculator`, `StreakCalculator`), orchestrates student state transactions, and exposes system status endpoints (`GET /api/health`, `GET /api/ready`, `GET /api/meta`).
- **FastAPI owns stateless AI compute.** It performs profile embedding, semantic scoring, reranker scoring, mandatory constraint checks, and mentor RAG with atom retrieval. It maintains zero state and has no database connection.
- **Static Content Host serves pre-rendered unit content bundles.** Micro-lesson text, exercise definitions, and answer payloads are published as versioned static JSON files (`/content/v{contentVersion}/units/{unitSlug}.{hash}.json`). The React SPA fetches content directly from the CDN/static host, providing instant lesson starts even if the backend is cold-starting.
- **React owns presentation and instant client-side feedback.** The SPA checks exercise answers locally for instantaneous feedback, while submitting student selections to .NET for authoritative server-side grading upon lesson completion.
- **Content factory tooling is strictly offline.** The Python content factory (`tools/content-factory/`) used for LLM drafting and CI verification operates offline using a separate developer API key and quota; it is never in the runtime path.

---

## 3. System context

```mermaid
flowchart TB
    STU["Student<br/>P1, P2"]
    ADV["Advisor<br/>P3"]
    ADM["Admin"]

    subgraph CDN["Static Hosting / CDN"]
        BUNDLES["Static Content Bundles<br/>/content/v{contentVersion}/units/{unitSlug}.{hash}.json"]
    end

    subgraph MASAR["Masar Runtime"]
        WEB["React 19 SPA<br/>browser / PWA"]
        API["ASP.NET Core 10 API<br/>authoritative state · re-grading · auth"]
        AISVC["Python FastAPI Service<br/>stateless AI compute"]
        DB[("PostgreSQL 16<br/>+ pgvector")]
    end

    LLM["External LLM API<br/>free tier"]

    STU --> WEB
    ADV --> WEB
    ADM --> WEB

    WEB -->|"GET static bundles<br/>(instant cached)"| BUNDLES
    WEB -->|"HTTPS · JWT<br/>(state & completion)"| API
    API -->|"EF Core / SQL"| DB
    API -->|"internal HTTP<br/>shared secret"| AISVC
    AISVC -->|"HTTPS · API key<br/>allow-listed context"| LLM
```

---

## 4. Backend internals

```mermaid
flowchart TB
    subgraph API["Api — controllers · auth · validation · rate limiting"]
        direction LR
        C1["Auth"]
        C2["Profile"]
        C3["Assessment"]
        C4["Careers"]
        C5["Gap"]
        C6["Path"]
        C7["Lessons"]
        C8["Reviews"]
        C9["Game"]
        C10["Mentor"]
        C11["Advisor"]
        C12["Admin"]
    end

    subgraph APP["Application — orchestration · DTO mapping · transactions"]
        direction LR
        S1["ProfileService"]
        S2["AssessmentService"]
        S3["RecommendationService"]
        S4["GapService"]
        S5["PathService"]
        S6["LessonService"]
        S7["GamificationService"]
        S8["PlacementService"]
        S9["MentorService"]
    end

    subgraph DOM["Domain — pure logic · injected clock · no framework · no I/O"]
        direction LR
        D1["PathBuilder"]:::core
        D2["MasteryCalculator"]:::core
        D3["GapCalculator"]:::core
        D4["ReadinessCalculator"]:::core
        D5["XpCalculator"]:::core
        D6["StreakCalculator"]:::core
        D7["ReviewScheduler"]:::core
        D8["AtomGraphValidator"]:::core
    end

    subgraph INF["Infrastructure — I/O adapters"]
        direction LR
        I1["EF Core / Npgsql"]
        I2["AiRecommendationClient"]
        I3["AiMentorClient"]
    end

    subgraph AI["FastAPI — recommendation and AI computation"]
        direction LR
        AI1["Profile Embedder"]
        AI2["Semantic Scoring<br/>over supplied candidate vectors"]
        AI3["Reranker"]
        AI4["Mandatory Constraints"]
        AI5["Final Recommendation"]
        AI1 --> AI2 --> AI3 --> AI4 --> AI5
    end

    API --> APP
    APP --> DOM
    APP --> INF
    I2 --> AI1

    classDef core fill:#E8F0FE,stroke:#1A73E8,stroke-width:2px
```

Key rules:

- **`Domain` references nothing.** All calculators are pure functions accepting plain arguments and an injected `IClock`.
- **Query budget:** Gap analysis executes in $\le 2$ queries; lesson completion executes in $\le 8$ queries within a single database transaction.

---

## 5. AI service internals

```mermaid
flowchart LR
    IN["POST /extract-skills<br/>POST /embed<br/>POST /recommend<br/>POST /mentor"]

    subgraph P["Pipelines"]
        E1["Skill Extractor<br/>normalise → candidate phrases →<br/>taxonomy match → confidence"]
        E2["Embedder<br/>MiniLM-L6-v2 · 384-dim<br/>(skills, careers, atoms)"]
        E3["Recommendation Pipeline<br/>profile embedding → semantic scoring →<br/>reranker → mandatory constraints"]
        E4["Mentor RAG Pipeline<br/>allow-list verification → atom retrieval →<br/>sanitised prompt → LLM → output filter"]
    end

    IN --> E1
    IN --> E2
    IN --> E3
    IN --> E4
    E4 --> LLM["External LLM"]
    E1 -.-> E2
    E3 -.-> E2
    E4 -.-> E2
```

---

## 6. Service-to-service authentication

| Control | Implementation |
|---|---|
| Network | AI service bound to private container network; not publicly routable. |
| Shared secret | Every internal request carries `X-Masar-Service-Key` compared in constant time; returns `401` on mismatch. |
| Timeouts & Retries | Connect timeout: 2 s.<br/>`/recommend`: 8 s total timeout, 1 retry with exponential backoff.<br/>`/mentor`: 12 s total timeout, **no retry** (prevents doubling quota usage). |
| Failure handling | If `/recommend` fails or times out, .NET falls back to `mode: "unavailable"` with unranked career summaries and cached historical results ([F-24](10-risks-and-assumptions.md)). If `/mentor` times out, .NET returns a stored explanation. |
| Correlation | `X-Correlation-Id` propagated across all service boundaries. |

---

## 7. Key request flows

### 7.0 End-to-end onboarding and path reveal flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant D as Domain
    participant DB as PostgreSQL
    participant AI as AI Service

    Note over S,AI: Step 1 — Personality & Work Preferences (22 Likert items, <= 4 min)
    S->>W: Start onboarding
    W->>A: POST /api/assessments
    A->>DB: create assessment attempt
    A-->>W: 201 questions (22 items)
    S->>W: Answer items
    W->>A: PUT /api/assessments/{id}/answers
    A->>DB: persist answers

    Note over S,AI: Step 2 — Coursework & Skills (<= 3 min)
    S->>W: Select academic year & completed courses
    W->>A: POST /api/profile/courses/derive-skills
    A->>DB: query course_skill & course_atom
    A-->>W: proposed unverified skills
    S->>W: Confirm/adjust skill claims (0-5)
    W->>A: PUT /api/profile/skills
    A->>DB: upsert student_skill & assumed atoms

    Note over S,AI: Step 3 — Optional Placement Probe (<= 5 min, skippable)
    S->>W: Take placement probe for core claim
    W->>A: POST /api/placement {skillId}
    A-->>W: adaptive probe questions (is_placement_probe=true)
    S->>W: Submit answers
    W->>A: POST /api/placement/{id}/answer
    A->>D: evaluate band passed (capped at level 4)
    A->>DB: mark atoms assumed (verified=true, source='placement')

    Note over S,AI: Step 4 — Career Recommendation & Target Selection (<= 2 min)
    W->>A: POST /api/assessments/{id}/submit
    A->>DB: load profile + skills + candidate careers + precomputed vectors
    A->>AI: POST /recommend
    AI->>AI: Profile embed -> semantic scoring -> rerank -> mandatory constraints
    AI-->>A: 200 ranked careers + inspectable reason badges
    A-->>W: display ranked careers
    S->>W: Commit to target career & track (e.g. Backend / .NET)
    W->>A: PUT /api/profile/target {careerId, trackId}
    A->>DB: update target and initialize student_path_prefs

    Note over S,AI: Step 5 — Weekly Goal & Path Reveal -> First Lesson (< 10 min total)
    S->>W: Select weekly goal (e.g. 5 hrs/week)
    W->>A: PUT /api/profile/study-goal {hoursPerWeek: 5}
    A->>DB: persist weekly study goal
    W->>A: GET /api/path
    A->>D: PathBuilder.Build(path, atomStates, prefs)
    A-->>W: 200 path summary (units, total atoms, projected completion date)
    W-->>S: Reveal path banner and automatically focus first available micro-lesson
```

### 7.1 Career recommendation — model-first with a FastAPI fallback

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant DB as PostgreSQL
    participant AI as FastAPI Service

    S->>W: view recommendations
    W->>A: POST /api/assessments/{id}/submit
    A->>DB: load profile, claimed skills, candidate career vectors
    A->>AI: POST /recommend (profile + candidate data)

    alt AI service healthy
        AI->>AI: Embed profile -> semantic scoring -> rerank -> enforce constraints
        AI-->>A: 200 { mode: "model-first", careers: [...] }
        A-->>W: 200 ranked careers + reason badges
    else AI service down / timeout / cold start (> 8 s)
        A-->>W: 200 { mode: "unavailable", careers: [unranked static], retryAvailable: true }
        W-->>S: unranked careers with static summaries & retry button
    end
```

### 7.2 Path and lesson flow — static content with authoritative re-grading

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant C as Static Content Bundle
    participant A as .NET API
    participant D as Domain
    participant DB as PostgreSQL

    S->>W: tap next available atom
    W->>C: GET /content/v{contentVersion}/units/{unitSlug}.{hash}.json (read via bundleUrl, cached by CDN)
    C-->>W: unit bundle (micro-lesson markdown, exercises, local keys)
    W->>A: POST /api/lessons { atomId }
    A->>DB: create lesson_session
    A-->>W: 201 sessionId + contentVersion

    loop For each exercise in lesson (3 to 6 exercises)
        S->>W: select answer
        W->>W: instant local feedback and re-queue misses
    end

    S->>W: complete lesson
    W->>A: POST /api/lessons/{sessionId}/complete { idempotencyKey?, attempts }
    A->>D: MasteryCalculator.Evaluate(attempts)
    A->>D: XpCalculator.Calculate(accuracy)
    A->>D: StreakCalculator.Update(studentTimezone, injectedClock)
    A->>DB: Single Transaction:
    Note over A,DB: update student_atom_state<br/>update student_skill_progress<br/>update student_game_state<br/>upsert daily readiness_snapshot
    A-->>W: 200 { accuracy, xp, streak, readinessDelta, newlyUnlockedAtoms }
    W-->>S: End sheet (celebration, readiness gain, next atom)
```

**Pure Reads:** `GET /api/gap-analysis` and `GET /api/path` are strictly pure reads with no database side effects. Readiness snapshots are written only during state-mutating actions (lesson completion, target change), capped at one per profile, career, and local calendar day (F-18).

### 7.3 AI mentor — privacy-bounded RAG with atom retrieval

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant DB as PostgreSQL
    participant AI as AI Service
    participant LLM as External LLM

    S->>W: "Why is SQL indexing needed for my career?"
    W->>A: POST /api/mentor/messages { question }
    A->>A: rate limit check (10/h/user, 200/day total)
    A->>A: sanitize question: cap 300 chars, regex scrub email/phone/URL
    A->>DB: load student progress, target career, current unit
    A->>A: construct allow-listed Sanitised Context DTO in .NET (no PII)
    A->>AI: POST /mentor { question, contextDto }
    AI->>AI: re-verify context DTO against strict allow-list schema
    AI->>AI: embed question -> retrieve relevant authored atom excerpts
    AI->>LLM: system prompt + atom excerpts + sanitised context + question
    LLM-->>AI: generated response
    AI->>AI: validate response (length, no raw instructions, plain text)
    AI-->>A: response + retrieved atom deep links
    A->>DB: persist turn (question, answer, atom citations)
    A-->>W: 200 response + deep links
    W-->>S: mentor reply with "Open atom: SQL Indexing" link
```

---

## 8. Deployment topology

```mermaid
flowchart TB
    subgraph CI["GitHub Actions CI/CD"]
        G1["lint · test · graph validator"]
        G2["docs check: mermaid + links"]
        G3["publish-content: export static bundles"]
        G4["build & push container images"]
        G1 --> G2 --> G3 --> G4
    end

    subgraph PROD["Zero-Budget Production"]
        CDN["Static Content Host (Pages/Vercel)<br/>React SPA + /content/v{contentVersion}/*.json"]
        API["ASP.NET Core 10 Web API"]
        AISVC["Python FastAPI Service (Private)"]
        DB[("PostgreSQL 16 + pgvector")]
        PING["Automated Uptime Ping (Active Hours)"]
    end

    G3 --> CDN
    G4 --> API
    G4 --> AISVC
    PING -.->|"keep-alive ping"| API
    CDN -->|"API requests"| API
    API --> DB
    API --> AISVC
```

---

## 9. Environments and configuration

| Setting | Local Development | Staging | Production |
|---|---|---|---|
| Database | `pgvector/pgvector` container | Free managed Postgres | Free managed Postgres |
| Static Bundles | Local Vite dev server | Static preview URL | Global Static CDN |
| LLM Provider | Mock by default; real key if supplied | Real free tier | Real free tier |
| Embeddings | Local CPU (`all-MiniLM-L6-v2`) | Real CPU | Real CPU |
| Seed Data | Full, resettable via CLI | Full, resettable | Seeded once, versioned |
| Demo Mode | Supported (`MASAR_DEMO_MODE=true`) | Supported | **Supported** |
| Log Level | Debug | Information | Warning |

---

## 10. Demo mode

When `MASAR_DEMO_MODE=true`:

- Pre-seeded student account (Omar) loads with known skills, active streak, and preset unit bundle fixtures.
- The AI service serves canned responses; zero external network requests are made.
- Placement probes and mentor questions return deterministic recorded responses.
- The demo operates completely offline, eliminating risk from host cold starts or third-party outages.

---

## 11. What we are deliberately not building

| Not building | Why | What we do instead |
|---|---|---|
| In-browser code execution sandbox | Security risk, high complexity, out of scope | Non-executing structured code exercises (token ordering, bug spotting, output prediction) |
| Real-time multiplayer leagues | Excessive complexity, network overhead | Async weekly leagues (opt-in, nickname-only, XP-based) |
| Native mobile applications | Multi-platform maintenance overhead | Responsive, mobile-first PWA with cached static bundles |
| Message queue / broker | Purely synchronous student flows | Synchronous, bounded endpoints with idempotent retries |
| Distributed Redis cache | Scale is 500 students; static bundles offload API | In-memory cache + static CDN caching |
| Microservices | Overkill for 8-person graduation team | Three clean services on a strict language boundary |
| Kubernetes | Costly and unneeded at this scale | Docker compose locally; platform containers remotely |

---

**Next:** [04 — Data Model](04-data-model.md)
