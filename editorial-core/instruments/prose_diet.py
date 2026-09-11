# -*- coding: utf-8 -*-
"""
prose_diet.py — the three grammar moves, measured.

Named 2026-07-29 after they were caught by eye in the W7 rewrites: leaning on
"is", on "it" without a clear antecedent, and on articles fronting nominalized
verbs. All three are ways of sounding like a sentence without committing to one,
and all three are nearly invisible one line at a time.

Implements the diagnostics four editors converge on:

  Lanham, *Revising Prose* — the Paramedic Method. Box the be-verbs, circle the
  prepositions, then ask "who is kicking whom?" and put the doer in the subject.
  Be-verbs are where the action went missing.

  Williams, *Style: Lessons in Clarity and Grace* — subjects should name
  characters, verbs should name their actions. When the action hides in a noun,
  turn the noun back into a verb. Williams licenses nominalization in four
  cases, which is why this is a candidate finder and not a gate.

  Sword, *The Writer's Diet* — five categories, three of which are these:
  be-verbs, zombie nouns, and the waste words *it / this / that / there*. Her
  rule for the last: use "it" and "this" only when you can state exactly which
  noun each refers to.

  Vague-pronoun-reference doctrine — search the draft for it/this/which/that,
  draw an arrow to the antecedent, and rewrite anything with no arrow.

**Thresholds are this book's own baseline, not absolute standards.** The
manuscript is written; the job is to stop new prose drifting heavier than the
prose around it. A chapter at the book average scores 1.00.

    python3 instruments/prose_diet.py              # per chapter vs baseline
    python3 instruments/prose_diet.py -v           # quote the orphan "it" sites
    python3 instruments/prose_diet.py FILE         # score a draft file
"""
import re, io, os, sys, glob, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
MS = os.path.join(HERE, os.pardir, "manuscript")   # last-resort fallback glob only


def _load_mod(name):
    try:
        spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    except Exception:
        return None


_fl = _load_mod("find_line")
_profile = _load_mod("profile")
# HANDBOOK and SIGNATURE added 2026-07-31, when they turned out to be counted inside every
# chapter's expository score. Measured on ch7 the effect is small, passive 1.75 against 1.77
# stripped, so it was not the cause of anything; stripping them is correct regardless, because
# an admissions page and a treatise signature are not the chapter's prose and are governed by
# HEAD_VOICE_DIAL rather than by this baseline.
#
# A SCORED FRAME IS NOT STRIPPED (v32, 2026-09-11). A project can rule a frame back onto the scored
# surface via `scored_frames:` — MTGOA did that for HANDBOOK on 2026-09-10 ("Boxed records should
# be scored"), which put Quill's charter back where prose_diet and its register block can see it.
# The same manifest key find_line reads. A frame the manifest scores is dropped from the strip
# list; the rest are removed as before. This was a branch-only fix until v32 folded it in.
_ALL_FRAMES = ["MARGINALIA", "EPIGRAPH-BYLINE", "POSTCARD", "HANDBOOK", "SIGNATURE"]
_SCORED_FRAMES = set(_profile.scored_frames([]) if _profile else [])
_STRIP_FRAMES = [f for f in _ALL_FRAMES if f not in _SCORED_FRAMES]
BLOCK = re.compile(
    r"\n?\n<!-- (%s) -->\n" % "|".join(_STRIP_FRAMES)
    + r".*?\n<!-- /\1 -->\n", re.S) if _STRIP_FRAMES else re.compile(r"(?!x)x")

BE     = re.compile(r"\b(is|are|was|were|be|been|being)\b", re.I)
COPULA = re.compile(r"^\W*[\w'][\w' ]{0,30}\s(is|are|was|were)\s", re.I)
WASTE  = re.compile(r"\b(it|this|that|there)\b", re.I)
# Sword's zombie nouns arrive wearing an article — that is what makes them
# findable. "the maintenance of", "a recognition that".
# WIDENED 2026-07-31. The first version required the noun immediately after the article, so
# "the polite version" and "the composed version" both walked through on one adjective.
# Wendell caught both by eye, twice, which is the whole argument for widening it.
# EMPTY, added 2026-07-31. Wendell, on a draft that passed all six counters:
# "I'm starting to hate the word 'Thing' like I'm starting to hate the word room.
# It's a wack-a-mole of empty words."
#
# He is describing a hole, not a preference. Driving `waste` down removes pronouns,
# and what replaces them is an empty noun the other six counters cannot see. Measured
# on the draft that prompted this: 23.1 per thousand, against 0.0 in both of the
# sections it was written to sit beside and 14.0 book-wide, while every existing
# counter reported it clean.
EMPTY = re.compile(r"\b(thing|things|something|anything|nothing|version|versions"
                   r"|stuff|way|ways|part|parts|aspect|aspects|element|elements"
                   r"|area|areas|piece|pieces|room|rooms)\b", re.I)

ZOMBIE = re.compile(r"\b(?:the|a|an)\s+(?:\w+\s+){0,2}"
                    r"\w+(?:tion|ment|ance|ence|ness|ity|ism|sion)\b", re.I)

# PASSIVE and AGENT, added 2026-07-31. Wendell: "we don't seem to be able to pick up
# something that a high school English teacher could catch."
#
# He is right, and the gap was specific. `BE` counts be-verbs and `ZOMBIE` counts
# nominalisations, and neither one sees the two things a teacher circles first: a verb with
# no doer, and a doer that cannot act.
PASSIVE = re.compile(
    r"\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?"
    r"(?:\w+ed|known|seen|done|made|taken|given|held|told|said|written|built|kept|left|"
    r"put|set|shown|drawn|brought|found|heard|lost|sent|meant|felt)\b(?!\s+(?:to|that))",
    re.I)

# Abstractions given human verbs. A candidate finder rather than a counter, because some of
# these are correct English -- a question can resolve, a cost can land. The judgement is
# whether a reader can name who did it. Reported under -v only.
AGENT_NOUNS = (r"version|story|thing|part|move|read|point|conversation|situation|feeling|"
               r"moment|question|answer|tightening|naming|charge|energy|work|process|system")
AGENT = re.compile(r"\b[Tt]he\s+(?:\w+\s+){0,2}(?:%s)\s+"
                   r"(?:arrives?|assembles?|lands?|moves?|tells?|carries|carry|does|do|"
                   r"wants?|decides?|knows?|sees?|takes?|gives?|holds?|starts?|begins?)\b"
                   % AGENT_NOUNS)
# "It is/was" opening a sentence with no noun behind it: Lanham's expletive,
# Sword's waste word, and the classic missing antecedent, all at once.
EXPLETIVE = re.compile(r"(?:^|(?<=[.!?]\s))\s*(It|There)\s+(is|was|are|were)\b")

# INCHOATIVE, added 2026-08-02. Wendell, on a sentence of mine that had just passed
# `gate` clean and scored 0.46 on copula: "What does 'go careful' mean? In which way are
# we now using the go, went construction as a way to be passive in a way that seems
# active?"
#
# `go/goes/went/gone` + adjective is an inchoative copula: it means *become*, and
# `goes cold` unpacks to `is cold now`. It has the surface shape of an intransitive
# action verb — subject, verb of motion, no object — so the eye reads it as something
# happening. Nothing happens. A state gets reported, and with an inanimate subject
# nobody caused the state, which makes this the same defect as `the hum arrives` and
# `it shows up` wearing a costume that reads as active.
#
# **BE and COPULA are structurally blind to it.** Both patterns match only
# is|are|was|were|be|been|being. Measured on two files of otherwise identical sentences:
#
#     "The meeting goes cold. The table goes careful."     be 0.00   copula 0.00
#     "The meeting is cold.  The table is careful."        be 4.97   copula 3.44
#
# So driving `copula` down actively rewards moving copulas into `go`, which is the same
# dynamic that made EMPTY necessary when driving `waste` down pushed pronouns into empty
# nouns. Third time this shape of hole has been found; assume there is a fourth.
#
# A CANDIDATE FINDER, like AGENT. The construction is legal with a human subject —
# `you go cold` at ch2:358 is the Emotional Body freezing, and the involuntariness is
# the whole point of the sentence. It is a defect when the subject cannot act. The
# counter scores only the inanimate ones; `-v` prints both, with the subject it found,
# because the classifier is a heuristic and only a reader can rule the edge cases.
#
# The adjective list is drawn from the manuscript's own usage rather than from a
# dictionary. Add to it when a new one is caught by eye — that is how the last three
# counters in this file grew.
INCH_VERB = (r"go|goes|going|gone|went|fall|falls|falling|fell|fallen"
             r"|grow|grows|growing|grew|grown|turn|turns|turning|turned")
# LAUNDER, the first six. `quiet` is banned by gate.py, and the phrase this construction
# wants is "goes quiet". Wendell caught me substituting `careful` — a word that does not
# collocate with `go`, and therefore carries no fixed meaning — after which the gate
# passed clean. That is routing around a banned word instead of rebuilding the sentence,
# which is the thing the ban exists to force. The gate can see the word and cannot see
# that it was replaced with a hole, and I do not think that is mechanisable. This is the
# nearest honest approximation: flag the synonyms in the one construction that hides them.
INCH_LAUNDER = r"careful|hushed|muted|subdued|soft|still"
INCH_ADJ = (INCH_LAUNDER + r"|cold|cool|dark|numb|flat|silent|blank|sour|sideways"
            r"|wrong|bad|thin|slack|tight|brittle|distant|absent|missing|unused"
            r"|unfelt|unheard|unnamed|unspoken|unremarked|external|fine|tense"
            r"|rigid|hollow|stale|small|empty|deep|under")
INCHOATIVE = re.compile(r"\b(%s)\s+(%s)\b" % (INCH_VERB, INCH_ADJ), re.I)
LAUNDER_ADJ = re.compile(r"^(?:%s)$" % INCH_LAUNDER, re.I)

# Subjects that can legitimately become something. Real people, and the entities this
# book personifies on purpose: the village acts, the Faces act, they are characters.
# Metonyms are deliberately NOT here — "the whole table goes careful" is the sentence
# that started this, and whitelisting `table` would have let it through.
HUMAN_SUBJ = {
    "i", "you", "he", "she", "we", "they", "me", "him", "her", "them", "who",
    "somebody", "someone", "everybody", "everyone", "nobody", "anyone", "people",
    "person", "friend", "friends", "ally", "allies", "reader", "child", "kid",
    "partner", "colleague", "everybody's", "man", "woman", "body",
    # Added 2026-08-03 during the ch1 inchoative pass. `ch1:167` -- "an arcade whose
    # OWNER is exhausted and going under" -- scored DEFECT, and the counter's own rule
    # says a person becoming something is legal. The list held pronouns and relationship
    # words and no occupations, so every role noun in the book was a false positive
    # waiting to happen. These are the ones the manuscript actually uses.
    "owner", "coworker", "boss", "manager", "facilitator", "student", "teacher",
    "candidate", "neighbour", "neighbor", "parent", "mother", "father", "brother",
    "sister", "daughter", "son", "villager", "villagers",
    "village", "shaman", "challenger", "regent", "architect", "diplomat", "sage",
    "player", "headmaster", "caretaker", "annotator",
}
# Walked back over, because none of them is ever the subject head: relative pronouns,
# auxiliaries, modals, prepositions, conjunctions, and the adverbs that sit between a
# subject and its verb.
#
# `it` is deliberately NOT here. An `it` subject is abstract by definition, so letting
# it stand as the subject head is the correct verdict rather than a miss.
INCH_SKIP = {
    "that", "which", "and", "or", "then", "just", "never", "still", "also", "even",
    "suddenly", "finally", "already", "always", "often", "usually", "not", "only",
    "would", "will", "could", "can", "may", "might", "must", "should", "to", "about",
    "has", "have", "had", "is", "are", "was", "were", "am", "be", "been", "being",
    "get", "gets", "got", "keep", "keeps", "kept", "start", "starts", "started",
    "without", "while", "when", "if", "before", "after", "from", "of", "by", "so",
    "but", "as", "than", "how", "why", "does", "do", "did", "all", "both", "again",
}
# Adjectives and participles that can sit between the subject and a coordinated
# inchoative — "whose owner is exhausted and going under" — where stopping at the
# adjective would report the wrong subject and, worse, the wrong verdict.
INCH_SKIP_ADJ = {"exhausted", "tired", "spent", "sick", "ready", "able", "willing",
                 "afraid", "unable", "close", "next", "early", "late", "quick", "slow"}


def inchoative_subject(text, start):
    """The noun head governing an inchoative at `start`, lowercased, or ''.

    Heuristic by construction: walk left over relative pronouns and adverbs and take
    the last content word. `who` short-circuits, since a `who` clause has a person
    behind it by definition."""
    # "a conversation that's going fine" — strip the clitic first, so the relative
    # pronoun it is glued to gets walked over like any other.
    toks = [re.sub(r"'(s|re|ve|ll|d)$", "", t.lower())
            for t in re.findall(r"[A-Za-z']+", text[max(0, start - 70):start])]
    while toks and toks[-1] in (INCH_SKIP | INCH_SKIP_ADJ):
        toks.pop()
    return toks[-1] if toks else ""


def inchoative_sites(text):
    """[(match, subject, is_defect, is_launder)] for every inchoative in `text`."""
    out = []
    for m in INCHOATIVE.finditer(text):
        subj = inchoative_subject(text, m.start())
        out.append((m, subj, subj not in HUMAN_SUBJ,
                    bool(LAUNDER_ADJ.match(m.group(2)))))
    return out

# BASELINE IS EXTERNAL, DELIBERATELY.
#
# The first version of this file normalised against the manuscript's own
# average, which made the book incapable of failing its own test: every chapter
# scored ~1.00 and the tool reported nothing. SPEC_REPETITION_AND_CUTS had
# already settled the question the other way, against three outside books —
# MTGOA runs the copula at 62.8 per thousand against 28.8 in Igniting Joy, 2.2
# times the rate, and that spec names the short-declarative register as drift
# rather than voice. Normalising to it protected the defect. Its own warning
# applies: when a feature of the prose needs defending, check whose hand put it
# there before defending it.
#
# Target is Igniting Joy — Wendell's own book, so the bar is his voice working,
# not a stranger's. Elliott and Chou bracket it for sanity.
TARGET   = {"copula_1k": 28.8, "mean_sent": 18.8, "short_pct": 4.2, "hedge_1k": 2.8}
BRACKET  = {"copula_1k": (40.9, 41.1), "mean_sent": (23.7, 22.5),
            "short_pct": (12.4, 12.8), "hedge_1k": (12.2, 5.9)}
# Manuscript position as measured in SPEC_REPETITION_AND_CUTS, for reference.
MTGOA_WAS = {"copula_1k": 62.8, "mean_sent": 13.4, "short_pct": 27.5, "hedge_1k": 6.2}

# Retained for the pronoun check, which is a rate question rather than a
# comparative one. Book figures, not targets.
# zombie was 11.1 against the narrow regex. Widening the regex without re-measuring the
# baseline pushed all nine chapters above 1.00 on a counter nothing had changed in, which is
# a measurement bug rather than a finding. Re-measured 2026-07-31 at 15.0.
BASE = {"be": 50.3, "copula": 29.1, "waste": 56.3, "zombie": 15.0, "expletive": 2.4,
        # MEASURED across the nine chapters 2026-07-31, the day the counter was added.
        # The first value here was 5.6 and I had typed it rather than measured it, which is
        # the exact failure this file exists to catch. The book runs 3.1.
        "passive": 3.1,
        # measured across manuscript/ch*.md, 2026-07-31
        "empty": 14.0,
        # MEASURED across the nine chapters 2026-08-02, the day the counter was added,
        # inanimate subjects only. 31 defect sites in 101,821 words.
        #
        # It is a LOW-FREQUENCY counter — a tenth the rate of `passive`, the next
        # sparsest — so the ratio swings hard on anything short and the `-v` site list
        # is the real output. Two sites in a 300-word draft reads as 22x and means
        # nothing on its own.
        #
        # Per chapter, for the record: ch2 1.07, ch1 0.40, ch3 0.38, ch4 0.35, ch6 0.28,
        # ch8 0.29, ch5 0.10, ch7 0.08, ch9 0.08. **Ch2 runs 3.5x the book and 13x ch9**,
        # which is the chapter this counter was written out of.
        "inchoative": 0.30}

# REGISTERS — the criteria adjusting to the book, added 2026-07-31.
#
# Wendell: "the letter is ok because it is the register of a personal letter… I think ch5
# is also a reasonable exception. We should be updating our review criteria to adjust to
# these stylistic changes we are making as well."
#
# BASE was measured before the book grew genres. It is nine chapters of Wendell's own
# expository prose, and by that ruler a charter, a personal letter, a drill manual and a
# practitioner's casebook all read as defects. They are not defects. They are the
# `HEAD_VOICE_DIAL` doing exactly what it was written to do, and a ruler that punishes a
# voice the author ruled is a ruler measuring the wrong thing.
#
# So: a named register raises the ceiling on the specific counters its genre inflates, and
# on nothing else. Every entry carries the date, the ruling and the reason, which is
# `gate.py`'s EXEMPT convention. **An unnamed file gets BASE**, so this cannot spread by
# accident: a new file has to be added on purpose, with a reason, by a person.
#
# The registers are the PROJECT's, not the core's (v32, 2026-09-11). Until then MTGOA's
# headmasters-letter and ch5-charter registers lived here, so every other book matched them by
# filename — a book with its own `ch5.md` inherited MTGOA's charter ceilings. They are declared in
# the manifest now (`registers:`); a project that declares none gets BASE on every file.
REGISTERS = _profile.registers({}) if _profile else {}

# A limit worth knowing. A block register is a few hundred words inside a long chapter, so once it
# lands the chapter's own score swamps it and the exemption never fires. It fires on the draft
# file, which is where the check belongs anyway: before it lands.


def register_for(name):
    """The allowances that apply to a file, or {} for the book baseline."""
    for key, spec in REGISTERS.items():
        if key.lower() in name.lower():
            return spec
    return {}

# Two rulers, deliberately, because they answer different questions.
#
# COPULA_JUNE reproduces the regex SPEC_REPETITION_AND_CUTS used, so the book can
# be compared against its own June baseline of 62.8 and against Igniting Joy's
# 28.8 on the same terms. It counts a bare 's, which means it counts POSSESSIVES.
#
# That flaw was caught 2026-07-29 by a register agent working ch5, which noticed
# that "the Regent's" appears 34 times there and was contributing ~9% of the
# chapter's copula count. Measured book-wide: 758 's tokens, of which only 335
# are true contractions (it's, that's) and 423 are possessives. They inflate the
# ratio by 0.15x.
#
# COPULA_1K is the corrected measure and is what register() reports. Whether
# Igniting Joy's 28.8 carries the same inflation cannot be checked here — the
# corpus is gitignored — so the 28.8 target may itself be high. The direction and
# the per-chapter comparisons are unaffected either way, since every chapter is
# measured identically, and the approved 1.50x calibration came from Wendell
# READING ch8 Section 2, not from the number.
COPULA_JUNE = re.compile(r"\b(is|are|was|were|be|been|being)\b|'s\s|'re\s", re.I)
COPULA_1K = re.compile(
    r"\b(is|are|was|were|be|been|being)\b"
    r"|\b(?:it|that|there|this|he|she|what|who|here|one|everything|nothing)'s\s"
    r"|'re\s", re.I)
HEDGE = re.compile(r"\b(perhaps|somewhat|arguably|rather|fairly|quite|often|tends? to|"
                   r"generally|typically|might|maybe|sort of|kind of)\b", re.I)


def register(text):
    """The four metrics that are comparable to the external corpora."""
    S = sentences(text)
    lens = [len(s.split()) for s in S] or [0]
    w = max(len(text.split()), 1)
    return {
        "copula_1k": len(COPULA_1K.findall(text)) / w * 1000,
        "mean_sent": sum(lens) / len(lens),
        "short_pct": sum(1 for x in lens if x <= 6) / len(lens) * 100,
        "hedge_1k":  len(HEDGE.findall(text)) / w * 1000,
    }


def sentences(t):
    t = re.sub(r"```.*?```", " ", t, flags=re.S)
    t = re.sub(r"^[#>|\-*\s]*$", " ", t, flags=re.M)
    t = re.sub(r"\s+", " ", t)
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", t) if len(s.split()) > 3]


# The feature-counter contract version. Bump it whenever a regex or normalization in score()
# changes, so a band measured with an old scorer (stored in editorial.yaml's `scorer:`) can be
# caught by coherence.py as incomparable to a book scored now — the silent-drift trap the
# 2026-09-09 hostile review named. History: v1 was the original counters; the zombie-regex
# widening is folded into v1's BASE notes; v2 adds the external-band contract.
SCORE_VERSION = 2


def score(text):
    w = max(len(text.split()), 1)
    S = sentences(text)
    n = max(len(S), 1)
    return {
        "be":        len(BE.findall(text)) / w * 1000,
        "copula":    sum(1 for s in S if COPULA.search(s)) / n * 100,
        "waste":     len(WASTE.findall(text)) / w * 1000,
        "zombie":    len(ZOMBIE.findall(text)) / w * 1000,
        "expletive": sum(1 for s in S if EXPLETIVE.match(s)) / n * 100,
        "passive":   len(PASSIVE.findall(text)) / w * 1000,
        "empty":     len(EMPTY.findall(text)) / w * 1000,
        "inchoative": sum(1 for _m, _s, defect, _l in inchoative_sites(text)
                          if defect) / w * 1000,
    }


def split_blocks(text, spec):
    """Return (body, [(block_text, block_spec), ...]).

    An anchor matching zero times or more than once is a HARD ERROR rather than a silent
    pass. A register is an exemption, and an exemption that stops applying without saying
    so is how a defect gets licensed by accident."""
    out = []
    for b in spec.get("blocks", []):
        for key in ("start", "end"):
            if text.count(b[key]) != 1:
                raise SystemExit("register anchor %r matched %d times, expected 1"
                                 % (b[key][:56], text.count(b[key])))
        i = text.index(b["start"])
        j = text.index(b["end"]) + len(b["end"])
        out.append((text[i:j], b))
        text = text[:i] + text[j:]
    return text, out


def read(f):
    """The scored surface of a file: frame blocks stripped, excepted blocks lifted out."""
    t = BLOCK.sub("", io.open(f, encoding="utf-8").read())
    return split_blocks(t, register_for(os.path.basename(f)))


def _band_pos(v, band):
    """(status, edge) for a value against a [median, Q1, Q3] band. 'sparse' fires only when BOTH
    the band and the value are near zero — so a spike over a tiny band is reported, not hidden
    (the F9 fix: a median-0.4 feature with a book value of 5.0 must read ABOVE, not 'too sparse')."""
    med, q1, q3 = band
    if q3 < 1.0 and v < 1.0:
        return "sparse", med
    if v > q3:
        return "ABOVE", q3
    if v < q1:
        return "below", q1
    return "in-band", med


def _verdict(rpos, gpos):
    """Read the two positions together. Over the reader is the signal; the genre position says
    whether the register explains it — three distinct cases, not one (the F10 fix)."""
    if rpos in ("sparse", "n/a"):
        return "too sparse to read"
    if rpos in ("in-band", "below"):
        return "fine — at or under the reader"
    if gpos == "ABOVE":
        return "FLAB — over even the register's own range"
    if gpos == "in-band":
        return "register tax — normal for the form, heavy for the reader"
    if gpos == "below":
        return "register-light — the form runs heavier; still over your reader"
    return "heavy for the reader (no genre band to read against)"


def band_report(files, keys, ref):
    """Distance from the external reference bands, in place of the self-baseline ratio. Prints the
    book-wide read of each feature against the reader and genre bands, then the per-chapter list of
    features running heavier than the reader — the worklist a later pass edits down."""
    reader = (ref.get("reader") or {}).get("band", {}) or {}
    genre  = (ref.get("genre")  or {}).get("band", {}) or {}
    whole = score("\n".join(read(f)[0] for f in files))

    print("distance from the reference bands — external, from editorial.yaml (not a self-baseline)")
    print("READER = what the ideal reader reads; GENRE = the clinical register the book passes as\n")
    print("%-11s %7s   %-14s %-14s  %s" % ("feature", "book", "vs reader", "vs genre", "read"))
    print("-" * 84)
    for k in keys:
        v = round(whole[k], 1)
        rp = _band_pos(v, reader[k]) if k in reader else ("n/a", 0)
        gp = _band_pos(v, genre[k]) if k in genre else ("n/a", 0)
        fmt = lambda p: p[0] if p[0] in ("sparse", "n/a") else "%s %.1f" % p
        print("%-11s %7.1f   %-14s %-14s  %s" % (k, v, fmt(rp), fmt(gp), _verdict(rp[0], gp[0])))

    if reader:
        print("\nper chapter — features heavier than the reader band (the edit worklist):")
        for f in files:
            fs = score(read(f)[0])
            over = [k for k in keys if k in reader
                    and _band_pos(round(fs[k], 1), reader[k])[0] == "ABOVE"]
            print("  %-16s %s" % (os.path.basename(f), ", ".join(over) or "— all within the reader band"))

    # Summary LAST, because review.py's board reads each step's final line as its headline. Without
    # it the board showed a truncated per-chapter row and said nothing.
    over_reader = [k for k in keys if k in reader
                   and _band_pos(round(whole[k], 1), reader[k])[0] == "ABOVE"]
    flab = [k for k in over_reader if k in genre
            and _band_pos(round(whole[k], 1), genre[k])[0] == "ABOVE"]
    print("")
    print("%d feature(s) over the reader band, %d of them over the genre band too%s"
          % (len(over_reader), len(flab), (" — " + ", ".join(flab)) if flab else ""))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    verbose = "-v" in sys.argv
    if args:
        files = args
    else:
        # The chapters, from the shared spine (find_line.corpus_paths) rather than a hardcoded
        # manuscript glob, so this scans the project's real prose in any project. prose_diet diets
        # the body prose, so it takes the "chapter" components; appendices and matter are not it.
        files = [p for kind, p in _fl.corpus_paths() if kind == "chapter"] if _fl else []
        if not files:
            files = sorted(glob.glob(os.path.join(MS, "ch*.md")),
                           key=lambda f: int(re.search(r"ch(\d+)", os.path.basename(f)).group(1)))

    keys = ["be", "copula", "waste", "zombie", "expletive", "passive", "empty",
            "inchoative"]
    ref = (_profile.reference() if _profile else {}) or {}
    if ref.get("reader") or ref.get("genre"):
        # A project that declares external bands is read against them, not against its own prose.
        band_report(files, keys, ref)
    else:
        # No bands declared (e.g. MTGOA): the historical self-baseline table, unchanged.
        print("ratio against the book's own baseline — 1.00 is average, >1.30 is heavy")
        print("a * marks a counter covered by a named register in REGISTERS\n")
        print(f"{'file':<12}" + "".join(f"{k:>11}" for k in keys))
        print("-" * (12 + 11 * len(keys)))
        worst = []
        for f in files:
            name = os.path.basename(f)
            body, blocks = read(f)
            reg = register_for(name)
            for label, text, spec in ([(name, body, reg)]
                                      + [("  block %d" % (n + 1), bt, bs)
                                         for n, (bt, bs) in enumerate(blocks)]):
                s = score(text)
                cells = []
                for k in keys:
                    # Compare at the precision that is printed. A ratchet ceiling is copied from
                    # this table by a human, so a true 1.8912 displayed as 1.89 must not report
                    # heavy against a ceiling of 1.89. Rounding first makes the number on the
                    # page and the number in REGISTERS the same number.
                    r = round(s[k] / BASE[k], 2)
                    cells.append(f"{r:>10.2f}" + ("*" if k in spec else " "))
                    if r > spec.get(k, 1.30):
                        worst.append((label.strip() or name, k, r, k in spec, spec))
                print(f"{label:<12}" + "".join(cells))

        if worst:
            print("\nheavy:")
            for f, k, r, covered, spec in sorted(worst, key=lambda x: -x[2]):
                ceiling = spec.get(k, 1.30)
                print(f"  {f} {k} {r:.2f} over {ceiling:.2f}"
                      + (" (register ceiling)" if covered else ""))

    if verbose:
        print("\n--- passive: a verb with no doer ---")
        for f in files:
            t, _ = read(f)
            for s in sentences(t):
                m = PASSIVE.search(s)
                if m:
                    print(f"  {os.path.basename(f)}: [{m.group(0)}] {s[:88]}")

        print("\n--- agency: an abstraction doing a human verb (judgement) ---")
        for f in files:
            t, _ = read(f)
            for s in sentences(t):
                m = AGENT.search(s)
                if m:
                    print(f"  {os.path.basename(f)}: [{m.group(0).strip()}] {s[:88]}")

        print("\n--- expletive / orphan openers: no noun behind the pronoun ---")
        for f in files:
            t, _ = read(f)
            for s in sentences(t):
                if EXPLETIVE.match(s):
                    print(f"  {os.path.basename(f)}: {s[:96]}")

        print("\n--- inchoative: 'become' wearing a verb of motion ---")
        print("    DEFECT = the subject cannot act. ok = a person or a personified "
              "Face becoming\n    something, which is legal. LAUNDER = a banned word's "
              "synonym hiding in the slot.")
        for f in files:
            t, _ = read(f)
            base = os.path.basename(f)
            # Line numbers are the point: this counter finds sites, not scores.
            raw = io.open(f, encoding="utf-8").read().splitlines()
            for m, subj, defect, launder in inchoative_sites(t):
                phrase = m.group(0)
                ln = next((i + 1 for i, l in enumerate(raw) if phrase in l), 0)
                tag = "DEFECT" if defect else "ok    "
                tag += " LAUNDER" if launder else ""
                ctx = t[max(0, m.start() - 46):m.end() + 24].replace("\n", " ")
                print(f"  {base}:{ln:<4} {tag:<15} [{subj} | {phrase}] …{ctx}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
