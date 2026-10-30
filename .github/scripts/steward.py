#!/usr/bin/env python3
"""Keep every open pull request mergeable with main, and merge the ready ones once their checks pass.

Each pull request is classified first (classify()): working (pushed to in the last 20 minutes, or held), waiting (a
pull request it names, or its pair on the same branch in bars-engine, is still open), stale (no commit for 7 days), or
ready. Only ready ones are touched. A draft whose body says what was "Not checked" is the thread's own "finished": once it
is quiet, waits on nothing and passes the checks with main merged in, the steward marks it ready and then merges it.
With STEWARD_MODE=queue (bars-engine, merged by hand) it promotes and prints the merge queue, and never merges.

Runs in the steward workflow (.github/workflows/steward.yml). For each open pull request whose branch
lives in this repo:
1. If main has moved ahead, merge main into the branch with a merge commit (never a rebase), using the
   merge drivers in .gitattributes, rebuild the board page if the repo has one, and push.
2. Run the checks and post the result as the "steward" commit status on the branch head.
3. If the pull request is not a draft and the checks pass, merge it with a merge commit. Wendell, 2026-10-06:
   "having to manually put the label isn't working for me. Is there a way to automate this part of the process?"
   This replaces his label ruling of 2026-10-03 ("On your label"). Two things still stop a merge: the "hold" label,
   which anyone can add to keep a pull request open, and a change Wendell reviews himself: council/faces.yaml, which
   changes only by his ruling, and the daily session's daily/ branches. Those still wait for his "automerge" label. If main cannot be merged in cleanly, the branch is left untouched
and the pull request gets one comment naming the files, for the session that owns the branch to resolve.
"""
import json
import os
import re
import subprocess
import sys
import time

REPO = os.environ["GITHUB_REPOSITORY"]
# MODE=merge (the council): classify, promote, merge. MODE=queue (bars-engine, merged by Wendell's hand): classify,
# promote finished drafts, and print his merge queue; never merge and never touch a branch.
MODE = os.environ.get("STEWARD_MODE", "merge")
# Repos whose pull requests the home repo's pull requests wait on. A council PR on the same branch name as an open PR
# here (the "pair" convention) waits until that one merges.
UPSTREAM = ("johnair01/bars-engine",)
QUIET_MINUTES = 20   # a branch pushed to more recently than this is still being worked on
STALE_DAYS = 7       # no commit for this long: not swept, listed for Wendell to compost or revive
# A finished session says what it did not check; a draft that says so is the thread's own "I'm done".
DONE_MARK = re.compile(r"(?i)\bnot (?:checked|done)\b")
DEP = re.compile(r"(?i)(?:pair of|stacked on|waits? on|depends on|(?:kept )?draft until|blocked (?:on|by))\s+`?(?:([\w.-]+/[\w.-]+)\s*)?#(\d+)")
CONFLICT_MARK = "<!-- steward:conflict -->"
LABEL = "automerge"
HOLD = "hold"
# Files that change only by Wendell's ruling (CLAUDE.md, "Where the rest lives"). A pull request touching one still
# waits for his "automerge" label.
RESERVED = ("council/faces.yaml",)
# Board-only pull requests merge without the label (Wendell, 2026-10-04: "make sure we're automatically merging when we
# add rows"): every changed file is board data or a ledger record, the checks pass, and no row on main is removed.
BOARD_ONLY = ("board/board_data.json", "board/council-board.html")
BOARD_ONLY_PREFIX = ("council/ledger/", "board/stills/")


def sh(*args, check=True):
    r = subprocess.run(args, capture_output=True, text=True)
    if check and r.returncode:
        raise RuntimeError(f"{' '.join(args)} failed: {r.stderr.strip()}")
    return r


def gh_json(*args):
    return json.loads(sh("gh", *args).stdout or "null")


def checks():
    """Return a list of problems; empty means the branch passes."""
    problems = []
    if os.path.exists("board/board_data.json"):
        try:
            json.load(open("board/board_data.json", encoding="utf-8"))
        except ValueError as e:
            problems.append(f"board_data.json does not parse: {e}")
        else:
            page = "board/council-board.html"
            path = "board/board_data.json"
            before = open(page, encoding="utf-8").read() if os.path.exists(page) else None
            data_before = open(path, encoding="utf-8").read()
            sh("python3", "board/build_board.py")
            if open(page, encoding="utf-8").read() != before:
                problems.append("council-board.html is not built from board_data.json (run python3 board/build_board.py)")
            # The build also rewrites the derived lists in board_data.json. Comparing only the page left that rewrite
            # in the working tree, so the suite passed on a file the merge would throw away and the status said
            # nothing about it (position bp-check-names-stale-list). Name it, then put both files back.
            if open(path, encoding="utf-8").read() != data_before:
                problems.append("board_data.json's derived lists are stale (run python3 board/build_board.py)")
            sh("git", "checkout", "--", page, path, check=False)
            sh("git", "clean", "-fdq", "board/stills", check=False)
    try:
        import yaml
        for path in ("council/faces.yaml", "council/pipeline.yaml"):
            if os.path.exists(path):
                try:
                    yaml.safe_load(open(path, encoding="utf-8"))
                except yaml.YAMLError as e:
                    problems.append(f"{path} does not parse: {e}")
    except ImportError:
        pass
    leftover = sh("git", "grep", "-lE", "^(<<<<<<<|>>>>>>>) ", "--", ".", check=False).stdout.split()
    problems += [f"conflict markers left in {p}" for p in leftover]
    # The stage checks on what the branch changes (stage-checks.yml runs the same on the pull request; this one gates
    # the merge). Older sheets and folders are ratcheted inside the script.
    if os.path.exists("council/tools/stage_checks.py"):
        r = sh("python3", "council/tools/stage_checks.py", "--base", "origin/main", check=False)
        if r.returncode:
            fails = [l[len("fail: "):] for l in r.stdout.splitlines() if l.startswith("fail: ")]
            problems.append(f"stage checks fail ({len(fails)}): {(fails or [r.stderr.strip()])[0]}")
    # The board merge tests: a change to sync_board.py or board_merge.py that would drop a row fails here.
    # pytest runs the unittest classes and the pytest-style files (the board-save contract) alike.
    if os.path.isdir("tests"):
        r = sh("python3", "-m", "pytest", "-q", "tests", check=False)
        if r.returncode:
            last = ((r.stdout + r.stderr).strip().splitlines() or ["unknown failure"])[-1]
            problems.append(f"tests fail (python3 -m pytest -q tests): {last}")
    return problems


def set_status(sha, problems):
    state = "failure" if problems else "success"
    desc = (problems[0] if problems else "up to date with main, checks pass")[:140]
    sh("gh", "api", f"repos/{REPO}/statuses/{sha}", "-f", f"state={state}", "-f", "context=steward", "-f", f"description={desc}")


def note_conflict(number, files):
    comments = gh_json("api", f"repos/{REPO}/issues/{number}/comments", "--paginate")
    if any(CONFLICT_MARK in (c.get("body") or "") for c in comments):
        return
    body = (f"{CONFLICT_MARK}\nThe steward could not merge main into this branch. These files changed on both sides: "
            + ", ".join(f"`{f}`" for f in files)
            + ". The session that owns this branch should merge main, resolve them, and push.")
    sh("gh", "api", f"repos/{REPO}/issues/{number}/comments", "-f", f"body={body}")


def board_only():
    """True when the branch, against main, changes only board data and ledger records and removes no board row."""
    files = sh("git", "diff", "--name-only", "origin/main...HEAD").stdout.split()
    if not files or not all(f in BOARD_ONLY or f.startswith(BOARD_ONLY_PREFIX) for f in files):
        return False
    def ids(text):
        d = json.loads(text)
        return {(k, r["id"]) for k in ("positions", "questions", "terms", "causes") for r in d.get(k, []) if isinstance(r, dict) and "id" in r}
    main_rows = sh("git", "show", "origin/main:board/board_data.json", check=False).stdout
    if not main_rows:
        return True
    try:
        return ids(main_rows) <= ids(open("board/board_data.json", encoding="utf-8").read())
    except (ValueError, OSError):
        return False


def touches_reserved():
    files = sh("git", "diff", "--name-only", "origin/main...HEAD").stdout.split()
    return [f for f in files if f in RESERVED]


def last_work(head):
    """Seconds since the last commit that is not the steward's own merge of main."""
    out = sh("git", "log", "-1", "--format=%ct", "--invert-grep", "--grep=(steward)", f"origin/{head}", check=False).stdout.strip()
    return time.time() - int(out) if out else 0


def unmet(pr):
    """Pull requests this one waits on that are still open: named in its body, or the pair on the same branch upstream."""
    found = []
    for repo, num in DEP.findall(pr.get("body") or ""):
        repo = repo or REPO
        r = sh("gh", "pr", "view", num, "--repo", repo, "--json", "state", check=False)
        if r.returncode == 0 and json.loads(r.stdout)["state"] == "OPEN":
            found.append(f"{repo}#{num}")
    if MODE == "merge":
        for up in UPSTREAM:
            r = sh("gh", "pr", "list", "--repo", up, "--head", pr["headRefName"], "--state", "open", "--json", "number", check=False)
            if r.returncode == 0:
                found += [f"{up}#{p['number']}" for p in json.loads(r.stdout or "[]")]
    return found


def classify(pr):
    """Return (state, reason). States: working, waiting, stale, ready-to-promote, ready, stuck is set by tend()."""
    labels = {l["name"] for l in pr["labels"]}
    if HOLD in labels:
        return "working", "has the hold label"
    sh("git", "fetch", "-q", "origin", pr["headRefName"], check=False)
    idle = last_work(pr["headRefName"])
    if idle < QUIET_MINUTES * 60:
        return "working", f"pushed to {int(idle // 60)} min ago"
    if idle > STALE_DAYS * 86400:
        return "stale", f"no commits for {int(idle // 86400)} days"
    waits = unmet(pr)
    if waits:
        return "waiting", "waits on " + ", ".join(waits)
    if pr["isDraft"] and not DONE_MARK.search(pr.get("body") or ""):
        return "working", "draft with no 'Not checked' line yet"
    return ("ready-to-promote" if pr["isDraft"] else "ready"), "quiet, nothing it waits on"


def vercel_ok(sha):
    r = sh("gh", "api", f"repos/{REPO}/commits/{sha}/status", check=False)
    return r.returncode == 0 and json.loads(r.stdout).get("state") == "success"


def tend(pr):
    """Classify one pull request and act on its state. Returns True if merged."""
    num = pr["number"]
    state, why = classify(pr)
    print(f"#{num}: {state}: {why}")
    if state in ("working", "waiting", "stale"):
        if state == "waiting" and MODE == "merge":
            set_status(pr["headRefOid"], [f"waiting: {why}"])
        return False
    if MODE == "queue":
        # bars-engine: no merge, no push. A finished draft with a green deployment becomes ready; the queue lists it.
        if state == "ready-to-promote" and vercel_ok(pr["headRefOid"]):
            sh("gh", "pr", "ready", str(num), check=False)
            sh("gh", "pr", "comment", str(num), "--body", f"The steward marked this ready: {why}, and the deployment is green. It waits for your merge.", check=False)
        return False
    head = pr["headRefName"]
    sh("git", "reset", "-q", "--hard")
    sh("git", "fetch", "-q", "origin", "main", head)
    sh("git", "checkout", "-q", "-B", "steward-work", f"origin/{head}")
    if sh("git", "merge-base", "--is-ancestor", "origin/main", "HEAD", check=False).returncode:
        r = sh("git", "merge", "--no-edit", "-m", f"Merge main into {head} (steward)", "origin/main", check=False)
        if r.returncode:
            files = sh("git", "diff", "--name-only", "--diff-filter=U").stdout.split()
            if not files:
                print(f"#{num}: merge failed: {r.stderr.strip() or r.stdout.strip()}", file=sys.stderr)
            sh("git", "merge", "--abort", check=False)
            print(f"#{num}: conflict in {files}")
            note_conflict(num, files or ["(unknown)"])
            set_status(pr["headRefOid"], [f"main does not merge cleanly: {', '.join(files)}"])
            return False
        if os.path.exists("board/build_board.py"):
            # Whatever the build writes, the merge carries (position bp-rebuild-commits-data).
            sh("python3", "board/build_board.py")
            sh("git", "add", "board/board_data.json", "board/council-board.html", "board/stills")
            sh("git", "commit", "-q", "--amend", "--no-edit")
        if sh("git", "push", "-q", "origin", f"HEAD:{head}", check=False).returncode:
            print(f"#{num}: branch moved while merging; the next run picks it up")
            return False
        print(f"#{num}: merged main into {head}")
    sha = sh("git", "rev-parse", "HEAD").stdout.strip()
    problems = checks()
    set_status(sha, problems)
    print(f"#{num}: {'; '.join(problems) or 'checks pass'}")
    labels = {l["name"] for l in pr["labels"]}
    reserved = touches_reserved()
    if reserved and LABEL not in labels:
        print(f"#{num}: changes {', '.join(reserved)}; waits for Wendell's {LABEL} label")
    # The daily session's pull requests keep waiting for his label: its changes are proposals he reviews.
    daily = head.startswith("daily/")
    allowed = LABEL in labels or ((not reserved and not daily) or board_only())
    if pr["isDraft"]:
        # Promote: the thread called it finished, it is quiet, waits on nothing, and the checks pass on main merged in.
        if allowed and not problems:
            sh("gh", "pr", "ready", str(num), check=False)
            sh("gh", "pr", "comment", str(num), "--body", f"The steward marked this ready: {why}, and checks pass with main merged in.", check=False)
            print(f"#{num}: promoted to ready")
            pr["isDraft"] = False
        else:
            return False
    if allowed and not problems:
        r = sh("gh", "pr", "merge", str(num), "--merge", "--match-head-commit", sha, check=False)
        if r.returncode == 0:
            print(f"#{num}: merged into main")
            return True
        print(f"#{num}: merge refused: {r.stderr.strip()}")
    return False


def queue_report(prs):
    """bars-engine: the order Wendell merges by hand. Every ready PR, oldest first."""
    ready = [p for p in sorted(prs, key=lambda p: p["number"]) if not p["isDraft"] and HOLD not in {l["name"] for l in p["labels"]}]
    lines = [f"### Merge queue for {REPO}", ""]
    for i, p in enumerate(ready, 1):
        ok = "green" if vercel_ok(p["headRefOid"]) else "check the deployment"
        lines.append(f"{i}. [#{p['number']}](https://github.com/{REPO}/pull/{p['number']}) {p['title']} ({ok})")
    text = "\n".join(lines)
    print(text)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(text + "\n")


def main():
    sh("git", "config", "user.name", "github-actions[bot]")
    sh("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
    # Branches cut before the driver existed lack it, so run main's copy from outside the work tree.
    driver = os.path.join(os.environ.get("RUNNER_TEMP", "/tmp"), "board_merge.py")
    if os.path.exists("council/tools/board_merge.py"):
        sh("cp", "council/tools/board_merge.py", driver)
        sh("git", "config", "merge.boardjson.driver", f"python3 {driver} %O %A %B")
    # Attributes come from the work tree, which is the pull request's branch, so pin main's copy.
    if os.path.exists(".gitattributes"):
        sh("cp", ".gitattributes", os.path.join(sh("git", "rev-parse", "--git-dir").stdout.strip(), "info", "attributes"))
    sh("git", "config", "merge.ours.driver", "true")
    if MODE == "merge":
        sh("gh", "label", "create", LABEL, "--color", "0e8a16", "--force",
           "--description", "Wendell's yes, needed only for a change to council/faces.yaml", check=False)
        sh("gh", "label", "create", HOLD, "--color", "b60205", "--force",
           "--description", "Keeps this pull request open: the steward does not merge it", check=False)
    # A pull_request event tends only the pull request it names; push, schedule and manual runs sweep all of them.
    only = int(os.environ.get("STEWARD_PR") or 0)
    fields = "number,title,body,headRefName,headRefOid,isDraft,labels,isCrossRepository"
    # A merge moves main, so after each merge go round again to bring the other branches up to the new main.
    for _ in range(10):
        prs = gh_json("pr", "list", "--state", "open", "--json", fields)
        merged = False
        # Newest first: the pull request a session just finished is the one waiting to merge.
        for pr in sorted(prs, key=lambda p: -p["number"]):
            if pr["isCrossRepository"] or (only and pr["number"] != only):
                continue
            try:
                if tend(pr):
                    merged = True
                    break
            except RuntimeError as e:
                print(f"#{pr['number']}: {e}", file=sys.stderr)
        if not merged:
            break
    if MODE == "queue":
        queue_report(gh_json("pr", "list", "--state", "open", "--json", fields))


if __name__ == "__main__":
    main()
