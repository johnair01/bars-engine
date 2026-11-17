#!/usr/bin/env python3
"""
copy-scan.py: the editorial check for player-facing copy, run over WHOLE files (never only the diff).

Why whole files: #802 reported "the no-ai-slop scan hits only lines already on #793" and shipped anyway. A scan of the
diff lets old hits pass and says nothing about the sentence shapes `.claude/skills/no-ai-slop/scan.py` does not look for.
This file adds the shapes Wendell has ruled on and that scan.py misses (2026-11-17: "lots of dangling 'and'
construction ... a sign that the system doesn't know what it's talking about"):

  trailing and   ", and" followed by a second clause (editorial-core/instruments/trailing_and.py, ruled 2026-09-01: zero)
  and joins      "X and the Y ...", "X and you ...": a bare "and" that starts a second clause with its own subject
  and chain      two or more bare "and" in one sentence (editorial-core/instruments/polysyndeton.py)

It also runs the negation, banned-word and hedge checks from .claude/skills/no-ai-slop/scan.py.

    python3 scripts/copy-scan.py              # every file listed in scripts/copy-scan.files, report only
    python3 scripts/copy-scan.py --strict     # same, exit 1 on any hit
    python3 scripts/copy-scan.py --baseline   # record today's hits as known debt in scripts/copy-scan.baseline
    python3 scripts/copy-scan.py FILE...      # these files
    python3 scripts/copy-scan.py --text "A sentence, and another."   # one string, for a look row's copy

A string the reader owns (a quoted option they pick, a book reservation) goes in scripts/copy-scan.allow with a reason.
scripts/copy-scan.baseline lists hits that already stood when this check was wired (2026-11-17). They print as known
debt and never fail --strict; any other hit fails it. Delete a line when its sentence is rewritten.

A hit has two ends: rewrite the string, or add it to the allow file with a reason. Never hand the hit to Wendell.
"""
import importlib.util
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("slop_scan", ROOT / ".claude/skills/no-ai-slop/scan.py")
slop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(slop)

TRAILING = re.compile(r",\s+and\s+(?=\w)", re.I)
# "and" opening a second clause: a determiner, pronoun or proper-looking subject follows, then a verb-ish word.
JOINS = re.compile(
    r"\band\s+(?:the|a|an|your|his|her|their|its|this|that|these|those|you|he|she|it|we|they|there|nothing|everything|someone|"
    r"no\s+one|each|every|one|two|three)\s+\w+", re.I)
BARE_AND = re.compile(r"(?<![,;:])\s+and\s+(?=\w)", re.I)
SENT = re.compile(r"(?<=[.!?])\s+")


def sentences(text):
    return [s for s in SENT.split(text) if s.strip()]


def shapes(text):
    out = []
    for s in sentences(text):
        if TRAILING.search(s):
            out.append(("trailing and", s))
        elif JOINS.search(s):
            out.append(("and joins two clauses", s))
        elif len(BARE_AND.findall(s)) >= 2:
            out.append(("and chain", s))
    return out


def load_allow():
    p = ROOT / "scripts/copy-scan.allow"
    if not p.exists():
        return []
    return [ln.split("|", 1)[0].strip().lower() for ln in p.read_text(encoding="utf-8").splitlines()
            if ln.strip() and not ln.lstrip().startswith("#")]


def scan_text(text, allow):
    low = text.lower()
    if any(a and a in low for a in allow):
        return []
    hits = list(shapes(text))
    t = text.strip()
    if len(t.split()) >= 4:
        for pat, label in slop.NEGATION:
            if pat.search(t):
                hits.append((label, t)); break
        if slop.BANNED.search(t): hits.append(("banned word", t))
        if slop.HEDGE.search(t): hits.append(("hedge/transition", t))
    return hits


def scan_file(path, allow):
    out = []
    for lineno, text in slop.prose_from(path):
        t = text.strip()
        if len(t.split()) < 4 or "http" in t or "--bars" in t or "var(" in t or t.startswith(("src/", "public/", "@/")):
            continue
        for label, s in scan_text(t, allow):
            out.append((lineno, label, s))
    return out


def load_baseline():
    p = ROOT / "scripts/copy-scan.baseline"
    if not p.exists():
        return set()
    return {ln.rstrip("\n") for ln in p.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.startswith("#")}


def main(argv):
    strict = "--strict" in argv
    make_baseline = "--baseline" in argv
    argv = [a for a in argv if a != "--baseline"]
    argv = [a for a in argv if a != "--strict"]
    allow = load_allow()
    if argv[:1] == ["--text"]:
        hits = scan_text(" ".join(argv[1:]), allow)
        for label, s in hits: print(f"[{label}] {s}")
        print(f"{len(hits)} to look at.")
        return 1 if (strict and hits) else 0
    files = argv or [ln.strip() for ln in (ROOT / "scripts/copy-scan.files").read_text(encoding="utf-8").splitlines()
                     if ln.strip() and not ln.startswith("#")]
    base = set() if make_baseline else load_baseline()
    total = known = 0
    recorded = []
    for f in files:
        p = ROOT / f
        if not p.is_file():
            print(f"copy-scan: {f} is listed but missing"); total += 1; continue
        hits = scan_file(p, allow)
        recorded += [f"{f}|{s}" for _, _, s in hits]
        known += sum(1 for _, _, s in hits if f"{f}|{s}" in base)
        hits = [h for h in hits if f"{f}|{h[2]}" not in base]
        if hits:
            print(f"\n=== {f} ({len(hits)}) ===")
            for lineno, label, s in hits:
                print(f"  {lineno or 'jsx':>4} [{label}] {s[:160]}")
        total += len(hits)
    if make_baseline:
        (ROOT / "scripts/copy-scan.baseline").write_text(
            "# Hits that stood on 2026-11-17 when copy-scan was wired. file|sentence. Delete a line once the sentence is rewritten.\n"
            + "\n".join(recorded) + "\n", encoding="utf-8")
        print(f"copy-scan: baseline of {len(recorded)} written."); return 0
    print(f"\ncopy-scan: {total} new to look at, {known} known debt in the baseline ({'strict' if strict else 'report only'}).")
    return 1 if (strict and total) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
