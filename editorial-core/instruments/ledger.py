# -*- coding: utf-8 -*-
"""
ledger.py — the ONLY supported way to write `editorial_exceptions.yaml`.

    python3 instruments/ledger.py accept polysyndeton --file sites.tsv --reason "..."
    python3 instruments/ledger.py accept gate --quote "..." --reason "..."
    python3 instruments/ledger.py remove polysyndeton --quote "..."
    python3 instruments/ledger.py check

`exceptions.py` READS the ledger. This file WRITES it, and nothing else should.

## The incident this exists to prevent — 2026-09-09

MTGOA's ledger was edited by a script doing `text.replace("trailing_and:", block, 1)`. The header
carries commented examples, one of which ends `#   trailing_and:` — **and that is the first
substring occurrence in the file.** The new block was spliced in after the `#   ` prefix, so its
key line became `#   polysyndeton:`, commented out, while its list entries stayed at top level with
no parent. Orphaned list items are not valid YAML.

`exceptions.py` then caught the parse failure with `except Exception: {}` and returned an empty
ledger. **Nine slop_shapes acceptances and fourteen polysyndeton acceptances went dead at once, and
`coherence` reported `ledger  ok  clean` the whole time** — because a stale-entry check has nothing
to call stale when it reads no entries at all.

Three separate failures had to line up, and each one on its own is ordinary:

    a substring match that hit a comment      ->  a structurally broken file
    an exception swallowed into a default     ->  broken read as empty
    a check that could not tell those apart   ->  a green board over a dead ledger

## What this module does differently, and why each part is load-bearing

**Parse, mutate, serialise.** The file is read with `yaml.safe_load` and written with
`yaml.safe_dump`. No regex, no `str.replace`, no line splicing. A comment cannot be mistaken for a
key by a parser.

**Validate before write.** The new document is round-tripped through `safe_load` in memory and
every declared instrument must still be a list. A document that will not parse never reaches disk.

**Write atomically.** Serialise to a temporary file in the same directory, then `os.replace`. An
interrupted write leaves the old ledger intact rather than half of a new one.

**Keep one backup.** The previous contents go to `editorial_exceptions.yaml.bak` on every write.

**The cost, stated honestly:** `safe_dump` does not preserve comments, so the header and the
per-head notes are re-emitted from `HEADER` below and from each entry's own `reason`. Comments that
live anywhere else are lost. That is why reasons belong in the `reason:` field of an entry rather
than in a floating comment above it — the field survives a rewrite and a comment does not.
"""
import io, os, sys, argparse, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)
LEDGER = os.path.join(ROOT, "editorial_exceptions.yaml")

# Every instrument that reads this ledger. A key missing from the file is written back as an
# empty list, so the file always shows the full set and a reader can see what is available.
KEYS = ["telling", "trailing_and", "polysyndeton", "light_verb", "fragment", "gate", "slop_shapes"]

HEADER = """\
# editorial_exceptions.yaml — accepted deviations, one sentence at a time.
#
# The target for every instrument below is ZERO. Every hit is a defect until a human decides one
# earns its place, and that decision is recorded here so the scanner stops counting it. The number
# coherence.py drives to zero is the UN-accepted hits.
#
# An entry is the offending SENTENCE (folded, so it survives the line moving) with a reason. When a
# kept sentence is later rewritten its entry stops matching, and coherence.py's `ledger` check
# flags it as stale so this file does not silently rot.
#
# WRITE THIS FILE WITH instruments/ledger.py, NOT BY HAND AND NOT WITH A SCRIPT THAT EDITS TEXT.
# On 2026-09-09 a `str.replace` on "trailing_and:" matched inside this very comment block, and the
# resulting file stopped parsing while the board still read `ledger ok clean`. See that module.
#
# Reasons belong in an entry's `reason:` field. A comment written above an entry is lost the next
# time this file is rewritten; the field is not.
"""


def _yaml():
    try:
        import yaml
        return yaml
    except ImportError:
        sys.stderr.write("PyYAML is required to write the ledger.\n")
        raise SystemExit(2)


def load():
    """The ledger as a dict. Raises rather than returning {} — a caller about to WRITE must
    never proceed from a silently emptied document, which is the whole incident above."""
    yaml = _yaml()
    if not os.path.exists(LEDGER):
        return {k: [] for k in KEYS}
    with io.open(LEDGER, encoding="utf-8") as fh:
        d = yaml.safe_load(fh)
    if d is None:
        d = {}
    if not isinstance(d, dict):
        raise ValueError("%s does not parse to a mapping" % os.path.basename(LEDGER))
    for k in KEYS:
        d.setdefault(k, [])
        if d[k] is None:
            d[k] = []
        if not isinstance(d[k], list):
            raise ValueError("`%s:` is a %s, and every key must be a list"
                             % (k, type(d[k]).__name__))
    return d


def save(doc, allow_mass_removal=False):
    """Validate, back up, write atomically. Returns the path written.

    REFUSES a write that drops more than half of any instrument's entries (and at least five)
    unless `allow_mass_removal=True`. Added 2026-09-10 (core v31): a prune script that read a
    freshly imported exceptions module — which had matched nothing — saw every entry as stale and
    removed all 107 of MTGOA's acceptances in one save. The one-step `.bak` restored the file, but
    a writer that refuses to CORRUPT the ledger should also refuse to EMPTY it by accident."""
    yaml = _yaml()
    if os.path.exists(LEDGER) and not allow_mass_removal:
        with io.open(LEDGER, encoding="utf-8") as fh:
            before = yaml.safe_load(fh) or {}
        for k in KEYS:
            n0, n1 = len(before.get(k) or []), len(doc.get(k) or [])
            if n0 - n1 >= 5 and n1 < n0 / 2.0:
                raise ValueError("refusing to write: `%s` would drop from %d entries to %d. If that "
                                 "is intended, call save(doc, allow_mass_removal=True)." % (k, n0, n1))
    body = yaml.safe_dump(doc, allow_unicode=True, sort_keys=False, width=100,
                          default_flow_style=False)
    text = HEADER + "\n" + body

    # Round-trip in memory. A document that will not parse never reaches disk.
    back = yaml.safe_load(text)
    if not isinstance(back, dict):
        raise ValueError("refusing to write: the serialised ledger does not parse to a mapping")
    for k in KEYS:
        if not isinstance(back.get(k, []), list):
            raise ValueError("refusing to write: `%s:` did not survive the round trip" % k)

    if os.path.exists(LEDGER):
        with io.open(LEDGER, encoding="utf-8") as fh:
            old = fh.read()
        with io.open(LEDGER + ".bak", "w", encoding="utf-8") as fh:
            fh.write(old)

    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(LEDGER) or ".", suffix=".yaml")
    try:
        with io.open(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, LEDGER)          # atomic on POSIX
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
    return LEDGER


def accept(name, quote, reason):
    """Add one acceptance. Returns True if added, False if that sentence is already accepted."""
    doc = load()
    for e in doc[name]:
        q = e if isinstance(e, str) else (e or {}).get("quote")
        if q == quote:
            return False
    doc[name].append({"quote": quote, "reason": reason})
    save(doc)
    return True


def remove(name, quote):
    doc = load()
    before = len(doc[name])
    doc[name] = [e for e in doc[name]
                 if (e if isinstance(e, str) else (e or {}).get("quote")) != quote]
    if len(doc[name]) == before:
        return False
    save(doc)
    return True


def _keys(name):
    """[(location, exact ledger key)] for every UNACCEPTED hit, straight from the instrument.

    Runs `<name>.py --keys`, which every targeted instrument answers with TSV. The point is that
    the key is never retyped: the string the ledger needs is computed by the same code that
    decides whether an entry matches. See exceptions.emit_keys for the gap this closes.
    """
    import subprocess
    r = subprocess.run([sys.executable, os.path.join(HERE, name + ".py"), "--keys"],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0 and not r.stdout.strip():
        sys.stderr.write(r.stderr)
        raise SystemExit("%s.py --keys failed" % name)
    out = []
    for line in r.stdout.splitlines():
        if "\t" in line:
            locn, key = line.split("\t", 1)
            out.append((locn, key))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("accept", help="accept one or more sites")
    a.add_argument("instrument", choices=KEYS)
    a.add_argument("--site", help="THE ONE TO USE. A substring of the location or the sentence; "
                                  "the instrument is run and its own exact keys are matched "
                                  "against it, so nothing is retyped. e.g. --site ch5.md:173")
    a.add_argument("--quote", help="an exact key, when you already have one. It must be the "
                                   "sentence the instrument keys on — check with `keys`.")
    a.add_argument("--file", help="TSV from `ledger.py keys <instrument>`")
    a.add_argument("--reason", required=True)

    k = sub.add_parser("keys", help="the exact ledger key for every unaccepted hit, as TSV")
    k.add_argument("instrument", choices=KEYS)
    k.add_argument("--grep", help="only sites whose location or key contains this")

    r = sub.add_parser("remove", help="drop one acceptance")
    r.add_argument("instrument", choices=KEYS)
    r.add_argument("--quote", required=True)

    sub.add_parser("check", help="parse the ledger and report what it holds")
    args = ap.parse_args()

    if args.cmd == "check":
        try:
            doc = load()
        except Exception as e:
            print("LEDGER BROKEN — %s" % e)
            return 1
        print("%s parses. %d instrument key(s):" % (os.path.basename(LEDGER), len(KEYS)))
        for k in KEYS:
            print("  %-14s %d accepted" % (k, len(doc[k])))
        return 0

    if args.cmd == "keys":
        rows = _keys(args.instrument)
        for locn, key in rows:
            if args.grep and args.grep not in locn and args.grep not in key:
                continue
            print("%s\t%s" % (locn, key))
        return 0

    if args.cmd == "remove":
        ok = remove(args.instrument, args.quote)
        print("removed" if ok else "no entry matched that quote")
        return 0 if ok else 1

    quotes = []
    if args.site:
        rows = [(l, k) for l, k in _keys(args.instrument)
                if args.site in l or args.site in k]
        if not rows:
            print("no unaccepted %s site matches %r — run `ledger.py keys %s` to see them"
                  % (args.instrument, args.site, args.instrument))
            return 1
        for l, k in rows:
            print("  %s" % l)
        quotes += [k for _l, k in rows]
    if args.quote:
        quotes.append(args.quote)
    if args.file:
        with io.open(args.file, encoding="utf-8") as fh:
            for line in fh:
                if not line.strip():
                    continue
                quotes.append(line.rstrip("\n").split("\t")[-1])
    if not quotes:
        ap.error("give --quote or --file")

    added = sum(1 for q in quotes if accept(args.instrument, q, args.reason))
    print("accepted %d of %d into `%s` (%d already present)"
          % (added, len(quotes), args.instrument, len(quotes) - added))
    return 0


if __name__ == "__main__":
    sys.exit(main())
