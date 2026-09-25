# -*- coding: utf-8 -*-
"""
Pronouns whose antecedent is too far away, or in another paragraph.

    python3 instruments/antecedent.py                  # the board
    python3 instruments/antecedent.py -v               # every site
    python3 instruments/antecedent.py --write FILE     # the full report
    python3 instruments/antecedent.py DRAFT.md [...]   # draft mode, one row per file

## Draft mode, added 2026-08-29

This file was written on 2026-08-01 because Wendell said *"we are REALLY bad at this 'it'
thing… this needs to be a pattern to explore the book against."* On 2026-08-29 he caught
the same defect again, in marketing copy the pass had reported clean — *"the meeting where
the same person absorbs it again"*, and: **"what person? what is it? We're handwaving
again."**

**The pattern was explored against the book, exactly as asked, and never against a draft.**
It had no FILE branch, so it read the manuscript whatever you passed it. See
`specs/GAP_DRAFT_REVIEW_INSTRUMENTS_2026-08-29.md`.

**One class of hit is louder on a draft than in the book, and it is left in deliberately.**
A paragraph-opening `This` or `It` pointing at the artifact itself — *"This is a field
guide"*, *"Skip it if you are looking for a script"* — has no antecedent inside the
paragraph, so it reports as an orphan. In a chapter the paragraph before it supplies a
noun; on a 500-word description there is no paragraph before it. **That is a real question
about copy a reader arrives at cold** — *this* what? — and suppressing the class would also
hide the handwaves it is here to find. Three glances on a draft is the price.

## Why this exists

Wendell, 2026-08-01, on a drafted line of mine reading *"I have been on the other
side of it more times than I can count"*:

> *"Been on the other side of what? We are REALLY bad at this 'it' thing. So much so
> that this needs to be a pattern to explore the book against. These pronouns aren't
> operating correctly. In this case the 'it' is the thing that someone wrote on a
> card, but it's too far away from its pronoun, and so it reads as confusing."*

A pronoun fails two ways, and both are countable without a coreference parser.

**Distance.** The referent is far enough back that the reader has to go looking.
Working memory for an unrepeated noun is short.

**Paragraph crossing.** No candidate appears anywhere in the paragraph before the
pronoun, so the referent is back in a previous paragraph. That is the failure
Wendell caught: the noun and its pronoun were separated by a paragraph break, and by
the time the pronoun arrived the reader had put the noun down.

## How it is measured

For each referential `it`, `this`, `that`, `they` and `them`, the instrument walks
back through the paragraph collecting candidate antecedents (common and proper
nouns, matched for number where the pronoun marks it), and reports the distance in
words to the nearest one.

**CORRECTED on the first run.** The first version also scored *competition* — how
many other nouns sat in a two-sentence window. That metric fired on 2,436 sites,
including *"Most of the people held to it have no professional training in it"*,
where the referent is two words back and perfectly clear. Ordinary prose has many
nouns near any pronoun; counting them measures prose, not confusion. The tier was
removed rather than tuned, because no threshold on it separates the clear cases from
the unclear ones.

**Expletive `it` is excluded** — *it is worth*, *it turns out*, *it takes three
hours*. That `it` refers to nothing and needs no antecedent, and counting it would
bury the real hits. The exclusion is a pattern match and it is imperfect; a hit list
this instrument prints is a candidate list.

## What this is not

It is not a coreference resolver. It cannot tell you what the pronoun points at, and
it will flag pronouns that a reader follows without effort because the referent is
the obvious topic of the passage. What it can do is find every place where the
grammar gives the reader more than one plausible answer, which is the half a person
cannot do by reading their own prose — the writer always knows what they meant.
"""
import io, os, re, sys, importlib.util
from collections import defaultdict

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
dn = _load("density", os.path.join(HERE, "density.py"))
dl = _load("draft_lines", os.path.join(HERE, "draft_lines.py"))

SING = {"it", "this", "that"}
PLUR = {"they", "them", "these", "those"}

# `it` with no referent. Weather-it, cleft-it, extraposed-it.
EXPLETIVE = re.compile(
    r"^it (?:is|was|'s|s|takes|took|turns out|turned out|seems|seemed|means|meant|"
    r"happens|happened|matters|mattered|helps|helped|costs|cost|works|worked)\b"
    r"(?:[^.]{0,40}?\b(?:to|that|because|when|how|why|worth)\b)?", re.I)

# `that` and `this` as determiners (`that card`, `this book`) are not pronouns.
DET_NEXT = ("NN", "NNS", "NNP", "NNPS", "JJ", "JJR", "JJS", "CD")

NOUN_S = ("NN", "NNP")
# Singular `they` is house style in this book — Ash is they/them, and the prose uses
# it for an unnamed person throughout. So a singular noun is a legal antecedent for a
# plural pronoun, and requiring NNS produced a false-positive class: *"what somebody
# means underneath what they said"* was reported as having no antecedent four words
# after `somebody`. Added 2026-08-01 after it fired twice on one drafted paragraph.
NOUN_P = ("NNS", "NNPS", "NN", "NNP")

DISTANCE_LIMIT = 30      # words back inside the paragraph; beyond this, searching


def sites(text, pos_tag, word_tokenize):
    """Every referential pronoun in a paragraph, with distance to its nearest candidate."""
    sents = dn.sentences(text)
    out = []
    for i, s in enumerate(sents):
        toks = word_tokenize(s)
        tags = pos_tag(toks)
        # The window is the paragraph up to the pronoun. A referent outside it is
        # the paragraph-crossing failure, which is the one Wendell named.
        prior = []
        for p in sents[:i]:
            prior.extend(pos_tag(word_tokenize(p)))
        for j, (tok, tag) in enumerate(tags):
            low = tok.lower()
            if low not in SING and low not in PLUR:
                continue
            if low in ("this", "that", "these", "those"):
                if j + 1 < len(tags) and tags[j + 1][1] in DET_NEXT:
                    continue                      # determiner, not pronoun
            # RELATIVE `that`, excluded 2026-08-29 when draft mode went in. `the books
            # that explain what is wrong` was being reported as an orphan pronoun on a
            # draft whose first paragraph had no earlier noun. A `that` sitting between a
            # noun and a verb is a relative pronoun and its antecedent is the word before
            # it, which is as close as an antecedent gets. Measured book-wide: 202 sites
            # down to 194, all eight of them relative clauses that were never findings.
            if low == "that" and j and tags[j - 1][1] in ("NN", "NNS", "NNP", "NNPS") \
                    and j + 1 < len(tags) and tags[j + 1][1].startswith(("VB", "MD")):
                continue
            if low == "it" and EXPLETIVE.match(" ".join(toks[j:j + 8])):
                continue
            want = NOUN_P if low in PLUR else NOUN_S
            window = prior + tags[:j]
            dist = None
            for k in range(len(window) - 1, -1, -1):
                if window[k][1] in want:
                    dist = len(window) - k
                    break
            if dist is None:
                out.append((low, s, None, 0))
            elif dist > DISTANCE_LIMIT:
                out.append((low, s, dist, 0))
    return out


def draft(paths, pos_tag, word_tokenize, verbose):
    """One row per file, then the sites. The shape `review.py` greps for a basename in."""
    print("pronouns — orphan means no candidate antecedent in the paragraph before it")
    print("%-22s %8s %8s" % ("file", "orphan", ">%dw" % DISTANCE_LIMIT))
    print("-" * 40)
    rows = []
    for l in dl.paragraphs(dl.prose(dl.surfaces(paths))):
        for low, s, dist, comp in sites(l["text"], pos_tag, word_tokenize):
            rows.append((l, low, s, dist))
    per = defaultdict(lambda: [0, 0])
    for l, _low, _s, dist in rows:
        per[os.path.basename(l["rel"])][0 if dist is None else 1] += 1
    bad = 0
    for p in paths:
        n, f = per[os.path.basename(p)]
        print("%-22s %8d %8d" % (os.path.basename(p)[:22], n, f))
        bad += n + f
    if rows:
        print("")
        for l, low, s, dist in (rows if verbose else rows[:12]):
            where = "orphan" if dist is None else "%dw back" % dist
            print("  %-5s %-9s %s:%d" % (low, where, os.path.basename(l["rel"]), l["line"]))
            print("      > %s" % " ".join(s.split())[:120])
        if not verbose and len(rows) > 12:
            print("  … %d more, run with -v" % (len(rows) - 12))
    return 1 if bad else 0


def main():
    verbose = "-v" in sys.argv
    out = None
    if "--write" in sys.argv:
        i = sys.argv.index("--write")
        out = sys.argv[i + 1] if i + 1 < len(sys.argv) else os.path.join(
            ROOT, "editorial_reports", "ANTECEDENT_BOARD.md")

    pos_tag, word_tokenize = dn.tagger()
    if pos_tag is None:
        sys.stderr.write("tagger unavailable\n")
        # The machine line coherence's `gates` check and review.py both read: this is a missing
        # dependency, not a clean run. Same contract as fragment.py.
        print("EDITORIAL antecedent status=unavailable reason=nltk")
        return 1

    paths = dl.paths_from(sys.argv[1:])
    if paths:
        return draft(paths, pos_tag, word_tokenize, verbose)

    # Reflow hard-wrapped lines into whole paragraphs (see draft_lines.paragraphs). The old
    # dn.paragraphs() is a per-line filter with a 25-word floor — on a wrapped file each ~12-word
    # line falls under the floor and is dropped, so the scan missed wrapped passages entirely, and
    # pronoun→antecedent distance was measured inside a line fragment. Reflow gives real paragraphs.
    body = dl.paragraphs([l for l in fl.surfaces()
                          if l["surface"] == "body" and l["rel"] != dn.LETTER
                          and not dl.is_apparatus(l["text"])])
    per = defaultdict(lambda: {"n": 0, "far": [], "crowd": [], "none": []})
    total_pron = 0
    for l in body:
        for low, s, dist, comp in sites(l["text"], pos_tag, word_tokenize):
            rec = per[l["rel"]]
            rec["n"] += 1
            total_pron += 1
            row = (l, low, s, dist, comp)
            (rec["none"] if dist is None else rec["far"]).append(row)

    L = ["# Pronouns without a clear antecedent — the board", "",
         "Generated by `instruments/antecedent.py`. Body prose only. Named by Wendell",
         "2026-08-01: *\"we are REALLY bad at this 'it' thing… these pronouns aren't",
         "operating correctly.\"* See the module docstring for the two failure modes",
         "and for what this instrument cannot do.", "",
         "A site is flagged when no candidate antecedent appears in the paragraph before",
         "the pronoun, or when the nearest one is more than %d words back." % DISTANCE_LIMIT, "",
         "**Every hit is a candidate.** A reader follows a distant pronoun without effort",
         "when the referent is the obvious topic. The instrument finds where the grammar",
         "offers more than one answer, which is the half the writer cannot see.", ""]

    spine = [rel for _, _, rel, _ in fl.bb.SPINE if rel]
    L += ["## Per component", "",
          "| Component | referent in another paragraph | nearest over %d words back | total |"
          % DISTANCE_LIMIT,
          "|---|---|---|---|"]
    for rel in sorted(per, key=lambda r: spine.index(r) if r in spine else 999):
        v = per[rel]
        L.append("| %s | %d | %d | **%d** |"
                 % (os.path.basename(rel), len(v["none"]), len(v["far"]), v["n"]))
    L.append("")
    L.append("**%d sites.**" % total_pron)
    L.append("")

    for key, title in (("none", "The referent is in another paragraph"),
                       ("far", "Nearest candidate too far back")):
        rows = [r for rel in per for r in per[rel][key]]
        L += ["## %s — %d" % (title, len(rows)), ""]
        for l, low, s, dist, comp in rows[:15 if not verbose else 500]:
            where = "referent outside the paragraph" if dist is None else "%d words back" % dist
            L.append("- `%s` · %s:%d · %s" % (low, l["rel"], l["line"], where))
            L.append("  > %s" % " ".join(s.split())[:150])
        L.append("")

    text = "\n".join(L) + "\n"
    if out:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        io.open(out, "w", encoding="utf-8").write(text)
        print("wrote %s — %d sites" % (os.path.relpath(out, ROOT), total_pron))
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
