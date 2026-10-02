#!/usr/bin/env python3
"""Install the six-faces council into a repo, new or existing.

Usage: python3 council/install.py <target_repo_path> [--source owner/repo@ref] [--no-register]

Run from the home repo (named in council/source.txt). It writes into the target:
  council/source.txt              the home repo the target pulls shared files from
  council/faces.yaml              the shared definition file (kept current by the hook)
  .claude/skills/six-faces/       the skill (kept current by the hook)
  council/hooks/council-sync.sh   the session-start hook that pulls updates from home
  .claude/settings.json           the hook registered under SessionStart, merged with what is there
  council/terms.yaml              an empty term registry, if the repo has none
  council/ledger/                 where this repo's pass records go
It then adds the target's GitHub remote to council/repos.yaml here, unless --no-register.
Nothing is committed. The target's own files (glossaries, decision logs, ledgers) are never changed.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

HOME = Path(__file__).resolve().parent.parent
SHARED = ["council/faces.yaml", ".claude/skills/six-faces/SKILL.md"]
HOOK_CMD = '"$CLAUDE_PROJECT_DIR"/council/hooks/council-sync.sh'
TERMS_HEADER = """# Term registry for this repo. The repo's glossary, if it has one, stays the canon; this file indexes
# terms the council has harvested or tested, with their state, source and usage. States: harvested,
# candidate, proposed, locked, not_yet, retired, not_a_term. Only Wendell locks.
terms: []
"""


def origin_of(path: Path) -> str | None:
    r = subprocess.run(["git", "-C", str(path), "config", "--get", "remote.origin.url"], capture_output=True, text=True)
    url = r.stdout.strip()
    if not url:
        return None
    return url.split("github.com")[-1].lstrip(":/").removesuffix(".git") or None


def main(argv: list[str]) -> int:
    args = argv[1:]
    if not args:
        print(__doc__)
        return 2
    register = "--no-register" not in args
    args = [a for a in args if a != "--no-register"]
    source = None
    if "--source" in args:
        i = args.index("--source"); source = args[i + 1]; del args[i:i + 2]
    target = Path(args[0]).resolve()
    if not target.is_dir():
        print(f"no such directory: {target}"); return 1
    if source is None:
        source = next(l.strip() for l in (HOME / "council/source.txt").read_text().splitlines() if l.strip() and not l.startswith("#"))

    done = []
    (target / "council/ledger").mkdir(parents=True, exist_ok=True)
    if (target / "council/source.txt").resolve() != (HOME / "council/source.txt").resolve():
        (target / "council/source.txt").write_text(f"# The home repo for the six-faces council, as owner/repo@ref. Shared files are pulled from here.\n{source}\n")
        done.append("council/source.txt -> " + source)
    for rel in SHARED:
        (target / rel).parent.mkdir(parents=True, exist_ok=True)
        if (HOME / rel).resolve() != (target / rel).resolve():
            shutil.copyfile(HOME / rel, target / rel); done.append(rel)
    if not (target / "council/terms.yaml").exists():
        (target / "council/terms.yaml").write_text(TERMS_HEADER); done.append("council/terms.yaml (empty)")
    hook = target / "council/hooks/council-sync.sh"
    hook.parent.mkdir(parents=True, exist_ok=True)
    if hook.resolve() != (HOME / "council/hooks/council-sync.sh").resolve():
        shutil.copyfile(HOME / "council/hooks/council-sync.sh", hook); done.append("council/hooks/council-sync.sh")
    hook.chmod(0o755)

    settings_path = target / ".claude/settings.json"
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
    groups = settings.setdefault("hooks", {}).setdefault("SessionStart", [])
    for g in groups:  # drop an older registration at another path
        g["hooks"] = [h for h in g.get("hooks", []) if not (h.get("command", "").endswith("council-sync.sh") and h.get("command") != HOOK_CMD)]
    groups[:] = [g for g in groups if g.get("hooks")]
    already = any(h.get("command") == HOOK_CMD for g in groups for h in g.get("hooks", []))
    if not already:
        groups.append({"hooks": [{"type": "command", "command": HOOK_CMD}]})
        done.append(".claude/settings.json (SessionStart hook added)")
    else:
        done.append(".claude/settings.json (hook already registered)")
    settings_path.write_text(json.dumps(settings, indent=2) + "\n")

    ignored = []
    for rel in [".claude/settings.json", "council/hooks/council-sync.sh", ".claude/skills/six-faces/SKILL.md"]:
        r = subprocess.run(["git", "-C", str(target), "check-ignore", "-q", rel])
        if r.returncode == 0:
            ignored.append(rel)

    origin = origin_of(target)
    if register and origin:
        reg = HOME / "council/repos.yaml"
        text = reg.read_text()
        if f"  - {origin}\n" not in text:
            reg.write_text(text.rstrip("\n") + f"\n  - {origin}\n"); done.append(f"registered {origin} in the home council/repos.yaml")

    print(f"Installed the six-faces council into {target}")
    for d in done:
        print("  " + d)
    if ignored:
        print("WARNING: git ignores these, so sessions will not see them until .gitignore allows them:")
        for r in ignored:
            print("  " + r)
    print("Next: commit these files in the target and merge to its default branch. New sessions there then load the skill and sync at start.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
