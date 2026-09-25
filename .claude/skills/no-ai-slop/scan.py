#!/usr/bin/env python3
"""
Find negation-pairing and other house-rule violations in user-facing copy.

Over-reports on purpose. It is a prompt to look at a line, not a linter to
satisfy — see SKILL.md, "When a negation earns its place".

Usage:
    python3 .claude/skills/no-ai-slop/scan.py src/lib/grow-up/check-content.ts
    python3 .claude/skills/no-ai-slop/scan.py $(git diff --name-only)
"""
import re
import sys
import pathlib

# Prose that legitimately contains a negation. Substring match, case-insensitive.
ALLOW = (
    # Only strings the reader owns: the book's six canonical reservations, and
    # picker options a reader selects as their own answer. Everything else gets
    # rewritten — Wendell adds a negation back if one reads more naturally.
    "i'm not", "i’m not", "i am not", "i do not", "i don't", "i don’t",
    "they're not", "they’re not", "i did not", "i didn't", "i didn’t",
    "not sure / skip", "not the right hand", "not this hand",
    "not my ask", "not your ask",
)

NEGATION = [
    (re.compile(r",\s*(?:not|never)\s+(?:a|an|the|one)\b", re.I), "X, not Y"),
    (re.compile(r"—\s*(?:not|never)\s+", re.I), "X — not Y"),
    (re.compile(r"\b(?:is|was|are|were)\s+(?:not|never)\s+(?:a|an|the)\b.*?[,.]\s*(?:it|they|that)\s+(?:is|are)\b", re.I), "is not X, it is Y"),
    (re.compile(r"^\s*Not\s+(?:a|an|the)?\s*\w", re.I), "Not X. Y."),
    (re.compile(r"\brather than\b", re.I), "X rather than Y"),
    (re.compile(r"\bnot\s+\w+[^.?!]{0,40},\s*(?:but|just)\b", re.I), "not X, but Y"),
    # Lower-confidence: any plain negation in prose. The house policy is to write
    # the affirmative and let Wendell add a negation back where one reads better,
    # so these are worth a look even with no paired clause.
    (re.compile(r"\b(?:is|are|was|were|does|do|did|has|have|can|could|will|would|chose|choose)\s+(?:not|never)\b", re.I), "plain negation"),
    (re.compile(r"\bthere\s+(?:is|are)\s+no\b", re.I), "there is no X"),
    (re.compile(r"\bnot\s+yet\b", re.I), "not yet"),
    (re.compile(r"\bnever\b", re.I), "never"),
]

BANNED = re.compile(
    r"\b(delve|tapestry|testament to|seamless|robust|supercharge|unleash|"
    r"elevate your|in today'?s world|navigate the landscape|leverage(?:s|d)?\s+the)\b",
    re.I,
)
HEDGE = re.compile(r"\b(it'?s worth noting|it'?s important to (?:note|consider)|moreover|furthermore|additionally)\b", re.I)


def prose_from(path: pathlib.Path):
    """Yield (line, text) for quoted strings and JSX text, minus code comments."""
    src = path.read_text(encoding="utf-8")
    src = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), src, flags=re.S)
    src = re.sub(r"^\s*//.*$", "", src, flags=re.M)

    out = []
    # Match EVERY quoted string, then filter by length afterwards. A minimum
    # length inside the pattern (`{10,}`) desynchronises the quote pairs: a short
    # attribute like className="space-y-8" gets skipped, so the next match starts
    # at its *closing* quote and swallows the attribute after it. That is how
    # eyebrow="A small opening, not a test" hid through a whole review.
    single = re.compile(r"'([^'\\\n]*(?:\\.[^'\\\n]*)*)'")
    double = re.compile(r'"([^"\\\n]*(?:\\.[^"\\\n]*)*)"')
    for i, line in enumerate(src.splitlines(), 1):
        for pat in (single, double):
            for m in pat.finditer(line):
                text = m.group(1)
                if len(text) >= 10:
                    out.append((i, text))

    # JSX text nodes, flattened across lines so wrapped prose is seen whole.
    flat = re.sub(r"\s+", " ", src)
    for m in re.finditer(r">\s*([A-Za-z][^<>{}]{12,})\s*<", flat):
        out.append((0, m.group(1)))
    return out


def scan(path: pathlib.Path):
    hits = []
    for lineno, text in prose_from(path):
        t = text.strip()
        if len(t.split()) < 4 or "http" in t or "--bars" in t or "var(" in t:
            continue
        low = t.lower()
        for pat, label in NEGATION:
            if pat.search(t):
                if any(a in low for a in ALLOW):
                    break
                hits.append((lineno, label, t))
                break
        if BANNED.search(t):
            hits.append((lineno, "banned word", t))
        if HEDGE.search(t):
            hits.append((lineno, "hedge/transition", t))
    return hits


def main(argv):
    total = 0
    for arg in argv:
        p = pathlib.Path(arg)
        if not p.is_file() or p.suffix not in {".ts", ".tsx", ".md", ".mdx"}:
            continue
        hits = scan(p)
        if not hits:
            continue
        print(f"\n=== {p} ({len(hits)}) ===")
        for lineno, label, text in hits:
            where = f"{lineno:>4}" if lineno else "  jsx"
            print(f"  {where} [{label}] {text[:150]}")
        total += len(hits)
    print(f"\n{total} to look at.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
