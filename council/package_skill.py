#!/usr/bin/env python3
"""Build the portable six-faces skill for upload to a claude.ai account.

Usage: python3 council/package_skill.py [out.zip]
Bundles council/portable/six-faces/SKILL.md with the current council/faces.yaml and a snapshot date,
as a zip whose top folder is six-faces/. Upload it at claude.ai Settings > Customize > Skills. An
uploaded skill reaches claude.ai chats, the desktop and mobile apps, and Claude Code cloud sessions.
Re-run and re-upload after faces.yaml gains a lesson; the uploaded copy does not update itself.
"""
from __future__ import annotations

import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main(argv: list[str]) -> int:
    out = Path(argv[1]) if len(argv) > 1 else ROOT / "council" / "dist" / "six-faces-skill.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    sha = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    snap = f"faces.yaml snapshot taken {date.today().isoformat()} from bars-engine {sha or 'working tree'}.\n"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(ROOT / "council" / "portable" / "six-faces" / "SKILL.md", "six-faces/SKILL.md")
        z.write(ROOT / "council" / "faces.yaml", "six-faces/faces.yaml")
        z.writestr("six-faces/snapshot.txt", snap)
    print(f"wrote {out}")
    print(snap.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
