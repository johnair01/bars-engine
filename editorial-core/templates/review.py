# -*- coding: utf-8 -*-
"""
review.py — run the pass this project declares. Generic, manifest-driven edition.

    python3 instruments/review.py            # the book: every scanner in `pass:`, then coherence
    python3 instruments/review.py DRAFT.md   # draft mode: the same pass over given files
    python3 instruments/review.py -v         # each step's full output rather than its headline

## Why this exists

Before this, a ported project had eight scanners and no way to run them: a review was whatever the
operator remembered to type. Worse, four of `coherence.py`'s ten checks (`wiring`, `pass-wire`,
`orphan`, `register`) read `review.py` and reported `n/a` in its absence — so the manifest's `pass:`
list was decorative, and a project could declare a scanner that nothing ran with no check to say so.

This is the portable-orchestration half of the split, and it is the same move `build_book.py` makes
for the corpus: **MTGOA keeps its own hand-authored `review.py` with book-only steps** (voice, seam,
citations, round-trip); a project without one installs this, which builds the sequence from
`editorial.yaml` instead of by hand.

## COHERENCE: wiring-source = manifest

That marker line is a contract, and `coherence.wired_instruments()` looks for it.

A hand-authored `review.py` names its instruments as string literals, so coherence can read the
wiring by scanning the source. **This runner names none** — it reads `pass:` at runtime — so a
source scan would find an empty set and report every declared scanner as unwired. With the marker,
coherence takes the manifest as the wiring, which is the truth for this file.

One check changes character and one does not:

- **`pass-wire`** (is every declared scanner actually run?) becomes true by construction. That is a
  better outcome than a passing check: the disagreement it looks for cannot arise here.
- **`orphan`** (is every *targeted* instrument run?) stays live and can still fail — a manifest may
  target `fragment` while leaving it out of `pass:`, and then nothing runs the thing being enforced.

## What fails the board

Three declared classes, and the classification is **declared rather than inferred**:

- **`targets:`** — the scanner emits `EDITORIAL <name> unresolved=K …` and fails when K exceeds its
  target. Its findings have a remediation loop: resolve in the prose, or accept in
  `editorial_exceptions.yaml`.
- **`reporting:`** — a declared board (`prose_diet`, `slop_shapes`) that surfaces candidates for a
  reader and exits non-zero as a matter of course. Shown as `note`, never fails.
- **anything else** — a non-zero exit fails the board.

The strict default is deliberate. The first version of this runner *inferred* "reporting" from
"absent from `targets:`", and that inference silently demoted `gate` — a hard gate, exiting 1 on 15
real hits — to advisory. A class you have to declare is a class you cannot lose by accident.

A gate whose analyzer is missing (`fragment` without NLTK) reports `n/a` rather than failing, so an
optional dependency never blocks the pass.

**`coherence.py` runs last and its verdict is the board's**, the same position it holds in MTGOA's
own review.
"""
import os, re, sys, subprocess, importlib.util

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


prof = _load("profile")

EDITORIAL = re.compile(r"EDITORIAL\s+(\w+)\s+unresolved=(\d+)\s+accepted=(\d+)\s+total=(\d+)")
UNAVAILABLE = re.compile(r"EDITORIAL\s+(\w+)\s+status=unavailable")


def run(script, args):
    p = subprocess.run([sys.executable, os.path.join(HERE, script)] + list(args),
                       capture_output=True, text=True, cwd=ROOT, timeout=600)
    return p.returncode, (p.stdout + p.stderr)


def headline(out):
    """The last non-empty line, which is where every instrument in this pipeline puts its summary."""
    lines = [l.rstrip() for l in out.splitlines() if l.strip()]
    return lines[-1][:74] if lines else "(no output)"


def main():
    verbose = "-v" in sys.argv
    paths = [a for a in sys.argv[1:] if not a.startswith("-")]
    steps = prof.pass_list()
    targets = prof.targets()
    reporting = set(prof.reporting())

    if not steps:
        print("no `pass:` declared in editorial.yaml — nothing to run")
        return 2

    mode = "draft (%d file(s))" % len(paths) if paths else "the book"
    print("review — the pass declared in editorial.yaml, over %s" % mode)
    print("-" * 78)

    failed, results = 0, []
    for name in steps:
        script = name + ".py"
        if not os.path.exists(os.path.join(HERE, script)):
            print("  %-14s %-6s %s" % (name, "MISS", "instruments/%s is missing" % script))
            failed += 1
            continue
        code, out = run(script, paths)

        if UNAVAILABLE.search(out):
            print("  %-14s %-6s %s" % (name, "n/a", "gate OFF — its analyzer is not installed here"))
            results.append((name, out))
            continue

        hit = next((m for m in EDITORIAL.finditer(out) if m.group(1) == name), None)
        if hit and name in targets:
            unresolved, accepted, total = int(hit.group(2)), int(hit.group(3)), int(hit.group(4))
            target = targets[name]
            over = unresolved > target
            failed += 1 if over else 0
            print("  %-14s %-6s %d unresolved (target %d)%s"
                  % (name, "FAIL" if over else "ok", unresolved, target,
                     "  [%d accepted, %d total]" % (accepted, total) if accepted else ""))
        elif name in reporting:
            # A declared board: it surfaces candidates for a reader and exits non-zero as a matter
            # of course. Marked `note` rather than `ok`, so a step nobody judged cannot be misread
            # as a step that passed.
            print("  %-14s %-6s %s" % (name, "note", headline(out)))
        else:
            # Undeclared: a non-zero exit fails. The default is strict on purpose — the first
            # version of this runner INFERRED "reporting" from "absent from targets:", and that
            # inference silently demoted `gate`, a hard gate, to advisory while it was failing.
            failed += 1 if code else 0
            print("  %-14s %-6s %s" % (name, "FAIL" if code else "ok", headline(out)))
        results.append((name, out))

    print("-" * 78)
    code, out = run("coherence.py", [])
    print("  %-14s %-6s %s" % ("coherence", "FAIL" if code else "ok", headline(out)))
    failed += 1 if code else 0

    if verbose:
        for name, o in results:
            print("\n" + "=" * 78 + "\n### %s\n" % name + o.rstrip())
        print("\n" + "=" * 78 + "\n### coherence\n" + out.rstrip())

    print("")
    print("REVIEW %s" % ("PASS — every step within target" if not failed
                         else "FAIL — %d step(s) failing" % failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
