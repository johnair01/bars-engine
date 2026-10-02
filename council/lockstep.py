#!/usr/bin/env python3
"""Lockstep check for the council standard across sibling repos.

Usage: python3 council/lockstep.py [--fix] [--canonical <repo_root>] [<repo_root> ...]
Default repos: every sibling of this repo's parent directory that has council/faces.yaml.
Canonical: this repo unless --canonical is given. Reports drift in council/faces.yaml and
.claude/skills/six-faces/SKILL.md. --fix copies the canonical files over drifted ones.

The house voice was copied from mtgoa-manuscript and stayed true; the April ontology was copied and
dropped Open Up for three months. The difference was a check. This is the check.
"""
from __future__ import annotations

import hashlib
import shutil
import sys
from pathlib import Path

FILES = ["council/faces.yaml", ".claude/skills/six-faces/SKILL.md"]
ROOT = Path(__file__).resolve().parent.parent


def digest(p: Path) -> str | None:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:12] if p.exists() else None


def main(argv: list[str]) -> int:
    fix = "--fix" in argv
    args = [a for a in argv[1:] if a != "--fix"]
    canonical = ROOT
    if "--canonical" in args:
        i = args.index("--canonical")
        canonical = Path(args[i + 1]).resolve()
        del args[i : i + 2]
    repos = [Path(a).resolve() for a in args] or sorted(d for d in ROOT.parent.iterdir() if (d / "council" / "faces.yaml").exists())
    drift = 0
    for rel in FILES:
        ref = digest(canonical / rel)
        print(f"{rel}  canonical={canonical.name}:{ref}")
        for r in repos:
            if r == canonical:
                continue
            d = digest(r / rel)
            state = "same" if d == ref else ("missing" if d is None else "DRIFT")
            print(f"  {r.name:<24} {d or '-':<12} {state}")
            if state != "same":
                drift += 1
                if fix:
                    (r / rel).parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(canonical / rel, r / rel)
                    print(f"  {'':<24} copied from {canonical.name}")
    print(f"\n{drift} drifted file(s)" + (" fixed" if fix and drift else ""))
    return 1 if (drift and not fix) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
