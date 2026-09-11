# -*- coding: utf-8 -*-
"""
Propositional idea density — why a book can score easy and read hard.

    python3 instruments/density.py                  # the board
    python3 instruments/density.py -v               # every site
    python3 instruments/density.py --write FILE     # the full report

## The finding this exists to correct

`instruments/readability.py` reported the book at Flesch-Kincaid 7.2 and concluded
it was three grades *easier* than Wendell's own control text. Wendell's reading
experience is the opposite: the book is hard, "because of how the sentences make
people's minds work."

Both are true, and the second one is the one that matters. Kintsch and Keenan
showed in 1973 that **the number of propositions in a sentence, rather than the
number of words, determines reading time.** Every formula in `readability.py`
counts words and syllables. None of them counts propositions. So a text can be
built out of short, plain, one-syllable sentences and still be expensive to read,
because each of those sentences carries a full proposition the reader has to
build, and they arrive one after another with no connective telling her how they
join.

That is a description of this manuscript's register.

## What is measured

**Propositional idea density (P-density)**, in the sense of Kintsch (1974) and
Turner and Greene (1977), approximated from part-of-speech tags the way Brown,
Snodgrass, Kemper, Herman and Covington's CPIDR does it: the count of verbs,
adjectives, adverbs, prepositions and conjunctions over total words. Ordinary
English prose sits near 0.5. Higher means more ideas per word, which means more
work per word.

**The interaction, which is the actual finding.** Density and brevity are not
independent problems. A twenty-word sentence at 0.5 gives the reader room to
assemble ten propositions. A six-word sentence at 0.6 hands her four propositions
with no subordination to say how they relate, and then does it again. This
computes density *within each sentence-length band*, because the band is where
the cost lands.

**Given-new.** A sentence whose opening carries no content word from the sentence
before it starts on new information, and the reader has nothing to attach it to.
Halliday's theme/rheme, Williams' topic position. Counted per paragraph.

## The control is Wendell's own

`specs/VOICE_ANCHOR.md` holds five passages he selected as the book at its best
(DL-14). They are the right comparison set: not another author, not a formula's
idea of easy, but this book's prose in the places its author says it works.

Sources: Kintsch & Keenan 1973; Turner & Greene 1977;
[Brown et al., automatic P-density from POS tagging](https://pmc.ncbi.nlm.nih.gov/articles/PMC2423207/)
"""
import io, os, re, sys, math, importlib.util
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)
LETTER = "front_matter/headmasters_letter.md"

# The five passages Wendell picked as the book at its best, DL-14 / VOICE_ANCHOR.md.
#
# RESOLVED BY CONTENT, 2026-08-03. These were five hardcoded line numbers, and on
# 2026-08-03 three of them silently went stale: inserting a paragraph into Section 1
# of ch4, ch5 and ch8 pushed each anchor down two lines, so the control was scoring
# paragraphs Wendell never picked. The agentless rate on the anchors read 63% against
# a real 46%, and nothing failed -- a line number cannot tell you it is pointing at
# the wrong thing.
#
# The fix is to anchor on a distinctive phrase from each passage and resolve the line
# at import. If a passage is ever edited past recognition this raises rather than
# drifting, which is the behaviour a control needs.
ANCHOR_TEXT = [
    ("manuscript/ch1.md", "It wasn't until I gave myself permission"),
    ("manuscript/ch1.md", "you perform the care, you feel like"),
    ("manuscript/ch4.md", 'At *using "I" statements.*'),
    ("manuscript/ch5.md", "I have a part of me I call Mr. Inadequate"),
    ("manuscript/ch8.md", "The view from above was the easy half"),
]


def _resolve_anchors():
    out = []
    for rel, needle in ANCHOR_TEXT:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue  # ANCHOR_TEXT is MTGOA's own voice passages; in another project the files
                      # are absent, so anchors resolve empty and density imports without them.
                      # fragment.py only needs density.tagger(), which does not use ANCHOR.
        lines = io.open(path, encoding="utf-8").read().split("\n")
        hits = [i + 1 for i, l in enumerate(lines) if needle in l]
        if len(hits) != 1:
            raise SystemExit(
                "VOICE_ANCHOR drift: %r matches %d lines in %s. The passage moved or "
                "changed; re-read specs/VOICE_ANCHOR.md and update ANCHOR_TEXT."
                % (needle, len(hits), rel))
        out.append((rel, hits[0]))
    return out


ANCHOR = _resolve_anchors()


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

# Sentence boundary. The abbreviation guard was added 2026-09-09: the bare
# `(?<=[.!?])\s+` split on every period, so `Practitioner: J. Kuiper, first case.`
# came apart into two fragments and `3rd ed. names the surgeon.` into one. Five
# instruments carry this constant; they must stay identical. Each lookbehind is
# fixed-width, which is what stdlib `re` allows.
_ABBR = (r"(?<!\b[A-Z]\.)(?<!\bed\.)(?<!\bDr\.)(?<!\bMr\.)(?<!\bMs\.)"
         r"(?<!\bMrs\.)(?<!\betc\.)(?<!\bvs\.)(?<!\bvol\.)(?<!\bno\.)"
         r"(?<!\bpp\.)(?<!\bcf\.)(?<!\bi\.e\.)(?<!\be\.g\.)(?<!\bSt\.)")
SENT = re.compile(r"(?<=[.!?])" + _ABBR + r"\s+")
WORD = re.compile(r"[A-Za-z][A-Za-z'’-]*")

# Brown et al.'s CPIDR rule: these tags are the propositions. Determiners, nouns
# and pronouns are the arguments the propositions take, and are not counted.
PROP_TAGS = ("VB", "VBD", "VBG", "VBN", "VBP", "VBZ",       # verbs
             "JJ", "JJR", "JJS",                            # adjectives
             "RB", "RBR", "RBS",                            # adverbs
             "IN", "CC")                                    # prepositions, conjunctions

STOP = set("""a an the and or but if then than that this these those of to in on at by for with
from as is are was were be been being it its you your i me my we our us they them their he she
his her not no do does did have has had will would can could should may might must so such
about into over under out up down off just only very more most some any what which who when
where why how all both each few other own same too also there here one two three""".split())


def tagger():
    try:
        import nltk
        from nltk import pos_tag, word_tokenize
        pos_tag(word_tokenize("test sentence here"))
        return pos_tag, word_tokenize
    except Exception as exc:
        sys.stderr.write(
            "NLTK tagger unavailable (%s).\n"
            "  pip install nltk\n"
            "  python3 -c \"import nltk; nltk.download('averaged_perceptron_tagger_eng');"
            " nltk.download('punkt_tab')\"\n"
            "This instrument needs real part-of-speech tags. A heuristic tagger would\n"
            "produce a number that looks like P-density and is not one.\n" % exc)
        return None, None


def p_density(text, pos_tag, word_tokenize):
    """Verbs + adjectives + adverbs + prepositions + conjunctions, over words."""
    toks = [t for t in word_tokenize(text) if WORD.match(t)]
    if not toks:
        return None
    tags = pos_tag(toks)
    props = sum(1 for _, tg in tags if tg in PROP_TAGS)
    return {"words": len(toks), "props": props, "density": props / float(len(toks))}


def sentences(text):
    return [s.strip() for s in SENT.split(text.strip()) if s.strip()]


def content(text):
    return {w.lower() for w in WORD.findall(text)
            if w.lower() not in STOP and len(w) > 3}


def given_new(text):
    """Sentences whose first six words share no content word with the one before."""
    ss = sentences(text)
    if len(ss) < 2:
        return 0, 0
    # A head with no content word in it cannot be judged either way — `You do not
    # have to` carries nothing to match on. Counting those as new information
    # inflated the rate; measured, it is only 1% of transitions, but the count is
    # excluded rather than assumed.
    breaks = judged = 0
    for a, b in zip(ss, ss[1:]):
        head = content(" ".join(WORD.findall(b)[:6]))
        if not head:
            continue
        judged += 1
        if not head & content(a):
            breaks += 1
    return breaks, judged


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    return 0.0 if not n else (xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2.0)


def paragraphs(lines):
    out = []
    for l in lines:
        t = l["text"].strip()
        if not t or t.startswith(("#", "|", ">", "- ", "* ", ":::")) or re.match(r"^\d+\.\s", t):
            continue
        if l["rel"] == LETTER or l["surface"] != "body":
            continue
        if len(WORD.findall(t)) < 25:
            continue
        out.append(l)
    return out


def report(lines, verbose):
    pos_tag, word_tokenize = tagger()
    if pos_tag is None:
        return ["Tagger unavailable — no report."]

    L = []
    add = L.append
    body = paragraphs(lines)

    scored = []
    for l in body:
        d = p_density(l["text"], pos_tag, word_tokenize)
        if d:
            scored.append((l, d))

    whole = p_density("\n".join(l["text"] for l in body), pos_tag, word_tokenize)

    # ------------------------------------------------------------------ headline
    add("## 1 · The number the formulas could not see")
    add("")
    add("| | value | reading |")
    add("|---|---|---|")
    add("| **P-density, whole body** | **%.3f** | propositions per word |" % whole["density"])
    add("| propositions | %d | across %d words |" % (whole["props"], whole["words"]))
    add("| Ordinary English prose | ~0.50 | Brown et al. |")
    add("")
    add("Kintsch and Keenan, 1973: **the number of propositions in a sentence, not")
    add("the number of words, determines reading time.** Flesch-Kincaid counts words")
    add("and syllables. It cannot see this number at all.")
    add("")

    # ------------------------------------------------------- the anchor control
    add("## 2 · Against Wendell's own control")
    add("")
    add("The five passages selected in `specs/VOICE_ANCHOR.md` as the book at its")
    add("best — not another author, not a formula's idea of easy.")
    add("")
    add("| Passage | words | P-density | vs book |")
    add("|---|---|---|---|")
    anchor_ds = []
    by_key = {(l["rel"], l["line"]): (l, d) for l, d in scored}
    for rel, ln in ANCHOR:
        hit = by_key.get((rel, ln))
        if not hit:
            near = [(abs(l["line"] - ln), l, d) for l, d in scored if l["rel"] == rel]
            if not near:
                continue
            _, l, d = min(near, key=lambda r: r[0])
        else:
            l, d = hit
        anchor_ds.append(d["density"])
        add("| `%s:%d` | %d | **%.3f** | %+.3f |"
            % (rel.split("/")[-1], l["line"], d["words"], d["density"],
               d["density"] - whole["density"]))
    if anchor_ds:
        am = sum(anchor_ds) / len(anchor_ds)
        add("| **anchor mean** | | **%.3f** | %+.3f |" % (am, am - whole["density"]))
    add("")

    # ------------------------------------------------------------ the interaction
    add("## 3 · The interaction — density inside each sentence-length band")
    add("")
    add("This is the finding. Density and brevity are not separate problems: a short")
    add("sentence at high density hands the reader several propositions with no")
    add("subordination to say how they relate, and then does it again.")
    add("")
    bands = [(1, 6, "≤6 — the short run"), (7, 14, "7–14"),
             (15, 25, "15–25 — the explaining band"), (26, 40, "26–40"),
             (41, 999, "41+")]
    buckets = defaultdict(lambda: {"w": 0, "p": 0, "n": 0})
    for l, _ in scored:
        for s in sentences(l["text"]):
            n = len(WORD.findall(s))
            d = p_density(s, pos_tag, word_tokenize)
            if not d:
                continue
            for lo, hi, name in bands:
                if lo <= n <= hi:
                    buckets[name]["w"] += d["words"]
                    buckets[name]["p"] += d["props"]
                    buckets[name]["n"] += 1
                    break
    add("| Band | sentences | share | P-density |")
    add("|---|---|---|---|")
    total_n = sum(b["n"] for b in buckets.values()) or 1
    for _, _, name in bands:
        b = buckets[name]
        if not b["n"]:
            continue
        add("| %s | %d | %.1f%% | **%.3f** |"
            % (name, b["n"], 100.0 * b["n"] / total_n,
               b["p"] / float(b["w"]) if b["w"] else 0))
    add("")

    # -------------------------------------------------------------- worst sites
    add("## 4 · The densest paragraphs")
    add("")
    med = median([d["density"] for _, d in scored])
    add("Median body paragraph: **%.3f**. The heaviest:" % med)
    add("")
    for l, d in sorted(scored, key=lambda r: -r[1]["density"])[:14 if not verbose else 200]:
        ss = sentences(l["text"])
        mean_len = d["words"] / float(len(ss)) if ss else 0
        add("- **%.3f** · %s:%d — %d words, %d sentences, mean %.0f"
            % (d["density"], l["rel"], l["line"], d["words"], len(ss), mean_len))
        add("  > %s…" % l["text"][:150].strip())
    add("")

    # ----------------------------------------------------------------- given-new
    add("## 5 · Given-new — sentences that start on new information")
    add("")
    add("A sentence whose first six words share no content word with the sentence")
    add("before it gives the reader nothing to attach it to. Some of that is normal")
    add("and necessary; a high rate means she is re-anchoring on every sentence.")
    add("")
    per_file = defaultdict(lambda: [0, 0])
    for l, _ in scored:
        b, t = given_new(l["text"])
        per_file[l["rel"]][0] += b
        per_file[l["rel"]][1] += t
    spine = [rel for _, _, rel, _ in fl.bb.SPINE if rel]
    add("| Component | transitions | starting on new | rate |")
    add("|---|---|---|---|")
    tot_b = tot_t = 0
    for rel in sorted(per_file, key=lambda r: spine.index(r) if r in spine else 999):
        b, t = per_file[rel]
        tot_b += b
        tot_t += t
        if t:
            add("| %s | %d | %d | **%.0f%%** |"
                % (os.path.basename(rel), t, b, 100.0 * b / t))
    add("| **whole body** | %d | %d | **%.0f%%** |"
        % (tot_t, tot_b, 100.0 * tot_b / tot_t if tot_t else 0))
    add("")
    ab = at = 0
    for rel, ln in ANCHOR:
        hit = by_key.get((rel, ln))
        if hit:
            b, t2 = given_new(hit[0]["text"])
            ab += b
            at += t2
    if at:
        add("**The control.** The five `VOICE_ANCHOR.md` passages run **%.0f%%** "
            "against the body's %.0f%%. Wendell's own best prose threads; the book "
            "states. That gap is the finding — not the grade level."
            % (100.0 * ab / at, 100.0 * tot_b / tot_t))
        add("")

    # ------------------------------------------------------------ per component
    add("## 6 · P-density by component")
    add("")
    per = defaultdict(lambda: {"w": 0, "p": 0})
    for l, d in scored:
        per[l["rel"]]["w"] += d["words"]
        per[l["rel"]]["p"] += d["props"]
    add("| Component | words | P-density |")
    add("|---|---|---|")
    for rel in sorted(per, key=lambda r: spine.index(r) if r in spine else 999):
        v = per[rel]
        add("| %s | %d | **%.3f** |" % (os.path.basename(rel), v["w"],
                                        v["p"] / float(v["w"])))
    add("")
    return L


def main():
    verbose = "-v" in sys.argv
    out = None
    if "--write" in sys.argv:
        i = sys.argv.index("--write")
        out = sys.argv[i + 1] if i + 1 < len(sys.argv) else os.path.join(
            ROOT, "editorial_reports", "DENSITY_BOARD.md")

    header = [
        "# Propositional idea density — the board",
        "",
        "Generated by `instruments/density.py`. Body prose only.",
        "",
        "**Why this exists.** `readability.py` reported the book three grades easier",
        "than its control and concluded it was too easy. The reading experience is the",
        "opposite. Kintsch and Keenan settled which one to believe in 1973: reading",
        "time is set by propositions, not words, and no readability formula counts",
        "propositions.",
        "",
    ]
    text = "\n".join(header + report(fl.surfaces(), verbose)) + "\n"
    if out:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        io.open(out, "w", encoding="utf-8").write(text)
        print("wrote %s" % os.path.relpath(out, ROOT))
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
