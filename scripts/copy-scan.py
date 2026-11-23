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

  no concrete referent   a line that gestures at meaning and names no thing: "What was stuck moves.", "It means
                         something.", "You feel settled." (Wendell, 2026-11-17, on sc-crops-copy-look-1: "What was
                         stuck? why does it moving matter? IT means something. What does it mean?")

It also runs the negation, banned-word and hedge checks from .claude/skills/no-ai-slop/scan.py.

The referent rule is a tripwire. Patterns cannot read, so the reader pass is --ask: it lists every sentence with the
question "what, specifically?" for the writer to answer beside it. A line whose answer is not a word in the line gets
rewritten or cut. The rule and the worked examples: .claude/skills/no-ai-slop/concrete-referent.md.

    python3 scripts/copy-scan.py              # every file listed in scripts/copy-scan.files, report only
    python3 scripts/copy-scan.py --strict     # same, exit 1 on any hit
    python3 scripts/copy-scan.py --baseline   # record today's hits as known debt in scripts/copy-scan.baseline
    python3 scripts/copy-scan.py FILE...      # these files
    python3 scripts/copy-scan.py --text "A sentence, and another."   # one string, for a look row's copy
    python3 scripts/copy-scan.py --ask FILE...  # the reader pass: every sentence with "what, specifically?"
    python3 scripts/copy-scan.py --lexicon [FILE...]  # the lexicon gate (scripts/voice_gate.py); exit 1 on a new failure
    python3 scripts/copy-scan.py --pin-words  # rewrite content/voice/common-words.txt from the files copy-scan holds

A string the reader owns (a quoted option they pick, a book reservation) goes in scripts/copy-scan.allow with a reason.
check.sh runs --strict and fails on any hit (Wendell, 2026-11-17, copy-scan-gate-1: "C, Fail it, and rewrite the 19
older lines too"). The baseline those 19 sat in is gone; a scripts/copy-scan.baseline, if one is ever written, still
prints as known debt.

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

# No concrete referent (Wendell, 2026-11-17, on sc-crops-copy-look-1: "What was stuck? why does it moving matter? IT
# means something. What does it mean?"). A line that gestures at meaning without naming the thing passes every "and"
# rule above, so these catch the gesture itself. They are a tripwire, not the reader: the reader pass is --ask, and the
# rule is .claude/skills/no-ai-slop/concrete-referent.md.
_VERBS = r"(?:means?|matters?|moves?|opens?|settles?|shifts?|changes?|happens?|works?|counts?|lands?|flows?|pulls?|holds?|stands?|comes?|goes?|gets?|feels?)"
VAGUE_SUBJECT = re.compile(
    r"^(?:and\s+|but\s+|so\s+)?(?:it|this|that|something(?:\s+\w+)?|things|everything|nothing|what\s+(?:was|is)\s+\w+|what\s+matters)\s+"
    + _VERBS + r"\b", re.I)
VAGUE_PHRASE = re.compile(
    r"\b(?:means? something|it matters|what matters|the whole\s*[.,]|something new|something that|your power|the shape of"
    r"|feels? alive|the kind of help|its meaning|a sense of|show up fully|in a way that|on a deeper level|the one that is there"
    r"|share it|rest in (?:it|them)|step into it|what you care about|something in (?:you|me)|what you brought)\b", re.I)
# A short line that names a feeling or a quality and nothing it is about: "You feel settled." "A boundary is honoured."
BARE_FEELING = re.compile(r"^(?:you|it|a \w+|the \w+)\s+(?:feel|feels|are|is|get to|see|have)\s+(?:\w+\s*){1,3}[.!]?$", re.I)
ABSTRACT = set("delight power boundary meaning presence settled present whole something things everything nothing feeling "
               "feelings energy space journey shape kind way sense care calm peace joy growth value truth honoured clearly "
               "cleanly risk nerve close play matters".split())
_STOP = set("your you that this with what have from into they them will when then there their about just even more "
            "been were being does could would should".split())


def no_referent(s):
    t = s.strip().strip("'\"‘’“”")
    if VAGUE_SUBJECT.search(t):
        return "no concrete referent (vague subject)"
    if VAGUE_PHRASE.search(t):
        return "no concrete referent (vague phrase)"
    if len(t.split()) <= 5 and BARE_FEELING.search(t):
        return "no concrete referent (a feeling with nothing it is about)"
    content = [w for w in (x.lower() for x in re.findall(r"[A-Za-z’']+", t)) if len(w) > 3 and w not in _STOP]
    if content and all(w in ABSTRACT for w in content):
        return "no concrete referent (abstract words only)"
    return None


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
        label = no_referent(s)
        if label:
            out.append((label, s))
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


def run_lexicon(files):
    """The lexicon gate: FR-006 to FR-011 of .specify/specs/voice-desk. Known debt sits in scripts/voice-gate.baseline."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import voice_gate
    gate = voice_gate.Gate()
    allow = load_allow()
    base = set()
    bp = ROOT / "scripts/voice-gate.baseline"
    if bp.exists():
        base = {ln.rstrip("\n") for ln in bp.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.startswith("#")}
    if not files:
        files = sorted({f for s in gate.screens.values() for f in s.get("files") or []})
        files += [ln.strip() for ln in (ROOT / "scripts/copy-scan.files").read_text(encoding="utf-8").splitlines()
                  if ln.strip() and not ln.startswith("#") and ln.strip() not in files]
    fails, known, warns = [], 0, {}
    for f in files:
        p = ROOT / f
        if not p.is_file():
            print(f"copy-scan --lexicon: {f} is listed but missing"); fails.append((f, 0, "missing file", f, f, f"{f}|missing|{f}")); continue
        sids = gate.screens_of(f) or [None]
        for lineno, text in slop.prose_from(p):
            for sid in sids:
                for _lvl, rule, msg, word in gate.check_string(text, sid):
                    key = f"{f}|{rule}|{word}"
                    if key in base:
                        known += 1
                    else:
                        fails.append((f, lineno, rule, msg, text, key))
            for w in gate.coinages(text, allow):
                warns.setdefault(f, {}).setdefault(w, lineno)
    seen = set()
    for f, lineno, rule, msg, text, key in fails:
        if (f, key) in seen:
            continue
        seen.add((f, key))
        print(f"FAIL {f}:{lineno or 'jsx'} [{rule}] {msg}\n       in: {text.strip()[:110]}")
    for f, ws in warns.items():
        shown = ", ".join(sorted(ws)[:12]) + (f" (+{len(ws) - 12} more)" if len(ws) > 12 else "")
        print(f"warn {f}: {len(ws)} word(s) in neither the lexicon nor content/voice/common-words.txt: {shown}")
    print(f"\ncopy-scan --lexicon: {len(seen)} failing, {known} known debt in scripts/voice-gate.baseline, "
          f"{sum(len(w) for w in warns.values())} coinage warning(s).")
    return 1 if seen else 0


def pin_words():
    """Common = a word of 4+ letters that shipped player copy uses in at least two files under src/."""
    import collections
    seen_in = collections.defaultdict(set)
    for p in sorted((ROOT / "src").rglob("*")):
        if p.suffix not in {".ts", ".tsx"} or "__tests__" in p.parts or ".test." in p.name:
            continue
        for _, text in slop.prose_from(p):
            for w in re.findall(r"[A-Za-z][A-Za-z’']*", text):
                seen_in[w.strip("’'").lower()].add(p)
    out = sorted(w for w, fs in seen_in.items() if len(w) >= 4 and len(fs) >= 2 and w.isalpha())
    (ROOT / "content/voice/common-words.txt").write_text(
        "# Pinned common words (voice-desk FR-011): every word of 4+ letters that player copy under src/ uses in at least two\n"
        "# files. A word outside this list, the lexicon and scripts/copy-scan.allow warns as a coinage (never fails).\n"
        "# Regenerate with: python3 scripts/copy-scan.py --pin-words\n" + "\n".join(out) + "\n", encoding="utf-8")
    print(f"pinned {len(out)} words")
    return 0


def main(argv):
    if argv[:1] == ["--lexicon"]:
        return run_lexicon(argv[1:])
    if argv[:1] == ["--pin-words"]:
        return pin_words()
    strict = "--strict" in argv
    make_baseline = "--baseline" in argv
    argv = [a for a in argv if a != "--baseline"]
    argv = [a for a in argv if a != "--strict"]
    allow = load_allow()
    if argv[:1] == ["--ask"]:
        for f in argv[1:]:
            print(f"\n=== {f}: answer each line, then rewrite or cut any line whose answer is not a word in it ===")
            for lineno, text in slop.prose_from(ROOT / f):
                for s in sentences(text.strip()):
                    if len(s.split()) >= 4 and "http" not in s and "(" not in s:
                        print(f"  {lineno or 'jsx':>4} {s[:150]}\n       what, specifically? ___")
        return 0
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
