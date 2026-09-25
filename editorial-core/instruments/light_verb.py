# -*- coding: utf-8 -*-
"""
light_verb.py — the weak verb: a nothing-verb faking the work a real one should do.

    python3 instruments/light_verb.py DRAFT.md [...]   # draft mode, one row per file
    python3 instruments/light_verb.py                  # the book, as the baseline
    python3 instruments/light_verb.py -v               # every site

## Why this exists

Wendell, reading the proof, 2026-09-02, on *"praise lands warm"* and *"it leaves you smaller"*:
*"'lands warm' — what the fuck does landing warm mean? Land is another one of those nothing
words that gets overused."* And, on *"it leaves you smaller"*: *"who is the it that makes you
smaller and how can they leave you?"*

**Two verbs, one failure: the verb does no work, and the sentence pretends it does.** *Land*
and *leave* and *make* borrow the look of a physical action and spend it on an abstraction that
cannot perform one. The red-team (`specs/REDTEAM_WRITE_WITHOUT_THESE_ISSUES_2026-09-02.md`)
named this the one buildable half of the solve: **catch the enumerable weak-verb class
mechanically, before the draft reaches him.** This is that half.

## Three shapes, and why they are different

The third tier and the vocabulary the first two read came from DL-97 (2026-09-10), folded into
core v32 on 2026-09-11 so one instrument serves every book. **The shapes are universal; the
words are the project's.** A generic abstraction list missed the nouns MTGOA hands a physical
verb to (*the feeling runs clean*), so a project extends the list through its manifest
(`abstractions:`), and the wrong-domain tier's vocabulary is the project's too
(`light_verb_borrowed:`, with `light_verb_borrowed_ruled_in:` for what the author kept). A
project that declares none of these runs the generic detector, unchanged.

**DELEXICAL — the buried verb.** *make a decision* (decide), *reach a conclusion* (conclude),
*conduct an investigation* (investigate), *provide assistance* (help). A light verb — *make,
take, give, have, do, get, provide, perform, conduct, reach* — plus a nominalization that hides
the real verb inside a noun. Strunk Rule 13 (*omit needless words*) and Williams (*Style*: put
the action in the verb, not the noun) both name it. **This tier is gradeable and driven down**:
the fix is mechanical — recover the buried verb, drop the noun.

**DEAD — the fake-concrete verb.** *praise lands warm*, *the shame sits there*, *it leaves you
smaller*. A motion or placement verb — *land, leave, sit, hang, settle, run, move* — handed an
abstract or a bare-demonstrative subject that cannot move or be placed. On a concrete subject
the same verb is fine (*she left the room*), so **this tier is surfaced, not graded**: whether
the subject can really do the verb is a reading call, not the instrument's. It is the shape
Wendell caught by eye that no counter saw. **DL-97 added a transaction sub-shape** — *vigilance
buys aim*, *it trades contact for control* — where an abstraction buys, sells or spends; it needs
an abstract object too, so it stays a couple of sites in a book rather than hundreds.

**BORROWED — the wrong-domain verb.** *metabolize a feeling*. A verb lifted from chemistry,
computing or logistics and run on an inner state: not a weak verb but a precise one pointing at
the wrong domain, and the precision is what makes it persuasive. Its vocabulary is a project's
own, so the tier is empty until a manifest declares it, and a verb the author rules back in is
excluded so the tier records that the question was asked. **Graded like DELEXICAL on a draft**,
not surfaced like DEAD.

## The remediation (Williams, and Wendell)

**Recover the action.** *make a decision* → *decide*. Not a better noun; the verb.
**Give the verb a subject that can do it.** *it leaves you smaller* → name who, and let them do
something a person can do: *when you take the grade, their read of your work outranks your own*.
The dead verb is the same tell as the copula-label in `telling.py`: **a symptom that the thought
under it is unfinished.** The writer reached for *lands* because the real verb was not worked out.

## What it cannot decide (the honest ceiling)

**This is an existence check on a word list — the same instrument every prose linter in the wild
is** (write-good, proselint, Vale). Their shared lesson is the ceiling: write-good ships its
ban-all-*to-be* mode (E-Prime) OPT-IN because banning a verb class produces false positives, and
proselint's own authors conclude every such tool is incomplete. So this reports a rate against
the book's own baseline, not zero — a light verb on a concrete object is often exactly right
(*take the medication*, *give the book*), and the DELEXICAL match cannot always tell the
delexical *take action* from the literal *take the road*. **It surfaces candidates. The reader
clears the earned ones**, exactly as with `telling.py`, and the irreducible class — a strong verb
with no real referent — stays his eye's, per the red-team.
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

# DELEXICAL: a light verb + an optional article + a nominalization that hides the real verb.
# The light-verb list is the linguistics core (do, make, take, give, have, get) plus the Latinate
# performers editors flag most (provide, perform, conduct, achieve, reach, offer, gain). The
# nominalization is caught by suffix -- high-precision, and it deliberately misses the bare
# deverbal noun (take a look, give a push), which needs a hand-built list this does not keep.
LIGHT = (r"make|makes|made|making|take|takes|took|taken|taking|give|gives|gave|given|giving|"
         r"have|has|had|having|do|does|did|doing|get|gets|got|gotten|getting|"
         r"provide|provides|provided|providing|perform|performs|performed|performing|"
         r"conduct|conducts|conducted|conducting|achieve|achieves|achieved|achieving|"
         r"reach|reaches|reached|reaching|offer|offers|offered|offering|gain|gains|gained|gaining")
NOMINAL = r"\w{3,}(?:tion|sion|ment|ance|ence|ity|ism)"
DELEXICAL = re.compile(r"\b(?:%s)\s+(?:a |an |the )?(%s)\b" % (LIGHT, NOMINAL), re.I)

# The bare-noun light-verb construction the suffix regex cannot see: "make an effort" (try),
# "take advantage of" (exploit), "do harm to" (harm). These are the class Wendell meant by
# "someone has made a list of these" -- and someone has: this set is drawn from write-good's
# `too-wordy` list (read from the npm package, verified against source, not a summary), which
# ships "make an effort", "do damage to", "do harm to", "have a tendency to", "took advantage
# of" as wordiness, plus the canonical delexical constructions the British Council teaches.
LIGHT_PHRASE = re.compile(
    r"\b(?:mak(?:e|es|ing)|made)\s+(?:a |an |the )?"
    r"(?:effort|choice|attempt|difference|comparison|distinction|assumption|mention|use of)\b"
    r"|\b(?:tak(?:e|es|ing)|took|taken)\s+(?:a |an |the )?"
    r"(?:action|step|advantage of|account of|control of)\b"
    r"|\b(?:giv(?:e|es|ing)|gave|given)\s+(?:a |an |the )?"
    r"(?:consideration|explanation|description|demonstration|rise to|permission)\b"
    r"|\b(?:hav(?:e|es|ing)|has|had)\s+(?:a |an |the )?"
    r"(?:tendency to|impact on|preference for)\b"
    r"|\b(?:do|does|doing|did|done)\s+(?:a |an |the )?(?:harm|damage)\b"
    r"|\bput(?:s|ting)?\s+(?:emphasis|pressure|stress|a strain)\s+on\b", re.I)
# Nouns that carry a flagged suffix but bury no verb -- the cheap precision win. Chasing this
# list past the obvious offenders is the Goodhart trap the red-team named, so it stays short:
# every entry was read off a false positive in the first book-wide run.
NOT_DEVERBAL = {
    "reality", "conscience", "section", "foundation", "presence", "absence", "sentence",
    "distance", "science", "patience", "silence", "audience", "experience", "difference",
    "reference", "evidence", "confidence", "sequence", "counterbalance", "instance",
    "quality", "quantity", "city", "priority", "majority", "minority", "security",
    "university", "community", "identity", "activity", "opportunity", "authority",
    "responsibility", "ability", "reality", "capacity", "intimacy",
}

# DEAD: a motion/placement verb on a subject that cannot move -- an abstraction or a bare
# demonstrative. `land` and `leave` are the two Wendell named; the rest are the same fake-concrete
# family. Surfaced, never graded: on a concrete subject every one of these is a real verb.
DEADV = (r"lands?|landed|landing|leaves?|left|leaving|sits?|sat|sitting|hangs?|hung|hanging|"
         r"settles?|settled|settling|sinks?|sank|sunk|sinking|runs?|ran|running|"
         r"moves?|moved|moving|travels?|travell?ed|travell?ing|rides?|rode|carries|carried")
# Generic-English abstractions, plus any nominalization-suffixed noun, plus a bare demonstrative.
# Kept explicit so the tier stays low-noise and aimed at the flagged family. A project extends
# this with its own abstractions through the manifest (`abstractions:`) -- DL-97 found that a
# generic list missed the nouns THIS book hands a physical verb to (*the feeling runs clean*), so
# the vocabulary is the project's while the shape is universal. See profile.abstractions.
ABSTRACT_BASE = (r"praise|encouragement|shame|fear|trust|power|love|hope|doubt|guilt|grief|anger|"
                 r"joy|help|care|respect|control|comfort|silence|attention|presence|absence|"
                 r"meaning|truth|belief|faith|pride|courage|kindness|cruelty|authority|"
                 r"condescension|approval|validation|recognition|feedback|criticism|worth|grade|"
                 r"verdict")
_ABSTRACT_EXTRA = profile.abstractions([])
ABSTRACT = ABSTRACT_BASE + ("|" + "|".join(_ABSTRACT_EXTRA) if _ABSTRACT_EXTRA else "")
SUBJ = r"it|this|that|these|those|%s|\w{4,}(?:tion|sion|ment|ness)" % ABSTRACT
DEAD = re.compile(r"\b(%s)\s+(?:\w+ly\s+)?(?:%s)\b" % (SUBJ, DEADV), re.I)

# TRADE, DL-97 (2026-09-10, into core v32). An abstraction cannot buy, sell, spend or trade;
# when one does, the transaction verb is fake-concrete the way a motion verb is in DEAD. It needs
# an abstract OBJECT as well as an abstract subject, or every literal "it cost you an hour" fires
# -- that object test is what holds it to a couple of sites in a book rather than hundreds.
# Universal mechanism, always on; the abstraction vocabulary it reads is the project's.
TRADEV = (r"trades?|traded|trading|buys?|bought|buying|sells?|sold|selling|pays?|paid|paying|"
          r"spends?|spent|spending|earns?|earned|earning|purchases?|exchanges?|affords?")
TRADE = re.compile(r"\b(%s)\s+(?:\w+ly\s+)?(?:%s)\s+"
                   r"(?:a |an |the |your |their |you )?(%s|\w{4,}(?:tion|sion|ment|ness))\b"
                   % (SUBJ, TRADEV, ABSTRACT), re.I)

# BORROWED, DL-97/DL-102. A verb lifted from another domain (chemistry, computing, logistics) and
# run on a feeling: not a weak verb but a WRONG one, and the precision is what makes it persuasive.
# Its vocabulary is domain-specific, so it is the project's (`light_verb_borrowed:`); a verb the
# author has ruled back in (`light_verb_borrowed_ruled_in:`) is excluded, so the tier records that
# the question was asked and answered rather than firing. Empty in a project that declares neither.
_BORROWED = profile.light_verb_borrowed([])
BORROWED = re.compile(r"\b(?:%s)\b" % "|".join(_BORROWED), re.I) if _BORROWED else None
BORROWED_RULED_IN = {w.lower() for w in profile.light_verb_borrowed_ruled_in([])}

# Measured 2026-09-03 by this file on the book's own body prose: 39 DELEXICAL and 124 DEAD across
# 5,985 sentences. DEAD runs high because most of its subjects are concrete and fine -- which is
# why it is surfaced, not graded.
BOOK_BASELINE = profile.baseline("light_verb", 0.7)  # manifest-authoritative; see profile.py
TARGET = profile.target("light_verb", 0)  # max un-accepted DELEXICAL hits; house policy is zero


def sites(text):
    out = []
    sents = [" ".join(s.split()) for s in SENT.split(text)]
    # DL-97 lowered this from `> 3`: the three-word floor hid the book's flattest register
    # (*"Vigilance buys aim."*, *"That is burnout."*). It scanned ~449 fewer sentences for one
    # DELEXICAL hit and several DEAD/TRADE ones, so it was buying nothing and hiding real sites.
    sents = [s for s in sents if len(s.split()) > 1]
    for s in sents:
        m = DELEXICAL.search(s)
        suffix_hit = m and m.group(1).lower() not in NOT_DEVERBAL
        if suffix_hit or LIGHT_PHRASE.search(s):
            out.append(("DELEXICAL", s))
        if DEAD.search(s) or TRADE.search(s):
            out.append(("DEAD", s))
        if BORROWED is not None:
            bw = BORROWED.search(s)
            if bw and bw.group(0).lower() not in BORROWED_RULED_IN:
                out.append(("BORROWED", s))
    return out, len(sents)


def main():
    verbose = "-v" in sys.argv
    paths = dl.paths_from(sys.argv[1:])
    if paths:
        groups = [(os.path.basename(p), dl.paragraphs(dl.prose(dl.surfaces([p])))) for p in paths]
    else:
        groups = [("the book", dl.paragraphs([l for l in fl.surfaces() if l["surface"] == "body"
                                and not dl.is_apparatus(l["text"])]))]

    print("light verb — the buried verb (DELEXICAL), the fake-concrete verb (DEAD), the wrong-domain "
          "verb (BORROWED); see the docstring")
    print("%-24s %6s %5s %6s %7s %8s" % ("file", "DELEX", "DEAD", "BORROW", "sents", "delex%"))
    print("-" * 62)
    bad, rows, total = 0, [], 0
    for label, lines in groups:
        hits, n = [], 0
        for l in lines:
            h, c = sites(l["text"])
            hits += [(t, s, l) for t, s in h]
            n += c
        dx = sum(1 for t, _s, _l in hits if t == "DELEXICAL")
        dv = sum(1 for t, _s, _l in hits if t == "DEAD")
        bw = sum(1 for t, _s, _l in hits if t == "BORROWED")
        rate = 100.0 * dx / max(n, 1)
        flag = "" if rate <= BOOK_BASELINE + 2 else "  HEAVY"
        print("%-24s %6d %5d %6d %7d %7.1f%%%s" % (label[:24], dx, dv, bw, n, rate, flag))
        # On a draft, DELEXICAL and BORROWED are build failures (a buried verb, a wrong verb);
        # DEAD is a backlog to look at, its subjects often concrete, so book-wide it does not
        # inflate `bad`. BORROWED is 0 unless a project declares the tier's vocabulary.
        bad += dx + bw + (dv if paths else 0) + (1 if flag else 0)
        rows += hits
        total += n
    print("-" * 62)

    order = {"DELEXICAL": 0, "BORROWED": 1, "DEAD": 2}
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
    print("book baseline %.1f%% DELEXICAL. An existence check has a false-positive floor; the "
          "instrument surfaces, the reader clears." % BOOK_BASELINE)

    # Zero-target accounting. DELEXICAL is the tier driven to zero; a hit whose sentence is in the
    # ledger is a deliberate keep and does not count. coherence.py reads this line.
    prim = [s for (t, s, _l) in rows if t == "DELEXICAL"]
    if "--keys" in sys.argv:
        return exc.emit_keys("light_verb", [
            ("%s:%d" % (os.path.basename(l["rel"]), l["line"]), s)
            for (t, s, l) in rows if t == "DELEXICAL"])
    kept = [s for s in prim if exc.is_accepted("light_verb", s)]
    print("EDITORIAL light_verb unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (len(prim) - len(kept), len(kept), len(prim), TARGET, len(exc.stale("light_verb"))))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
