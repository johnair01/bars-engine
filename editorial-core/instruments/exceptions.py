# -*- coding: utf-8 -*-
"""
exceptions.py — the accepted-deviations ledger. The companion to profile.py.

The pipeline's target for telling, trailing_and and light_verb is ZERO. Every hit is a defect
until a human decides one earns its place — a trailing *and* that carries, a copula-label that
IS the beat. That decision is recorded here, in editorial_exceptions.yaml, so the scanner stops
counting it and the number that must reach zero is the UN-accepted hits.

    editorial_exceptions.yaml (one per project, at the project root):

        telling:
          - quote: "That is the whole case against the instrument."
            reason: "the label is the sentence's point, not a lazy tell"
        trailing_and:
          - "a shorter entry may be the bare quote, with the reason left for later"
        light_verb: []

An entry is a folded match on the offending sentence, not a line number, so it survives the
line moving. It does NOT survive the sentence being rewritten — and that is correct: a rewritten
sentence is a new sentence and gets judged again. coherence.py's `ledger` check reports entries
that match nothing any more, so the ledger does not silently rot.

The ledger is authoritative when present and invisible when absent: no file, no PyYAML, or a
missing key all mean "no exceptions", and the pipeline runs exactly as if every hit were unresolved.
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, os.pardir))
LEDGER = os.path.join(ROOT, "editorial_exceptions.yaml")

_cache = None

_EMPH = re.compile(r"[*_`]")
_FOLD = {"‘": "'", "’": "'", "“": '"', "”": '"', "—": "-", "–": "-", "−": "-", "…": "..."}


def key(sentence):
    """The match key for a sentence: lowercased, typographic marks and markdown emphasis
    removed, whitespace collapsed. A quote pasted from the printed book folds to the same key
    as the source line it came from, so the author can copy from either."""
    s = sentence or ""
    for a, b in _FOLD.items():
        s = s.replace(a, b)
    s = _EMPH.sub("", s)
    return re.sub(r"\s+", " ", s).strip().strip('"\'').lower()


# When this file will not parse, every acceptance in the book goes quiet at once and every count
# silently inflates. coherence.py's `ledger` check fails on it.
#
# Found 2026-09-09. A bad edit left duplicate keys and an orphaned list in MTGOA's ledger, and
# the board reported `ledger  ok  clean` while nine slop_shapes acceptances and fourteen
# polysyndeton acceptances were being read as absent. **`except Exception: {}` turned a corrupt
# file into an empty one, silently.**
_error = None


def error():
    """The ledger's parse failure, or None. coherence.py reads this."""
    _load()
    return _error


def _load():
    global _cache, _error
    if _cache is not None:
        return _cache
    if not os.path.exists(LEDGER):
        _cache = {}                       # no ledger is a legitimate state; a broken one is not
        return _cache
    try:
        import yaml
        with open(LEDGER, encoding="utf-8") as fh:
            _cache = yaml.safe_load(fh) or {}
        if not isinstance(_cache, dict):
            _error = "%s does not parse to a mapping" % os.path.basename(LEDGER)
            _cache = {}
    except ImportError:
        _error = "PyYAML is not installed — no acceptance in this ledger is being read"
        _cache = {}
    except Exception as e:
        _error = "%s will not parse: %s" % (os.path.basename(LEDGER),
                                            str(e).split("\n")[0][:160])
        _cache = {}
    return _cache


def emit_keys(name, pairs):
    """`--keys` mode: print `location<TAB>key` for every UNACCEPTED key, one per line.

    **The gap this closes.** Instruments key the ledger on the containing SENTENCE, computed after
    paragraph reflow, and their `-v` listings truncate at 130 characters. So the string a reader
    can see is not the string the ledger needs, and there was no way to obtain the real one short
    of reading each instrument's source. `ledger.py accept --quote` would then write an entry that
    matched nothing while reporting success, and the count would sit unchanged.

    Found by the third install (Flirtcraft, 2026-09-09) — a stranger following USING.md hit it on
    their first acceptance. The listing is for a human; this is for the ledger, and nothing has to
    be retyped from one into the other.

    Output is TSV so `ledger.py accept --file` consumes it directly.
    """
    import sys
    seen = set()
    for loc, key in pairs:
        if key in seen or is_accepted(name, key):
            continue
        seen.add(key)
        sys.stdout.write("%s\t%s\n" % (loc, " ".join(str(key).split())))
    return 0


def _quotes(name):
    """The raw quote strings declared for an instrument. An entry is either a bare string or a
    {quote, reason} mapping — both are accepted, so a quick keep needs no reason typed."""
    out = []
    for entry in (_load().get(name) or []):
        if isinstance(entry, str):
            out.append(entry)
        elif isinstance(entry, dict) and entry.get("quote"):
            out.append(entry["quote"])
    return out


def exists():
    return os.path.exists(LEDGER)


def accepted(name):
    """The set of folded keys accepted for this instrument."""
    return {key(q) for q in _quotes(name)}


_matched = {}


def is_accepted(name, sentence):
    k = key(sentence)
    if k in accepted(name):
        _matched.setdefault(name, set()).add(k)
        return True
    return False


def stale(name):
    """Ledger entries for `name` that matched NO hit in this run — call after every hit has been
    through is_accepted.

    Added 2026-09-10 (core v30). coherence used to compare the number of ENTRIES with the number
    of accepted HITS. One entry accepts an identical sentence wherever it recurs (MTGOA's quest
    format line sits in five chapters), so hits outnumbered entries and three dead entries hid
    under the surplus while the board read `ledger ok clean` — the same green-over-dead failure
    the 2026-09-09 ledger incident was. Counting unmatched entries directly cannot be masked."""
    hit = _matched.get(name, set())
    return [q for q in _quotes(name) if key(q) not in hit]


def count(name):
    """How many exceptions the ledger declares for this instrument — used to spot stale ones."""
    return len(_quotes(name))
