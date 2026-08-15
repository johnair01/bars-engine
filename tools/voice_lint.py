# -*- coding: utf-8 -*-
"""House voice linter — the book's counters, pointed at product copy.

    python3 tools/voice_lint.py src/app/mastering-allyship/page.tsx
    python3 tools/voice_lint.py "src/**/*.tsx" --strict     # exit 1 on a hard hit
    python3 tools/voice_lint.py README.md -v                # every site

Self-contained on purpose: standard library only, no repo layout assumed, no config
file. Drop it anywhere and it runs.

## What this is, and what it deliberately is not

This is the portable half of `instruments/review.py` from the book repo. That instrument
runs twelve steps against `manuscript/ch*.md` and knows about marginalia membranes,
chapter registers and a typeset spine. **None of that exists in a product repo**, so
porting it whole would ship a tool that mostly reports about files it cannot find.

What ports is the part that is about English: the hard gate, and the density counters.
The regexes below are **copied verbatim** from `gate.py`, `prose_diet.py` and
`empty_head.py` so the site and the book cannot drift into disagreeing about what a
defect is. When the book's counters change, re-copy them; do not re-derive them.

## Reading TSX without linting the code

A marketing page is 90% code and 10% copy, and running an English linter over the code
produces noise that trains you to skim — the failure every counter in the book repo had
to be narrowed out of. So for `.ts/.tsx/.js/.jsx` this extracts only what a customer can
read:

  - JSX text nodes — the characters between `>` and `<`
  - string and template literals that look like prose

"Looks like prose" means: contains a space, contains a lowercase letter, is at least 12
characters, and does not look like a class list, an import path, a URL, a CSS value or an
identifier. **The coverage line in the report says how much was actually scanned**, so a
clean board on 40 characters is visibly a clean board on 40 characters.

Markdown and plain text are read whole.

## Tiers

**HARD** — the gate. Banned words, sentence-initial And/But, glued em-dashes, negation
stacks, live placeholders, and narrating the reader's history back to her as fact. Each
one is a defect rather than an opinion. `--strict` exits 1 on any.

**SOFT** — the densities, per thousand words, against the book's own measured baselines.
These are *candidate finders*. A number over the baseline means read the sites; it does
not mean the sentence is wrong. Marketing copy legitimately runs hotter than book prose
on `copula` and `waste` — a landing page points at things.
"""
import io, os, re, sys, glob, json

# ---------------------------------------------------------------- HARD (from gate.py)

HARD = [
    ("banned",  re.compile(r"\brooms?\b|\bquiet(ly|er|est)?\b|\bgenuinely\b|\bthings?\b", re.I),
     "the four words the book bans outright — rebuild the sentence, do not swap a synonym"),
    ("andbut",  re.compile(r'(^|[.?!]["“”\'’]? |\*|\*\*|— |; )(And|But) ', re.M),
     "sentence-initial And/But"),
    ("emdash",  re.compile(r"[a-zA-Z0-9,]—[a-zA-Z0-9]"),
     "glued em-dash — the budget only ratchets down"),
    ("stacks",  re.compile(r"\bNot [^.!?]{1,60}[.!?]\s+(Not|Never|No)\b"),
     "negation stack — a negation is legal only if the negated thing is still true at the end"),
    ("A0",      re.compile(r"you (were|was) (taught|told|raised|trained)|somewhere along the way", re.I),
     "narrating the reader's unnamed history back to her as fact"),
    ("prodtag", re.compile(r"\[[A-Z][A-Z0-9 →/&—-]{1,40}\]"),
     "unresolved placeholder — these typeset, and they ship"),
    ("token",   re.compile(r"⟦[^⟧]*⟧"),
     "live template token"),
]

# ---------------------------------------------------------- SOFT (from prose_diet.py)

SOFT = [
    ("be",        re.compile(r"\b(is|are|was|were|be|been|being)\b", re.I), 38.0),
    ("copula",    re.compile(r"^\W*[\w'][\w' ]{0,30}\s(is|are|was|were)\s", re.I | re.M), 9.0),
    ("waste",     re.compile(r"\b(it|this|that|there)\b", re.I), 22.0),
    ("zombie",    re.compile(r"\b(?:the|a|an)\s+(?:\w+\s+){0,2}"
                             r"\w+(?:tion|ment|ance|ence|ness|ity|ism|sion)\b", re.I), 7.0),
    ("expletive", re.compile(r"(?:^|(?<=[.!?]\s))\s*(It|There)\s+(is|was|are|were)\b"), 1.4),
    ("passive",   re.compile(r"\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?"
                             r"(?:\w+ed|known|seen|done|made|taken|given|held|told|said|"
                             r"written|built|kept|left|put|set|shown|drawn|brought|found|"
                             r"heard|lost|sent|meant|felt)\b(?!\s+(?:to|that))", re.I), 4.5),
    ("empty",     re.compile(r"\b(thing|things|something|anything|nothing|version|versions"
                             r"|stuff|way|ways|part|parts|aspect|aspects|element|elements"
                             r"|area|areas|piece|pieces|room|rooms)\b", re.I), 14.0),
]

# empty_head.py's HARD tier — the placeholder nouns, as a named list rather than a density
EMPTY_HEAD = re.compile(r"\b(?:the|this|that|these|those|a|an)\s+"
                        r"(?:thing|things|stuff|bit|bits|aspect|aspects|piece|pieces|"
                        r"part|parts|element|elements|area|areas)\b", re.I)

CODE = re.compile(r"^(?:https?:|/|\./|@|#|[a-z]+-[a-z-]+$|[\w.]+\.(?:tsx?|jsx?|css|png|svg)$)")
CLASSY = re.compile(r"^[\w\s:/\[\]().%-]*$")   # tailwind-ish: no sentence punctuation


def looks_like_prose(s):
    s = s.strip()
    if len(s) < 12 or " " not in s:
        return False
    if not re.search(r"[a-z]", s):
        return False
    if CODE.match(s):
        return False
    # A tailwind class list has many tokens, no sentence punctuation and lots of dashes.
    if CLASSY.match(s) and not re.search(r"[.,!?;'’]", s) and s.count("-") >= 2:
        return False
    if re.match(r"^[\w-]+$", s):
        return False
    return True


FENCE = re.compile(r"^```.*?^```", re.S | re.M)
# Markdown lets an inline code span wrap across a source line, and the examples in
# reference.md do exactly that. Allowing one newline inside the span is what makes
# the tool agree with the format instead of with its own convenience.
INLINE = re.compile(r"`[^`\n]*(?:\n[^`\n]*)?`")


def strip_examples(text):
    """Blank out code fences and inline code spans, keeping line numbers intact.

    Documentation about banned words necessarily contains banned words. The first run
    of this linter reported 26 hard findings against its OWN reference doc, every one
    of them a quoted example of the defect being described. **A counter that is wrong
    on the document explaining it is a counter people learn to skim**, which is the
    failure every instrument in the book repo had to be narrowed out of.

    So the rule is: an example belongs in backticks, and backticks are not prose.
    That is also just correct Markdown, and it makes the boundary something an author
    controls deliberately rather than something the linter guesses at.
    """
    text = FENCE.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)
    return INLINE.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)


def extract(path):
    """Return (text, coverage_note). Code files yield only customer-visible copy."""
    raw = io.open(path, encoding="utf-8", errors="replace").read()
    ext = os.path.splitext(path)[1].lower()
    if ext not in (".ts", ".tsx", ".js", ".jsx", ".mjs"):
        if ext in (".md", ".markdown", ".mdx"):
            return strip_examples(raw), "whole file, code spans excluded"
        return raw, "whole file"

    segs = []
    # JSX text nodes. Skip anything containing a brace — that is an expression, not copy.
    for m in re.finditer(r">([^<>{}]{12,})<", raw):
        if looks_like_prose(m.group(1)):
            segs.append(m.group(1).strip())
    # String and template literals.
    for m in re.finditer(r"'([^'\\\n]{12,})'|\"([^\"\\\n]{12,})\"|`([^`\\$]{12,})`", raw):
        s = m.group(1) or m.group(2) or m.group(3)
        if s and looks_like_prose(s):
            segs.append(s.strip())

    seen, out = set(), []
    for s in segs:
        if s not in seen:
            seen.add(s)
            out.append(s)
    text = "\n".join(out)
    return text, "%d copy segment(s), %d of %d chars" % (len(out), len(text), len(raw))


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("-")]
    verbose = "-v" in sys.argv
    strict = "--strict" in sys.argv
    as_json = "--json" in sys.argv
    if not argv:
        sys.stderr.write(__doc__.split("\n\n")[0] + "\n\nusage: voice_lint.py <file|glob> [-v] [--strict] [--json]\n")
        return 2

    paths = []
    for a in argv:
        hits = glob.glob(a, recursive=True)
        paths.extend(hits if hits else [a])
    paths = [p for p in sorted(set(paths)) if os.path.isfile(p)]
    if not paths:
        sys.stderr.write("no files matched\n")
        return 2

    report, hard_total, words_total = [], 0, 0
    for p in paths:
        text, coverage = extract(p)
        words = len(re.findall(r"[A-Za-z’'-]+", text))
        words_total += words
        entry = {"file": p, "coverage": coverage, "words": words, "hard": [], "soft": {}}

        for name, rx, why in HARD:
            for m in rx.finditer(text):
                entry["hard"].append({"rule": name, "line": line_of(text, m.start()),
                                      "text": m.group(0).strip()[:60], "why": why})
        for m in EMPTY_HEAD.finditer(text):
            entry["hard"].append({"rule": "empty-head", "line": line_of(text, m.start()),
                                  "text": m.group(0).strip()[:60],
                                  "why": "placeholder noun — name the referent"})
        hard_total += len(entry["hard"])

        if words >= 40:
            for name, rx, base in SOFT:
                per_k = len(rx.findall(text)) * 1000.0 / max(words, 1)
                entry["soft"][name] = round(per_k / base, 2) if base else 0.0
        report.append(entry)

    if as_json:
        print(json.dumps(report, indent=2))
        return 1 if (strict and hard_total) else 0

    print("voice lint — %d file(s), %d words of copy\n" % (len(paths), words_total))
    for e in report:
        flags = [k for k, v in e["soft"].items() if v > 1.30]
        state = "HARD %d" % len(e["hard"]) if e["hard"] else ("heavy: " + ",".join(flags) if flags else "clean")
        print("  %-52s %-9s %s" % (e["file"][-52:], "%dw" % e["words"], state))
        if e["soft"] and (verbose or flags):
            print("      " + "  ".join("%s %.2f" % (k, v) for k, v in e["soft"].items()))
        for h in (e["hard"] if verbose else e["hard"][:6]):
            print("      [%s] L%-4d %r" % (h["rule"], h["line"], h["text"]))
            if verbose:
                print("             %s" % h["why"])
        if not verbose and len(e["hard"]) > 6:
            print("      ... %d more, run -v" % (len(e["hard"]) - 6))

    print("\n%d hard finding(s). Soft numbers are ratios against the book's baseline; "
          "over 1.30 means read the sites." % hard_total)
    if not verbose:
        print("A ratio on under ~300 words is noise — score a page, not a button.")
    return 1 if (strict and hard_total) else 0


if __name__ == "__main__":
    sys.exit(main())
