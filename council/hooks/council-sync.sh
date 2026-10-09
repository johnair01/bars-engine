#!/bin/bash
# Six-faces council: pull the shared files from the home repo at session start.
#
# The home repo is named in council/source.txt as owner/repo@ref. The hook also updates itself, so a
# change to the list of shared files reaches every repo at its next session start. Every repo with the council runs
# this hook, so an update made at home (a new lesson, a changed lens, a skill rule) reaches every
# other repo the next time a session opens there. Only the shared files are pulled. Ledgers, term
# registries and glossaries belong to the repo they are in and are never touched.
#
# Fail-soft: with no network, the local copy stays and the session is told its date.
# Test override: COUNCIL_SOURCE_BASE=file:///path/to/home replaces the GitHub address.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$root" || exit 0
[ -f council/source.txt ] || exit 0

source_spec="$(grep -v '^#' council/source.txt | head -1 | tr -d '[:space:]')"
home_repo="${source_spec%@*}"
ref="${source_spec#*@}"
[ "$ref" = "$source_spec" ] && ref=main

origin="$(git config --get remote.origin.url 2>/dev/null | sed -E 's#^.*github\.com[:/]##; s#\.git$##')"
# Printed at every session start, because the moment the reach test exists for is the moment a session
# is about to ask Wendell something, and no trigger phrase marks it (Wendell, 2026-10-02: "In theory
# these questions should've triggered the game master agents yes?").
rule="Standing rule: before you ask Wendell a question whose answer changes what gets built, run it through the six-faces reach test (skill six-faces). Answer it from the record if you can. A question that survives goes to the council board with options, and the chat reply says it is there."
# The feature pipeline (council/pipeline.yaml), asked for by Wendell on 2026-10-02: "Things that need
# building should go through a production pipeline managed by the 6 faces".
pipeline_rule="Standing rule: a new feature starts as a spec kit in .specify/specs/<name>/ from council/spec-kit/ and runs the six-faces pipeline in council/pipeline.yaml. A step only Wendell can take goes on the Your steps tab on the council board (https://claude.ai/artifact/DxyShVS8tmvJym4HAsgnho#steps), never into chat."
lessons() { grep -c '^      - date:' council/faces.yaml 2>/dev/null || echo 0; }

# Merge drivers named in .gitattributes: the board's rows merge by id, and the built page is rebuilt.
if [ -f council/tools/board_merge.py ]; then
  git config merge.boardjson.driver "python3 council/tools/board_merge.py %O %A %B" 2>/dev/null
  git config merge.ours.driver true 2>/dev/null
fi

if [ "$origin" = "$home_repo" ] && [ -z "${COUNCIL_SOURCE_BASE:-}" ]; then
  echo "Six-faces council: this repo is the home copy ($home_repo). $(lessons) face lessons in council/faces.yaml. Lessons and lens changes are made here."
  echo "$rule"
  echo "$pipeline_rule"
  exit 0
fi

base="${COUNCIL_SOURCE_BASE:-https://raw.githubusercontent.com/$home_repo/$ref}"
label="$home_repo@$ref"; [ -n "${COUNCIL_SOURCE_BASE:-}" ] && label="$COUNCIL_SOURCE_BASE"
files="council/faces.yaml council/pipeline.yaml council/spec-kit/spec.md council/spec-kit/plan.md council/spec-kit/tasks.md .claude/skills/six-faces/SKILL.md council/portable/six-faces/SKILL.md council/tools/voice_lint.py council/hooks/council-sync.sh council/daemons/daemons.yaml council/daemons/check_report.py council/iching/hexagrams.yaml council/iching/cast.py council/strands.py council/census.py .claude/agents/daemon-protector.md .claude/agents/daemon-controller.md .claude/agents/daemon-skeptic.md .claude/agents/daemon-fixer.md .claude/agents/daemon-victim.md .claude/agents/daemon-damaged-self.md .claude/agents/daemon-emotional-body.md .claude/agents/daemon-player.md"
changed=""; failed=""
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
for f in $files; do
  # the portable copy is only kept where it already exists
  if [ "$f" = "council/portable/six-faces/SKILL.md" ] && [ ! -f "$f" ]; then continue; fi
  if curl -fsS --max-time 8 "$base/$f" -o "$tmp/x" 2>/dev/null && [ -s "$tmp/x" ]; then
    if ! cmp -s "$tmp/x" "$f" 2>/dev/null; then
      # write beside and rename, so a running copy of this hook is never overwritten in place
      mkdir -p "$(dirname "$f")" && cp "$tmp/x" "$f.council-new" && mv "$f.council-new" "$f" && changed="$changed $f"
      case "$f" in *.sh|*.py) chmod +x "$f" ;; esac
    fi
  else
    failed="$failed $f"
  fi
done

if [ -n "$failed" ]; then
  stamp="$(git log -1 --format=%as -- council/faces.yaml 2>/dev/null)"
  echo "Six-faces council: could not reach $label, so this session uses the local copy (faces.yaml last committed ${stamp:-unknown}). $(lessons) face lessons."
elif [ -n "$changed" ]; then
  echo "Six-faces council: synced from $label. Updated:$changed. $(lessons) face lessons. Commit these with your next change so the repo copy stays current. Write any new lesson in the home repo, or record it under lessons_pending in this repo's ledger."
else
  echo "Six-faces council: up to date with $label. $(lessons) face lessons."
fi
echo "$rule"
echo "$pipeline_rule"
exit 0
