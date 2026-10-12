#!/usr/bin/env python3
"""Save a daemon report and a JSON sidecar of its claim, quote and link pairs.

Usage:
  python3 council/daemons/save_report.py <report.md> --pass <id> --daemon <name> --face <name> \
      [--cast "49 -> 33"] [--model sonnet] [--tokens 101627] [--research]

The face runs this after check_report.py passes. It copies the report to council/daemons/reports/ as
<date>-<pass>-<daemon>.md and writes <same>.json beside it. The sidecar holds one row per numbered source:
the claim sentence(s) that cite it as [n], the link, the quote, and a `label` of "unlabelled" until a
person reads the pair and sets it to "supports", "contradicts" or "says_nothing". The labelled set for the
Jev quote-to-claim trial (.specify/specs/jev-quote-claim-check/) grows from these files.
A report that fails check_report.py is not saved. Exit 0 saved, 1 failed the check, 2 usage.
"""
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from check_report import check  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "reports")


def sources(text):
    """Numbered source lines: n -> (url, quote)."""
    block = re.split(r"(?im)^#+\s*sources\s*$", text)
    block = block[-1] if len(block) > 1 else text
    rows = {}
    for m in re.finditer(r"(?m)^\s*(\d+)\.\s+(.*)$", block):
        n, rest = int(m.group(1)), m.group(2)
        url = re.search(r"https?://[^\s)\]>]+", rest)
        quote = re.search(r"[\"“]([^\"”]+)[\"”]", rest)
        rows[n] = (url.group(0).rstrip(".,;") if url else None, quote.group(1).strip() if quote else None)
    return rows


def claims(text, n):
    body = re.split(r"(?im)^#+\s*sources\s*$", text)[0]
    out = []
    for line in body.splitlines():
        for sent in re.split(r"(?<=[.!?])\s+", line):
            if re.search(r"\[(?:[\d,\s]*\b%d\b[\d,\s]*)\]" % n, sent):
                out.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s*", "", sent).strip())
    return out


def main(argv):
    def opt(name, default=None):
        return argv[argv.index(name) + 1] if name in argv else default
    if len(argv) < 2 or argv[1].startswith("--") or not opt("--pass") or not opt("--daemon"):
        print(__doc__)
        return 2
    text = open(argv[1], encoding="utf-8").read()
    problems = check(text, "--research" in argv)
    if problems:
        for p in problems:
            print(f"FAIL: {p}")
        return 1
    date = datetime.date.today().isoformat()
    stem = f"{date}-{opt('--pass')}-{opt('--daemon')}"
    pairs = []
    for n, (url, quote) in sorted(sources(text).items()):
        pairs.append({"n": n, "claims": claims(text, n), "url": url, "quote": quote, "label": "unlabelled"})
    meta = {"date": date, "pass": opt("--pass"), "daemon": opt("--daemon"), "face": opt("--face"),
            "cast": opt("--cast"), "model": opt("--model"), "tokens": opt("--tokens"),
            "report": f"{stem}.md", "pairs": pairs}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, stem + ".md"), "w", encoding="utf-8") as f:
        f.write(text)
    with open(os.path.join(OUT, stem + ".json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"saved {stem}: {len(pairs)} source rows, {sum(1 for p in pairs if p['quote'])} with a quote, "
          f"{sum(1 for p in pairs if p['claims'])} with a claim")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
