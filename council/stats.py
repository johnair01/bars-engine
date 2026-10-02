#!/usr/bin/env python3
"""Counts over council ledger records.

Usage: python3 council/stats.py [--remote | ledger_dir ...]\n--remote reads every repo in council/repos.yaml over GitHub instead of the folders on this disk.
Default: every ledger/ directory under .specify/specs/ plus council/ledger/ if present.
Reads JSON records in the shape of .specify/specs/six-faces-council-agents/ledger/*.json.
No model, no network. Prints counts by project, cause, position outcome, question outcome, and
lessons per face from council/faces.yaml.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def find_records(dirs: list[Path]) -> list[dict]:
    out = []
    for d in dirs:
        for p in sorted(d.glob("*.json")):
            try:
                out.append(json.loads(p.read_text()))
            except json.JSONDecodeError as e:
                print(f"skip {p}: {e}", file=sys.stderr)
    return out


def main(argv: list[str]) -> int:
    if "--remote" in argv:
        # every repo in council/repos.yaml, read over GitHub; public repos need no token
        import importlib.util
        spec = importlib.util.spec_from_file_location("cl", ROOT / "council" / "collect_lessons.py")
        cl = importlib.util.module_from_spec(spec); spec.loader.exec_module(cl)
        recs = []
        for repo in cl.registry():
            for d in ("council/ledger", "council/ledger/backfill", ".specify/specs/six-faces-council-agents/ledger"):
                try:
                    items = cl.get(f"https://api.github.com/repos/{repo}/contents/{d}")
                except Exception:
                    continue
                for it in items:
                    if it.get("type") == "file" and it["name"].endswith(".json"):
                        try:
                            import urllib.request
                            with urllib.request.urlopen(it["download_url"], timeout=15) as r:
                                recs.append(json.loads(r.read()))
                        except Exception:
                            pass
        return report(recs, "remote: " + ", ".join(cl.registry()))
    if argv[1:]:
        dirs = [Path(a) for a in argv[1:]]
    else:
        # this repo's ledgers, plus every sibling repo's council ledgers (records live per repo)
        dirs = sorted(ROOT.glob(".specify/specs/*/ledger"))
        for repo in sorted(ROOT.parent.iterdir()):
            base = repo / "council" / "ledger"
            if base.is_dir():
                dirs += [base] + sorted(d for d in base.rglob("*") if d.is_dir())
    dirs = [d for d in dirs if d.is_dir()]
    return report(find_records(dirs), f"{len(dirs)} ledger dir(s)")


def report(recs: list[dict], where: str) -> int:
    print(f"{len(recs)} record(s) from {where}\n")

    by_project, by_cause, by_convener = Counter(), Counter(), Counter()
    pos_outcomes, q_outcomes, doc_outcomes, by_source = Counter(), Counter(), Counter(), Counter()
    faces_seen = Counter()
    steers, overrules = 0, 0
    for r in recs:
        by_project[r.get("project", "?")] += 1
        by_cause[r.get("cause", "?")] += 1
        by_convener[r.get("convened_by", "?")] += 1
        by_source[r.get("invoked_from", "?")] += 1
        if r.get("outcome"):
            doc_outcomes[r["outcome"]] += 1
        for f in r.get("faces_present") or []:
            faces_seen[f] += 1
        for v in (r.get("positions") or {}).values():
            pos_outcomes[v] += 1
        overrules += len(r.get("overruled") or [])
        steers += len(r.get("steers") or {})
        for q in (r.get("questions") or {}).values():
            q_outcomes["answered" if q.get("choice") else "open"] += 1

    def table(title: str, c: Counter) -> None:
        print(title)
        for k, v in c.most_common():
            print(f"  {k:<28} {v}")
        print()

    table("by project", by_project)
    table("by cause", by_cause)
    table("convened by", by_convener)
    table("invoked from", by_source)
    table("document outcomes (ruled / unruled)", doc_outcomes)
    table("faces present in documents", faces_seen)
    table("position outcomes", pos_outcomes)
    table("question outcomes", q_outcomes)
    print(f"overrules {overrules}\nsteers {steers}\n")

    faces = ROOT / "council" / "faces.yaml"
    if faces.exists():
        try:
            import yaml  # type: ignore

            d = yaml.safe_load(faces.read_text())
            print("lessons per face")
            for name, f in d["faces"].items():
                print(f"  {name:<12} {len(f.get('lessons') or [])}")
            print(f"  {'council':<12} {len(d.get('council_lessons') or [])}")
        except ImportError:
            print("pyyaml not installed; lessons per face skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
