# -*- coding: utf-8 -*-
"""
build_bands.py — measure a reference band from comp texts, ready to paste into editorial.yaml.

## Why this exists

The distribution-shaped measures (prose_diet's be / copula / passive / zombie …) are read against
an EXTERNAL band, not the book's own average — see
`specs/EDITORIAL_BASELINE_EXTERNAL_REFERENCE_2026-09-04.md`. A band is the median-and-spread of a
few comparable texts. This turns "measure the comps and compute the band" into one command, so a
new project can set its own bands without reinventing the arithmetic.

## The band is median + interquartile range (Q1..Q3)

An earlier version used min/max for the edges. That was wrong twice over: min/max is set by the
single most extreme comp, and it can only WIDEN as comps are added — so "more comps tighten the
band" was false of it. The band now uses the interquartile range (Q1..Q3), the middle half of the
comps: robust to one outlier, and it converges (tightens) as the sample grows, which is the
property a reference wants. A verdict of "over the band" means over Q3.

## The workflow for a new project

1. **Pick the comps.** The one step nothing automates. A *genre* band is the register the book must
   pass as; a *reader* band is what the ideal reader reads, at its readable end. Native to the
   book's language (a translation measures the translator); enough of them (see below).
2. **Get the texts** as plain-text `CORPUS.txt`, from owned copies or public-domain / open-access
   sources. Only the numbers are stored, so the text stays on the machine. Every comp is run
   through `corpus_clean.clean()` here, so page-number tables, reference lists, DOIs and journal
   boilerplate do not get measured as prose.
3. **Measure**: `python3 instruments/build_bands.py reader <comp>... --sources DIR`. Each comp is a
   text file, a directory holding `CORPUS.txt`, or a slug resolved under `--sources`. It prints
   every comp's rates, the band, and a ready-to-paste YAML block stamped with the scorer version
   and the sources dir (so coherence.py can re-measure and catch drift).
4. **Paste** the block into `editorial.yaml`. prose_diet reads it next run; a project with no band
   keeps its built-in baseline, so the change is additive and reversible.

**Sample size.** Four-plus comps of a few thousand words each. Q1..Q3 is defined for two, but the
band is only as steady as the sample; the tool prints n and flags a thin one. More native, clean
comps is the single biggest thing that makes a band trustworthy.
"""
import os, sys, importlib.util, datetime, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, os.pardir))


def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, [name]
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


pd = _load("prose_diet")
cc = _load("corpus_clean")
KEYS = ["be", "copula", "waste", "zombie", "expletive", "passive", "empty", "inchoative"]


def resolve(arg, sources):
    if os.path.isfile(arg):
        return arg
    if os.path.isdir(arg) and os.path.isfile(os.path.join(arg, "CORPUS.txt")):
        return os.path.join(arg, "CORPUS.txt")
    cand = os.path.join(sources, arg, "CORPUS.txt")
    return cand if os.path.isfile(cand) else None


def band_of(values):
    """[median, Q1, Q3] for a feature across the comps. Q1..Q3 is the middle-half spread; with two
    comps it degenerates to the pair, which is why the caller warns on a thin sample."""
    med = round(st.median(values), 1)
    if len(values) >= 2:
        q1, _q2, q3 = st.quantiles(values, n=4, method="inclusive")
    else:
        q1 = q3 = values[0]
    return [med, round(q1, 1), round(q3, 1)]


def main():
    argv = sys.argv[1:]
    sources = os.path.join(ROOT, "sources")
    if "--sources" in argv:
        i = argv.index("--sources")
        sources = argv[i + 1]
        del argv[i:i + 2]
    if len(argv) < 2:
        print("usage: build_bands.py <band-name> <comp>... [--sources DIR]")
        return 2

    band_name, args = argv[0], argv[1:]
    comps = {}
    for a in args:
        p = resolve(a, sources)
        if not p:
            print("  ! no text for %r (tried a file, a dir/CORPUS.txt, and %s/%s/CORPUS.txt)"
                  % (a, sources, a))
            continue
        raw = open(p, encoding="utf-8", errors="ignore").read()
        comps[os.path.basename(a.rstrip("/")) or a] = pd.score(cc.clean(raw))

    n = len(comps)
    if n < 2:
        print("Need at least 2 comps to make a band (4+ is the goal). Found %d." % n)
        return 2
    if n < 4:
        print("NOTE: only %d comps — Q1..Q3 is barely defined and the band will move as you add "
              "more. Treat it as provisional.\n" % n)

    hdr = "%-11s" % "feature" + "".join("%12s" % nm[:11] for nm in comps) + "%9s%8s%8s" % (
        "median", "Q1", "Q3")
    print(hdr); print("-" * len(hdr))
    band = {}
    for k in KEYS:
        vals = [comps[nm][k] for nm in comps]
        band[k] = band_of(vals)
        print("%-11s" % k + "".join("%12.1f" % comps[nm][k] for nm in comps)
              + "%9.1f%8.1f%8.1f" % tuple(band[k]))

    print("\n# --- paste under `reference:` in editorial.yaml (merge if the key exists) ---")
    print("reference:")
    print("  %s:" % band_name)
    print("    comps: [%s]" % ", ".join(comps))
    print("    sources: %s" % sources)
    print("    scorer: %s        # prose_diet.SCORE_VERSION at measure time; coherence checks it" % pd.SCORE_VERSION)
    print("    measured: %s" % datetime.date.today().isoformat())
    print("    n: %d" % n)
    print("    band:                     # [median, Q1, Q3]")
    for k in KEYS:
        print("      %-11s [%5.1f, %5.1f, %5.1f]" % (k + ":", *band[k]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
