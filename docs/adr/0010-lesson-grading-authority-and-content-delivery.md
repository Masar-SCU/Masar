# ADR-0010 — Lesson grading authority and static content delivery

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** Abdelrahman, Mohamed Yasser, Ziad, Osama, Mohamed Salah

---

## Context

Interactive micro-lessons (~4,050 atoms) require responsive exercise evaluation. When a student selects a multiple-choice option, reorders code lines in a Parsons problem, or fills a syntax blank, they require instant feedback (< 100 ms) to stay engaged.

However, client-server architectures face key tensions:

1. **Latency vs. Backend Load:** Sending every click to the backend over mobile networks introduces latency (300–800 ms), breaking the conversational flow of micro-learning, while exhausting free-tier backend container compute and connection pools.
2. **Cheating & Integrity:** Purely client-side grading allows trivial manipulation of requests (e.g., submitting fake completion payloads), which would corrupt academic evaluation datasets (RQ7, RQ8) and cohort analytics.
3. **Bandwidth & Cold Starts:** Serving dynamic JSON content bundles from the .NET backend subjects learners to container cold starts (up to 60s) on free-tier hosting ([ADR-0005](0005-zero-budget-hosting.md)).

## Options considered

### A — Pure server-side execution and grading

Browser transmits every individual exercise answer to the backend API for verification.

- *Rejected:* Unacceptable interactive latency; easily overloads free-tier web hosting during cohort evaluations.

### B — Pure client-side grading with trusted client reporting

Browser grades all exercises locally and sends a simple "atom completed" boolean to the server.

- *Rejected:* Zero verification; easily cheated via browser console; invalidates academic research data integrity.

### C — Static CDN delivery + instant local grading + authoritative server re-grading *(chosen)*

Static content bundles are distributed via CDN. The browser evaluates exercises immediately for smooth UI feedback and re-queues mistakes within the session. Upon lesson completion, the browser submits the complete attempt trace to the server. The backend authoritatively re-grades the attempt, validates timing sanity, records attempts, and updates student state idempotently.

## Decision

**Adopt a dual-tier execution architecture: Static CDN delivery with client-side interactive feedback, validated by authoritative backend re-grading upon completion.**

```text
1. Fetch Bundle (CDN) → 2. Interactive Session (Local) → 3. Submit Trace (API) → 4. Authoritative Re-Grade (.NET)
```

1. **Static Content Delivery:**
   - Unit content bundles (`/content/bundles/{unit_slug}.json`) are compiled ahead-of-time and hosted on a high-speed global static CDN (e.g., GitHub Pages, Cloudflare Pages, or Vercel).
   - Bundles are cacheable in the browser and Service Worker, providing instant loading and enabling future offline PWA support.
2. **Instant Local Feedback & In-Session Retry State Machine:**
   - The React Lesson Player evaluates student answers locally in memory against the bundle's exercise metadata (< 50 ms).
   - Mistakes trigger immediate explanatory feedback and automatically re-queue the exercise at the end of the session queue.
   - Up to 2 retries are allowed per exercise (maximum 3 attempts total).
   - If an exercise is missed 3 times, the player reveals the worked step-by-step solution and flags the exercise as `unresolved`. The lesson concludes once all exercises have been answered or exhausted their 3 attempts.
3. **Authoritative Server Re-Grading & Idempotency:**
   - Upon session completion, the client posts an attempt payload to `/api/lessons/{sessionId}/complete` containing: `atomId`, `sessionId`, `idempotencyKey` (optional, defaults to `sessionId`), `durationSeconds`, and the array of exercise `attempts` with timing telemetry (per `docs/07-api-contract.md` §6).
   - The .NET backend independently validates the submitted answers against the authoritative database record for that atom.
   - **Anti-Cheat Sanity Checks:** The server verifies reasonable timing thresholds (e.g., flagging attempts completing 5 exercises in under 15 seconds).
   - **Canonical Idempotency Semantics:**
     - `sessionId` identifies the ephemeral session record in `LESSON_SESSION`.
     - `idempotencyKey` enforces deduplication at the database level via a `UNIQUE` constraint scoped to the student's `profile_id`.
     - If a request is received for an already completed `sessionId` or matching `idempotencyKey`:
       - If the submitted attempt hash matches: Returns HTTP `200 OK` with the cached original result (exact XP awarded, streak status, and readiness delta), performing zero database mutations and awarding zero duplicate XP.
       - If a conflicting payload is submitted with an existing key: Returns HTTP `409 Conflict` (ProblemDetails).
     - Guarantees that network retries, page refreshes, or duplicate client clicks can never double-award XP or streak progress.
   - **Mastery State Update:** If first-pass accuracy is $\ge 80\%$ (and all items resolved), the atom status transitions to `'learned'` (+15 XP base + 5 XP bonus); if first-pass accuracy $< 80\%$ or items remain unresolved, status becomes `'shaky'` (+15 XP base, 0 bonus) and is queued for priority review. Both status values strictly satisfy `CHECK (status IN ('learned', 'shaky', 'assumed'))`.

## Consequences

### Positive

- **Instantaneous UX:** Zero perceived network latency (< 100 ms) during interactive exercise stepping.
- **Drastically Reduced Backend Load:** Backend compute is required only once per completed lesson, rather than on every user click.
- **Resilience to Cold Starts:** Content loads instantly from CDN even if backend containers are sleeping.
- **Data Integrity:** Academic evaluation metrics (error rates, attempts, completion times) are server-validated and tamper-resistant.

### Negative

- **Bundle Visibility & Assessment Scope:** Exercise solutions exist in the static JSON bundle strictly for low-stakes, formative daily practice lessons, where instant offline feedback is paramount. For high-stakes evaluations (Unit Checkpoints and Placement Test-Outs granting `verified = true` and unlocking path units), question payloads delivered to the client omit answer keys and correct choice identifiers, and grading is performed strictly server-side against backend records. Authoritative server re-grading and timing checks prevent automated script abuse on formative sessions as well.
- **Cache Invalidation:** Updates to published atom content require cache-busting bundle file hashes (`{unit_slug}.{hash}.json`).

### Neutral

- Offline progress synchronization can be supported cleanly in future releases via the idempotency key mechanism.

## Verification

- [ ] **W10** — Static bundle build script generates valid, hash-versioned JSON bundles for sample units (Mohamed Yasser)
- [ ] **W12** — Authoritative re-grading endpoint rejects tampered payloads and records valid attempts idempotently (Osama)
- [ ] **W14** — End-to-end lesson completion latency measured under 200 ms total network time on staging (Ziad)
- [ ] **W20** — Load test verifies 100 concurrent students completing lessons without backend saturation (Mohamed Salah)
