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
* **Engine B (Career Alignment & Gap Analysis)**: Calculates student-to-role fit using cosine similarity across 384-dimensional skill embeddings, generating prioritized skill-gap profiles.
* **Engine C (AI Mentor)**: Interactive runtime assistant providing tailored explanations and learning guidance. Employs Retrieval-Augmented Generation (RAG) over verified content atoms.
* **Engine D (Content Drafting & Quality Gate)**: Offline developer CLI for drafting atom exercises, accompanied by an automated blind-solve validation protocol.

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

## 4. Privacy Guardrails & Context Sanitization

* **Strict PII Stripping**:
  * Engine C (AI Mentor) must never receive raw student profile data, student university registration numbers, emails, or personal identifiers.
  * Inputs to the mentoring engine must be restricted to sanitized Data Transfer Objects (DTOs) containing only skill atom IDs, topic titles, student query text, and error classification tags.
* **Prompt Injection Defense**:
  * Treat all student queries and atom content inputs as untrusted data.
  * System prompts must clearly enforce instruction boundaries and explicitly disallow role-breaking instructions.

---

## 5. Quota Governance & Authoring Integrity

* **Quota Segregation**:
  * **Runtime AI Mentor (Engine C)**: Uses the designated user-facing LLM quota (e.g., Gemini Flash models), with caching, request rate-limiting, and graceful degradation to static hint sequences when quotas are exceeded.
  * **Offline Authoring (Engine D)**: Operates strictly on developer authoring keys and local CLI scripts. It must never consume runtime student service quotas.
* **Exercise Blind-Solve Protocol**:
  * Offline-generated assessment exercises must undergo automated blind-solve verification before ingestion into the content catalog.
  * While automated batches require $\ge 90\%$ blind-solve accuracy across the unit, 100% of individual dissenting or ambiguous exercises must be flagged for manual human educator review before publication.
