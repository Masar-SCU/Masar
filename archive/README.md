# Archive

Superseded documents, kept for history. **Nothing here is authoritative.**

The current specification is in [`docs/`](../docs/), indexed from the
[repository README](../README.md).

## Contents

### `masar_project_document.tex`

The original LaTeX specification and feature roadmap. Superseded by the Markdown documentation set.

**Do not update this file.** It contradicts the current specification in several places, most
importantly:

| The `.tex` says | Current position |
|---|---|
| "The **AI is an enabling component**, not the product itself" | Resolved precisely in [ADR-0006](../docs/adr/0006-deterministic-core.md): AI interprets and matches; deterministic code decides |
| AI Mentor, NLP Extraction and Semantic Matching are all 🔵 Should-Have | Extraction and semantic matching are 🟡 MVP (offline / enhancer); the mentor is 🔵 Should-have |
| Only 2 features are MVP-Core, with the AI tiers arranged differently | Matches the current tiering by coincidence, but the reasoning and the fallbacks are new |
| Skill levels as percentages | 0–5 integer scale — [ADR-0004](../docs/adr/0004-proficiency-scale.md) |
| "The recommendation can initially use a weighted scoring algorithm. Sophisticated ML is not required for the MVP." | Still true, and now the *permanent* baseline rather than a temporary shortcut |

It also has no team section, no technology stack, no dates, and no evaluation methodology.

There is no LaTeX toolchain installed on the development machine, so this file cannot currently be
built. The formal report will be written separately (Word or Overleaf) using `docs/` as its source
material — see [08 §3, Slice 11](../docs/08-plan-and-timeline.md#slice-11--report-presentation-defence--w31w35--18-apr--20-may).

## Policy

- Files here are read-only in practice. Do not edit them.
- If content in an archived file is still useful, move it into `docs/` rather than maintaining two versions.
- Delete a file from `archive/` only when it is certain nobody needs the history.
