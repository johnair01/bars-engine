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
stacks, live placeholders, narrating the reader's history back to her as fact, and
**fragments**. Each one is a defect rather than an opinion. `--strict` exits 1 on any.

**The fragment check is the one addition to the ported gate, made 2026-09-01**, and it is
the only rule here that is a heuristic rather than a pattern. It exists because the
constraint it enforces used to have an exception — a fragment was legal if it carried a
*beat* — and the exception was revoked for being gameable: prose gets more rhythmic in
order to qualify for it. A rule with no exception can be checked, so this checks it.

Sentences with no finite verb, at most twelve words, outside headings, table cells and
list items. Imperatives are complete sentences and are allowed; so are sentences opening
with an unambiguous subject pronoun. A finite verb is found by a small verb lexicon plus
one morphological rule: a word ending in **-ed** is a verb, since a plural noun never is.
**-s is deliberately not used.** A word ending in -s is a plural noun as readily as a verb,
and the first cut of this check read every -s as a verb — which let `this`, plural nouns and
`exchanges` stand in for a predicate and hid real fragments (`Three exchanges at minimum.`).
That was the hole `instruments/fragment.py` retired this counter over; it is closed here as
of 2026-09-11. The price is the mirror image: a third-person verb the lexicon has not learned
reads as a fragment (`The fire arrives.`) until its form is added to `VERB_S`. That trade is
the right way round for a candidate finder — a missed fragment ships, a false one costs a
glance.

**What it still cannot do is separate a main clause from a subordinate one**: *Sixty cards,
every one a question you send a friend* is a fragment, and the `send` inside the relative
clause hides it. Catching that needs a parser, and this file is standard library only by
design. **The limit is stated rather than left to be found.**

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

# ------------------------------------------------- FRAGMENTS (constraint, not a counter)
#
# Added 2026-09-01, on Wendell's ruling. The constraint used to read "fragments carry
# beats, never claims, and only in landing position" and it was revoked for cause: an
# exception clause gets used as a licence. Given a rule that permits a fragment when it
# carries a beat, prose bends toward sounding rhythmic in order to qualify. The rule now
# has no exception, so it can be checked.
#
# There is no parser here on purpose — this file is stdlib-only and stays that way. The
# test is a heuristic: a short sentence with no finite verb in it. That catches the shape
# that actually recurs (a noun phrase punctuated as a sentence) and it will occasionally
# be wrong, which is why the report names the sentence and not just a span.
#
# What is deliberately NOT scanned: headings, table cells and list items. A bullet list of
# noun phrases is a list, not prose, and nobody has ever thought it needed a finite verb.
# Blockquotes ARE scanned, with the marker stripped, because that is where drafts live.

AUX = set("""am is are was were be been isnt arent wasnt werent
has have had hasnt havent hadnt do does did dont doesnt didnt
will would shall should can could may might must wont wouldnt cant couldnt
shouldnt mustnt cannot lets ive youve weve theyve ill youll well theyll
im youre were theyre hes shes its thats theres heres
id hed shed wed youd theyd itd whod""".split())

# High-frequency verbs whose finite forms carry no visible inflection.
IRREG = set("""go goes went come comes came make makes made take takes took
get gets got give gives gave say says said see sees saw know knows knew
think thinks thought find finds found tell tells told become becomes became
run runs ran read reads keep keeps kept let leave leaves left put puts
mean means meant hold holds held write writes wrote send sends sent
sit sits sat stand stands stood cost costs need needs want wants ask asks
hit shut split spread cast quit bet beat upset bid rid burst
work works fail fails call calls open opens close closes carry carries carried
name names named cut cuts fit fits fix fixes hurt set sets show shows shot
buy buys bought bring brings brought choose chooses chose lose loses lost
pay pays paid meet meets met hear hears heard feel feels felt
draw draws drew break breaks broke speak speaks spoke""".split())

# An imperative is a complete sentence with no visible subject, and this repo is full of
# them: "Follow the flinch." "Serve the relationship." "Then wait." Checked in FIRST
# POSITION ONLY, so a noun use elsewhere still counts as a fragment ("A hard call.").
BASE_VERBS = set("""ask answer avoid begin bring build buy call carry check choose close
accept act add allow answer apologise apologize apply argue assume audit avoid
belong break
bring calm cancel change
claim collect commit compare come count cut decide describe do draw drop end explain fail find finish fix follow
confirm consider count cover define delete draft drop end explain extend
enter fill finish focus get give go grow guess handle hear help hold imagine
keep kill know learn leave let list listen live look lose love make mark match meet
mention message move name notice note
feel learn locate offer open own pause pay perform pick picture place play point
post prefer prepare propose prove pull push put repeat
quote raise reach read realize record refuse remember remind remove repair repeat
replace return
reply return run save say see seek send serve set settle show sit skip solve sort
speak spend split stand start state stay stop suppose switch
plan prepare protect publish reach share simulate sort state store take talk tell
test think throw track treat try turn expect
use wait walk want watch weigh work write""".split())
# A sentence opening with a subject pronoun has a subject, and almost certainly a finite
# verb the inflection tests cannot see ("They also share a scene").
# Only unambiguous pronouns. "one", "this", "that" are determiners at least as often
# ("One sitting.", "This rule.") and listing them hides exactly the shape we are after.
SUBJ_PRONOUNS = set("i you we they he she it who".split())
# Quantifier subjects take an uninflected verb the same way a plural pronoun does
# ("Some happen in the external world", "Most people turn back"). Three words minimum,
# so "Some of them." and "Both true." stay flagged.
QUANT_SUBJ = set("some most many few several all both others each either neither none people".split())
ABBREV = re.compile(r"\b(Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|vs|etc|e\.g|i\.e|No|Fig|Vol|Ch|pp|p)\.\s",
                    re.I)

BASE_VERBS |= set("""declare deliver deny design discuss earn edit engage ensure establish
examine expect face flag force gather grant hand hide hope host include invite join judge
lead limit log manage map measure mind miss model order pass permit plot praise press
promise prove provide publish question rate react refer reflect register reject release
remain rename repeat report request require reserve resist resolve respect respond rest
restore retain reveal review revise reward risk roll rule satisfy scan score search secure
select sell separate shape share shift ship sign sketch slow source spare spot spread
stack stage stick strike study submit suggest supply support surface survive swap sweep
tag tap target teach tend thank tie time touch trace trade train transfer translate
trigger trim trust tune type undo unlock update upgrade urge value vary verify view visit
vote wake warn wave wear welcome win wipe wish withdraw wonder worry wrap yield""".split())

LEAD_ADVERBS = set("""then now so first next also always never please instead again
still just only rather even simply here there today tomorrow""".split())

# A word ending in -ed is a regular past tense or past participle, and a plural noun never
# ends in -ed, so -ed is a safe morphological signal that a word is a verb. -s is not, and
# this is where the counter broke: a word ending in -s is a plural noun (or `this`, or
# `across`) at least as often as it is a third-person verb, so the rule that read every
# -s over three letters as a verb cleared "Three exchanges at minimum.", "Not this one,
# not yet, not from me." and "Grief, four days old." — real fragments, each hidden by a
# plural noun (or `this`) the rule mistook for a predicate. `instruments/fragment.py`
# retired this counter on that hole (see its v32 note). The -s rule is gone here too as of
# 2026-09-11; -ed stays. Regular -s verbs the lexicon misses are recovered by name in
# VERB_S below, never by morphology — the same discipline, for the same reason.
# ("Four words each, no explanation." is the fourth of fragment.py's four examples; it is
#  still cleared here by the QUANT_SUBJ filter below, which fires on `each` — a separate
#  limit, not this one.)
INFLECTED = re.compile(r"ed$")

# Third-person -s verbs the hand lists miss, recovered one at a time now that morphology no
# longer guesses them. The rule for adding a form is the referee's (fragment.py EXTRA_VERBS):
# it goes in ONLY if it can never be a noun, so admitting it can never clear a real
# noun-phrase fragment. That is why `includes` and `undermines` are absent though both are
# verb-only: each cleared a real headed-noun-phrase fragment ("Harmony that includes truth.",
# "Self-deprecation that undermines authority.") — the shape this file cannot see anyway (see
# the docstring), so a name that hides one buys nothing. Common-noun homographs (`reports`,
# `gains`, `permits`, `supplies`, `converts`, `finishes`, `notices`, `catches`) stay out for
# the same rule. To extend it: read the sites an addition removes before you add it.
VERB_S = set("""arrives produces completes decides separates exists creates resolves belongs
requires describes protects inherits owns removes slows begins receives follows applies adapts
envisions detects outlives responds maintains contains accumulates polarizes transmutes
participates refuses continues tends helps metabolizes""".split())
WORDRX = re.compile(r"[A-Za-z][A-Za-z'’-]*")
SKIPLINE = re.compile(r"^\s*(?:#{1,6}\s|\||[-*+]\s|\d+[.)]\s|!\[|\[!)")
LINKRX = re.compile(r"\[([^\]]*)\]\([^)]*\)")
MARKS = re.compile(r"~~|[*_]{1,3}|^\s*>\s?", re.M)


def _has_finite_verb(words):
    for w in words:
        w = w.lower().replace("'", "").replace("’", "")
        if w in AUX or w in IRREG or w in VERB_S:
            return True
        if len(w) > 3 and INFLECTED.search(w):   # a regular -ed past or participle
            return True
    return False


def fragments(text, max_words=12):
    """Yield (offset, sentence) for sentences with no finite verb.

    Markdown is hard-wrapped, so a sentence routinely spans several source lines and the
    tail of a wrapped sentence looks exactly like a fragment. Lines are therefore joined
    into paragraphs first, carrying an index map so the reported offset still points at
    the real character. Offsets are into `text`, so the caller's line_of() still works.
    """
    def scan(buf, idx):
        # "Ms. G, christine and Tasshin" must not split at the title.
        buf = ABBREV.sub(lambda m: m.group(0).replace(".", "\u0001"), buf)
        off = 0
        for sent in re.split(r"(?<=[.!?])\s+", buf):
            sent = sent.replace("\u0001", ".")
            here, off = off, off + len(sent) + 1
            sent = sent.strip()
            if not sent or not sent.endswith((".", "!", "?")):
                continue
            words = WORDRX.findall(sent)
            if not words or len(words) > max_words:
                continue
            if not re.search(r"[a-z]", sent):          # ALL-CAPS labels
                continue
            if re.match(r"^[\W\d]*§[\w.§\u2013-]*[\W]*$", sent):   # "§4d.", "§5b."
                continue
            # A blanked code span at the head of a sentence leaves it starting mid-clause
            # (", following Publishing Base v0.1..."), which is an artifact, not a fragment.
            if not re.match(r"^[\"\u201c\u2018'(\[]?[A-Z0-9]", sent):
                continue
            if "  " in sent:      # a blanked code span left a gap; the sentence is not whole
                continue
            if sent.count("(") != sent.count(")"):     # a split parenthetical
                continue
            head = [w.lower() for w in words]
            # A subject pronoun with anything after it almost always brings a finite verb
            # the inflection tests cannot see: "From there you play the next move cleanly",
            # "The rest of the time they interrupt."
            if any(w in SUBJ_PRONOUNS for w in head[:-1]):
                continue
            if len(head) >= 3 and any(w in QUANT_SUBJ for w in head[:-2]):
                continue
            while head and head[0] in LEAD_ADVERBS:
                head.pop(0)
            if head and head[0] in BASE_VERBS:         # imperative
                continue
            if _has_finite_verb(words):
                continue
            yield idx[min(here, len(idx) - 1)], sent

    buf, idx, pos, skipping = "", [], 0, False
    for line in text.split("\n"):
        start, pos = pos, pos + len(line) + 1
        if not line.strip():
            for hit in scan(buf, idx):
                yield hit
            buf, idx, skipping = "", [], False
            continue
        # A citation line is a list of link titles, not prose. Two or more links and
        # little else outside them: skip it.
        if len(LINKRX.findall(line)) >= 2 and len(LINKRX.sub("", line).strip()) < 40:
            for hit in scan(buf, idx):
                yield hit
            buf, idx, skipping = "", [], True
            continue
        if SKIPLINE.match(line):
            for hit in scan(buf, idx):
                yield hit
            buf, idx, skipping = "", [], True
            continue
        # A wrapped list item continues on an indented line and is still list, not prose.
        # Without this, the tail of every wrapped bullet reads as a fragment.
        if skipping and line[:1].isspace():
            continue
        skipping = False
        clean = MARKS.sub("", LINKRX.sub(r"\1", line))
        # Rebuild the index map by locating each kept character in the source line.
        j = 0
        for ch in clean:
            k = line.find(ch, j)
            if k < 0:
                k = j
            idx.append(start + k)
            j = k + 1
        buf += clean
        buf += " "
        idx.append(start + len(line))
    for hit in scan(buf, idx):
        yield hit


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
        for off, sent in fragments(text):
            entry["hard"].append({"rule": "fragment", "line": line_of(text, off),
                                  "text": sent[:60],
                                  "why": "no finite verb — a fragment. There is no exception "
                                         "for cadence; write the sentence."})
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
