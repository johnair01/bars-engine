#!/usr/bin/env python3
"""List the open strands in a repo, the files each touches, and where two of them would collide.

Usage:
  python3 council/strands.py                         open strands in this repo and their overlaps
  python3 council/strands.py --touch a.js b.md       would a new strand touching these files collide?

Wendell, 2026-10-03: sense and respond means "doing work in parallel that's responding to an emergent need",
and "This will make the work more inclusive and the handoffs from colliding". A strand is any branch on origin
that main has not merged. Two strands that touch the same file are sequenced, never run at once.
"""
import subprocess
import sys


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def main(argv):
    touch = set(argv[argv.index("--touch") + 1:]) if "--touch" in argv else None
    git("fetch", "-q", "origin")
    base = "origin/main" if git("rev-parse", "--verify", "-q", "origin/main").strip() else "origin/master"
    open_branches = [b.strip() for b in git("branch", "-r", "--no-merged", base).splitlines()
                     if b.strip() and "->" not in b and b.strip() != base]
    strands = {}
    for b in open_branches:
        mb = git("merge-base", base, b).strip()
        files = set(f for f in git("diff", "--name-only", mb, b).splitlines() if f)
        if files:
            strands[b.replace("origin/", "")] = files
    if not strands:
        print("No open strands.")
    for name, files in sorted(strands.items()):
        print(f"{name}: {len(files)} files")
    clashes = 0
    names = sorted(strands)
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            both = strands[a] & strands[b]
            if both:
                clashes += 1
                print(f"COLLIDE {a} and {b}: " + ", ".join(sorted(both)))
    if touch is not None:
        for name, files in sorted(strands.items()):
            both = touch & files
            if both:
                clashes += 1
                print(f"COLLIDE new strand and {name}: " + ", ".join(sorted(both)))
    if not clashes:
        print("No collisions.")
    return 1 if clashes else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
