#!/usr/bin/env python3
"""Refresh council/daemons/daemons.yaml from a local clone of Wendell's friendcraft repo.

Usage: python3 council/daemons/refresh.py <path to friendcraft-manuacript>
Friendcraft is the canon for the daemons and is private, so the hook cannot fetch it. Wendell ruled on
2026-10-02 that the subagents carry a copy so they run on their own: "We can copy over from friendcraft.
They need to be able to run independently". Run this from any session that has friendcraft, and commit
the result here. The copy is trimmed to what the subagents read.
"""
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent.parent


def main(argv):
    fc = Path(argv[1])
    shared = fc / "decks" / "shared"
    sha = subprocess.run(["git", "-C", str(fc), "log", "-1", "--format=%h", "--", "decks/shared/parts.yaml",
                          "decks/shared/parts_by_face.yaml"], capture_output=True, text=True).stdout.strip()
    parts = yaml.safe_load((shared / "parts.yaml").read_text())
    cells = yaml.safe_load((shared / "parts_by_face.yaml").read_text())
    flat = lambda v: " ".join(str(v).split())
    out = {"source": f"Copied from wendell-britt/friendcraft-manuacript decks/shared/parts.yaml and parts_by_face.yaml at "
                     f"{sha or 'working tree'}, on Wendell's instruction of 2026-10-02: \"We can copy over from friendcraft. "
                     "They need to be able to run independently\". Trimmed to what the subagents read. Friendcraft stays the "
                     "canon; refresh this copy with council/daemons/refresh.py from a session that has friendcraft.",
           "canon_cells": "Cells marked canon true follow the book. The others were written by sessions.",
           "daemons": []}
    for p in parts:
        d = {"id": p["id"], "name": p["name"], "kind": p.get("kind")}
        for k in ("alias", "aim", "says", "in_you"):
            if p.get(k):
                d[k] = flat(p[k])
        d["at_each_face"] = {}
        for c in cells:
            if c["part"] == p["id"]:
                e = {"role": c["role"], "does": flat(c["does"])}
                if c.get("in_you"):
                    e["in_you"] = flat(c["in_you"])
                if c.get("canon"):
                    e["canon"] = True
                d["at_each_face"][c["face"]] = e
        out["daemons"].append(d)
    dest = ROOT / "council" / "daemons" / "daemons.yaml"
    dest.write_text(yaml.safe_dump(out, sort_keys=False, width=110, allow_unicode=True))
    print(f"wrote {dest} from friendcraft {sha}: {len(out['daemons'])} entries")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
