// Validates every ```mermaid block in the repository by parsing it.
//
// Why parse instead of render: mermaid-cli renders through headless Chrome,
// which needs a ~150 MB browser download and takes minutes. mermaid.parse()
// throws on exactly the syntax errors we care about — a diagram that renders
// as a red error box on GitHub — and runs in about a second.
//
// Usage:  node scripts/check-mermaid.mjs [rootDir]
// Requires: npm i --no-save mermaid@11 jsdom

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><body></body>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
// navigator is getter-only on modern Node, so it must be defined rather than assigned.
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;

const mermaid = (await import('mermaid')).default;
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const root = process.argv[2] ?? '.';
const files = [];

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.md')) files.push(full);
  }
})(root);

let total = 0;
let failed = 0;

for (const file of files.sort()) {
  const source = fs.readFileSync(file, 'utf8');
  const blocks = [...source.matchAll(/```mermaid\n([\s\S]*?)```/g)];

  for (const [index, block] of blocks.entries()) {
    total++;
    const label = `${path.relative(root, file)} block ${index + 1}`;
    try {
      await mermaid.parse(block[1]);
      console.log(`  OK    ${label}`);
    } catch (error) {
      failed++;
      const message = String(error?.message ?? error).split('\n')[0];
      console.log(`  FAIL  ${label}: ${message}`);
    }
  }
}

console.log(`\n${total} diagram(s), ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
