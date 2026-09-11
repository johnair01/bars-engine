# -*- coding: utf-8 -*-
"""
The standing voice gate from specs/MANUSCRIPT_FILE_CANON.md, as an instrument.

Scores each surface separately, because they are different registers by
different hands and a combined number hides which one regressed. Every counter
must read 0. Exits non-zero on any hit, so it can gate a commit.

Four surfaces, because four surfaces get printed:

  body        manuscript/ch1.md-ch9.md with the marginalia frame stripped
  marginalia  the frame blocks only
  appendices  the lettered appendices A-G
  matter      front matter and back matter

The last two were added 2026-07-29. Until then the gate read only manuscript/,
so ~10,000 words of shipping prose had never been held to the standing list.
Suppress them with --no-appendices when you are measuring a chapter edit in
isolation.

The `tokens` counter earns its keep on the matter surface: the front matter
carries ⟦ISBN-PRINT⟧, ⟦IMPRINT⟧, and the author-bio blanks, and the gate is what
stands between an unfilled placeholder and the typesetter.

    python3 instruments/gate.py                  # every printed surface
    python3 instruments/gate.py -v               # quote every hit with context
    python3 instruments/gate.py --no-appendices  # chapters only, the old behavior
"""
import re, io, os, sys, glob, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)


def _load_mod(name):
    try:
        spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    except Exception:
        return None


_profile = _load_mod("profile")
_fl = _load_mod("find_line")
_exc = _load_mod("exceptions")


def _sentence_at(text, pos):
    """The sentence holding offset `pos`.

    gate scores whole concatenated surfaces rather than sentences, so a hit arrives as an offset.
    The exceptions ledger keys on the sentence, so a hit has to be resolved back to one before it
    can be accepted. Boundaries are the nearest sentence end or line break on each side, which is
    the same coarse split the other scanners use."""
    left = max(text.rfind(". ", 0, pos), text.rfind("\n", 0, pos), text.rfind("! ", 0, pos),
               text.rfind("? ", 0, pos))
    start = 0 if left < 0 else left + 1
    ends = [e for e in (text.find(". ", pos), text.find("\n", pos)) if e >= 0]
    end = min(ends) + 1 if ends else len(text)
    return " ".join(text[start:end].split())

# The banned voice words are this project's profile, read from editorial.yaml when present and
# falling back to the historical hardcoded list otherwise (see profile.py). The fragments are
# wrapped in word boundaries here, exactly as the old inline pattern was.
# EMPTIED 2026-09-09. This list used to hold ["rooms?", "quiet(ly|er|est)?", "genuinely",
# "things?"] — which are *Mastering the Game of Allyship*'s voice decisions, sitting in the core
# as the default every project inherits. The selftest caught it the hour it was written: a
# throwaway project with no voice rules at all failed `gate` on the word "room".
#
# **A banned word is the most project-specific thing in the pipeline.** It belongs in
# `editorial.yaml`, and a project that declares none has none. Both current consumers declare
# their own lists, so emptying this changed neither of their counts.
_BANNED_DEFAULT = []
_banned = _profile.banned(_BANNED_DEFAULT) if _profile else _BANNED_DEFAULT
# `(?!)` never matches. Without it an empty list joins to the EMPTY pattern, which matches at
# every position — a project declaring `banned: []` scored 344 phantom hits on six lines of
# clean prose. Found by selftest.py the same hour _BANNED_DEFAULT was emptied.
BANNED_PATTERN = (r'|'.join(r'\b(?:%s)\b' % frag for frag in _banned)) if _banned else r'(?!)' 
# Only the last-resort fallback glob (when no spine/manifest is available) still needs this.
# What ships is now the spine's business, not a list maintained here — find_line.corpus_paths()
# returns the accurate shipping set, so a retired draft or a backup file cannot leak into the scan.
MS = os.path.join(ROOT, "manuscript")
BLOCK = re.compile(
    r"<!-- (MARGINALIA|EPIGRAPH-BYLINE|POSTCARD) -->\n(.*?)\n<!-- /\1 -->", re.S)

# (name, pattern, flags) — flags matter: andbut and stacks are case-sensitive,
# and treating them otherwise invents violations that are not there.
COUNTERS = [
    ("andbut", r'(^|[.?!]["“”\'’]? |\*|\*\*|— |; )(And|But) ', re.M),
    # "rooms" plural banned 2026-07-29 by Wendell. The earlier rule read
    # \broom\b, which let the plural through; ch5 carried three.
    # 2026-07-31: the comparative and superlative were invisible. `quiet(ly)?` matched
    # `quiet` and `quietly` and walked past `quieter`, which sat in ch1 and ch5. Wendell
    # on the ch5 site: "how can you claim to hear something when you don't have ears. You
    # do have eyes so harder to see makes sense." The word was wrong there as a metaphor
    # before it was wrong as a banned word.
    # `thing` promoted 2026-08-03. Wendell: "sweep the marginalia and promote thing to
    # the gate." Body went 405 -> 0 uncovered and the marginalia 27 -> 0; everything that
    # remains is in CANON below. His reasoning, 2026-08-03: "it's not in my writing style
    # to use the word 'thing' because of how unspecific it is", and, on the classification
    # that had cleared 320 sites as idiom: "until I see a number of examples of 'the thing'
    # that are grammatical we're actually preserving something bad and saying it's ok
    # because we've done it before."
    ("banned", BANNED_PATTERN, re.I),
    ("emdash", r'[a-zA-Z0-9,]—[a-zA-Z0-9]', 0),
    ("A0", r'you (were|was) (taught|told|raised|trained)|somewhere along the way'
           r'|the village taught you', re.I),
    ("stacks", r'\bNot [^.!?]{1,60}[.!?]\s+(Not|Never|No)\b', 0),
    # Unfilled HEAD_REGISTERS biography placeholders. Deliberately introduced by
    # W6 and must not survive to print — see R9. This counter is the only thing
    # standing between a token and the typesetter.
    ("tokens", r'⟦[^⟧]*⟧', 0),
    # Production tags — `**[DISSATISFACTION → SATISFACTION] …**`, `[TRANSLATE]`,
    # `[CONTROL]`. Added 2026-08-09 after Wendell read `[TRANSLATE]` on a printed
    # page: "this shouldn't be in the text. We spend a lot of time removing these
    # artifacts."
    #
    # **They were removed twice and came back twice, and neither loss was an
    # argument.** Ruled out 2026-06-03; the fix landed in the retired `chapters/`
    # tree while `manuscript/` became canon, and the acceptance grep only checked
    # the tree that had been fixed. Fixed again 2026-08-07 in `5ac778f`, which
    # took ch7 from 16 to 0 — and the merge that delivered it, `485d004`, had one
    # parent at 0 and one at 23 and kept the 23. The merge notes for that day
    # still say the tags were removed. They were; the merge put them back.
    #
    # A gate is the only form of this fix that survives a merge, because it fails
    # the build rather than trusting a checklist. It greps `manuscript/` and only
    # `manuscript/`, which is the lesson `SPEC_BRACKET_TAGS_2026-07-29.md` §2 drew
    # from the first loss.
    #
    # Scoped to a bracketed run of two or more capitals so ordinary bracketed
    # prose and single-letter references are untouched.
    ("prodtag", r'\[[A-Z][A-Z0-9 →/&—-]{1,40}\]', 0),
]


# Sentence- and name-level exemptions are the PROJECT's, declared in the manifest (v32,
# 2026-09-11). Each is `{counter, phrase, reason}`; a counter ignores any span where `phrase`
# occurs. Two conventions, both carried here as data:
#
#   EXEMPT approves one SENTENCE, keyed on the whole sentence so an approval cannot spread — right
#   for a one-off (MTGOA's Laloux `rooms` line).
#   CANON approves a NAME that recurs — a move title or a thesis — so keying on one sentence would
#   mean re-approving it in every chapter that cites it (MTGOA's `thing` theses).
#
# Until v32 MTGOA's own exemptions lived here as hardcoded lists, so every other book carried
# them. They move to `gate_exceptions:` in the manifest; a project that declares none runs the bare
# gate. See profile.gate_exceptions.
GATE_EXCEPTIONS = [
    (e["counter"], e["phrase"], e.get("reason", ""))
    for e in (_profile.gate_exceptions([]) if _profile else [])
]


def exempt_spans(text, counter):
    """Character spans in `text` that this counter must ignore."""
    spans = []
    for name, phrase, _reason in GATE_EXCEPTIONS:
        if name != counter:
            continue
        i = text.find(phrase)
        while i >= 0:
            spans.append((i, i + len(phrase)))
            i = text.find(phrase, i + 1)
    return spans


def split_surfaces(text):
    """Return (body, marginalia) for one chapter."""
    marg = "\n".join(m.group(2) for m in BLOCK.finditer(text))
    return BLOCK.sub("", text), marg


def score(text):
    out = []
    for n, p, f in COUNTERS:
        skip = exempt_spans(text, n)
        out.append((n, [m for m in re.finditer(p, text, f)
                        if not any(a <= m.start() < b for a, b in skip)]))
    return out


def draft_surfaces(paths):
    """Score named files instead of the board.

    Added 2026-08-05. Until today `main` globbed the manuscript and silently
    discarded any path handed to it, so `gate.py somedraft.md` printed a verdict
    on the shipped book. Four domain sections were drafted against that reading
    before one of them checked. Same failure as the six board-only instruments
    `draftprobe.py` was built to wrap: an instrument that answers a question you
    did not ask is worse than one that refuses, because the answer looks fine.
    """
    surfaces = {}
    for p in paths:
        b, m = split_surfaces(io.open(p, encoding="utf-8").read())
        surfaces[os.path.basename(p)] = b
        if m.strip():
            surfaces[os.path.basename(p) + " (marginalia)"] = m
    return surfaces


def main():
    verbose = "-v" in sys.argv
    paths = [a for a in sys.argv[1:]
             if not a.startswith("-") and os.path.isfile(a)]
    if paths:
        return report(draft_surfaces(paths), verbose)

    # The corpus is the shared spine (find_line.corpus_paths), not a hardcoded manuscript glob,
    # so gate scans exactly what the rest of the pipeline scans — the accurate shipping set, no
    # retired drafts or backups — and travels to a project whose prose is not under manuscript/.
    # Bucket by the spine's `kind`, which is portable; fall back to the old glob only if the spine
    # is unavailable (no build_book / manifest).
    corpus = _fl.corpus_paths() if _fl else []
    if not corpus:
        corpus = [("chapter", f) for f in sorted(glob.glob(os.path.join(MS, "ch*.md")))]
    no_apx = "--no-appendices" in sys.argv

    surfaces = {"body": "", "marginalia": ""}
    for kind, f in corpus:
        # Through find_line, so gate honours `prose_section` and the front-matter strip like
        # every other instrument.
        text = _fl.prose_text(f) if _fl else io.open(f, encoding="utf-8").read()
        if kind == "chapter":
            b, m = split_surfaces(text)
            surfaces["body"] += "\n" + b
            surfaces["marginalia"] += "\n" + m
        elif no_apx:
            continue
        elif kind == "appendix":
            surfaces["appendices"] = surfaces.get("appendices", "") + "\n" + text
        else:  # front, back, component — other shipped text, scanned for the same violations
            surfaces["matter"] = surfaces.get("matter", "") + "\n" + text

    return report(surfaces, verbose)


def report(surfaces, verbose):
    width = max([12] + [len(l) for l in surfaces])
    names = [n for n, _, _ in COUNTERS]
    print("%-*s %s" % (width, "surface", " ".join("%8s" % n for n in names)))
    print("-" * (width + 50))
    total = 0
    for label, text in surfaces.items():
        s = score(text)
        total += sum(len(ms) for _, ms in s)
        print("%-*s %s" % (width, label, " ".join("%8d" % len(ms) for _, ms in s)))
    print("-" * (width + 50))

    if verbose:
        for label, text in surfaces.items():
            for name, ms in score(text):
                for m in ms:
                    ctx = text[max(0, m.start() - 70):m.end() + 70].replace("\n", " ")
                    print("\n%s [%s] %r\n    …%s…" % (label, name, m.group(0).strip(), ctx.strip()))
        print()

    # Every hit, resolved to the sentence that holds it — the unit the exceptions ledger keys on,
    # so a banned word inside a quotation can be accepted once instead of argued with every run.
    hits = []
    for label, text in surfaces.items():
        for name, ms in score(text):
            for m in ms:
                hits.append(_sentence_at(text, m.start()))
    if "--keys" in sys.argv:
        # gate concatenates surfaces, so it has no line number to offer — the surface label is
        # the most it honestly knows. The key is what matters; the location is a convenience.
        return _exc.emit_keys("gate", [("body", s) for s in hits]) if _exc else 0
    kept = [s for s in hits if _exc and _exc.is_accepted("gate", s)]
    unresolved = len(hits) - len(kept)
    target = _profile.target("gate", 0) if _profile else 0

    print("GATE PASS — every counter reads 0" if total == 0
          else "GATE FAIL — %d hit(s). Re-run with -v to see them." % total)
    print("EDITORIAL gate unresolved=%d accepted=%d total=%d target=%d stale=%d"
          % (unresolved, len(kept), len(hits), target, len(_exc.stale("gate")) if _exc else 0))
    return 0 if unresolved <= target else 1


if __name__ == "__main__":
    sys.exit(main())
