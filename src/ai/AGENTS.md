# Masar AI Microservice — Agent Guide

This document outlines architectural responsibilities, build and test procedures, quota management, and privacy requirements for the **Masar AI Service** (`src/ai`).

---

## 1. Stack & System Overview

* **Runtime**: Python 3.12+.
* **Web Framework**: FastAPI with Uvicorn.
* **Embeddings & NLP**: Sentence-Transformers (`all-MiniLM-L6-v2`, 384-dimensional dense embeddings).
* **Linter & Formatter**: Ruff (`ruff check`, `ruff format`).
* **Test Suite**: Pytest with HTTPX test client.

### Subsystem Boundaries & Engines

* **Engine A (Skill Extraction)**: Offline NLP parsing that extracts normalized skills from university course syllabi and industry job descriptions against O*NET 29.0 and ESCO v1.2 taxonomies.
* **Engine B (Career Recommendation & Candidate Ranking)**: Ranks student-to-career fit using a Learned Ranker over 384-dimensional dense profile embeddings (`all-MiniLM-L6-v2`), baseline fit terms, and deterministic business constraints.
  * **Architectural Invariant:** The .NET backend is the **sole authority** for deterministic domain rules: skill-gap classification, severity tagging, continuous readiness scores, and roadmap sequencing. The AI service provides recommendation signals, embeddings, and match explanations.
* **Engine C (AI Mentor)**: Interactive runtime assistant providing tailored explanations and learning guidance. Employs Retrieval-Augmented Generation (RAG) over verified content atoms stored in FastAPI's dedicated vector database.
* **Engine D (Offline Content Drafting Pipeline)**: High-volume authoring pipeline for micro-lessons and exercises, led by Ahmed Yousef (AI prompts & generation strategy), Mohamed Salah (Content Factory CLI & CI tooling), and Osama Mohammed (educational review & approval).

---

## 2. Setup, Build, Lint & Test Commands

Run all commands from the `src/ai` directory (or use appropriate directory paths from repo root):

```bash
# Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or: .venv\Scripts\activate  # Windows

# Install development dependencies
pip install -r requirements-dev.txt

# Run Ruff linter
ruff check .

# Run Ruff format check
ruff format --check .

# Execute test suite
pytest

# Start local development server with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Build Docker container image
docker build -t masar-ai:latest .
```

---

## 3. Python Code Style & Typing Standards

* **Modern Python 3.12 Typing**: Use built-in generic collections (`list[str]`, `dict[str, Any]`, `set[int]`) and union syntax (`str | None`) rather than legacy `typing.Optional` or `typing.List`.
* **Pydantic Validation**: All HTTP request bodies, external service responses, and configuration settings must be strictly typed using Pydantic v2 `BaseModel` classes with explicit field descriptions and validation constraints.
* **Vector Dimension Invariant**: The dense embedding model `all-MiniLM-L6-v2` outputs vectors of dimension **384**. Vector database columns (`vector(384)` in PostgreSQL `pgvector`) and similarity functions must consistently maintain this dimension.

---

## 4. Vector Store Ownership & Standardized Context DTO

* **FastAPI Dedicated Vector Store**:
  * FastAPI maintains and manages its own dedicated Vector Database for Atomic Roadmap content and embeddings.
  * Generates query embeddings and semantic retrieval for RAG without querying the primary PostgreSQL database directly.
  * Index is updated whenever new content bundles are published by the pipeline.
* **Standardized AI Mentor Context DTO**:
  * The context schema is strictly standardized across .NET API, FastAPI Pydantic models, and prompt templates:
    * `targetCareer` (Required): Committed career and track.
    * `currentStage` (Required): Active curriculum stage.
    * `currentUnit` (Required): Active unit slug and title.
    * `recentAtoms` (Required): Titles of recently studied atoms.
    * `mastery` (Required): Mastery summary.
    * `skillGaps` (Required): Prioritized skill gaps.
    * `readiness` (Conditional): Backend-calculated readiness score (0–100).
    * `streak` (Optional): Consecutive days active.
    * `weeklyGoalHours` (Optional): Configured weekly study goal.
  * .NET is the authoritative source; LLM never invents or derives official readiness or mastery values.

---

## 5. Privacy Guardrails & Context Sanitization

* **Strict PII Stripping**:
  * Engine C (AI Mentor) must never receive raw student profile data, student university registration numbers, emails, or personal identifiers.
  * Inputs to the mentoring engine must be restricted to the sanitized Context DTO and scrubbed student queries ($\le 300$ chars, regex-scrubbed for emails and URLs).
* **Prompt Injection Defense**:
  * Treat all student queries and atom content inputs as untrusted data wrapped in `<question>` and `<student_data>` tags.
  * System prompts must clearly enforce instruction boundaries and explicitly disallow role-breaking instructions.

---

## 6. Quota Governance & Engine D Authoring Integrity

* **Quota Segregation**:
  * **Runtime AI Mentor (Engine C)**: Uses the designated user-facing LLM quota (e.g., Gemini Flash models), with caching, request rate-limiting (10/hr/user, 200/day system-wide), and graceful degradation to static hint sequences when quotas are exceeded.
  * **Offline Authoring (Engine D)**: Operates strictly on developer authoring keys and local CLI scripts. It must never consume runtime student service quotas.
* **Engine D Ownership & Responsibilities**:
  * **AI Generation Lead (Ahmed Yousef)**: Prompt engineering, batch generation strategy, blind-solve harness, overall AI technical decisions.
  * **Tooling Lead (Mohamed Salah)**: `tools/content-cli`, CI validation workflow, packaging pipeline.
  * **Educational Review Lead (Osama Mohammed)**: Pedagogical sequencing, curriculum verification, final approval before publication.
* **Exercise Blind-Solve Protocol**:
  * Offline-generated assessment exercises must undergo automated blind-solve verification before ingestion into the content catalog.
  * While automated batches require $\ge 90\%$ blind-solve accuracy across the unit, 100% of individual dissenting or ambiguous exercises must be flagged for manual human educator review before publication.
