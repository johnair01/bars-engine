# -*- coding: utf-8 -*-
"""
polysyndeton.py — bare coordination chains: `X and Y and Z`, with no comma anywhere.

    python3 instruments/polysyndeton.py DRAFT.md [...]   # draft mode, one row per file
    python3 instruments/polysyndeton.py                  # the book
    python3 instruments/polysyndeton.py -v               # every site

## Why this exists, and why trailing_and could not do it

`trailing_and.py` fires on `,\\s+and` — a comma, then a coordinating conjunction. **This shape has
no comma at all**, so that instrument is blind to it by construction, and its own docstring says
so: *"Deliberate polysyndeton is this exact shape used on purpose, and the instrument cannot tell
intent from habit."*

The house rule already bans it in words. `/no-ai-slop`, rule 5: *"and-chains of three or more
clauses — each one is another chance for the sentence to avoid landing."* That skill's `scan.py`
has an `and-chain` pattern, but it matches `X, Y, and Z` — an Oxford-comma series, which is the
opposite construction. **The rule existed and nothing enforced it.**

Found 2026-09-09 when the fragment gate went live and a reverted sentence turned out to carry a
three-clause bare chain that every scanner on the board had walked past.

## Measured before it was written

Rate is sentences carrying **two or more** bare conjunctions that each open an independent clause.

    my own generated reports, this session      6 / 203     2.96%
    my own core documentation                   1 /  69     1.45%
    Wendell, PROCESS.md                         2 / 178     1.12%
    The AI Psychologist, body                   9 / 946     0.95%
    Mastering the Game, body                   53 / 7326    0.72%
    Wendell, VOICE.md                           0 / 136     0.00%

**Roughly 3× between generated prose and the books, and the hand-written style document is at
zero.** The absolute counts are small, which is an argument for the gate rather than against one:
nine sites is a morning, and a target of zero matches what Wendell's own prose already does.

## What it counts, and the two filters that earn their place

A hit needs **two or more** bare conjunctions, each followed by a real independent clause —
an explicit subject and then a finite verb. Two filters keep the noise out:

**Number words.** *"one hundred and six questions"* is a numeral, not a chain. The `and` preceded
by a number word is skipped.

**Phrase coordination.** *"the practitioner collects and holds"* shares a subject across two verbs,
and *"every ledger and contract and death"* is a noun series. Requiring a subject before the finite
verb drops both. They are polysyndeton in the rhetorical sense and they are not the defect: the
defect is a sentence that keeps starting new clauses instead of ending.

## What it cannot decide

Whether a chain is deliberate. The accelerating chain is a real figure — the King James cadence,
Hemingway — and this instrument cannot tell it from a sentence that would not stop. **That is what
the ledger is for**, one site at a time, with the reason written. The rate is reported so a corpus
can be compared with itself; it settles nothing about any hit.
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
dn = _load("density", os.path.join(HERE, "density.py"))
frag = _load("fragment", os.path.join(HERE, "fragment.py"))

# Sentence boundary with the abbreviation guard. Six instruments carry this constant and they
# must stay identical; see trailing_and.py for the note on why the guard exists.
_ABBR = (r"(?<!\b[A-Z]\.)(?<!\bed\.)(?<!\bDr\.)(?<!\bMr\.)(?<!\bMs\.)"
         r"(?<!\bMrs\.)(?<!\betc\.)(?<!\bvs\.)(?<!\bvol\.)(?<!\bno\.)"
         r"(?<!\bpp\.)(?<!\bcf\.)(?<!\bi\.e\.)(?<!\be\.g\.)(?<!\bSt\.)")
SENT = re.compile(r"(?<=[.!?])" + _ABBR + r"\s+")

# A BARE conjunction: no comma, semicolon or colon immediately before it. That punctuation is
# what makes a sentence trailing_and's business instead of this file's.
BARE = re.compile(r"(?<![,;:])\s+(?:and|or|nor)\s+(?=\w)", re.I)

# "one hundred and six" — a numeral wearing a conjunction.
NUM = re.compile(r"(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|"
                 r"thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\s*$", re.I)

# An independent clause after the conjunction. Two admissible shapes, and the split is what
# keeps noun series out.
#
# **The first version accepted any subject with any finite-looking verb, and `\w{3,}s` /
# `\w{3,}ed` match plural nouns and past participles.** So `the roles and the traditions and the
# weekly councils` scored as three clauses — `councils` read as the verb — and roughly half of
# MTGOA's reported hits were anaphoric noun lists, which are a figure this instrument has no
# business touching. Caught 2026-09-09 before a single one was rewritten.
#
#   1. A PRONOUN subject may take any finite verb. `he stayed`, `they can take`, `I was standing`.
#      A pronoun cannot head a noun series, so the loose verb test is safe behind it.
#   2. Any other subject must take a CLOSED-CLASS verb — be, have, do, or a modal. `her face is
#      arranged`, `the mm is in the wrong place`, `nobody has noticed`.
#
# A noun series has neither: no pronoun, and `councils` is not a modal.
_CLOSED = (r"is|are|was|were|has|have|had|does|do|did|"
           r"will|would|can|could|shall|should|must|may|might|"
           r"am|be|been|being")
_PRON = r"i|you|he|she|it|we|they|nobody|everyone|everybody|someone|there"

# Subject, then a finite verb within two words. The verb test has two tiers.
#
# **Two wrong versions preceded this one, and both are why the tiers exist.**
#
# v1 accepted any subject with `\w{3,}s|\w{3,}ed` as the verb. Those match plural nouns and
# past participles, so `the roles and the traditions and the weekly councils` scored three
# clauses — `councils` read as a verb — and about half of MTGOA's hits were anaphoric noun
# lists, a figure this instrument has no business touching.
#
# v2 fixed that by demanding a closed-class verb from any non-pronoun subject. Precision went
# to 100% and **recall collapsed to a third**: `Ferrand says so`, `the material is old and it
# will not come quickly`, `the city's whole record arrives` are all ordinary clauses with noun
# subjects and lexical verbs. A gate that misses two thirds of its targets is not a gate.
#
# What separates `councils` from `says` is not shape, it is part of speech, so the third
# version asks the corpus. `fragment.py` built this exact answer already: the union of every
# word the tagger ever calls a verb anywhere in the book, because a tagger is unreliable on one
# sentence and dependable across six thousand. `councils` never appears as a verb; `says` does.
#
# Tier A — a PRONOUN subject takes any finite verb. A pronoun cannot head a noun series.
# Tier B — any other subject takes a closed-class verb, or a word in the corpus verb lexicon.
#
# Without NLTK the lexicon is unavailable, and the instrument reports `status=unavailable`
# rather than falling back to v1 or v2. A wrong count is worse than an absent one.
SUBJ_PRON = re.compile(
    r"^(?:%s)\s+(?:\w+\s+){0,2}\b(?:%s|\w{3,}s|\w{3,}ed)\b" % (_PRON, _CLOSED), re.I)
SUBJ_CLOSED = re.compile(
    r"^(?:the|a|an|this|that|these|those|my|his|her|its|their|our|your|both|neither)?\s*"
    r"\w+(?:\s+\w+){0,2}\s+\b(?:%s)\b" % _CLOSED, re.I)
# Tier B, lexical: capture the candidate verb so it can be checked against the corpus lexicon.
SUBJ_LEX = re.compile(
    r"^(?:the|a|an|this|that|these|those|my|his|her|its|their|our|your|both|neither)?\s*"
    r"[\w'’-]+(?:\s+[\w'’-]+){0,2}\s+([a-z][\w'’-]{2,})\b", re.I)


def opens_clause(tail, lex):
    """Does `tail` — the text right after a bare conjunction — open an independent clause?"""
    if SUBJ_PRON.match(tail) or SUBJ_CLOSED.match(tail):
        return True
    m = SUBJ_LEX.match(tail)
    return bool(m and m.group(1).lower() in lex)


TARGET = profile.target("polysyndeton", 0)
MIN_LINKS = 2       # two bare conjunctions is three clauses


def sites(text, lex):
    """[(links, sentence)] for one block of prose, plus the sentence count."""
    out = []
    sents = [" ".join(s.split()) for s in SENT.split(text)]
    sents = [s for s in sents if len(s.split()) > 4]
    for s in sents:
        links = [m for m in BARE.finditer(s) if not NUM.search(s[:m.start()])]
        clauses = [m for m in links if opens_clause(s[m.end():m.end() + 70], lex)]
        if len(clauses) >= MIN_LINKS:
            out.append((len(clauses), s))
    return out, len(sents)


def main():
    verbose = "-v" in sys.argv

    # The corpus verb lexicon, which is the whole basis of tier B. Built from the book in every
    # mode -- see the note above SUBJ_PRON and fragment.py's docstring on why aggregation is
    # what makes a tagger usable here at all.
    pos_tag, word_tokenize = dn.tagger()
    if pos_tag is None:
        print("Tagger unavailable — no report.")
        print("EDITORIAL polysyndeton status=unavailable reason=nltk")
        return 1
    lex = frag.verb_lexicon(
        dl.paragraphs([l for l in fl.surfaces()
                       if not dl.is_apparatus(l["text"])]),
        pos_tag, word_tokenize)

    paths = dl.paths_from(sys.argv[1:])
    if paths:
        groups = [(os.path.basename(p), dl.paragraphs(dl.prose(dl.surfaces([p])))) for p in paths]
    else:
        groups = [("the book", dl.paragraphs([l for l in fl.surfaces() if l["surface"] == "body"
                                and not dl.is_apparatus(l["text"])]))]

    print("bare coordination chains — `X and Y and Z`, no comma. trailing_and cannot see these")
    print("%-24s %7s %7s %8s" % ("file", "chains", "sents", "rate"))
    print("-" * 50)
    rows, total = [], 0
    for label, lines in groups:
        hits, n = [], 0
        for l in lines:
            h, c = sites(l["text"], lex)
            hits += [(k, s, l) for k, s in h]
            n += c
        print("%-24s %7d %7d %7.2f%%" % (label[:24], len(hits), n, 100.0 * len(hits) / max(n, 1)))
        rows += hits
        total += n
    print("-" * 50)

    shown = sorted(rows, key=lambda r: -r[0])
    if shown:
        print("")
        for links, s, l in (shown if verbose else shown[:12]):
            print("  %d links  %s:%d" % (links, os.path.basename(l["rel"]), l["line"]))
            print("      > %s" % s[:130])
        if not verbose and len(shown) > 12:
            print("  … %d more, run with -v" % (len(shown) - 12))

    # The summary prints LAST because review.py's board takes lines[-1] as the step result.
    print("")
    print("%d chain(s) across %d sentence(s)" % (len(rows), total))
    prim = [s for (_k, s, _l) in rows]
    if "--keys" in sys.argv:
        return exc.emit_keys("polysyndeton", [
            ("%s:%d" % (os.path.basename(l["rel"]), l["line"]), s) for (_k, s, l) in rows])
    kept = [s for s in prim if exc.is_accepted("polysyndeton", s)]
    print("EDITORIAL polysyndeton unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (len(prim) - len(kept), len(kept), len(prim), TARGET, len(exc.stale("polysyndeton"))))
    return 1 if len(prim) - len(kept) > TARGET else 0


if __name__ == "__main__":
    sys.exit(main())
