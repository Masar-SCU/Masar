# ADR-0003 — Job data from a frozen, permitted-source snapshot

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Abdelrahman, Ahmed Yousef, Dr. Hend

---

## Context

Masar needs job-posting data to compute skill importance weights
([§04 5.3](../04-data-model.md#53-importance-weights)) and to evaluate the extraction pipeline
([RQ2](../09-evaluation.md#rq2--how-accurate-is-skill-extraction)).

The original specification contained a direct contradiction: **Job-Skill NLP Extraction** was listed
as 🔴 MVP-Core, while **Large-Scale Job Scraping** was ⚪ Later with the note that it "should not be a
core dependency." A core feature cannot depend on a non-existent data source.

Three real problems:

1. **Legal.** Most job sites prohibit automated scraping in their terms of service.
2. **Technical.** Scrapers break constantly. Debugging a scraper in April is not how anyone should spend the final weeks.
3. **Scientific.** A continuously changing corpus makes every number in the report unreproducible.

## Options considered

### A — One frozen snapshot from permitted sources *(chosen)*

Collect once, version it, freeze it, and commit the artefact. All weights derive from a named snapshot.

### B — Continuous large-scale scraping

Rejected on all three grounds above. It is also explicitly out of scope in
[§01 4](../01-project-overview.md#4-scope).

### C — Taxonomy data only, no postings

Kept as the **fallback**. O\*NET (CC BY 4.0) already contains occupation→skill relations and Technology
Skills, and ESCO adds multilingual concepts. Not the primary choice, because a market-derived weight is
a stronger claim than a taxonomy-derived one, and regional weighting requires local postings.

### D — Purchase a labour-market dataset

Rejected. Violates the $0 budget.

## Decision

**One frozen, versioned snapshot of 500–800 job postings, collected only from sources whose terms
permit it, with per-source terms recorded. No continuous scraping. Taxonomy data is the fallback.**

### Permitted collection methods, in order of preference

| Method | Notes |
|---|---|
| **Public APIs with terms permitting research use** | Preferred. Record the API, endpoint, date and terms URL. |
| **Openly licensed datasets** (e.g. Kaggle datasets with a clear licence) | Verify the licence, not just its availability. |
| **Manual collection** — a person reads a posting and records the text | Slow but unambiguously permitted. 800 postings across the team is achievable. |
| **Sites that explicitly permit automated access** in their terms or `robots.txt` | Only where genuinely explicit. Ambiguity is treated as prohibition. |

### Storage rules

```text
seed/job-snapshot-v1/
  README.md         # sources, dates, per-source terms, counts by career and region
  postings.jsonl    # raw text ONLY where terms permit storage
  extracted.jsonl   # (posting_id, skill_slug, confidence) — always safe to store
  LICENCES.md       # per-source licence and attribution
```

Where a source's terms permit reading but not redistribution, **store only the extracted skills plus a
URL**, never the raw text. The extraction output is our own derived data.

### Version freeze

- `snapshot_version` is mandatory on every posting row ([§04 8](../04-data-model.md#8-job-corpus)).
- Once weights are computed for the report, the snapshot **does not change**.
- A future snapshot becomes `v2` and any comparison between versions is reported explicitly.

## Consequences

**Positive**

- Legally defensible, and documented well enough to answer a committee question about it.
- Reproducible: every number in the report traces to a named, committed snapshot.
- No scraper to maintain, and nothing that can break in April.
- Removes the original contradiction — extraction now runs **offline at seed time**, so no runtime
  feature depends on the corpus.

**Negative**

- Manual collection costs team time. Budgeted into W15–W17, where capacity is low anyway.
- Weights reflect one point in time. Stated as a limitation in [§09 7](../09-evaluation.md#7-threats-to-validity).
- 500–800 postings is small for a labour-market study. Acknowledged; it is adequate for weighting 6 careers.

**Neutral**

- Regional weighting depends on collecting enough Egypt/MENA postings. If that proves impossible, the
  contribution is dropped and reported as future work.

## Consequence for feature tiers

Because extraction is offline, **Engine A moved from 🔴 MVP-Core to 🟡 MVP (offline)** in
[§08 2](../08-plan-and-timeline.md#2-priority-matrix--single-source-of-truth). If extraction quality is
poor, weights fall back to taxonomy plus expert judgement and the running system is unaffected.

That single reclassification removes the largest unmanaged dependency in the original plan.

## Verification

- [ ] **W10** — candidate sources identified with their terms recorded (Ahmed Yousef)
- [ ] **W15** — collection begins; ≥ 100 postings by W16
- [ ] **W17** — snapshot frozen at ≥ 300 postings, ideally 500+; `README.md` complete
- [ ] **W17** — 100 postings labelled for RQ2
- [ ] **W18** — weights computed and `snapshot_version` recorded in the database
