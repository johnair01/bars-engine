#!/usr/bin/env python3
"""Harvest emergent terms: phrases the record is already using as names that no glossary holds.

Usage: python3 council/harvest_terms.py [--min N] [--json out.json] [<repo_root> ...]
Default repos: every sibling of this repo that has council/faces.yaml.

A term emerges from usage before anyone rules on it. This script finds the usage. It does not coin.
It reads the deliberation record (passes, consults, decision logs, working rules, grammar and ruling
files) and counts short italic or bold phrases that recur. It drops any phrase already in a glossary,
and it marks each candidate with whose word it is: Wendell's, when the phrase appears inside a
quotation attributed to him; the record's otherwise. Every candidate carries its first and latest
sighting so the faces can read the usage in context.

Heuristic. A phrase in emphasis is not always a term. The council decides that; this finds the pile.
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {"node_modules", ".git", ".next", "dist", "build", "__pycache__", "ledger", "backfill"}
CORPUS_NAME = re.compile(r"^(6FACE.*|.*SIX_FACES?.*|DECISION_LOG|CLAUDE|GRAMMAR|ROADMAP|RULING.*|RESEARCH_.*|BELIEFS|THE_.*|REVIEW-.*)\.md$", re.I)
GLOSSARY_FILES = ["canon/GLOSSARY.md", "src/lib/allyship-deck/glossary.ts", "src/app/wiki/glossary/page.tsx", "council/faces.yaml", "council/terms.yaml"]
ITAL = re.compile(r"(?<![*\w])\*([A-Za-z][A-Za-z' -]{2,40}?)\*(?![*\w])")
BOLD = re.compile(r"\*\*([A-Za-z][A-Za-z' -]{2,40}?)\*\*")
QUOTED_TERM = re.compile(r"`([a-z][a-z -]{2,30})`")
STOP = {"not", "and", "but", "the", "this", "that", "every", "never", "only", "one", "two", "three", "four", "five",
        "six", "yes", "no", "why", "what", "how", "who", "when", "where", "approve", "approved", "locked", "proposed",
        "open", "closed", "ruled", "done", "now", "today", "later", "first", "second", "third", "half", "both", "neither",
        "it", "is", "are", "was", "he", "she", "they", "you", "we", "i", "a", "an", "of", "to", "in", "on", "for"}


def norm(p: str) -> str:
    return re.sub(r"\s+", " ", p.strip().strip(".,;:!?").lower())


def is_candidate(p: str) -> bool:
    w = p.split()
    if not 1 <= len(w) <= 4:
        return False
    if all(x in STOP for x in w):
        return False
    if len(w) == 1:
        return False  # one emphasised word is emphasis; a name has at least two
    if re.search(r"\b(npm|run|ts|md|json|yaml|css)\b", p):
        return False
    if w[0] in {"and", "but", "or", "so", "because", "if", "is", "was"}:
        return False
    return True


def known_terms(repos: list[Path]) -> set[str]:
    known: set[str] = set()
    for r in repos:
        for rel in GLOSSARY_FILES:
            p = r / rel
            if not p.exists():
                continue
            t = p.read_text(errors="replace")
            for m in re.finditer(r"^\|\s*\**~*([^|*~]{2,60}?)~*\**\s*\|", t, re.M):
                known.add(norm(m.group(1)))
            for m in re.finditer(r"term:\s*['\"]([^'\"]{2,60})['\"]", t):
                known.add(norm(m.group(1)))
            for m in re.finditer(r"^\s{0,4}([a-z][a-z_-]{2,40}):", t, re.M):
                known.add(norm(m.group(1).replace("_", " ").replace("-", " ")))
        reg = r / "council" / "terms.yaml"
        if reg.exists():
            try:
                import yaml  # type: ignore
                for e in (yaml.safe_load(reg.read_text()) or {}).get("terms", []):
                    known.add(norm(str(e.get("term", ""))))
            except ImportError:
                for m in re.finditer(r"term:\s*['\"]?([^'\"\n]{2,60})", reg.read_text()):
                    known.add(norm(m.group(1)))
    known.discard("")
    return known


def corpus(repo: Path):
    for p in sorted(repo.rglob("*.md")):
        if any(part in SKIP for part in p.parts):
            continue
        if CORPUS_NAME.search(p.name):
            yield p


def wendell_spans(text: str) -> list[tuple[int, int]]:
    """Character spans of quotations attributed to Wendell: a blockquote opened within three lines
    of his name, or an italic or quoted run that follows "Wendell" and a colon on the same line."""
    spans: list[tuple[int, int]] = []
    lines = text.splitlines(keepends=True)
    pos = 0
    for i, ln in enumerate(lines):
        if ln.lstrip().startswith(">"):
            ctx = "".join(lines[max(0, i - 3): i + 1])
            if "Wendell" in ctx or "his words" in ctx or "in his words" in ctx:
                spans.append((pos, pos + len(ln)))
        for m in re.finditer(r"Wendell[^.\n]{0,40}?:\s*(\*\*?\"?|\")(.+?)(\"?\*\*?|\")(?=\s|$|[.,;])", ln):
            spans.append((pos + m.start(2), pos + m.end(2)))
        pos += len(ln)
    return spans


def main(argv: list[str]) -> int:
    args = argv[1:]
    min_n, out_json = 3, None
    if "--min" in args:
        i = args.index("--min"); min_n = int(args[i + 1]); del args[i:i + 2]
    if "--json" in args:
        i = args.index("--json"); out_json = Path(args[i + 1]); del args[i:i + 2]
    repos = [Path(a).resolve() for a in args] or sorted(d for d in ROOT.parent.iterdir() if (d / "council" / "faces.yaml").exists())
    known = known_terms(repos)
    hits: dict[str, list[dict]] = defaultdict(list)
    surface: dict[str, str] = {}
    for repo in repos:
        for p in corpus(repo):
            text = p.read_text(errors="replace")
            ws = wendell_spans(text)
            dm = re.search(r"(20\d{2}-\d{2}-\d{2})", p.name)
            off = 0
            for i, ln in enumerate(text.splitlines(keepends=True)):
                lo = off
                off += len(ln)
                for rx in (ITAL, BOLD):
                    for m in rx.finditer(ln):
                        raw = m.group(1)
                        k = norm(raw)
                        if not is_candidate(k) or k in known:
                            continue
                        surface.setdefault(k, raw.strip())
                        d = re.search(r"(20\d{2}-\d{2}-\d{2})", ln)
                        hits[k].append({"repo": repo.name, "file": str(p.relative_to(repo)), "line": i + 1,
                                        "date": (d or dm).group(1) if (d or dm) else None,
                                        "wendell": any(a <= lo + m.start() < b for a, b in ws), "context": ln.strip()[:220]})
    rows = []
    for k, hs in hits.items():
        files = {(h["repo"], h["file"]) for h in hs}
        if len(hs) < min_n or len(files) < 2:
            continue  # a term is used in more than one place, or it is emphasis
        dates = sorted(h["date"] for h in hs if h["date"])
        rows.append({"term": surface[k], "key": k, "uses": len(hs), "files": len(files),
                     "repos": sorted({h["repo"] for h in hs}),
                     "wendell_uses": sum(h["wendell"] for h in hs),
                     "whose": "wendell" if any(h["wendell"] for h in hs) else "record",
                     "first": dates[0] if dates else None, "latest": dates[-1] if dates else None,
                     "sightings": hs[:6]})
    rows.sort(key=lambda r: (-r["wendell_uses"], -r["files"], -r["uses"]))
    print(f"{len(known)} known terms across {len(repos)} repo(s). {len(rows)} candidate(s) used in 2+ files, {min_n}+ times.\n")
    print(f"{'term':<32} {'uses':>4} {'files':>5} {'W':>3}  repos")
    for r in rows[:60]:
        print(f"{r['term'][:32]:<32} {r['uses']:>4} {r['files']:>5} {r['wendell_uses']:>3}  {','.join(x.split('-')[0] for x in r['repos'])}")
    if out_json:
        out_json.write_text(json.dumps(rows, indent=2) + "\n")
        print(f"\nwrote {out_json}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
