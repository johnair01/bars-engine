# -*- coding: utf-8 -*-
"""
telling.py — the copula-label, where the writing tells instead of showing.

    python3 instruments/telling.py DRAFT.md [...]   # draft mode, one row per file
    python3 instruments/telling.py                  # the book, as the baseline
    python3 instruments/telling.py -v               # every site

## Why this exists

Wendell, 2026-09-01, reading the proof: *"That is the trade, every time. THAT IS THAT IS THAT
IS."* And then the diagnosis, in full:

> *"That is the trade points to nothing the reader can hold onto. They have to move backwards to
> remember what it's referring to. Using the definite article* the *in* the trade *assumes there
> is a trade that people know about AND it's supporting something they have to reference back to
> understand… These are telling instead of showing, which is my big critique of the writing time
> and time again."*

**The construction is a copula carrying a label the reader cannot hold.** *That is the trade.*
*Encouragement is the smaller word.* *It is the kind you carry home.* Two failures ride in it:

- **The demonstrative points backward.** *That* sends the reader in reverse to rebuild the
  referent, so the sentence hands over nothing to hold moving forward.
- **The definite article presupposes.** *the trade* claims a trade the reader already knows,
  when nothing has named one. *The* smuggles in a shared thing that does not exist, then leans
  on it.

**It breaks Strunk twice.** Rule 18 — the end of a sentence should carry *"the new element in
the sentence"* — and a re-label carries nothing new. Rule 11 — *direct and vigorous* — dies on
the flat copula.

## The remediation is not a better sentence

Wendell, on how he fixes one: *"If the reader is making a trade we need to use language that
puts them in a place where the trading is happening and they see the result of the trade they've
made. And feel the dissatisfaction. What it's leaving out is that it's a bad trade. Most people
don't talk about good trades. It flags that the thought is unfinished."*

**So a copula-label is a symptom of unfinished thinking.** The writer reached for the label
because the scene, the mechanism, and the consequence were not worked out yet. **The fix is to
finish the thought** — put the reader where the thing happens, let them see the result and feel
it — not to tighten the label. And the label usually hides a verdict: *trade* means a *bad*
trade, and showing it lets the reader feel the bad deal the label flattened.

## Three tiers, by how much they mean

**LABEL** — a demonstrative or *it* + a copula + an article + a noun. *That is the trade.* The
flagship, and the one to drive down. **3.0% of the book's sentences; 7.3% in the flagged proof
passage.** Reported as a rate against the book, HEAVY over it.

**PROPERTY** — an abstract handed a physical property. *praise has a shape*, *a texture to it*.
**Five in the whole book**, which is why one of them stopped Wendell cold. A low-noise
candidate: the off-system copula-metaphor, the *is* that walked into a mapping the reader cannot
make (Lakoff, *Metaphors We Live By*, not Strunk).

**ABSOLUTE** — an asserted universal, *every time*, *always*. A separate sickness from the
copula: a claim that has to be proven and dies on the first exception. It appears in **27 sentences
across this book** (measured 2026-09-04), and the instrument surfaces every one. **Whether a given
absolute is earned or unprovable is a reading call — not the instrument's, and not mine.** The
pattern also catches bounded factual uses (*never once wondered* = a thing the narrator did not
do), which it cannot mechanically separate from unearned universals. Both reach the reader as
candidates. Nobody upstream of the reader gets to clear them.

## What it cannot decide

Whether a copula is deliberate. This book's ontology spends *is* on purpose — *allyship is a
game*, the psyche as an arcade, the self as a party of characters — the licensed metaphors of
`Metaphors We Live By`. The instrument cannot tell a licensed *is* from an accidental one.
**It reports candidates and a rate.** The test a reader applies to each: does it show or tell,
is the metaphor on-system, and is the thought under it finished.
"""
import io, os, re, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, [name]
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


fl = _load("find_line", os.path.join(HERE, "find_line.py"))
dl = _load("draft_lines", os.path.join(HERE, "draft_lines.py"))
profile = _load("profile", os.path.join(HERE, "profile.py"))
exc = _load("exceptions", os.path.join(HERE, "exceptions.py"))

# Sentence boundary. The abbreviation guard was added 2026-09-09: the bare
# `(?<=[.!?])\s+` split on every period, so `Practitioner: J. Kuiper, first case.`
# came apart into two fragments and `3rd ed. names the surgeon.` into one. Five
# instruments carry this constant; they must stay identical. Each lookbehind is
# fixed-width, which is what stdlib `re` allows.
_ABBR = (r"(?<!\b[A-Z]\.)(?<!\bed\.)(?<!\bDr\.)(?<!\bMr\.)(?<!\bMs\.)"
         r"(?<!\bMrs\.)(?<!\betc\.)(?<!\bvs\.)(?<!\bvol\.)(?<!\bno\.)"
         r"(?<!\bpp\.)(?<!\bcf\.)(?<!\bi\.e\.)(?<!\be\.g\.)(?<!\bSt\.)")
SENT = re.compile(r"(?<=[.!?])" + _ABBR + r"\s+")

# The demonstrative-copula label. A backward-pointing subject, a copula, an article, a noun.
LABEL = re.compile(r"\b(That|This|These|Those|It)\s+(is|are|was|were|'s)\s+(the|a|an)\s+\w+", re.I)

# An abstract handed a physical property -- the off-system copula-metaphor. Kept to a short list
# of genuinely physical nouns, because that is what makes it low-noise: "praise has a shape"
# fires, "he has a plan" does not.
PROPERTY = re.compile(
    r"\b(has|have|had)\s+(?:a |an )?(shape|texture|weight|colou?r|smell|taste|temperature|"
    r"edge|surface|geometry|thickness|density|flavou?r|grain|contour)\b(?!\s+(?:of|for|to\s+\w))"
    r"|\b(shape|texture|weight|edge|grain|contour)\s+to\s+it\b", re.I)

# An asserted universal. Surfaced, never graded -- "earned or unprovable" is the reader's call.
# It catches bounded factual uses too (never once wondered); the instrument does not get to
# decide which of those are fine, because deciding that is the judgement it does not have.
ABSOLUTE = re.compile(r"\b(every time|everytime|always|everyone|no one|nobody)\b", re.I)

# Measured 2026-09-02 by this file on the book's own body prose. The manifest (editorial.yaml)
# is authoritative when present; the constant is the fallback and the default it is checked
# against. coherence.py re-measures and fails on drift from the manifest value.
BOOK_BASELINE = profile.baseline("telling", 3.0)  # per cent of sentences carrying a LABEL
TARGET = profile.target("telling", 0)  # max un-accepted LABEL hits; house policy is zero


def sites(text):
    out = []
    sents = [" ".join(s.split()) for s in SENT.split(text)]
    sents = [s for s in sents if len(s.split()) > 3]
    for s in sents:
        if LABEL.search(s):
            out.append(("LABEL", s))
        if PROPERTY.search(s):
            out.append(("PROPERTY", s))
        if ABSOLUTE.search(s):
            out.append(("ABSOLUTE", s))
    return out, len(sents)


def main():
    verbose = "-v" in sys.argv
    paths = dl.paths_from(sys.argv[1:])
    if paths:
        groups = [(os.path.basename(p), dl.paragraphs(dl.prose(dl.surfaces([p])))) for p in paths]
    else:
        groups = [("the book", dl.paragraphs([l for l in fl.surfaces() if l["surface"] == "body"
                                and not dl.is_apparatus(l["text"])]))]

    print("telling not showing — the copula-label. LABEL is the one to drive down; see the docstring")
    print("%-24s %6s %5s %5s %7s %8s" % ("file", "LABEL", "PROP", "ABS", "sents", "label%"))
    print("-" * 60)
    bad, rows, total = 0, [], 0
    for label, lines in groups:
        hits, n = [], 0
        for l in lines:
            h, c = sites(l["text"])
            hits += [(t, s, l) for t, s in h]
            n += c
        lab = sum(1 for t, _s, _l in hits if t == "LABEL")
        prop = sum(1 for t, _s, _l in hits if t == "PROPERTY")
        ab = sum(1 for t, _s, _l in hits if t == "ABSOLUTE")
        rate = 100.0 * lab / max(n, 1)
        flag = "" if rate <= BOOK_BASELINE + 2 else "  HEAVY"
        print("%-24s %6d %5d %5d %7d %7.1f%%%s" % (label[:24], lab, prop, ab, n, rate, flag))
        # On a draft, every tier is a thing to look at -- absolutes included, because clearing
        # them is the reader's call and a draft has not had one yet. Book-wide the absolute count
        # is a backlog rather than a build failure, so it does not inflate `bad` there.
        bad += lab + prop + (ab if paths else 0) + (1 if flag else 0)
        rows += hits
        total += n
    print("-" * 60)

    order = {"LABEL": 0, "PROPERTY": 1, "ABSOLUTE": 2}
    shown = sorted(rows, key=lambda r: order[r[0]])
    if shown:
        print("")
        for tier, s, l in (shown if verbose else shown[:12]):
            print("  %-9s %s:%d" % (tier, os.path.basename(l["rel"]), l["line"]))
            print("      > %s" % s[:130])
        if not verbose and len(shown) > 12:
            print("  … %d more, run with -v" % (len(shown) - 12))

    # Summary LAST, so review.py's book board reads it off lines[-1] rather than a site quote.
    print("")
    print("book baseline %.1f%% LABEL. Every hit is a candidate the reader tests; the instrument "
          "surfaces, it does not clear." % BOOK_BASELINE)

    # Zero-target accounting. LABEL is the tier driven to zero; a hit whose sentence is in the
    # ledger is a deliberate keep and does not count. coherence.py reads this line.
    prim = [s for (t, s, _l) in rows if t == "LABEL"]
    if "--keys" in sys.argv:
        return exc.emit_keys("telling", [
            ("%s:%d" % (os.path.basename(l["rel"]), l["line"]), s)
            for (t, s, l) in rows if t == "LABEL"])
    kept = [s for s in prim if exc.is_accepted("telling", s)]
    print("EDITORIAL telling unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (len(prim) - len(kept), len(kept), len(prim), TARGET, len(exc.stale("telling"))))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
