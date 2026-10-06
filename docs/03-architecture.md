# 03 — Architecture

**Document owner:** Abdelrahman Megahed · **Status:** Baseline

---

## 1. Technology stack

| Layer | Choice | Why | Owner |
|---|---|---|---|
| Frontend | **React 19 + TypeScript + Vite** | Team's existing skill; TypeScript makes the [API contract](07-api-contract.md) enforceable at compile time | Ziad, Mazen |
| UI | **Tailwind CSS + Radix UI primitives** | Radix provides accessible components out of the box, which is how [NFR-05](02-requirements.md#nfr-05--accessibility) becomes achievable rather than aspirational | Yousef K. |
| Charts | **Recharts** | Needed for the readiness trend and the cohort heatmap | Mazen |
| Backend | **ASP.NET Core 10 Web API (C#)** | Team's existing skill; active LTS release | Mohamed Y., Osama |
| ORM | **EF Core 10 + Npgsql** | Migrations, plus `Pgvector.EntityFrameworkCore` for vector columns | Mohamed Y. |
| Database | **PostgreSQL 16 + pgvector** | One store for both relational and vector data — see ADR-0001 | Mohamed Y. |
| AI service | **Python 3.12 + FastAPI** | The NLP/embedding ecosystem is Python in practice | Ahmed Y. |
| Embeddings | **sentence-transformers `all-MiniLM-L6-v2`** — 384 dimensions, ~23 M parameters, Apache-2.0, CPU-only | Small enough for a free CPU tier, and the licence permits this use | Ahmed Y. |
| LLM | **Free-tier hosted API**, provider-abstracted — see ADR-0002 | $0 budget; the abstraction lets the provider be swapped without touching features | **Ahmed Y.** |
| Containers | **Docker + docker compose** | One-command local setup ([NFR-14](02-requirements.md#nfr-14--portability)) | Mohamed Salah |
| CI/CD | **GitHub Actions** | Free for public repositories | Mohamed Salah |
| Hosting | Free tiers — see ADR-0005 | $0 budget | Mohamed Salah |

> **Rule:** no dependency is added without a named reason and a pinned version. `latest` is banned
> in Dockerfiles, and lockfiles are committed.

---

## 2. Why three services and not one

A single .NET application would be simpler, and simpler is usually right. It is not right here for
one specific reason: the embedding and NLP libraries the project needs are Python. Running them
through ONNX inside .NET is possible, but that would place the riskiest, least familiar work
directly on the critical path of the component two other people depend on.

The split is therefore drawn on a **language boundary, not a scalability boundary**:

- **.NET owns all application state and public API responsibilities.** It is the only service that talks to the database and is responsible for loading persisted career/skill data, including precomputed embeddings, before calling the AI service.
- **FastAPI owns stateless AI and career-recommendation computation.** Recommendation work includes profile embedding, candidate retrieval over supplied candidate data/vectors, reranking, mandatory constraints, and the final ranking. **The AI Mentor intelligence also lives here, including construction/validation of the Sanitised Context DTO, RAG/prompt construction, LLM provider abstraction, output validation, and AI fallback logic.** It stores nothing and does not access the database directly.
- **React owns presentation only.** No business rules in the client.

This keeps the Python service focused. Career and skill embeddings are generated at seed time and persisted by the
.NET/data layer in PostgreSQL. For recommendation requests, .NET loads the required candidate data and stored career
embeddings, then sends them to FastAPI. FastAPI performs per-request profile embedding, candidate retrieval,
reranking, mandatory constraints, and final recommendation without accessing PostgreSQL directly.

---

## 3. System context

```mermaid
flowchart TB
    STU["Student<br/>P1, P2"]
    ADV["Advisor<br/>P3"]
    ADM["Admin"]

    subgraph MASAR["Masar"]
        WEB["React SPA<br/>browser"]
        API["ASP.NET Core API<br/>state · public API · auth"]
        AISVC["Python AI Service<br/>stateless compute"]
        DB[("PostgreSQL 16<br/>+ pgvector")]
    end

    LLM["External LLM API<br/>free tier"]

    STU --> WEB
    ADV --> WEB
    ADM --> WEB
    WEB -->|"HTTPS · JWT"| API
    API -->|"EF Core"| DB
    API -->|"internal HTTP<br/>shared secret"| AISVC
    AISVC -->|"HTTPS · API key<br/>no PII"| LLM
```

Note what is **not** in this diagram: the browser never talks to the AI service, and the AI service
never talks to the database. Both omissions are deliberate.

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
        C6["Roadmap"]
        C7["Progress"]
        C8["Mentor"]
        C9["Advisor"]
        C10["Admin"]
    end

    subgraph APP["Application — orchestration · DTO mapping · transactions"]
        direction LR
        S1["ProfileService"]
        S2["AssessmentService"]
        S3["RecommendationService"]
        S4["GapService"]
        S5["RoadmapService"]
        S6["ProgressService"]
        S7["MentorService"]
    end

    subgraph DOM["Domain — pure logic · no framework · no I/O"]
        direction LR
        D1["GapCalculator"]:::core
        D2["ReadinessCalculator"]:::core
        D3["RoadmapScheduler"]:::core
        D4["PrerequisiteGraph"]:::core
    end

    subgraph INF["Infrastructure — I/O adapters"]
        direction LR
        I1["EF Core / Npgsql"]
        I2["AiRecommendationClient"]
    end

    subgraph AI["FastAPI — recommendation and AI computation"]
        direction LR
        AI1["Embedder"]
        AI2["Candidate Retrieval<br/>supplied career vectors"]
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

For recommendation requests, `AiRecommendationClient` sends the profile plus candidate career data and
precomputed career embeddings that `.NET` loaded from PostgreSQL. The vector payload is an input to FastAPI
candidate retrieval; FastAPI never queries PostgreSQL.

**The highlighted `Domain` classes are the project's intellectual core.** They are pure functions
over plain objects: no `DbContext`, no `HttpClient`, no `DateTime.Now` (time is injected). That is
what makes [NFR-12](02-requirements.md#nfr-12--testability)'s 80 % coverage target realistic rather
than painful, and it is what lets the final report present the algorithms without infrastructure noise.

Dependency rule, enforced by project references: `Api → Application → Domain`, and
`Application → Infrastructure`. **`Domain` references nothing.** If `Domain` ever needs a database,
the design has drifted.

---

## 5. AI service internals

```mermaid
flowchart LR
    IN["POST /extract-skills<br/>POST /embed<br/>POST /recommend<br/>POST /mentor"]

    subgraph P["Pipelines"]
        E1["Skill Extractor<br/>normalise → candidate phrases →<br/>taxonomy match → confidence"]
        E2["Embedder<br/>MiniLM-L6-v2 · 384-dim"]
        E3["Recommendation Pipeline<br/>profile embedding → retrieval over<br/>supplied career vectors → reranker → constraints"]
        E4["Mentor RAG<br/>Sanitised Context DTO → prompt →<br/>LLM → output validator"]
    end

    IN --> E1
    IN --> E2
    IN --> E3
    IN --> E4
    E4 --> LLM["External LLM"]
    E1 -.-> E2
    E3 -.-> E2
```

Properties that matter:

- **Stateless.** No database, no session. It can be restarted or replaced at any moment.
- **The model loads once at startup**, not per request. Cold start is roughly 10 s on free CPU hardware; the readiness probe accounts for this.
- **Every endpoint is synchronous and bounded.** No background jobs, no message queues — nothing extra to debug the night before a review.

---

## 6. Service-to-service authentication

The AI service must never be reachable from the internet. If it were, anyone could burn the LLM
free-tier quota, which under a $0 budget means taking the mentor offline for everyone.

| Control | Implementation |
|---|---|
| Network | AI service bound to the internal network only, with no public route. In `docker compose` its port is not published; on the hosting provider it is a private service. |
| Shared secret | Every request from .NET carries `X-Masar-Service-Key`. The AI service rejects any request without an exact match, using a constant-time comparison, and returns `401` with no detail. |
| Secret storage | Environment variable, injected by the platform's secret store. Never committed, and rotated if it is ever printed in a log. |
| Timeouts | .NET client: 20 s timeout, 2 retries with backoff; if the primary model inference still fails while FastAPI is available, FastAPI returns the documented deterministic fallback ([NFR-09](02-requirements.md#nfr-09--abuse-and-cost-control)). |
| Logging | Request ID propagated as `X-Correlation-Id` so one student action can be traced across all three services. |

> If the chosen host cannot provide private networking on its free tier, the shared secret becomes
> the only control. That is documented as **R-08** in [§10](10-risks-and-assumptions.md) with
> IP allow-listing as the mitigation.

---

## 7. Key request flows

### 7.0 End-to-end onboarding and plan creation flow

The complete end-to-end journey for a first-time student, tying together assessment, skill capture, calibration, career recommendation, and roadmap generation:

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant D as Domain
    participant DB as PostgreSQL
    participant AI as AI Service

    Note over S,AI: Step 1 — Personality & Work-Preference Assessment
    S->>W: Start onboarding
    W->>A: POST /api/assessments  (start attempt)
    A->>DB: create assessment attempt
    A-->>W: 201  questions[]
    S->>W: Answer questions (incremental)
    W->>A: PUT /api/assessments/{id}/answers
    A->>DB: persist answers

    Note over S,AI: Step 2 — Coursework & Skill Identification
    S->>W: Select academic year & completed courses
    W->>A: POST /api/profile/courses/derive-skills
    A->>DB: query course_skill mappings
    A-->>W: proposed skills with confidence
    S->>W: Confirm/adjust skill levels (0-5)
    W->>A: PUT /api/profile/skills  (claims)
    A->>DB: upsert student_skill rows

    Note over S,AI: Step 3 — Targeted Skill Calibration
    W->>A: GET /api/quizzes/calibration-candidates
    A->>DB: find top claimed skills with quiz coverage
    A-->>W: candidate skills (e.g. SQL, Git)
    S->>W: Complete 5-8 question quiz for primary skill
    W->>A: POST /api/quizzes/{skillId}/submit
    A->>D: evaluate calibrated level
    A->>DB: update student_skill (calibrated_level, effective_level follows)
    Note over S,AI: Step 4 — Career Recommendation & Selection
    W->>A: POST /api/assessments/{id}/submit
    A->>DB: load profile + skills + career data + stored career embeddings
    A->>AI: POST /recommend (profile + candidate data + precomputed career vectors)
    AI->>AI: Embed profile → retrieve over supplied career vectors → rerank
    AI->>AI: Apply mandatory constraints → final ranking
    AI-->>A: final ranked careers + recommendation metadata
    A-->>W: ranked careers + fit explanations
    S->>W: Select target career & track (e.g. Backend / .NET)
    W->>A: PUT /api/profile/target
    A->>DB: update target_career_id & target_track_id

    Note over S,AI: Step 5 — Personalized Roadmap Generation
    S->>W: Specify weekly hours (e.g. 10 h/week)
    W->>A: GET /api/roadmap
    A->>D: GapCalculator.Analyse(...)
    A->>D: PrerequisiteGraph.TopologicalOrder(...)
    A->>D: RoadmapScheduler.Pack(...)
    A->>DB: persist generated roadmap & snapshot
    A-->>W: 200  dated roadmap + capstone project
```

### 7.1 Career recommendation — model-first, with a FastAPI fallback

Career prediction and recommendation are computed inside the internal FastAPI service. The .NET
backend remains responsible for loading the required data, calling the service, and returning the
public API response. FastAPI does not access PostgreSQL directly.

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant DB as PostgreSQL
    participant AI as FastAPI Recommendation Service

    S->>W: submit assessment
    W->>A: POST /api/assessments/{id}/submit
    A->>DB: load profile + skills + career data + stored career embeddings
    A->>AI: POST /recommend (profile + candidate data + precomputed career vectors)

    AI->>AI: Embed profile
    AI->>AI: Candidate retrieval over supplied career vectors
    AI->>AI: Reranker produces primary ranking
    AI->>AI: Apply mandatory constraints
    AI->>AI: Build final recommendation
    AI-->>A: final ranked careers + score/reasons + mode

    A-->>W: 200 ranked careers + reasons
    W-->>S: ranked careers with explanations

    alt primary model inference fails
        AI->>AI: Run documented deterministic baseline fallback
        AI-->>A: fallback ranking + mode "fallback"
        A-->>W: 200 fallback ranking
    end
```

The model is the primary prediction mechanism. The deterministic baseline is retained for evaluation
and as the documented FastAPI fallback; it is not the production primary predictor.

### 7.2 Gap analysis and roadmap — fully deterministic

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant D as Domain
    participant DB as PostgreSQL

    S->>W: open dashboard
    W->>A: GET /api/gap-analysis?careerId=…
    A->>DB: skills (calibrated where present) + career requirements
    A->>D: GapCalculator.Analyse(...)
    D-->>A: per-skill gap, weighted priority, severity
    A->>D: ReadinessCalculator.Score(...)
    D-->>A: readiness 0–100
    A->>DB: append readiness snapshot (history)
    A-->>W: 200  gap rows + readiness + rationale

    W->>A: GET /api/roadmap
    A->>DB: gap set + prerequisite edges + resources + projects
    A->>D: PrerequisiteGraph.TopologicalOrder(...)
    A->>D: RoadmapScheduler.Pack(order, hoursPerWeek, startDate)
    D-->>A: phases with items, hour costs, target dates
    A-->>W: 200  roadmap
```

**No AI call appears anywhere in this flow.** The two MVP-core features are pure computation,
which means they are fast, reproducible, unit-testable, and impossible to break with an expired
API key. This is the single most important structural change from the original specification.

### 7.3 AI mentor — RAG with a privacy boundary

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant W as React SPA
    participant A as .NET API
    participant DB as PostgreSQL
    participant AI as AI Service
    participant L as External LLM

    S->>W: "Why should I learn Docker?"
    W->>A: POST /api/mentor/messages
    A->>A: rate-limit check (10/hour/user)
    A->>DB: load gap, roadmap, target career
    A->>AI: POST /mentor  { question, context }
    AI->>AI: construct and validate Sanitised Context DTO - allow-list skills, levels, career, computed data, reject identifiers and free text
    AI->>AI: wrap untrusted text in delimiters
    AI->>L: system prompt + context + question
    L-->>AI: answer
    AI->>AI: validate - length, no leaked instructions, plain text
    AI-->>A: answer + cited context keys
    A->>DB: persist turn (question, answer, cited keys)
    A-->>W: 200  answer + citations
```

The sanitisation and allow-list validation step inside FastAPI is a requirement, not an optimisation:
[NFR-08](02-requirements.md#nfr-08--privacy-and-data-protection) forbids sending student
identifiers to a third party.

---

## 8. Deployment topology

```mermaid
flowchart TB
    subgraph LOCAL["Local development — docker compose"]
        L1["web :5173"]
        L2["api :5080"]
        L3["ai :8000 (not published)"]
        L4[("postgres :5432<br/>pgvector image")]
        L1 --> L2 --> L4
        L2 --> L3
    end

    subgraph CI["GitHub Actions"]
        G1["lint · build · test"]
        G2["docs: markdownlint + link check"]
        G3["build & push images"]
        G1 --> G3
    end

    subgraph STAGING["Staging — free tier, auto-deploy from main"]
        T1["web (static)"]
        T2["api"]
        T3["ai (private)"]
        T4[("postgres — staging")]
    end

    subgraph PROD["Production — free tier, manual promote from a tag"]
        P1["web (static)"]
        P2["api"]
        P3["ai (private)"]
        P4[("postgres — prod")]
    end

    CI --> STAGING
    STAGING -->|"tag release"| PROD
```

Rules:

- **`main` auto-deploys to staging.** Every merge is visible to the whole team within minutes; nobody has to ask "is it deployed?".
- **Production is promoted from a tag, manually.** Reviews and the defence run against production, so it never moves unexpectedly.
- **Staging and production have separate databases.** Seed and reset staging freely; never point a script at production.
- **Migrations run as an explicit deployment step**, never automatically on application startup — an auto-migration on a cold start under a free tier is a way to corrupt a database live.

---

## 9. Environments and configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| Database | container | free managed Postgres | free managed Postgres |
| LLM | mock by default, real if a key is present | real, free tier | real, free tier |
| Embeddings | real (CPU) | real (CPU) | real (CPU) |
| Seed data | full, resettable | full, resettable | seeded once |
| Demo mode | available | available | **available** |
| Log level | Debug | Information | Warning |

Configuration comes from environment variables only. No `appsettings.Production.json` with real
values in the repository. Required variables are listed in `.env.example`, and the API fails fast
at startup with a clear message if one is missing — a missing variable should break the boot, not
the third page of the demo.

---

## 10. Demo mode

Insurance for the two sessions that actually count (1 Nov 2026 and 20 May 2027).

When `MASAR_DEMO_MODE=true`:

- Authentication accepts three fixed seeded accounts (`student`, `advisor`, `admin`).
- A fixed student profile with known skills is loaded, so the gap table and readiness score are known in advance.
- The AI service returns recorded fixture responses; **no external network calls are made**.
- The mentor answers from a small recorded transcript covering the questions demonstrated.

This means the demo runs from a laptop with the network unplugged. Given free-tier sleep
behaviour ([NFR-03](02-requirements.md#nfr-03--availability)), this is not paranoia — it is the
difference between a smooth defence and a cold-start timeout in front of the committee.

---

## 11. What we are deliberately not building

Named so nobody "helpfully" adds them at week 20.

| Not building | Why | What we do instead |
|---|---|---|
| Message queue / broker | Nothing is asynchronous | Synchronous, bounded calls |
| Redis / distributed cache | 500 users, and embeddings are cached in Postgres | In-memory cache with a short TTL |
| Microservice-per-feature | 8 people and 35 weeks | Three services on a language boundary |
| Kubernetes | Free tiers do not offer it, and it is not needed at this scale | docker compose locally, platform deploys remotely |
| GraphQL | REST plus a typed client is enough | OpenAPI-generated TypeScript client |
| WebSockets / live updates | No collaborative or real-time feature | Request/response |
| Event sourcing / CQRS | Would add weeks of ceremony for no gain | Straight CRUD plus pure domain calculators |
| Separate vector database | pgvector covers the scale — ADR-0001 | pgvector in the same Postgres instance |

---

**Next:** [04 — Data Model](04-data-model.md)
