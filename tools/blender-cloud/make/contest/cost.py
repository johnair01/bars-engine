"""What each contender spent, and what the spend bought.

  python3 cost.py <contest dir> [--marks <marks.json>]

Tokens and price come from <contender>/usage.json when a run keeps them:

  {"model": "deepseek-v4-flash", "price_per_mtok": {"in": 0.28, "out": 1.10},
   "price_source": "the provider's price sheet, read 2026-11-09",
   "rounds": [{"tokens_in": 1200, "tokens_out": 3400},
              {"tokens_in": 2600, "tokens_out": 1800}]}

Round 0 is the first build; later rounds are refinements. No price is guessed: with none, the cost stays null and
says so. A mark is Wendell's look out of ten, read from the marks file, and satisfaction is that mark over the cost
and over the wall time, so a cheap object that reads badly cannot look efficient.
"""
import json
import sys
from pathlib import Path

CONTENDERS = ("deepseek", "glm")


def usage_of(d):
    p = d / "usage.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def cost_of(u):
    if not u:
        return {"usd": None, "why": "no usage kept for this run; the race recorded wall time and script size only"}
    price = u.get("price_per_mtok") or {}
    if price.get("in") is None or price.get("out") is None:
        return {"usd": None, "why": "usage kept, price not set; fill price_per_mtok from the provider's sheet"}
    def one(r):
        return (r.get("tokens_in", 0) * price["in"] + r.get("tokens_out", 0) * price["out"]) / 1_000_000
    rounds = u.get("rounds") or []
    initial = one(rounds[0]) if rounds else None
    refine = sum(one(r) for r in rounds[1:])
    return {"usd": round(initial + refine, 6) if initial is not None else None,
            "initial_usd": round(initial, 6) if initial is not None else None,
            "refine_usd": round(refine, 6), "rounds": len(rounds),
            "model": u.get("model"), "price_source": u.get("price_source")}


def main():
    args = [a for a in sys.argv[1:] if a != "--marks"]
    root = Path(args[0])
    marks_path = Path(sys.argv[sys.argv.index("--marks") + 1]) if "--marks" in sys.argv else None
    marks = json.loads(marks_path.read_text(encoding="utf-8")) if marks_path else {"marks": {}}
    rows = []
    for c in CONTENDERS:
        d = root / c
        results = json.loads((d / "results.json").read_text(encoding="utf-8"))
        gen = round(sum(r.get("seconds") or 0 for r in results), 1)
        render = round(sum((r.get("render") or {}).get("seconds") or 0 for r in results), 1)
        cost = cost_of(usage_of(d))
        mark = marks.get("marks", {}).get(c)
        minutes = gen / 60
        rows.append({"contender": c, "objects": len(results), "generation_seconds": gen,
                     "render_seconds": render, "code_bytes": sum(r.get("size") or 0 for r in results),
                     "cost": cost, "mark_out_of_ten": mark,
                     "satisfaction_per_minute": round(mark / minutes, 2) if mark and minutes else None,
                     "satisfaction_per_dollar": round(mark / cost["usd"], 2) if mark and cost.get("usd") else None})
    out = {"marks_source": marks.get("source"), "contenders": rows}
    print(json.dumps(out, indent=1))
    print()
    for r in rows:
        usd = f"${r['cost']['usd']}" if r["cost"].get("usd") is not None else "no cost (" + r["cost"]["why"].split(';')[0] + ")"
        print(f"{r['contender']:9s} {r['objects']} objects  {r['generation_seconds']:6.1f}s gen  {r['render_seconds']:5.1f}s render  "
              f"{r['code_bytes'] / 1024:5.1f} KB  mark {r['mark_out_of_ten']}/10  {usd}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
