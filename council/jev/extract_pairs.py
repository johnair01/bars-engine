#!/usr/bin/env python3
"""Extract (claim, quote) pairs from the saved daemon reports into labelled.json.

Usage: python3 council/jev/extract_pairs.py [--reports DIR] [--out FILE]

Reads every *.json sidecar in council/daemons/reports/ and writes one row per (claim, quote) pair:
  {id, kind, report, n, claim, quote, source_url, label, by}
Every label starts as "unlabelled" and `by` is null. This script never sets any other label.
A source row with no quote, or with no claim, yields no pair; the count of such rows is printed.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPORTS = os.path.join(HERE, "..", "daemons", "reports")
OUT = os.path.join(HERE, "labelled.json")


def extract_from_meta(meta, stem):
    """Return (rows, skipped) for one parsed sidecar."""
    rows, skipped = [], 0
    for p in meta.get("pairs", []):
        claims = [c for c in (p.get("claims") or []) if c and c.strip()]
        quote = p.get("quote")
        if not quote or not quote.strip() or not claims:
            skipped += 1
            continue
        for k, claim in enumerate(claims, 1):
            rows.append({
                "id": f"{stem}#{p['n']}.{k}",
                "kind": "real",
                "report": meta.get("report", stem + ".md"),
                "n": p["n"],
                "claim": claim,
                "quote": quote.strip(),
                "source_url": p.get("url"),
                "label": "unlabelled",
                "by": None,
            })
    return rows, skipped


def extract_all(reports_dir):
    rows, skipped = [], 0
    for path in sorted(glob.glob(os.path.join(reports_dir, "*.json"))):
        with open(path, encoding="utf-8") as f:
            meta = json.load(f)
        r, s = extract_from_meta(meta, os.path.splitext(os.path.basename(path))[0])
        rows += r
        skipped += s
    return rows, skipped


def main(argv):
    def opt(name, default):
        return argv[argv.index(name) + 1] if name in argv else default
    rows, skipped = extract_all(opt("--reports", REPORTS))
    out = opt("--out", OUT)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {len(rows)} real pairs to {out}; skipped {skipped} source rows (no quote or no claim)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
