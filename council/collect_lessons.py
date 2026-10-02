#!/usr/bin/env python3
"""List lessons recorded in other repos that the home faces.yaml does not hold yet.

Usage: python3 council/collect_lessons.py [--local]

A session in a repo that is not the home records a new lesson under `lessons_pending` in that repo's
ledger record: {"face": "...", "wendell": "his exact words", "lesson": "...", "date": "...", "source": "..."}.
This script reads every repo in council/repos.yaml over GitHub (public repos need no token), or the
sibling folders with --local, and prints each pending lesson whose quotation is not already in
faces.yaml. Folding one in stays a reviewed edit in the home repo; the script never writes.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def registry() -> list[str]:
    import yaml  # type: ignore
    return yaml.safe_load((ROOT / "council/repos.yaml").read_text())["repos"]


def get(url: str):
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "council"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def remote_records(repo: str) -> list[dict]:
    out = []
    for d in ("council/ledger",):
        try:
            items = get(f"https://api.github.com/repos/{repo}/contents/{d}")
        except Exception:
            continue
        for it in items:
            if it.get("type") == "file" and it["name"].endswith(".json"):
                try:
                    with urllib.request.urlopen(it["download_url"], timeout=15) as r:
                        out.append(json.loads(r.read()))
                except Exception:
                    pass
    return out


def local_records(repo: str) -> list[dict]:
    path = ROOT.parent / repo.split("/")[-1] / "council/ledger"
    return [json.loads(p.read_text()) for p in sorted(path.glob("*.json"))] if path.is_dir() else []


def main(argv: list[str]) -> int:
    local = "--local" in argv
    faces = (ROOT / "council/faces.yaml").read_text()
    found = 0
    for repo in registry():
        recs = local_records(repo) if local else remote_records(repo)
        for rec in recs:
            for l in rec.get("lessons_pending") or []:
                words = (l.get("wendell") or "").strip()
                if words and words[:60] in faces:
                    continue
                found += 1
                print(f"{repo} {rec.get('id')}: {l.get('face')} | {words} | {l.get('lesson')}")
    print(f"{found} pending lesson(s) not yet in faces.yaml.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
