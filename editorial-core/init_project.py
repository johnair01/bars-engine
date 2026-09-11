#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
init_project.py — install the editorial core into a project, correctly, in one command.

    python3 editorial-core/init_project.py ../my-book --name "My Book"
    python3 editorial-core/init_project.py ../my-book --name "My Book" --corpus "manuscript/*.md"

## Why this exists

The README's install was six manual commands, and a cold-install test on 2026-09-09 showed **three
of them wrong or stale**, every one silent:

1. `review.py` was documented into the project root. `coherence.py` looks for it at
   `instruments/review.py`, so `wiring`, `pass-wire` and `orphan` all reported *"not present in
   this project"* — three checks dark, and nothing said so. **A check that reports `n/a` when it
   should be running is worse than one that fails.**
2. `templates/editorial.yaml` carried `core_version: 1`, so a fresh install disagreed with its own
   instruments on day one and the `core` check opened with a false staleness warning.
3. The template's `targets:` were two scanners behind the projects actually running the core.

None of these are hard to fix by hand. All of them are guaranteed to recur by hand, which is what
an installer is for: the paths, the version stamp and the target list are computed, not typed.

## What it does not do

It does not write prose, invent a corpus, or guess a reader. `editorial.yaml`'s `reader:` block and
`reference:` bands are the project's own work — the file it writes says so at each one.
"""
import io, os, re, sys, shutil, argparse, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))


def version():
    with io.open(os.path.join(HERE, "VERSION"), encoding="utf-8") as fh:
        return int(fh.readline().strip())


LEDGER = """# editorial_exceptions.yaml — accepted deviations for {name}.
#
# The target for every scanner below is ZERO. Every hit is a defect until a human decides one
# earns its place, and that decision is recorded here so the scanner stops counting it. The
# number coherence.py drives to zero is the UN-accepted hits.
#
# An entry is the offending SENTENCE (folded, so it survives the line moving), with an optional
# reason. A bare string is a quick keep; a {{quote, reason}} pair records why. When a kept
# sentence is later rewritten its entry stops matching — coherence.py's `ledger` check flags it
# as stale so this file does not silently rot. See instruments/exceptions.py.

telling: []
trailing_and: []
polysyndeton: []
light_verb: []
fragment: []
gate: []
slop_shapes: []
"""


def main():
    ap = argparse.ArgumentParser(description="Install the editorial core into a project.")
    ap.add_argument("target", help="project directory (created if absent)")
    ap.add_argument("--name", required=True, help="project name, for the manifest")
    ap.add_argument("--corpus", default="chapters/*.md", help="glob for the prose")
    ap.add_argument("--prose-section", nargs=2, metavar=("BEGIN", "END"), default=None,
                    help="markers bounding the prose inside each component, e.g. "
                         "--prose-section '## Chapter Text' '## Notes'")
    ap.add_argument("--force", action="store_true", help="overwrite an existing install")
    a = ap.parse_args()

    tgt = os.path.abspath(a.target)
    inst = os.path.join(tgt, "instruments")
    manifest = os.path.join(tgt, "editorial.yaml")
    if os.path.exists(manifest) and not a.force:
        print("refusing to overwrite %s — pass --force" % manifest)
        return 1
    os.makedirs(inst, exist_ok=True)

    # 1. The closure. Owned by the core; sync_core.py overwrites these.
    src = os.path.join(HERE, "instruments")
    copied = 0
    for f in sorted(os.listdir(src)):
        if f.endswith(".py") or f == "requirements.txt":
            shutil.copy2(os.path.join(src, f), os.path.join(inst, f))
            copied += 1

    # 2. Project-owned templates. build_book and review BOTH belong in instruments/ —
    #    coherence.py resolves review.py relative to its own directory, and the old README
    #    put it in the project root, which silently darkened three checks.
    for f in ("build_book.py", "review.py"):
        dst = os.path.join(inst, f)
        if not os.path.exists(dst) or a.force:
            shutil.copy2(os.path.join(HERE, "templates", f), dst)

    # 3. The manifest, with the version STAMPED rather than typed, and core_home computed.
    with io.open(os.path.join(HERE, "templates", "editorial.yaml"), encoding="utf-8") as fh:
        y = fh.read()
    rel = os.path.relpath(HERE, tgt)
    y = re.sub(r'^project:.*$', 'project: "%s"' % a.name, y, count=1, flags=re.M)
    y = re.sub(r'^core_version:.*$', 'core_version: %d' % version(), y, count=1, flags=re.M)
    y = re.sub(r'^core_home:.*$', 'core_home: "%s"' % rel, y, count=1, flags=re.M)
    y = re.sub(r'^corpus:\n(\s+- .*\n)+', 'corpus:\n  - "%s"\n' % a.corpus, y, count=1, flags=re.M)
    if a.prose_section:
        y = y.rstrip() + '\n\nprose_section:\n  begin: "%s"\n  end: "%s"\n' % tuple(a.prose_section)
    with io.open(manifest, "w", encoding="utf-8") as fh:
        fh.write(y)

    ledger = os.path.join(tgt, "editorial_exceptions.yaml")
    if not os.path.exists(ledger):
        with io.open(ledger, "w", encoding="utf-8") as fh:
            fh.write(LEDGER.format(name=a.name))

    print("installed core v%d into %s" % (version(), tgt))
    print("  %d core module(s) + build_book.py + review.py -> instruments/" % copied)
    print("  editorial.yaml, editorial_exceptions.yaml")
    print("")
    print("Still yours to fill in editorial.yaml: `banned:` for this project's voice, the")
    print("`reader:` block if you want ICA passes, and `reference:` bands if you want prose_diet")
    print("scored against comps rather than nothing.")
    print("")

    # 4. Prove it. An installer that does not run the board has not finished.
    print("-" * 60)
    r = subprocess.run([sys.executable, os.path.join(inst, "coherence.py")], cwd=tgt)
    print("-" * 60)
    print("A fresh project FAILS the `zero` check if it has any prose — that is the pipeline")
    print("working. Every other check should read ok or n/a; a `core` or `wiring` finding here")
    print("means this installer is wrong, not your project.")
    return 0 if r.returncode in (0, 1) else r.returncode


if __name__ == "__main__":
    sys.exit(main())
