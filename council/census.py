#!/usr/bin/env python3
"""Census of a repo's open strands, with a recommendation for each, for Wendell to rule on.

Usage: python3 council/census.py [--json] [--today YYYY-MM-DD]   (run inside the repo)

Wendell chose the census on the board (stale-strands, 2026-10-03). Transcend and include rules out deleting
anything, so the strongest recommendation is retire: keep the work as an archive tag and drop the branch.
Nothing here merges, tags or deletes; it only reads.

Every branch main has not merged gets a row; none is skipped. A shallow clone is deepened first. Each gets one of:
  unread    it shares no history with main, so nothing here can judge it; read it by hand
  landed    its work is in main: every file it changed matches main, or main holds its change squashed; retire
  active    a commit in the last 7 days; keep, and sequence any collision with it
  recent    unique work, last commit 8 to 30 days ago; review: merge or retire
  stale     unique work, last commit over 30 days ago; retire as an archive tag unless Wendell wants it
"""
import datetime as dt
import json
import subprocess
import sys


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def squashed_in(base, b, mb):
    """True when main holds the branch's change under another commit, as a squash merge or a cherry-pick.

    The file test above misses these when main has moved on since. git cherry compares changes by patch id: once
    commit by commit, then once with the whole branch folded into a single temporary commit, which is what a
    squash merge produces. A merge that needed conflict fixes changes the patch id and still reads as unique.
    """
    marks = [line[:1] for line in git("cherry", base, b).splitlines() if line]
    if marks and all(m == "-" for m in marks):
        return True
    folded = git("commit-tree", f"{b}^{{tree}}", "-p", mb, "-m", "census fold").strip()
    return bool(folded) and git("cherry", base, folded).startswith("-")


def main(argv):
    today = dt.date.fromisoformat(argv[argv.index("--today") + 1]) if "--today" in argv else dt.date.today()
    git("fetch", "-q", "origin")
    if git("rev-parse", "--is-shallow-repository").strip() == "true":
        # A shallow clone hides where older branches split from main. On 2026-10-03 that made the census skip
        # 36 of bars-engine's 140 branches without a word, three of them with open pull requests.
        git("fetch", "-q", "--unshallow", "origin")
    base = "origin/main" if git("rev-parse", "--verify", "-q", "origin/main").strip() else "origin/master"
    rows = []
    for b in [x.strip() for x in git("branch", "-r", "--no-merged", base).splitlines()]:
        if not b or "->" in b or b == base:
            continue
        mb = git("merge-base", base, b).strip()
        files = [f for f in git("diff", "--name-only", mb, b).splitlines() if f] if mb else []
        still_different = [f for f in files
                           if subprocess.run(["git", "diff", "--quiet", base, b, "--", f]).returncode != 0]
        if still_different and squashed_in(base, b, mb):
            still_different = []
        last = dt.date.fromisoformat(git("log", "-1", "--format=%cs", b).strip())
        age = (today - last).days
        ahead = int(git("rev-list", "--count", f"{base}..{b}").strip() or 0)
        if not mb:
            kind, rec = "unread", "read by hand: it shares no history with main"
        elif not still_different:
            kind, rec = "landed", "retire: its work is already in main"
        elif age <= 7:
            kind, rec = "active", "keep; sequence any collision with it"
        elif age <= 30:
            kind, rec = "recent", "review: merge or retire"
        else:
            kind, rec = "stale", "retire as an archive tag unless you want it"
        rows.append({"branch": b.replace("origin/", ""), "kind": kind, "recommendation": rec, "last_commit": str(last),
                     "days": age, "commits_ahead": ahead, "files": len(files), "files_not_in_main": len(still_different),
                     "subject": git("log", "-1", "--format=%s", b).strip()[:100]})
    rows.sort(key=lambda r: (["unread", "active", "recent", "stale", "landed"].index(r["kind"]), r["days"]))
    if "--json" in argv:
        print(json.dumps(rows, indent=1))
        return 0
    counts = {k: sum(1 for r in rows if r["kind"] == k) for k in ("unread", "active", "recent", "stale", "landed")}
    print(f"{len(rows)} open strands: " + ", ".join(f"{v} {k}" for k, v in counts.items()))
    for r in rows:
        print(f"  {r['kind']:<7} {r['last_commit']}  {r['commits_ahead']:>4} commits  {r['branch']}  ({r['subject']})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
