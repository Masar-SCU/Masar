# Diagrams

Diagram sources. **Prefer Mermaid inside the Markdown documents** over binary or exported formats:
GitHub renders Mermaid natively in `.md` files, it diffs as text in pull requests, and it never goes
stale relative to the document that contains it.

Use a file here only when Mermaid genuinely cannot express what is needed.

## Contents

### `PROJECT_MVP.drawio.svg`

The original MVP flow diagram, drawn in draw.io. The SVG has the draw.io source embedded, so it remains
editable at <https://app.diagrams.net>.

**Superseded by** the Mermaid flowchart in the [repository README](../../README.md#the-core-value-loop),
which shows the same loop plus the two additions that came out of the restructure: the Career Readiness
Score, and the explicit re-scoring feedback edge.

Kept because it may be useful for slides, where a hand-positioned diagram sometimes reads better than a
generated one.

## Conventions

| Situation | Format |
|---|---|
| Flowcharts, sequence diagrams, ERDs, Gantt charts | **Mermaid**, inline in the relevant `docs/*.md` |
| Anything needing precise manual layout, e.g. a title slide | draw.io, exported as `.drawio.svg` so the source stays embedded |
| Screenshots for the report | PNG, named `NN-description.png`, added at report time |

## Rules

1. **Never commit an exported PNG of something Mermaid can draw.** It will drift from the document and nobody will notice.
2. If a file here is edited, note in its section above which document it belongs to.
3. Mermaid blocks must parse. CI validates them; verify locally with:

   ```bash
   npx -y @mermaid-js/mermaid-cli -i docs/03-architecture.md -o /tmp/out.md
   ```

4. Keep colour meaningful but never load-bearing — the same accessibility rule as the UI
   ([NFR-05](../02-requirements.md#nfr-05--accessibility)). Highlight core components, but always label them too.
