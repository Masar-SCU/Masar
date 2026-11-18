# Masar Developer & Agent Operating Guide

Welcome to **Masar** (مسار) — an AI-powered academic career guidance and atomic learning platform tailored for Computer Science students at Suez Canal University (Faculty of Computers and Informatics).

This guide outlines architectural invariants, build and verification procedures, coding standards, security guardrails, and collaboration workflows across the repository.

---

## 1. Project Overview & Architecture

Masar bridges academic curricula and tech industry expectations through skill-gap analysis, personalized career role alignment, and structured atomic learning modules.

### High-Level Architecture

* **Backend Service (`src/backend`)**: .NET 10.0 (LTS) Web API following Clean Architecture principles (`Domain` ← `Application` ← `Infrastructure` / `Api`), persisted with PostgreSQL 16 and `pgvector` for vector similarity matching.
* **Frontend Web Application (`src/frontend`)**: React 19, TypeScript, Vite, Tailwind CSS, and Zustand. Supports bilingual layout (Arabic RTL application shell with LTR code islands) and WCAG 2.1 AA accessibility.
* **AI & Recommendation Microservice (`src/ai`)**: Python 3.12 FastAPI microservice hosting vector embeddings (`all-MiniLM-L6-v2`), recommendation engines, skill extraction, and conversational mentoring logic.
* **Documentation & Contracts (`docs/`)**: Canonical system documentation, Architecture Decision Records (ADRs), feature specifications, and unified API contracts.

### Subproject Precedence

Nested `AGENTS.md` instruction files reside within each package directory:

* [`src/backend/AGENTS.md`](src/backend/AGENTS.md) — .NET 10 Web API, Entity Framework Core, database migrations, and C# guidelines.
* [`src/frontend/AGENTS.md`](src/frontend/AGENTS.md) — React 19 SPA, Tailwind CSS, Zustand stores, and client UX rules.
* [`src/ai/AGENTS.md`](src/ai/AGENTS.md) — Python 3.12 FastAPI service, Sentence-Transformers, and offline authoring engines.

Agents working within any subproject must defer to the nearest `AGENTS.md` file for specialized commands and local invariants.

---

## 2. Universal Build, Lint & Verification Commands

All pull requests and local changes must pass these automated checks before merging:

### Root & Monorepo Operations

```bash
# Start local PostgreSQL with pgvector
docker compose up -d

# Verify documentation markdown formatting
npx --yes markdownlint-cli2@0.14.0 "**/*.md" "#node_modules"

# Validate all Mermaid diagrams in documentation
npm i --no-save mermaid@11 jsdom && node scripts/check-mermaid.mjs .

# Verify internal markdown links and anchors
python3 scripts/check-links.py .
```

### Subproject Verification Matrix

| Subproject | Build Command | Lint / Format Command | Test Command |
| :--- | :--- | :--- | :--- |
| **Backend** (`src/backend`) | `dotnet build src/backend/Masar.sln --configuration Release` | `dotnet format src/backend/Masar.sln --verify-no-changes` | `dotnet test src/backend/Masar.sln --configuration Release --verbosity normal` |
| **Frontend** (`src/frontend`) | `npm run build --prefix src/frontend` | `npm run lint --prefix src/frontend`<br/>`npx --prefix src/frontend tsc -b src/frontend` | `npm test --prefix src/frontend` (when configured) |
| **AI Service** (`src/ai`) | `docker build -t masar-ai:latest ./src/ai` | `ruff check src/ai` | `pytest src/ai` |

---

## 3. Global Code Style & Architecture Guidelines

### Architectural Invariants

* **Separation of Concerns**: Core deterministic algorithms (skill gap calculations, prerequisite tree resolution, XP and streak progression) must remain deterministic and testable without AI runtime dependencies. AI models serve for candidate recommendation, explanation generation, and interactive mentoring.
* **API Contracts**: All JSON request and response payloads must strictly follow `camelCase` property naming. URL paths use `kebab-case` with resource nouns (e.g., `POST /api/lessons/{sessionId}/complete`).
* **Error Handling**: Use RFC 7807 `ProblemDetails` for API errors with standard HTTP status codes (`400` Bad Request, `401` Unauthorized, `404` Not Found, `409` Conflict, `422` Unprocessable Entity).
* **Database Constraints**: All entity statuses must match database check constraints exactly (e.g., roadmap mastery statuses: `'learned'`, `'shaky'`, `'assumed'`).

---

## 4. Universal Security Considerations & Gotchas

### Student Data Isolation & Privacy

* **Strict Ownership Checks**: Every query accessing student data, roadmaps, or progress records must filter by the authenticated `userId` extracted from the JWT token claims. Never trust a client-supplied student ID in URL params or payload bodies.
* **Enumeration Prevention**: Return HTTP `404 Not Found` (instead of `403 Forbidden`) when a user attempts to access a resource belonging to another student. This prevents resource existence discovery.
* **LLM Context Sanitization**: Never forward raw student records or personally identifiable information (PII) to external LLM providers. Always pass sanitized Data Transfer Objects (DTOs) containing only relevant skill gaps and atom references.

### Credentials & Environment Secrets

* **Zero Committed Secrets**: Never commit API keys, JWT signing keys, or connection strings to source control.
* **Local Development Secrets**: Use `appsettings.Development.json`, .NET User Secrets (`dotnet user-secrets`), or local `.env` files. Base configuration files (`appsettings.json`) intentionally omit credentials so unconfigured staging deployments fail fast at startup.
* **Private Directories**: Hidden dotfiles and personal workspace directories must remain strictly uncommitted, ignored by all repository linters and build tools, and never referenced in public documentation or pull requests.

---

## 5. Git Conventions & Pull Request Guidelines

### Branch Naming Convention

Branches must follow the regex `^(feat|fix|docs|chore|refactor|test)[/-][a-zA-Z0-9._-]+$`.

Examples:

* `feat/s0-docker-compose`
* `fix/gap-score-rounding`
* `docs/adr-content-pipeline`
* `chore/update-dependencies`

### Commit Messages & PR Titles

Commit messages and PR titles must adhere strictly to the Conventional Commits specification:

Format: `<type>(<optional scope>): <description>`

* `feat(api)`: Implement student roadmap generation endpoint
* `fix(auth)`: Rotate refresh tokens on session renewal
* `docs(adr)`: Document lesson grading authority decision
* `refactor(ai)`: Optimize cosine similarity indexing for pgvector
* `test(backend)`: Add unit tests for XP streak calculation

### Pull Request Scope & Reviewability

* **Target Size**: Aim for small, reviewable vertical slices ($\le 400$ lines modified).
* **Self-Verification Checklist**:
  * [ ] Backend builds and unit tests pass (`dotnet test`).
  * [ ] Frontend lints cleanly (`oxlint`) and passes TypeScript checks (`tsc -b src/frontend`).
  * [ ] AI service lints cleanly (`ruff check`) and passes pytest (`pytest`).
  * [ ] Markdown documents conform to markdownlint, link checker, and Mermaid validation.
  * [ ] No secrets or sensitive configuration values are staged.

---

## 6. Large Datasets & Knowledge Base Guidelines

* **Taxonomies**: Masar references standardized industry taxonomies (O*NET 29.0 and ESCO v1.2) for roles and technical skills.
* **Frozen Snapshots**: Taxonomies, course catalog mappings, and benchmark skills are ingested as frozen snapshot files (`v1`) rather than dynamically scraped at runtime.
* **Zero Runtime Web Scraping**: Live scraping of job boards during runtime is strictly prohibited to avoid rate-limiting, IP blocking, and unpredictable latency.
* **Content Atoms**: Educational content atoms follow strict JSON/YAML schemas. High-stakes assessments (Unit Checkpoints and Placement Tests) omit answer keys from client payloads and evaluate strictly server-side.

---

## 7. Deployment & Staging Operations

* **Zero-Budget Strategy**: Deployments are optimized for free or low-cost cloud tiers (e.g., containerized instances on Railway/Render and managed PostgreSQL).
* **Health Check Endpoints**: Every active service must expose a `/health` endpoint returning `{"status": "ok"}` for container orchestration and uptime monitoring.
* **Offline Demo Capability**: A seed script must populate a complete, realistic demo state (student profiles, completed units, active roadmaps) to support offline or low-connectivity presentations and defences.
