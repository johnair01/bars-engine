#!/usr/bin/env python3
"""Add one constructed mismatch per real pair to labelled.json.

Usage: python3 council/jev/make_constructed.py [--file FILE]

For each real pair, the quote is swapped for a quote that was attached to a different source row of
the same report, and whose own claims do not include this claim. The row is marked kind "constructed",
label "no", by "construction". Constructed rows never count toward the pass test (spec, Labelled set 3).
Reports with fewer than two distinct quotes yield no constructed rows. The choice is deterministic:
the next distinct quote in source order, wrapping round. Re-running replaces earlier constructed rows.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "labelled.json")


def build_constructed(real_rows):
    """Return (constructed_rows, skipped_reports)."""
    by_report = {}
    for r in real_rows:
        by_report.setdefault(r["report"], []).append(r)
    out, skipped = [], []
    for report, rows in by_report.items():
        # distinct quote groups keyed by source number n, in source order
        groups = {}
        for r in rows:
            groups.setdefault(r["n"], []).append(r)
        ns = sorted(groups)
        if len(ns) < 2:
            skipped.append(report)
            continue
        for r in rows:
            own_claims = {x["claim"] for x in groups[r["n"]]}
            i = ns.index(r["n"])
            donor = None
            for step in range(1, len(ns)):
                cand = groups[ns[(i + step) % len(ns)]][0]
                if cand["quote"] != r["quote"] and cand["claim"] not in own_claims:
                    donor = cand
                    break
            if donor is None:
                continue
            out.append({
                "id": r["id"] + "~swap",
                "kind": "constructed",
                "report": report,
                "n": r["n"],
                "claim": r["claim"],
                "quote": donor["quote"],
                "quote_from_n": donor["n"],
                "source_url": r["source_url"],
                "label": "no",
                "by": "construction",
            })
    return out, skipped


def main(argv):
    path = argv[argv.index("--file") + 1] if "--file" in argv else FILE
    with open(path, encoding="utf-8") as f:
        rows = json.load(f)
    real = [r for r in rows if r.get("kind", "real") == "real"]
    constructed, skipped = build_constructed(real)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(real + constructed, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{len(real)} real rows kept; {len(constructed)} constructed rows written; "
          f"{len(skipped)} reports skipped (fewer than 2 quoted rows)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
