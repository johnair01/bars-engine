"""Print how many tokens this session rereads on every call, read from its own transcript.

Every call rereads the whole context, so this number times the call count is most of a session's cost. Run it at each
milestone: past HANDOFF_AT the session finishes its step, writes its callsheet and hands off (CLAUDE.md, Short sessions;
measured in /mnt/project-files/usage-audit/audit-2026-10-18.md).

    python3 council/tools/context_size.py            # newest transcript under ~/.claude/projects
    python3 council/tools/context_size.py <file.jsonl>

Run as a PostToolUse hook (.claude/settings.json) with --hook, it reads the hook's JSON on stdin and, once the main
loop's context passes HANDOFF_AT, adds a handoff order to the next tool result, so a thread does not have to remember
to check. Subagent calls are skipped. Any error exits 0 with no output (a hook must never break a turn).
"""
import json
import sys
from pathlib import Path

HANDOFF_AT = 150_000


def latest_transcript():
    files = sorted(Path.home().glob(".claude/projects/*/*.jsonl"), key=lambda p: p.stat().st_mtime)
    return files[-1] if files else None


def context_tokens(path):
    """Context size of the last model call: fresh input plus cache reads plus cache writes."""
    last = None
    for line in path.open(errors="replace"):
        if '"usage"' not in line:
            continue
        try:
            usage = json.loads(line).get("message", {}).get("usage")
        except json.JSONDecodeError:
            continue
        if usage:
            last = usage
    if not last:
        return None
    return sum(last.get(k) or 0 for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"))


HANDOFF_ORDER = (
    "HANDOFF LINE PASSED: this thread rereads {n:,} tokens on every call (line {line:,}). Do not start a new step. "
    "Finish the one in hand, record the work (callsheet, board rows), send the coordinator the handoff, drop PR "
    "watches and resolve the thread (CLAUDE.md, Short sessions)."
)
STOP_ORDER = " Past {stop:,}: stop after this call and hand off."
STOP_AT = 220_000


def hook(stdin):
    """PostToolUse hook body: print hook JSON with additionalContext when the context is past the line."""
    try:
        event = json.load(stdin)
        if event.get("agent_id"):
            return 0
        path = Path(event.get("transcript_path") or "")
        tokens = context_tokens(path) if path.is_file() else None
        if tokens is None or tokens < HANDOFF_AT:
            return 0
        text = HANDOFF_ORDER.format(n=tokens, line=HANDOFF_AT)
        if tokens >= STOP_AT:
            text += STOP_ORDER.format(stop=STOP_AT)
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": text}}))
    except Exception:
        pass
    return 0


def main(argv):
    if len(argv) > 1 and argv[1] == "--hook":
        return hook(sys.stdin)
    path = Path(argv[1]) if len(argv) > 1 else latest_transcript()
    tokens = context_tokens(path) if path and path.exists() else None
    if tokens is None:
        print("no transcript usage found")
        return 0
    verdict = "hand off now" if tokens >= HANDOFF_AT else "under the handoff line"
    print(f"{tokens:,} tokens reread per call ({verdict}, line {HANDOFF_AT:,})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
