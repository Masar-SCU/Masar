# ADR-0008 — Content authoring pipeline: LLM-assisted drafts, CI validation, human review

**Status:** Accepted · **Date:** 2026-11-15 · **Deciders:** Abdelrahman, Ahmed Yousef, Mohamed Yasser, Mazen, Osama, Yousef Khaled · **Extends:** [ADR-0002](0002-llm-provider.md)

---

## Context

Adopting the Atomic Roadmap ([ADR-0007](0007-atomic-roadmap.md)) establishes a target corpus of approximately 4,050 micro-lessons across all tracked tech careers (with ~1,200 atoms required for the Tier 1 MVP across Backend, Frontend, and Data roles).

Creating this volume of structured educational content presents severe constraints:

1. **Student Capacity:** Hand-authoring 4,050 lessons with explanations and interactive exercises would require ~120 hours of manual writing per team member, creating severe burn-out and derailment risk.
2. **Pedagogical Consistency:** Content authored ad-hoc across 6 individuals tends to vary widely in exercise style, explanation depth, and terminology.
3. **Accuracy and Hallucination Risk:** Generative AI models frequently invent non-existent APIs, produce broken code snippets, or generate hallucinated documentation URLs.
4. **Licensing and Originality:** Scraping commercial platforms (Coursera, Codecademy, boot.dev) violates intellectual property rules. Content must be original and permissively licensed.

## Options considered

### A — 100% manual authoring by team members

Write every unit and atom definition by hand in Markdown/JSON.

- *Rejected:* Insufficient velocity; the team cannot author > 1,000 high-quality interactive atoms alongside core engineering work.

### B — Dynamic runtime generation by LLM

Generate lessons dynamically in response to student requests using runtime LLM prompts.

- *Rejected:* Introduces non-deterministic errors, high latency (> 3s), catastrophic API rate limiting on free tiers, and direct exposure of students to AI hallucinations.

### C — Offline LLM-assisted drafting with CI verification and mandatory human sign-off *(chosen)*

Utilize an offline authoring CLI (`content-cli`) powered by LLM prompts to produce candidate JSON draft bundles. All drafts undergo automated CI checks (schema validation, blind-solve, link checking) and require explicit human review and sign-off before publication.

## Decision

**Adopt an offline, 5-stage content authoring pipeline combining LLM-assisted drafting with automated CI linting and mandatory human review:**

```text
1. Outline (Human) → 2. Draft (LLM) → 3. CI Checks → 4. Review (Human) → 5. Publish (CDN/DB)
```

1. **Stage 1 (Outline):** Human curriculum leads define unit scope, pedagogical objectives, and prerequisite bindings.
2. **Stage 2 (Draft):** Offline CLI invokes LLM to draft atom explanations and interactive exercises (multiple choice, parsons, code blanks) conforming to a strict JSON schema.
3. **Stage 3 (CI Checks):**
   - *Schema Lint:* 100% conformance to JSON Schema.
   - *Blind-Solve Check:* An automated solver or independent prompt solves the generated exercises; agreement must be $\ge 90\%$.
   - *Zero-Hallucination Link Policy:* No generative URLs permitted. All external documentation links must resolve to an explicit curated allowlist or be omitted.
4. **Stage 4 (Human Review):** A designated team member tests the playable lesson, reviews code correctness and tone, and signs off (`status: "approved"`).
5. **Stage 5 (Publish):** Approved atoms are compiled into static unit bundles, committed to version control, and synced to production CDN and PostgreSQL.

### Operational Rules

- **Dedicated Developer Quota:** LLM drafting runs offline on developer workstations using an independent API key and quota; it never competes with the student-facing AI Mentor runtime quota.
- **Transparency:** All published atoms carry an explicit metadata tag: `source: "ai-drafted-human-reviewed"`.
- **Permanent Slugs:** Atom slugs are permanent immutable IDs. Content updates create new atom versions with `replaced_by` pointers; deprecated atoms are retired, never deleted.

## Consequences

### Positive

- **Feasible Velocity:** Increases authoring throughput from ~2 atoms/hour to ~10–15 atoms/hour per reviewer.
- **Guaranteed Validity:** CI prevents broken JSON, invalid exercise keys, or missing explanations from reaching students.
- **High Pedagogical Quality:** Human review ensures correct technical context, clear explanations, and alignment with academic standards.
- **Zero Runtime LLM Cost:** Lessons are statically served; zero AI calls during student learning.

### Negative

- **Review Workload:** Requires systematic team discipline; team members must dedicate 4–6 hours weekly during authoring sprints (W13–W28).
- **Tooling Overhead:** Requires developing and maintaining the offline `content-cli` tool.

### Neutral

- Content lives in Git (`content/` directory), providing full version history, branching, and auditability.

## Verification

- [ ] **W11** — `content-cli` operational; JSON schema validation and blind-solve runner implemented (Osama, Ahmed Yousef)
- [ ] **W13** — Tier 1 authoring kickoff: initial 200 atoms drafted and validated through CI (Mohamed Yasser, Mazen)
- [ ] **W17** — Milestone: Tier 1 content complete (1,200 atoms across 3 careers) with 100% human review approval (All)
- [ ] **W23** — Milestone: Tier 2 content complete (2,400 cumulative atoms) (All)
- [ ] **W28** — Content freeze: Tier 3 content complete (4,050 cumulative atoms) (All)
