#!/usr/bin/env python3
"""Check a daemon report's shape and links before a face reads it.

Usage: python3 council/daemons/check_report.py <report.md> [--research]
Pass six found that the smallest model sometimes drops the five moves or its links (council/passes/
6FACE_PASS6_2026-10-03.md). The face runs this on each report; a report that fails goes back to its daemon
once. --research also requires at least three links. Exit 0 passes, exit 1 fails with the reasons printed.
"""
import re
import sys

HEADINGS = ["The cast", "Wake Up", "Open Up", "Clean Up", "Grow Up", "Show Up", "For the Player", "Your questions",
            "Where you would overreach", "Sources"]
PLAYER = ["The cast", "What I want here", "What the superpower does with it", "What would make it fun", "Show Up",
          "My question", "Sources"]


def check(text, research):
    problems = []
    wanted = PLAYER if "What I want here" in text else HEADINGS
    found = [h for h in wanted if re.search(r"(^|\n)\s*(#+\s*|\*\*|- \*\*)?" + re.escape(h), text, re.I)]
    missing = [h for h in wanted if h not in found]
    if missing:
        problems.append("missing headings: " + ", ".join(missing))
    links = set(re.findall(r"https?://[^\s)\]>]+", text))
    sources = re.split(r"(?i)sources", text)[-1] if re.search(r"(?i)sources", text) else ""
    says_none = re.search(r"(?i)\bnone\b", sources[:80]) is not None
    if research and len(links) < 3:
        problems.append(f"research report cites {len(links)} links; at least 3 are required")
    elif not links and not says_none:
        problems.append("no links, and the Sources section does not say None")
    return problems


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    problems = check(open(argv[1], encoding="utf-8").read(), "--research" in argv)
    for p in problems:
        print(f"FAIL: {p}")
    if not problems:
        print("PASS")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
