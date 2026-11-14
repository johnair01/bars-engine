"""Print how many tokens this session rereads on every call, read from its own transcript.

Every call rereads the whole context, so this number times the call count is most of a session's cost. Run it at each
milestone: past HANDOFF_AT the session finishes its step, writes its callsheet and hands off (CLAUDE.md, Short sessions;
measured in /mnt/project-files/usage-audit/audit-2026-10-18.md).

    python3 council/tools/context_size.py            # newest transcript under ~/.claude/projects
    python3 council/tools/context_size.py <file.jsonl>

Run as a PostToolUse hook (.claude/settings.json) with --hook, it reads the hook's JSON on stdin and, once the main
loop's context passes HANDOFF_AT, adds a handoff order to the next tool result, with the next chat's paste-ready prompt
from council/tools/next_chat.py, so a thread does not have to remember to check or to write the prompt by hand.
Subagent calls are skipped. Any error exits 0 with no output (a hook must never break a turn).

The same hook keeps the per-call log (bc-per-call-log, 2026-10-30): one JSON line per model call, with its step, model,
context and the tool it asked for, in usage-audit/calls/<session>.jsonl under the project files (or ~/.claude/cost-log
outside a project, or $COST_LOG_DIR), and a <session>.summary.json beside it that the Stop hook rewrites at the end of
each turn. The summary's opening_tokens is the thread's opening load: the first call's context, before any work.

    python3 council/tools/context_size.py --opening [file.jsonl]   the first call's context (the opening load)

Spend against a card (docs/specs/council-board-v2.md section 2, "Spend"; docs/board-v2-part2.md): while a carded ticket
is claimed (board/work.py claim remembers it in ~/.claude/card-claims/), every call this session makes after the claim
counts against the card, in input-token equivalents (WEIGHT below, the measure the cost summary uses). At SPEND_STOP of
the card's budget the hook and the nudge tell the agent to stop and write a status note inside the card instead of
continuing; work.py done, release and failed post the final count onto the card's inside.tokens.spent.

    python3 council/tools/context_size.py --spend                 the claimed card's spend so far, against its budget
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

HANDOFF_AT = 250_000


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


USAGE_KEYS = ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens")
# Price ratios to fresh input (cache read 0.1x, 1-hour cache write 2x, output 5x; 6FACE_PASS_build-cost_2026-10-30.md).
# The summary reports input-token equivalents; dollars stay the platform's (docs/cost-ledger.md).
WEIGHT = {"input_tokens": 1, "cache_read_input_tokens": 0.1, "cache_creation_input_tokens": 2, "output_tokens": 5}


def calls(path):
    """One record per model call, in order. The transcript repeats a call's usage on every content block it wrote,
    so calls are told apart by message id."""
    seen, out = set(), []
    for line in path.open(errors="replace"):
        if '"usage"' not in line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        message = entry.get("message") or {}
        usage = message.get("usage") if isinstance(message, dict) else None
        if not usage:
            continue
        key = message.get("id") or entry.get("requestId") or len(out)
        if key in seen:
            continue
        seen.add(key)
        record = {k: usage.get(k) or 0 for k in USAGE_KEYS}
        record["context"] = sum(record[k] for k in USAGE_KEYS[:3])
        record["model"] = message.get("model", "")
        record["at"] = entry.get("timestamp", "")
        out.append(record)
    return out


def log_dir():
    if os.environ.get("COST_LOG_DIR"):
        return Path(os.environ["COST_LOG_DIR"])
    shared = Path("/mnt/project-files/")
    if shared.is_dir():
        return shared / "usage-audit" / "calls"
    return Path.home() / ".claude" / "cost-log"


def summarize(records, session):
    total = {k: sum(r[k] for r in records) for k in USAGE_KEYS}
    weighted = {k: round(total[k] * WEIGHT[k]) for k in USAGE_KEYS}
    spend = sum(weighted.values()) or 1
    return {
        "session": session,
        "calls": len(records),
        "opening_tokens": records[0]["context"] if records else 0,
        "last_context": records[-1]["context"] if records else 0,
        "max_context": max((r["context"] for r in records), default=0),
        "models": sorted({r["model"] for r in records if r["model"]}),
        "tokens": total,
        "input_equivalents": weighted,
        "share": {k: round(v / spend, 3) for k, v in weighted.items()},
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def log_calls(path, session, tool="", directory=None):
    """Append the calls not yet logged, naming the tool on the newest one, and rewrite the summary."""
    directory = Path(directory or log_dir())
    directory.mkdir(parents=True, exist_ok=True)
    records = calls(path)
    log = directory / f"{session}.jsonl"
    done = sum(1 for _ in log.open()) if log.exists() else 0
    with log.open("a") as out:
        for step, record in enumerate(records[done:], done + 1):
            line = {"step": step, **record}
            if tool and step == len(records):
                line["tool"] = tool
            out.write(json.dumps(line) + "\n")
    (directory / f"{session}.summary.json").write_text(json.dumps(summarize(records, session), indent=1) + "\n")
    return records


SPEND_STOP = 0.8
SPEND_ORDER = (
    "SPEND LINE PASSED: the card {card} has spent {spent:,} of its {budget:,} token budget ({pct:.0%}). Stop working it. "
    "Write a status note inside the card instead of continuing: python3 board/receipt.py spend {card} {spent} --note "
    "\"<where the work stands, what is left, what it needs>\" (spec section 2, Spend)."
)


def claims_dir():
    return Path(os.environ.get("CARD_CLAIMS") or Path.home() / ".claude" / "card-claims")


def current_claim():
    """The newest claimed carded ticket (board/work.py claim), or None."""
    try:
        files = sorted(claims_dir().glob("*.json"), key=lambda p: p.stat().st_mtime)
        return json.loads(files[-1].read_text()) if files else None
    except (OSError, ValueError):
        return None


def _when(stamp):
    try:
        return datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
    except ValueError:
        return None


def claim_spend(claim, path=None):
    """Input-token equivalents of the calls made since the claim, from this session's transcript; None without one."""
    path = path or latest_transcript()
    if not claim or not path or not Path(path).exists():
        return None
    since = _when(claim.get("at"))
    total = 0
    for r in calls(Path(path)):
        at = _when(r.get("at"))
        if since and at and at < since:
            continue
        total += sum(r[k] * WEIGHT[k] for k in USAGE_KEYS)
    return round(total)


def spend_order(path=None, claim=None):
    """The stop order when the claimed card has passed SPEND_STOP of its budget, else ''."""
    claim = claim or current_claim()
    if not claim or not claim.get("budget"):
        return ""
    spent = claim_spend(claim, path)
    if spent is None:
        return ""
    spent += int(claim.get("spent_before") or 0)
    budget = int(claim["budget"])
    if spent < SPEND_STOP * budget:
        return ""
    return SPEND_ORDER.format(card=claim["card"], spent=spent, budget=budget, pct=spent / budget)


HANDOFF_ORDER = (
    "HANDOFF LINE PASSED: this thread rereads {n:,} tokens on every call (line {line:,}). Do not start a new step. "
    "Finish the one in hand, record the work (callsheet, board rows), send the coordinator the handoff, drop PR "
    "watches and resolve the thread (CLAUDE.md, Short sessions)."
)
STOP_ORDER = " Past {stop:,}: stop after this call and hand off."
STOP_AT = 300_000
NEXT_CHAT = "\n\nPaste into a new chat: {prompt}"


def handoff_prompt():
    """The next chat's prompt, read from the newest callsheet's brief; '' when there is no brief to read."""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import next_chat
        return next_chat.build_prompt(next_chat.newest_strand())
    except Exception:
        return ""


def hook(stdin):
    """PostToolUse hook body: print hook JSON with additionalContext when the context is past the line."""
    try:
        event = json.load(stdin)
        if event.get("agent_id"):
            return 0
        path = Path(event.get("transcript_path") or "")
        if not path.is_file():
            return 0
        if event.get("session_id"):
            try:
                log_calls(path, event["session_id"], event.get("tool_name", ""))
            except Exception:
                pass
        if event.get("hook_event_name", "PostToolUse") != "PostToolUse":
            return 0
        tokens = context_tokens(path)
        spend = spend_order(path)
        if spend and (tokens is None or tokens < HANDOFF_AT):
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": spend}}))
            return 0
        if tokens is None or tokens < HANDOFF_AT:
            return 0
        text = (spend + " " if spend else "") + HANDOFF_ORDER.format(n=tokens, line=HANDOFF_AT)
        if tokens >= STOP_AT:
            text += STOP_ORDER.format(stop=STOP_AT)
        prompt = handoff_prompt()
        if prompt:
            text += NEXT_CHAT.format(prompt=prompt)
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": text}}))
    except Exception:
        pass
    return 0


def nudge(stream=None):
    """The hook's handoff order, printed to stderr by the board scripts threads run anyway (post_rows, gates,
    store_write, sync_board). Project threads never load the repo hook (step sc-setup-hook), so without this nothing
    tells a thread it has passed the line: 52% of 10-31's spend was in threads that ended past 200k (cost-cut,
    2026-10-31). Outside a Claude session, or on any error, it prints nothing."""
    try:
        if os.environ.get("CONTEXT_NUDGE") == "0":
            return
        path = latest_transcript()
        if not path or (datetime.now().timestamp() - path.stat().st_mtime) > 600:
            return
        tokens = context_tokens(path)
        spend = spend_order(path)
        if spend:
            print("\n" + spend, file=stream or sys.stderr)
        if tokens is None or tokens < HANDOFF_AT:
            return
        text = HANDOFF_ORDER.format(n=tokens, line=HANDOFF_AT)
        if tokens >= STOP_AT:
            text += STOP_ORDER.format(stop=STOP_AT)
        print("\n" + text, file=stream or sys.stderr)
    except Exception:
        pass


def main(argv):
    if len(argv) > 1 and argv[1] == "--hook":
        return hook(sys.stdin)
    if len(argv) > 1 and argv[1] == "--opening":
        path = Path(argv[2]) if len(argv) > 2 else latest_transcript()
        records = calls(path) if path and path.exists() else []
        print(f"{records[0]['context']:,} tokens on the first call (the opening load)" if records else "no calls found")
        return 0
    if len(argv) > 1 and argv[1] == "--spend":
        claim = current_claim()
        if not claim:
            print("no carded ticket is claimed in this session (board/work.py claim remembers one)")
            return 0
        spent = (claim_spend(claim) or 0) + int(claim.get("spent_before") or 0)
        budget = claim.get("budget")
        print(f"{claim['card']}: {spent:,} spent" + (f" of {int(budget):,} ({spent / int(budget):.0%}; stop at "
                                                     f"{SPEND_STOP:.0%})" if budget else ", no budget set"))
        order = spend_order(claim=claim)
        if order:
            print(order)
        return 0
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
