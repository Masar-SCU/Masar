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
2. **Instant Local Feedback:**
   - The React Lesson Player evaluates student answers locally in memory against the bundle's exercise metadata.
   - Mistakes trigger immediate explanatory feedback and automatically re-queue the question at the end of the lesson session until mastered.
3. **Authoritative Server Re-Grading:**
   - Upon session completion, the client posts an attempt payload to `/api/lessons/complete` containing: `atom_id`, `session_id`, `duration_seconds`, and array of exercise selections/timings.
   - The .NET backend independently validates the submitted answers against the authoritative database record for that atom.
   - **Anti-Cheat Sanity Checks:** The server verifies reasonable timing thresholds (e.g., flagging attempts completing 5 exercises in under 15 seconds).
   - **Idempotent State Update:** Upon successful re-grade, the server updates `atom_state` (`status: "completed"`, increments revision counts), logs `exercise_attempt` records, awards XP, updates daily streak, and derives updated skill mastery. Repeated submissions with the same `session_id` are idempotent.

## Consequences

### Positive

- **Instantaneous UX:** Zero perceived network latency (< 100 ms) during interactive exercise stepping.
- **Drastically Reduced Backend Load:** Backend compute is required only once per completed lesson, rather than on every user click.
- **Resilience to Cold Starts:** Content loads instantly from CDN even if backend containers are sleeping.
- **Data Integrity:** Academic evaluation metrics (error rates, attempts, completion times) are server-validated and tamper-resistant.

### Negative

- **Bundle Visibility:** Exercise solutions exist in the static JSON bundle. Technical students could inspect network traffic to find answers. This trade-off is accepted: Masar is a formative learning platform, not a proctored certification exam. The authoritative re-grade and timing checks prevent automated script abuse.
- **Cache Invalidation:** Updates to published atom content require cache-busting bundle file hashes (`{unit_slug}.{hash}.json`).

### Neutral

- Offline progress synchronization can be supported cleanly in future releases via the idempotency key mechanism.

## Verification

- [ ] **W10** — Static bundle build script generates valid, hash-versioned JSON bundles for sample units (Mohamed Yasser)
- [ ] **W12** — Authoritative re-grading endpoint rejects tampered payloads and records valid attempts idempotently (Osama)
- [ ] **W14** — End-to-end lesson completion latency measured under 200 ms total network time on staging (Ziad)
- [ ] **W20** — Load test verifies 100 concurrent students completing lessons without backend saturation (Mohamed Salah)
