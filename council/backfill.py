#!/usr/bin/env python3
"""Backfill council ledger records from existing consult and pass documents.

Usage: python3 council/backfill.py <repo_root> [<repo_root> ...]
Writes <repo>/council/ledger/backfill/<id>.json for every document it recognises, and prints a
summary plus the list of records it could not date or could not find a ruling in.

Heuristic by design. It never guesses a ruling: a document with no ruling text is recorded as
unruled and listed. Causes are proposals from path and title; Wendell names the categories in
council/causes.yaml. Re-running overwrites backfill records only (hand-written records are elsewhere).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

FACES = ["shaman", "challenger", "regent", "architect", "diplomat", "sage"]
NAME_RE = re.compile(r"(6FACE|SIX_FACE|SIX_GAME_MASTER|GM_CONSULT|GM_ANALYSIS|GM_GAP|STRAND_CONSULT|STRAND_OUTPUT|SAGE_CONSULT|CONSULT|CONCLAVE|GAP_ANALYSIS_GM|six-game-masters|sage_consult|Game Masters Council|gm-analysis)", re.I)
SKIP_DIRS = {"node_modules", ".git", ".next", "dist", "build", "__pycache__", "ledger", "six-faces-council-agents"}  # the council's own passes have hand-written records
DATE_RE = re.compile(r"(20\d{2}-\d{2}-\d{2})")
RULING_RE = re.compile(r"(ratified|Wendell ruled|What Wendell ruled|Wendell:|overrul|\bruled\b|Decided 20\d{2})", re.I)
FACE_HEAD_RE = re.compile(r"^#{1,4}\s*.*?\b(shaman|challenger|regent|architect|diplomat|sage)\b", re.I | re.M)


def git_added_date(repo: Path, path: Path) -> str | None:
    try:
        out = subprocess.run(["git", "-C", str(repo), "log", "--diff-filter=A", "--format=%as", "--", str(path.relative_to(repo))],
                             capture_output=True, text=True, timeout=20).stdout.strip().splitlines()
        return out[-1] if out else None
    except Exception:
        return None


def propose_cause(repo_name: str, rel: str, title: str) -> str:
    s = (rel + " " + title).lower()
    if repo_name.startswith("friendcraft"):
        if "what is next" in s or "grade" in s or "worth opening" in s or "pass4" in s or "pass5" in s:
            return "project-steering"
        if "tag or selector" in s or "pass6" in s:
            return "card-schema"
        return "book-structure"
    if repo_name.startswith("flirtcraft"):
        return "product-intake-pricing"
    if any(k in s for k in ("incident", "build-reliability", "flow-interruption", "db-connection")):
        return "incident-reliability"
    if "mailing" in s:
        return "vendor-decision"
    if any(k in s for k in ("funnel", "launch", "understood", "sku", "milestone", "paywall", "pricing")):
        return "product-launch"
    if any(k in s for k in ("gap_analysis", "review", "reevaluation", "hostile")):
        return "spec-review"
    if "consult" in s or "conclave" in s or "analysis" in s:
        return "feature-design"
    return "spec-review"


def parse(repo: Path, path: Path) -> dict:
    text = path.read_text(errors="replace")
    head = "\n".join(text.splitlines()[:25])
    rel = str(path.relative_to(repo))
    m = re.search(r"^#\s+(.+)$", text, re.M)
    title = m.group(1).strip() if m else path.stem
    q = re.search(r"\*\*Question:?\*\*:?\s*(.+)", text) or re.search(r"\*\*Subjects?\.?\*\*:?\s*(.+)", text)
    question = q.group(1).strip() if q else title
    date = None
    dm = DATE_RE.search(path.name) or DATE_RE.search(head)
    if dm:
        date = dm.group(1)
    date_source = "filename-or-header" if date else None
    if not date:
        date = git_added_date(repo, path)
        date_source = "git-add" if date else None
    faces_present = sorted({f.lower() for f in FACE_HEAD_RE.findall(text)}, key=FACES.index)
    ruled = bool(RULING_RE.search(text))
    overruled = []
    for f in faces_present:
        sec = re.search(rf"^#{{1,4}}\s*.*?\b{f}\b.*?$(.*?)(?=^#{{1,4}}\s|\Z)", text, re.I | re.M | re.S)
        if sec and re.search(r"overrul", sec.group(1), re.I):
            overruled.append(f)
    cause = propose_cause(repo.name, rel, title)
    slug = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")[:60]
    rid = f"{date or 'undated'}-{repo.name}-{slug}"
    return {
        "id": rid,
        "date": date,
        "date_source": date_source,
        "project": repo.name,
        "cause": cause,
        "cause_source": "backfill-heuristic",
        "question": question[:300],
        "title": title[:200],
        "convened_by": "unknown",
        "invoked_from": "backfill",
        "source_doc": rel,
        "faces_present": faces_present,
        "face_count": len(faces_present),
        "positions": {},
        "overruled": overruled,
        "outcome": "ruled" if ruled else "unruled",
        "note": "Backfilled from the document by heuristic. Positions were not extracted; faces_present and outcome are the reliable fields.",
    }


def main(argv: list[str]) -> int:
    repos = [Path(a).resolve() for a in argv[1:]]
    if not repos:
        print(__doc__)
        return 2
    total, unruled, undated = 0, [], []
    for repo in repos:
        out_dir = repo / "council" / "ledger" / "backfill"
        out_dir.mkdir(parents=True, exist_ok=True)
        for old in out_dir.glob("*.json"):
            old.unlink()
        seen = set()
        for p in sorted(repo.rglob("*.md")):
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if not NAME_RE.search(p.name):
                continue
            txt = p.read_text(errors="replace")
            if sum(1 for f in FACES if re.search(rf"\b{f}\b", txt, re.I)) < 2:
                continue  # a document that names fewer than two faces is not a council document
            rec = parse(repo, p)
            if rec["id"] in seen:
                rec["id"] += "-2"
            seen.add(rec["id"])
            (out_dir / (rec["id"] + ".json")).write_text(json.dumps(rec, indent=2) + "\n")
            total += 1
            if rec["outcome"] == "unruled":
                unruled.append(rec["source_doc"])
            if not rec["date"]:
                undated.append(rec["source_doc"])
        print(f"{repo.name}: {len(seen)} record(s) -> {out_dir.relative_to(repo)}")
    print(f"\n{total} record(s) in all. {len(unruled)} unruled, {len(undated)} undated.")
    if undated:
        print("\nundated:")
        for d in undated:
            print("  " + d)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
