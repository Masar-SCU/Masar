# Scripts

Verification scripts for the documentation set. Both run in CI
([`.github/workflows/docs.yml`](../.github/workflows/docs.yml)) and locally.

## `check-links.py`

Validates every relative Markdown link and heading anchor. No dependencies beyond Python 3.

```bash
python3 scripts/check-links.py .
```

Catches the failure mode that matters most in a 23-file documentation set: a link that breaks silently
when a heading is renamed. GitHub gives no warning — the link just lands at the top of the page.

## `check-mermaid.mjs`

Parses every ```mermaid block and fails on any syntax error.

```bash
npm i --no-save mermaid@11 jsdom
node scripts/check-mermaid.mjs .
```

Uses `mermaid.parse()` rather than `mermaid-cli`, deliberately: `mermaid-cli` renders through headless
Chrome, which needs a ~150 MB browser download and takes minutes. Parsing catches exactly the errors
that matter — a diagram rendering as a red error box on GitHub — in about a second.

## Run both before pushing documentation changes

```bash
python3 scripts/check-links.py . && node scripts/check-mermaid.mjs .
```

Also worth running, if `markdownlint-cli2` is available:

```bash
npx markdownlint-cli2 "**/*.md"
```
