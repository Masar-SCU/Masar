#!/usr/bin/env python3
"""Validate internal Markdown links and heading anchors.

The most common defect in a large Markdown documentation set is an internal
link that breaks silently when a heading is renamed. GitHub does not warn, the
link simply lands at the top of the page, and nobody notices for weeks.

Checks:
  1. every relative link target exists on disk
  2. every '#fragment' matches a heading in the target file, using GitHub's
     slug rules (lowercase, punctuation stripped, spaces to hyphens)

Headings inside fenced code blocks are ignored, since '# comment' in a shell
snippet is not a heading.

Usage:  python3 scripts/check-links.py [rootDir]
Exit:   0 if all links resolve, 1 otherwise.
"""

from __future__ import annotations

import os
import re
import sys
import unicodedata

LINK = re.compile(r"\[([^\]]*)\]\(([^)\s]+)\)")
HEADING = re.compile(r"^#{1,6}\s+(.*)$")
SKIP_SCHEMES = ("http://", "https://", "mailto:", "tel:")


def github_slug(text: str) -> str:
    """Approximate GitHub's heading-anchor algorithm."""
    text = text.strip().lower()
    text = re.sub(r"`([^`]*)`", r"\1", text)          # inline code
    text = re.sub(r"\*\*([^*]*)\*\*", r"\1", text)    # bold
    text = re.sub(r"\*([^*]*)\*", r"\1", text)        # italic
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links keep their text
    text = text.replace("\\", "")

    out = []
    for ch in text:
        if ch == " ":
            out.append("-")
        elif ch in "-_":
            out.append(ch)
        elif unicodedata.category(ch)[0] in ("L", "N"):
            out.append(ch)
    return "".join(out)


def markdown_files(root: str) -> list[str]:
    found = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
        for name in filenames:
            if name.endswith(".md"):
                found.append(os.path.normpath(os.path.join(dirpath, name)))
    return sorted(found)


def anchors_of(path: str) -> set[str]:
    anchors: set[str] = set()
    in_fence = False
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            if line.strip().startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            match = HEADING.match(line)
            if match:
                anchors.add(github_slug(match.group(1)))
    return anchors


def main() -> int:
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    files = markdown_files(root)
    anchors = {f: anchors_of(f) for f in files}

    broken = 0
    for file in files:
        with open(file, encoding="utf-8") as handle:
            source = handle.read()

        for match in LINK.finditer(source):
            target = match.group(2)
            if target.startswith(SKIP_SCHEMES):
                continue

            rel_path, _, fragment = target.partition("#")
            base = os.path.dirname(file)

            if rel_path:
                resolved = os.path.normpath(os.path.join(base, rel_path))
                if not os.path.exists(resolved):
                    print(f"  MISSING FILE  {file}: {target}")
                    broken += 1
                    continue
                if fragment and resolved.endswith(".md"):
                    if fragment not in anchors.get(resolved, set()):
                        print(f"  BAD ANCHOR    {file}: {target}")
                        broken += 1
            elif fragment and fragment not in anchors[file]:
                print(f"  BAD ANCHOR    {file}: #{fragment}")
                broken += 1

    print(f"\n{len(files)} file(s), {broken} broken link(s)")
    return 0 if broken == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
