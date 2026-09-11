#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_core.py — bring a project's installed core up to this one.

    python3 editorial-core/sync_core.py ../my-book            # show what would change
    python3 editorial-core/sync_core.py ../my-book --apply    # do it

## What it touches, and what it will not

**Overwrites** every module in `instruments/` that the core owns — the closure, declared in
`CLOSURE.md` and derived from the import graph.

**Never touches** the project's own files: `editorial.yaml`, `editorial_exceptions.yaml`,
`instruments/build_book.py`, `instruments/review.py`. Those are installed once from templates and
belong to the project thereafter. A sync that overwrote a manifest would delete the reader, the
banned list and the reference bands, which is the whole universal/profile split undone.

It stamps `core_version:` in the manifest, and only that key.

## Release severity, ruled 2026-09-09 and implemented here

`releases.yaml` says whether each version changed what a measurement MEANS.

    validity     the same prose now produces a different number. A stale project's counts no
                 longer mean what its targets and ledger assume, so its board FAILS until sync.
    capability   something new exists; nothing already counted moved. The board REPORTS.

The dry run prints every intervening release with its severity, so an upgrade that will move
counts says so before it moves them. **The point is that a number changing under you is never a
surprise** — it is the one thing that would make the whole zero-target regime unreadable.

## After a validity sync

Counts move. Expect the board to shift, read the diff the run prints, and re-check the ledger:
a sentence that stops being reported leaves its acceptance stale, which `coherence`'s `ledger`
check will say out loud.
"""
import io, os, re, sys, shutil, argparse, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))

# Project-owned. Installed once, never synced. See the note above.
PROJECT_OWNED = {"build_book.py", "review.py"}


def core_version():
    with io.open(os.path.join(HERE, "VERSION"), encoding="utf-8") as fh:
        return int(fh.readline().strip())


def installed_version(proj):
    """The version the PROJECT's manifest records, and the version its code actually carries."""
    manifest, code = None, None
    p = os.path.join(proj, "editorial.yaml")
    if os.path.exists(p):
        m = re.search(r"^core_version:\s*(\d+)", io.open(p, encoding="utf-8").read(), re.M)
        manifest = int(m.group(1)) if m else None
    p = os.path.join(proj, "instruments", "core_meta.py")
    if os.path.exists(p):
        m = re.search(r"^CORE_VERSION\s*=\s*(\d+)", io.open(p, encoding="utf-8").read(), re.M)
        code = int(m.group(1)) if m else None
    return manifest, code


def releases():
    try:
        import yaml
        with io.open(os.path.join(HERE, "releases.yaml"), encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except Exception:
        return {}


def pending(frm, to):
    """[(version, severity, note)] for every release strictly after `frm`, up to `to`."""
    rel = releases()
    out = []
    for v in sorted(rel):
        if frm is not None and v <= frm:
            continue
        if v > to:
            continue
        r = rel[v] or {}
        out.append((v, r.get("severity", "capability"), (r.get("note") or "").strip()))
    return out


def main():
    ap = argparse.ArgumentParser(description="Sync a project's editorial core.")
    ap.add_argument("target", help="the project directory")
    ap.add_argument("--apply", action="store_true", help="write the changes (default: dry run)")
    a = ap.parse_args()

    proj = os.path.abspath(a.target)
    inst = os.path.join(proj, "instruments")
    if not os.path.isdir(inst):
        print("no instruments/ in %s — use init_project.py to install first" % proj)
        return 2

    to = core_version()
    man, code = installed_version(proj)
    print("core here      v%d" % to)
    print("project code   %s" % ("v%d" % code if code else "unknown"))
    print("project says   %s" % ("v%d" % man if man else "unknown"))

    if code == to and man == to:
        print("\nalready current — nothing to do")
        return 0

    if man is not None and code is not None and man != code:
        print("\n!! the manifest and the installed code disagree. The code is what runs, so the")
        print("   sync below moves BOTH to v%d." % to)

    frm = min(x for x in (man, code) if x is not None) if (man or code) else None
    steps = pending(frm, to)
    if steps:
        print("\npending release(s):")
        worst = "capability"
        for v, sev, note in steps:
            print("  v%-3d %-11s %s" % (v, sev, note.replace("\n", " ")[:88]))
            if sev == "validity":
                worst = "validity"
        print("\n  -> %s upgrade." % worst.upper(), end=" ")
        print("Counts WILL move; read the board after." if worst == "validity"
              else "Nothing already counted changes.")

    src = os.path.join(HERE, "instruments")
    changed, added = [], []
    for f in sorted(os.listdir(src)):
        if not (f.endswith(".py") or f == "requirements.txt"):
            continue
        if f in PROJECT_OWNED:
            continue
        dst = os.path.join(inst, f)
        if not os.path.exists(dst):
            added.append(f)
        elif io.open(os.path.join(src, f), "rb").read() != io.open(dst, "rb").read():
            changed.append(f)

    print("\n%d module(s) to update, %d new" % (len(changed), len(added)))
    for f in changed:
        print("   ~ %s" % f)
    for f in added:
        print("   + %s" % f)
    keep = sorted(f for f in os.listdir(inst) if f in PROJECT_OWNED)
    if keep:
        print("   . %s  (project-owned, untouched)" % ", ".join(keep))

    if not a.apply:
        print("\ndry run — re-run with --apply to write")
        return 0

    for f in changed + added:
        shutil.copy2(os.path.join(src, f), os.path.join(inst, f))
    p = os.path.join(proj, "editorial.yaml")
    if os.path.exists(p):
        t = io.open(p, encoding="utf-8").read()
        t2 = re.sub(r"^core_version:\s*\d+", "core_version: %d" % to, t, count=1, flags=re.M)
        if t2 != t:
            io.open(p, "w", encoding="utf-8").write(t2)
    print("\nsynced to v%d" % to)

    print("-" * 60)
    subprocess.run([sys.executable, os.path.join(inst, "coherence.py")], cwd=proj)
    return 0


if __name__ == "__main__":
    sys.exit(main())
