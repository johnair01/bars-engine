#!/usr/bin/env python3
"""Cast the I Ching for one agent or several, by the three-coin method, and map the cast to its reading.

Usage:
  python3 council/iching/cast.py shaman architect daemon-skeptic     one cast per agent named
  python3 council/iching/cast.py --json shaman                       the same, as JSON for a ledger
  python3 council/iching/cast.py --seed 7 shaman                     repeatable, for tests only

Wendell, 2026-10-03: "all agents should be casting the I Ching and using its wisdom to inform their
decisions (not unlike flirtcraft)", and on the board: "We don't need them evenly. We actually want to do a
simulation of the coin method and then map to the reading".

Each line is three coin tosses, heads 3 and tails 2, built from the bottom up. A total of 6 is an old yin line
and 9 an old yang line; both are changing. 7 is young yang and 8 young yin. The lines give the primary
hexagram. When any line is changing, those lines flip and give the hexagram it becomes, and the cast maps to
both readings. Each agent gets its own cast. A face casts for the daemons it sends, and passes each daemon
its cast, so the daemons stay read-only.
"""
import json
import random
import secrets
import sys
from pathlib import Path

import yaml

TABLE = Path(__file__).resolve().parent / "hexagrams.yaml"


LINE = {6: (0, True, "old yin, changing"), 7: (1, False, "young yang"), 8: (0, False, "young yin"),
        9: (1, True, "old yang, changing")}


def reading(h, tri):
    lo, up = tri[h["lower"]], tri[h["upper"]]
    return {"n": h["n"], "name": h.get("name"), "cn": h["cn"], "pinyin": h["pinyin"], "lines": h["lines"],
            "shows": h.get("shows"), "image": h.get("image"), "situation": h.get("situation"),
            "lower": {"trigram": h["lower"], **{k: lo[k] for k in ("symbol", "name", "quality")}},
            "upper": {"trigram": h["upper"], **{k: up[k] for k in ("symbol", "name", "quality")}}}


def cast(agents, seed=None):
    data = yaml.safe_load(TABLE.read_text())
    tri = data["trigrams"]
    by_lines = {tuple(h["lines"]): h for h in data["hexagrams"]}
    rng = random.Random(seed) if seed is not None else secrets.SystemRandom()
    out = []
    for agent in agents:
        tosses = [[rng.choice((2, 3)) for _ in range(3)] for _ in range(6)]  # bottom line first
        values = [sum(t) for t in tosses]
        primary = [LINE[v][0] for v in values]
        changing = [i + 1 for i, v in enumerate(values) if LINE[v][1]]
        becomes = [1 - b if LINE[v][1] else b for b, v in zip(primary, values)]
        c = {"agent": agent, "method": "three coins", "tosses": tosses, "values": values,
             "changing_lines": changing, **reading(by_lines[tuple(primary)], tri)}
        if changing:
            c["becomes"] = reading(by_lines[tuple(becomes)], tri)
        out.append(c)
    return out


def main(argv):
    args = argv[1:]
    as_json = "--json" in args
    seed = None
    if "--seed" in args:
        i = args.index("--seed")
        seed = int(args[i + 1])
        del args[i:i + 2]
    agents = [a for a in args if not a.startswith("--")] or ["agent"]
    casts = cast(agents, seed)
    if as_json:
        print(json.dumps(casts, ensure_ascii=False))
        return 0
    for c in casts:
        print(f"{c['agent']}: hexagram {c['n']}, {c['name']}, {c['cn']} ({c['pinyin']}), cast with three coins")
        for pos in range(6, 0, -1):
            v = c["values"][pos - 1]
            mark = {6: "━━━ ━━━  x", 7: "━━━━━━━", 8: "━━━ ━━━", 9: "━━━━━━━  o"}[v]
            print(f"  {mark:<12} line {pos}: {v}, {LINE[v][2]}")
        print(f"  {c['upper']['symbol']} {c['upper']['trigram']}, {c['upper']['name']} ({c['upper']['quality']}), above")
        print(f"  {c['lower']['symbol']} {c['lower']['trigram']}, {c['lower']['name']} ({c['lower']['quality']}), below")
        print(f"  Shows: {c['shows']}\n  Image: {c['image']}\n  Situation: {c['situation']}")
        if c["changing_lines"]:
            b = c["becomes"]
            lines = ", ".join(str(x) for x in c["changing_lines"])
            print(f"  Changing lines: {lines}. It becomes hexagram {b['n']}, {b['name']}, {b['cn']} ({b['pinyin']}).")
            print(f"  Becomes, shows: {b['shows']}\n  Becomes, situation: {b['situation']}")
        else:
            print("  No changing lines.")
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
