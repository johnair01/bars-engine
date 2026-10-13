"""Token counts for one edit thread, read from its transcript (JSONL with per-call usage).

    python3 tokens.py label=transcript.jsonl [...]   prints one JSON row per thread

opening: the context the first call carried (system prompt, tools, CLAUDE.md, the ask)
added:   how much the context grew past the opening by the last call (the files read, the edits, the tool output)
beyond:  every call's input past the opening, summed, plus all output: the tokens the edit itself cost
output:  output tokens, all calls
"""
import json
import sys

for arg in sys.argv[1:]:
    label, path = arg.split("=", 1)
    calls = {}
    for line in open(path):
        d = json.loads(line)
        m = d.get("message")
        if not (isinstance(m, dict) and m.get("usage") and d.get("type") == "assistant"):
            continue
        u = m["usage"]
        inp = u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0)
        prev = calls.get(m.get("id"), (0, 0))
        calls[m.get("id")] = (inp, max(prev[1], u.get("output_tokens", 0)))  # a call's blocks repeat its usage
    rows = list(calls.values())
    opening = rows[0][0]
    print(json.dumps({"label": label, "calls": len(rows), "opening": opening, "added": rows[-1][0] - opening,
                      "beyond": sum(i - opening for i, _ in rows) + sum(o for _, o in rows),
                      "output": sum(o for _, o in rows)}))
