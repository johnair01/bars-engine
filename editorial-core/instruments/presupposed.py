# -*- coding: utf-8 -*-
"""
presupposed.py — the definite article that claims a referent nothing established.

    python3 instruments/presupposed.py DRAFT.md [...]   # draft mode
    python3 instruments/presupposed.py                  # the book
    python3 instruments/presupposed.py -v               # every site

## Why this exists

Wendell, 2026-09-01, on his own prose: *"Using the definite article* the *in* the trade *assumes
there is a trade that people know about AND it's supporting something they have to reference back
to understand."* `telling.py` names that failure in its docstring and catches it only inside the
copula-label shape (`That is the trade`). A bare `the table` with no antecedent passes every
scanner in this pipeline — which is how one reached a rewrite handed to Wendell on 2026-09-09, in
a sentence written to fix a different defect.

**This is `antecedent.py` for articles.** That instrument finds a pronoun pointing at nothing; this
one finds a definite noun phrase doing the same, and the two failures are one failure wearing
different grammar.

## What the research says, and why the naive version is worthless

The literature is settled and it is not on the AI-writing side. Searching LLM-detection work for
this turns up statistical and watermarking classifiers and nothing about presupposition; the useful
tradition is computational pragmatics, twenty-five years deep.

**Poesio & Vieira (Computational Linguistics, 2000)** classify every definite description as one of
three things, and their corpus finding is the warning label on this instrument:

| class | example | legal? |
|---|---|---|
| **direct anaphora** | *a car … the car* | yes — the head noun is already on the page |
| **bridging** | *a car … the motor* | yes — inferrable from an anchor |
| **discourse-new** | *the sun*, *the man who came to dinner* | **usually yes**, and **prevalent in ordinary prose** |

So *first mention* is the wrong trigger: most first-mention definites in real writing are fine. A
detector that flags them all reports the language rather than the defect.

**What licenses a discourse-new definite**, and therefore what this instrument must let through:

- **Larger situation / unique reference** — *the sun*, *the government*, *the reader*.
- **A licensing postmodifier** — *the man **who came to dinner***, *the end **of the road***. The
  description carries its own uniqueness, so nothing earlier needs to have supplied it.
- **A bridging anchor** in the neighbourhood — *room* licenses *the ceiling*.
- **Evans's small-world rule (2005)** — a definite may introduce an entity when it is the most
  relevant of its type in its local frame. Definiteness presupposes existence and maximality
  rather than familiarity.

## Why frequency is not a licence — Wendell, 2026-09-09

A first version of this file licensed any head noun the corpus used often, on the reasoning that a
term a book leans on is its own vocabulary. Wendell: *"this leap might be going too far. You'd need
to prove that each of those core terms were scaffolded correctly."*

He is right, and the error is worth keeping on the record. **Frequency counts uses. Introduction is a separate event, and only that one licenses a definite.** A term used forty times and never once established is a heavier failure than a term
used twice, because the whole book leans on something the reader was never given — and a frequency
licence would have exempted precisely that case. The first run
reported ~1,270 sites, 152 in chapter one, which is the language rather than the defect.

**So the instrument proves the scaffolding instead of assuming it.** For every head noun the book
uses with `the`, it finds the term's first *introduction* — an indefinite (*a trade*), a definition
(*X is…*, *X means…*), a heading, or a bolded term — and compares it against the term's first
definite use, in reading order across the spine.

| tier | what it means |
|---|---|
| **NEVER** | used with `the` and never introduced anywhere in the book |
| **EARLY** | the first `the X` lands before the passage that introduces X |

Everything else is left alone, which is what keeps the report short enough to act on.

## What it reports

**A term, not a site.** The unit is the head noun and the finding is about the book's handling of
it: where it is first presupposed, where (if ever) it is introduced, and how many times it is used.
One entry per term rather than one per occurrence, because the fix is one act of scaffolding.

**Rarity is a noise filter here, and it is not a licence.** Wendell, 2026-09-09, on an earlier
version that exempted frequent terms: *"this leap might be going too far. You'd need to prove that
each of those core terms were scaffolded correctly."* Correct, and the exemption is gone. This file
makes **no claim** about whether a frequently-used term was scaffolded; auditing the book's core
vocabulary is a human job it does not attempt. It reports only terms used a handful of times, where
a missing introduction leaves the reader with nothing at all.

**It needs real part-of-speech tags, and says so when they are missing.** A regex cannot find the
head of a noun phrase: a first pass took the word after `the` and reported *the five*, *the most*,
*the ones* and *the Challenger's* as nouns, 813 of them. Head extraction is the whole instrument, so
this one sits in the same tier as `fragment.py` and `antecedent.py` — it turns off without NLTK
rather than guessing.

## Status, 2026-09-09 — EXPERIMENTAL, and deliberately outside `pass:`

Four implementations, each fixing a real defect in the last, measured against MTGOA:

| version | rule | sites | why it failed |
|---|---|---|---|
| v1 | first-mention definite, frequency-licensed | 1270 | reported the language; frequency licence unsound (see above) |
| v2 | scaffolding, regex head | 813 | regex cannot find an NP head: *the five*, *the most*, *the ones* |
| v3 | scaffolding, POS head | 617 | missed reduced relatives and same-paragraph introductions |
| v4 | + those fixes, rarity as filter | 396 | residue is **bridging** and **idiom** |

The v4 residue is the honest wall: *"It spends theirs as well… does not reduce **the bill**"* is a
bridge from *spend*, and *the good news*, *in the dark*, *in the doorway* are idioms. Poesio &
Vieira needed an annotated corpus and a full system to get at these; a regex in this pipeline will
not.

**So this file is not in `pass:` and carries no target.** It is kept because the taxonomy and the
measurements are worth having, and because a narrower successor is buildable: either a curated
abstract-noun list in the manner of `telling.py`'s PROPERTY regex, or a judge that reads the
candidate and answers the one question. The second already exists in this repository as the
Skeptic hook, which caught *the table* on sight while these four versions were failing to.

**It cannot detect bridging**, which is the honest limit. Resolving *room → ceiling* needs world
knowledge this file does not have, so a term introduced only by inference from a related word will
read as never introduced. The larger-situation list absorbs the commonest of those.
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

BOLD = re.compile(r"\*\*([^*]{2,60})\*\*")
WORD = re.compile(r"[a-z']+", re.I)

# Larger-situation and generic referents: unique in the world, or unique to any book's frame.
SITUATION = set("""
sun moon sky earth world air ground sea ocean night day morning evening future past present
reader writer author book chapter page text story point end beginning middle rest whole time way
truth work room door floor wall body mind heart head hand eye face voice name word question answer
problem system group team moment thing things kind sort part side line place case fact
""".split())

NOUN = ("NN", "NNS", "NNP", "NNPS")


def stem(w):
    w = w.lower()
    for suf in ("ies", "es", "s", "ing", "ed"):
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            return w[: -len(suf)]
    return w


def scan(lines, pos_tag, word_tokenize):
    """Reading order. Per head noun: where it is first PRESUPPOSED (`the X` the reader cannot
    resolve) and where it is first INTRODUCED (indefinite, bare-plural generic, definition, bold)."""
    first_presup, first_intro, uses, where = {}, {}, {}, {}
    for i, l in enumerate(lines):
        text = l["text"]
        toks = word_tokenize(text)
        tags = pos_tag(toks)
        prev_stems = {stem(w) for w in WORD.findall(lines[i - 1]["text"])} if i else set()
        seen_here = set()
        nouns_so_far = set()

        for m in BOLD.finditer(text):
            for w in WORD.findall(m.group(1)):
                first_intro.setdefault(stem(w), i)

        for n, (tok, tag) in enumerate(tags):
            low = tok.lower()
            # --- introductions
            if tag in NOUN:
                k = stem(tok)
                nouns_so_far.add(k)
                prevtok = tags[n - 1][0].lower() if n else ""
                nxt = tags[n + 1][0].lower() if n + 1 < len(tags) else ""
                if prevtok in ("a", "an"):
                    first_intro.setdefault(k, i)                 # indefinite
                elif tag == "NNS" and prevtok not in ("the", "a", "an", "this", "that", "these"):
                    first_intro.setdefault(k, i)                 # bare-plural generic
                if nxt in ("is", "are", "means", "describes"):
                    first_intro.setdefault(k, i)                 # definition
            # --- presupposing definites
            if low == "the":
                j = n + 1
                head = None
                while j < len(tags) and tags[j][1] in ("JJ", "JJR", "JJS", "CD", "NN", "NNS",
                                                       "NNP", "NNPS", "VBG"):
                    if tags[j][1] in NOUN:
                        head = tags[j][0]
                    j += 1
                    if j - n > 4:
                        break
                if not head:
                    continue
                k = stem(head)
                uses[k] = uses.get(k, 0) + 1
                if head.lower() in SITUATION or k in seen_here or k in prev_stems or k in nouns_so_far:
                    seen_here.add(k)
                    continue
                after = tags[j][0].lower() if j < len(tags) else ""
                after_tag = tags[j][1] if j < len(tags) else ""
                if after in ("who", "whom", "whose", "which", "that", "where", "when", "of",
                             "in", "on", "for", "with", "to", "'s") or after_tag == "PRP":
                    seen_here.add(k)
                    continue                                     # licensing postmodifier
                seen_here.add(k)
                if k not in first_presup:
                    first_presup[k] = i
                    idx = text.find(head)
                    s0 = max(text.rfind(". ", 0, max(idx, 0)), text.rfind("\n", 0, max(idx, 0)))
                    st = 0 if s0 < 0 else s0 + 1
                    ends = [e for e in (text.find(". ", max(idx, 0)),
                                        text.find("\n", max(idx, 0))) if e >= 0]
                    en = min(ends) + 1 if ends else len(text)
                    where[k] = (head, l, " ".join(text[st:en].split()))
    return first_presup, first_intro, uses, where


def main():
    verbose = "-v" in sys.argv
    pos_tag, word_tokenize = dn.tagger()
    if pos_tag is None:
        print("Tagger unavailable — no report.")
        print("EDITORIAL presupposed status=unavailable reason=nltk")
        return 1

    paths = dl.paths_from(sys.argv[1:])
    if paths:
        lines = dl.paragraphs(dl.prose(dl.surfaces(paths)))
    else:
        lines = dl.paragraphs([l for l in fl.surfaces() if l["surface"] == "body"])

    declared = {stem(w) for w in profile.established([])}
    presup, intro, uses, where = scan(lines, pos_tag, word_tokenize)

    RARE = 3   # a term the book uses this few times has no chance to establish itself by use
    rows = []
    for k, at in presup.items():
        if k in declared or uses.get(k, 0) > RARE or len(k) < 3:
            continue
        j = intro.get(k)
        if j is None:
            rows.append((k, "NEVER", at))
        elif at < j:
            rows.append((k, "EARLY", at))
    rows.sort(key=lambda r: -uses.get(r[0], 0))

    print("presupposed — terms used with `the` before the book gives them to the reader.")
    print("NEVER = introduced nowhere.  EARLY = first presupposed before its introduction.")
    print("")
    print("%-18s %6s %7s  %s" % ("term", "uses", "tier", "first presupposed at"))
    print("-" * 74)
    for k, tier, _at in (rows if verbose else rows[:20]):
        h, l, _s = where[k]
        print("%-18s %6d %7s  %s:%d" % (h, uses.get(k, 0), tier, os.path.basename(l["rel"]), l["line"]))
    if not verbose and len(rows) > 20:
        print("… %d more, run with -v" % (len(rows) - 20))
    print("-" * 74)
    if rows:
        print("")
        for k, tier, _at in (rows if verbose else rows[:8]):
            h, l, s = where[k]
            print("  %-6s the %-14s %s:%d" % (tier, h, os.path.basename(l["rel"]), l["line"]))
            print("      > %s" % s[:150])

    sents = [where[k][2] for k, _t, _a in rows]
    kept = [s for s in sents if exc.is_accepted("presupposed", s)]
    target = profile.target("presupposed", 0)
    print("")
    print("EDITORIAL presupposed unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (len(sents) - len(kept), len(kept), len(sents), target, len(exc.stale("presupposed"))))
    return 1 if (len(sents) - len(kept)) > target else 0


if __name__ == "__main__":
    sys.exit(main())
