# -*- coding: utf-8 -*-
"""
trailing_and.py — Strunk's loose sentence, counted, with the ranking tag broken out.

    python3 instruments/trailing_and.py DRAFT.md [...]   # draft mode, one row per file
    python3 instruments/trailing_and.py                  # the book, as the baseline
    python3 instruments/trailing_and.py -v               # every site

## Why this exists

Wendell, 2026-09-01, on a sentence of mine: *"this trailing 'and' construction needs to go. I
don't want to see it anymore in any writing that I want to have generated."*

The construction is a comma, a coordinating conjunction, and a second independent clause.
**Strunk named it in 1918** and Rule 14 bans a run of them — *"loose sentences of a particular
type, those consisting of two co-ordinate clauses, the second introduced by a conjunction or
relative."* His replacement list ends on the line that is the whole diagnosis: choose
*"whichever best represent the real relations of the thought."*

**`and` represents no relation.** Every other connective commits — `because` to cause, `once`
to sequence, `though` to concession. `and` says only *here is another one*, so reaching for it
is declining to say how two ideas relate.

See `specs/RESEARCH_TRAILING_AND_2026-09-01.md` for the styles where parataxis is craft rather
than tic, and for the eight repairs.

## Measured before it was written, which is why the thresholds are real

    documents I generated, two weeks     206 / 806 sentences    25.6%
    the manuscript, hand scan            980 / 6407 sentences   15.3%
    the manuscript, by this file         783 / 5643 sentences   13.9%
    DECISION_FUNNEL, written that day     17 / 41               41%

**SUPERSEDED 2026-09-09 — the rate above is history, not the target.** The paragraph that
stood here made the manuscript its own standard: *the target is the manuscript's own rate.*
Wendell threw that regime out — *"the baselines are wrong… we really want zero for all of
them"* — and every manifest now declares `trailing_and: 0`.

**The target is zero, and the ledger carries the exceptions.** Deliberate parataxis is real and
it survives, one site at a time, with a written reason in `editorial_exceptions.yaml`. A rate
that justifies itself by being the rate the book already had is the exact reasoning the zero
target replaced.

The numbers above still earn their place: they are why the tic was believed to exist. **They are
not a permission.**

## Two tiers, because reading the hits showed two habits

**LOOSE** — the general case. A defect against a zero target, like every other hit.

**RANK** — the ranking tag: a set asserted, then a member ranked in a trailing clause.
*"Two errors, and the second is worse than the first."* *"There is now a third, and it is the
strongest of them."* **Twenty-three of these in two weeks of my output**, most of them the
literal string `, and it is the` plus a superlative.

**RANK is a defect rather than a candidate, and the reason is not grammatical.** It announces a
hierarchy instead of enacting one. If the second item is worse, lead with it or put it in the
stress position; saying so in a trailing clause is telling the reader about an ordering the
paragraph declined to build. **It also flatters** — the same move `/no-ai-slop` bans as
faux-insight, arriving through grammar rather than vocabulary, which is why `slop_shapes.py`
never saw it.

**RANK counts toward the target — fixed 2026-09-10, core v22.** Until then the zero-target line
and `--keys` read LOOSE only, and a RANK match `continue`d past the LOOSE test. So the one tier
this file calls a defect outright was the one tier no target and no ledger could see: MTGOA
reported `unresolved=781` over 799 sites. Both tiers now count, and both emit keys.

## What it cannot decide

Whether a given loose sentence is the right structure. Deliberate polysyndeton — the King
James cadence, Hemingway's iceberg — is this exact shape used on purpose, and the instrument
cannot tell intent from habit.

**That is what the ledger is for, and it is a per-site judgement.** A reader deciding one
sentence earns its shape writes the reason down and the scanner stops counting it. The rate is
reported so a corpus can be compared with itself over time; it settles nothing about any hit.

## The regex also catches two shapes Rule 14 never meant

**Serial lists.** One subject with three predicates, three adjective phrases, three enumerated
contract terms — the Oxford comma before the final `and` matches, and the sentence is a list
rather than two coordinate clauses. These are the commonest honest ledger entries.

**Compound predicates.** *X is conducted alone, and is not spoken in the household* shares a
subject across both verbs. Often the comma is simply wrong and deleting it clears the hit.

Neither is grounds for skipping the site. Both are grounds for **ledgering it with the shape
named**, which is a resolution. Leaving it counted is not.
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

# Strunk's own list of connectives, minus the relatives. `who/which/when/where/while` are in
# Rule 14 too and are left out here on purpose: in this book they are overwhelmingly
# restrictive, and counting them would bury the coordinators under ordinary relative clauses.
# RULED 2026-09-09 by Wendell, after the triage sample of 100.
#
# **`and` only.** This used to read `(and|but|or|so|yet)`, which contradicted the argument two
# paragraphs up in this file: *"`and` represents no relation. Every other connective commits."*
# `but` names concession, `or` names alternative, `so` names cause — by this instrument's own
# reasoning they are not the defect, and they were ~7% of the count. Strunk's Rule 14 does cover
# them, but the ZERO target was never justified on Strunk's terms; it was justified on the
# relation-naming argument, and that argument exonerates four of the five. The rationale and the
# pattern disagreed, and the number inherited the disagreement.
JOIN = re.compile(r",\s+(and)\s+(?=\w)", re.I)

# A coordinate SUBORDINATE clause is not a second sentence. `because it improves, and because you
# can carry it somewhere else` is one main clause with two reasons hung off it, and repairing it
# would break a legitimate parallel. Seven of the sampled hundred.
# A leading negator or adverb does not make it a main clause: `and not because anybody voted`.
# `what` was added in v25 and REMOVED in v26, the same day, after measuring what it hid: of 48
# sites it suppressed on MTGOA, about 14 were real clauses with a what-clause subject — `and what
# surfaces is not a defense`, `and what actually happened last sprint never comes up`. A reject
# rule that trades real hits for fewer ledger entries on lists is the wrong trade; what-lists
# (`what you will do, who it reaches, and what it costs you`) are ledgered as lists instead.
SUBORDINATOR = re.compile(
    r"^(?:not\s+|never\s+|only\s+|just\s+|also\s+|then\s+)*"
    r"(?:that|because|why|when|whenever|where|wherever|which|who|whom|whose|if|whether|how|"
    r"since|although|though|while|until|unless|before|after|so\s+that|as)\b", re.I)

# `that`, `this` and `which` are subordinators OR demonstrative subjects, and only the next word
# tells them apart: `and that was the problem` is a clause; `and that somewhere else was
# available` is a second that-clause on the same verb. A finite verb immediately after settles it.
# `which` was in this list until v28 (2026-09-10). After `, and` it is never a demonstrative
# subject — `…more consistent than my borrowing of it, and which will repay any reading` is a
# second relative clause on `the original`, and the rule read `which will` as a new sentence.
# `that`/`this` are genuinely ambiguous there; `which` is not.
DEMONSTRATIVE = re.compile(
    r"^(?:that|this|these|those)\s+"
    r"(?:is|are|was|were|has|have|had|does|do|did|will|would|can|could|shall|should|must|may|"
    r"might)\b", re.I)

# What follows `, and ` has to be a clause with its own SUBJECT. The old FINITE allowed up to
# four words then any finite verb, with no subject required, so `never misses a threat, and never
# has to work out which threat is here` scored — one subject, two predicates, which is a compound
# predicate and not two clauses.
#
# **This is written as a REJECT list, and the first version was not.** Enumerating the shapes a
# subject may take (pronoun, determined noun phrase, gerund, proper noun) reached 14/15 precision
# and dropped recall to 21/25, because English subjects do not enumerate: `only a directional
# diagnostic works`, `from inside it feels like failure`, `design assumes a goodwill` and `so does
# perfecting` are all ordinary clauses and none of them fitted the list. Naming the two shapes
# that are NOT clauses is both shorter and more accurate.
# `\w{3,}s` is the crude third-person test, and it reads any word ending in `s` as a verb. Found
# 2026-09-10 on MTGOA: `Third person, and not the version in this chapter` scored because `this`
# ends in `s`; `awareness`, `loss`, `axis` and `serious` scored the same way. The endings excluded
# below never form a third-person verb (`-ss`, `-ous`, `-sis`/`-xis`), and the words are closed-class.
# It cuts both ways: in BARE_PREDICATE the same false verb made `, and this matters` read as a
# second PREDICATE and go unreported, so the fix raises recall as well as precision.
NOT_VERB_S = (r"(?!\w*(?:ss|ous|sis|xis)\b)"
              r"(?!(?:this|thus|its|always|perhaps|towards|afterwards|sometimes|nevertheless|"
              r"whereas|besides|yours|ours|theirs|hers|unless|across|chaos|bias|plus|news|lens)\b)")

BARE_PREDICATE = re.compile(
    r"^(?:never|then|also|still|only|just|again|always|often|sometimes|now|already|simply|"
    r"merely|therefore|thus|commonly|usually|rarely|immediately|finally|eventually|"
    r"quickly|slowly|quietly|carefully)?\s*"
    r"\b(?:is|are|was|were|has|have|had|does|do|did|will|would|can|could|shall|should|must|may|"
    r"might|am|be|" + NOT_VERB_S + r"\w{3,}s|\w{3,}ed)\b", re.I)

# `and so does perfecting` — subject-verb inversion, and a real second clause.
INVERSION = re.compile(
    r"^so\s+(?:does|do|did|is|are|was|were|has|have|had|will|would|can|could|must|should)\b", re.I)

# NOTE — there was a MIDSENTENCE rule here, skipping any key that opened lower-case as a "split
# artifact". It was removed the same day it was added. It suppressed exactly one thing: glossary
# entries that the apparatus filter had beheaded (see draft_lines.APPARATUS), and once that bug
# was fixed it suppressed nothing at all — measured, zero sentences across MTGOA.
#
# It went in because Wendell rejected a sentence I had called an artifact and he called nonsense.
# He was right on both counts: the prose was bad AND the reason it looked broken was a bug.
# **A rule that hides a symptom reads exactly like a rule that fixes a class**, and the only way
# to tell them apart is to fix the underlying thing first and then measure what the rule still does.


# A subordinate clause FRONTING a main clause is not a second subordinate clause on the old verb.
# `, and when it gets inconvenient, the Controller is what holds you to your word` opens with
# `when`, so SUBORDINATOR rejected it — but after the comma a new main clause starts. Found
# 2026-09-10 (v26), five real sites in MTGOA. The exception is coordinate conditions sharing ONE
# main clause — `If X, and if Y, the move is the same` — told apart by the sentence opening on the
# same subordinator.
ADVERBIAL = re.compile(
    r"^(?:not\s+|never\s+|only\s+|just\s+|also\s+|then\s+)*"
    r"(because|when|whenever|where|wherever|if|since|although|though|while|until|unless|before|"
    r"after|once|as)\b", re.I)


def fronts_main_clause(sentence, m, tail):
    a = ADVERBIAL.match(tail)
    if not a:
        return False
    if re.match(r"^\W*%s\b" % re.escape(a.group(1)), sentence, re.I):
        return False                       # `If X, and if Y, …` — two conditions, one main clause
    c = re.search(r",\s+(.*)$", sentence[m.end():])
    if not c:
        return False
    rest = c.group(1)
    return bool(FINITE.match(rest)) and not SUBORDINATOR.match(rest) and not BARE_PREDICATE.match(rest)


def joins_two_clauses(sentence, m):
    """Does this `, and ` join two independent clauses? See the notes above."""
    tail = sentence[m.end():m.end() + 90]
    if DEMONSTRATIVE.match(tail) or INVERSION.match(tail):
        return True                        # `and that was the problem`, `and so does perfecting`
    if SUBORDINATOR.match(tail):
        return fronts_main_clause(sentence, m, tail)   # else a second subordinate clause
    if BARE_PREDICATE.match(tail):
        return False                       # a second predicate on the same subject
    return bool(FINITE.match(tail))

# Does what follows the conjunction look like an independent clause? A subject within a few
# words, then a finite verb. Crude on purpose -- the alternative is a tagger, and `fragment.py`
# already records what a tagger costs on single sentences.
FINITE = re.compile(
    r"^(?:\w+[\w'-]*\s+){0,4}\b(is|are|was|were|has|have|had|does|do|did|will|would|can|could|"
    r"should|must|may|might|am|" + NOT_VERB_S + r"\w{3,}s|\w{3,}ed)\b", re.I)

# `am` was missing from both verb lists until v25 (2026-09-10): `and I am the one who has to say
# so` found no verb and went unreported. `be` joins BARE_PREDICATE only — `, and be corrected
# afterward` is a second predicate on a modal (`I can check… and be corrected`), never a clause
# with its own subject.

# The ranking tag. A trailing coordinate clause whose whole content is where a member sits in
# an ordering. `, and it is the strongest of them.`
RANK = re.compile(
    r",\s+(?:and|but)\s+(?:the\s+|these\s+|that\s+|this\s+|it\s+|they\s+)?(?:\w+\s+){0,3}"
    r"\b(?:is|are|was|were)\s+(?:not\s+)?(?:the\s+|a\s+)?(?:\w+\s+){0,2}"
    r"(strongest|weakest|worst|best|hardest|easiest|sharpest|cheapest|biggest|smallest|"
    r"only|real|serious|better|worse|first|second|third|last|load-bearing|"
    r"useful|important|expensive|dangerous|interesting|surprising)\b"
    # `most`/`least` only in superlative position -- `the most likely one`, not `most people`.
    r"|,\s+(?:and|but)\s+(?:\w+\s+){0,4}\b(?:is|are|was|were)\s+(?:not\s+)?the\s+"
    r"(?:most|least)\b", re.I)

# Measured 2026-09-01 by this file on the book's own body prose: 770 LOOSE + 13 RANK across
# 5,643 sentences. An earlier hand scan said 15.3% because it counted headings and tables too;
# this is the number the instrument itself produces, which is the one to hold new prose to.
BOOK_BASELINE = profile.baseline("trailing_and", 13.9)  # manifest-authoritative; see profile.py
TARGET = profile.target("trailing_and", 0)  # max un-accepted LOOSE hits; house policy is zero


_CONJ = re.compile(r"^,\s+(?:and|but)\s+", re.I)


def is_rank(s):
    """A RANK match whose clause is SUBORDINATE is not a trailing coordinate clause.

    Found 2026-09-10 on MTGOA ch1: `That is why this chapter is called the Infinite Arcade, and
    why the answer is a better game rather than more willpower.` is two why-clauses on one `is`,
    and RANK read `is a better` as a ranking tag. The LOOSE tier has always applied SUBORDINATOR
    for exactly this; RANK never did. Same test, same demonstrative exception."""
    for m in RANK.finditer(s):
        tail = _CONJ.sub("", s[m.start():m.start() + 120])
        if SUBORDINATOR.match(tail) and not DEMONSTRATIVE.match(tail):
            continue
        return True
    return False


def sites(text):
    """[(tier, sentence)] for one block of prose, plus the sentence count."""
    out = []
    sents = [" ".join(s.split()) for s in SENT.split(text)]
    sents = [s for s in sents if len(s.split()) > 4]
    for s in sents:
        if is_rank(s):
            out.append(("RANK", s))
            continue
        for m in JOIN.finditer(s):
            if joins_two_clauses(s, m):
                out.append(("LOOSE", s))
                break
    return out, len(sents)


def main():
    verbose = "-v" in sys.argv
    paths = dl.paths_from(sys.argv[1:])
    if paths:
        groups = [(os.path.basename(p), dl.paragraphs(dl.prose(dl.surfaces([p])))) for p in paths]
    else:
        groups = [("the book", dl.paragraphs([l for l in fl.surfaces() if l["surface"] == "body"
                                and not dl.is_apparatus(l["text"])]))]

    print("trailing coordination — Strunk Rule 14. RANK and LOOSE are both defects; target zero")
    print("%-24s %6s %6s %7s %8s" % ("file", "LOOSE", "RANK", "sents", "rate"))
    print("-" * 56)
    bad, rows, total = 0, [], 0
    for label, lines in groups:
        hits, n = [], 0
        for l in lines:
            h, c = sites(l["text"])
            hits += [(t, s, l) for t, s in h]
            n += c
        loose = sum(1 for t, _s, _l in hits if t == "LOOSE")
        rank = sum(1 for t, _s, _l in hits if t == "RANK")
        rate = 100.0 * (loose + rank) / max(n, 1)
        flag = "" if rate <= BOOK_BASELINE + 3 else "  HEAVY"
        print("%-24s %6d %6d %7d %7.1f%%%s" % (label[:24], loose, rank, n, rate, flag))
        bad += rank + (1 if flag else 0)
        rows += hits
        total += n
    print("-" * 56)
    print("rate column is history (the pre-zero baseline was %.1f%%); the target is zero."
          % BOOK_BASELINE)

    shown = [r for r in rows if r[0] == "RANK"] + [r for r in rows if r[0] == "LOOSE"]
    if shown:
        print("")
        for tier, s, l in (shown if verbose else shown[:12]):
            print("  %-5s %s:%d" % (tier, os.path.basename(l["rel"]), l["line"]))
            print("      > %s" % s[:130])
        if not verbose and len(shown) > 12:
            print("  … %d more, run with -v" % (len(shown) - 12))
    # The summary prints LAST because `review.py`'s book board takes `lines[-1]` as the step
    # result. The first wiring ended on the site list and the board read "… 771 more, run with
    # -v" as the summary -- the same defect the diet and voice steps each shipped once, and
    # the third time this exact shape has bitten in this file's neighbourhood.
    print("")
    print("book baseline %.1f%% — %d LOOSE, %d RANK across %d sentence(s)"
          % (BOOK_BASELINE,
             sum(1 for t2, _s, _l in rows if t2 == "LOOSE"),
             sum(1 for t2, _s, _l in rows if t2 == "RANK"), total))

    # Zero-target accounting. BOTH tiers are driven to zero; a hit whose sentence is in the
    # ledger is a deliberate keep and does not count. coherence.py reads this line.
    prim = [s for (_t, s, _l) in rows]
    if "--keys" in sys.argv:
        return exc.emit_keys("trailing_and", [
            ("%s:%d" % (os.path.basename(l["rel"]), l["line"]), s)
            for (_t, s, l) in rows])
    kept = [s for s in prim if exc.is_accepted("trailing_and", s)]
    print("EDITORIAL trailing_and unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (len(prim) - len(kept), len(kept), len(prim), TARGET, len(exc.stale("trailing_and"))))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
