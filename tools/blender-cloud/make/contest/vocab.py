"""A pack's own parts, and how the gate measures each one.

A pack lists `parts`: a name, a selector that finds the part among the built meshes, and the numbers that part must meet.
The gate looks the measures up here. A new kind of object adds data to its pack and, only when it needs a new way to
measure, one entry in MEASURES. Nothing in this file knows what a hearth or a polearm is.

Every function works on plain dicts (reference.parts() builds them), so the checks run without Blender.
A part dict: name, lo_z, hi_z, wx, wy, x0, x1, y0, y1, long, mid, short (metres).
"""

# What a selector may constrain. Each key reads one number off a part dict, or a derived one.
FIELDS = {
    "long": lambda p: p["long"],
    "mid": lambda p: p["mid"],
    "short": lambda p: p["short"],
    "height": lambda p: p["hi_z"] - p["lo_z"],
    "lo_z": lambda p: p["lo_z"],
    "hi_z": lambda p: p["hi_z"],
    "span": lambda p: max(p["wx"], p["wy"]),
    "depth": lambda p: min(p["wx"], p["wy"]),
}


def _in(v, lo, hi):
    return (lo is None or v >= lo) and (hi is None or v <= hi)


def select(ps, where):
    """Parts matching every `{"field": {"min": a, "max": b}}` constraint in `where`."""
    out = []
    for p in ps:
        if all(_in(FIELDS[k](p), c.get("min"), c.get("max")) for k, c in where.items()):
            out.append(p)
    return out


def _find(ps, spec, taken):
    pool = [p for p in select(ps, spec.get("where", {})) if id(p) not in taken]
    want = spec.get("count", 1)
    pick = spec.get("pick")
    if pick:
        pool = sorted(pool, key=lambda p: FIELDS[pick["by"]](p), reverse=pick.get("order", "max") == "max")
    return pool[:want] if len(pool) >= want else []


def _numbers(found, spec):
    """Check the part's own numbers: `{"field": {"min": a, "max": b}}` held by every part found."""
    bad = []
    for key, c in spec.get("numbers", {}).items():
        for p in found:
            v = FIELDS[key](p)
            if not _in(v, c.get("min"), c.get("max")):
                bad.append(f"{p['name']} {key} {v:.2f} m outside {c.get('min')} to {c.get('max')}")
    return bad


def m_part(found, spec, ps):
    bad = _numbers(found, spec)
    names = ", ".join(p["name"] for p in found)
    return (not bad), (names if not bad else "; ".join(bad))


def m_above(found, spec, ps):
    """The part sits on top of another named part, touching it within `max_gap`."""
    other = spec["above"]
    tol = spec.get("max_gap", 0.02)
    base = other["found"]
    gaps = [p["lo_z"] - max(b["hi_z"] for b in base) for p in found]
    ok = all(-0.05 <= g <= tol for g in gaps)
    return ok, f"{', '.join(f'{g * 100:.0f} cm' for g in gaps)} above {other['name']} (limit {tol * 100:.0f} cm)"


def m_opening(found, spec, ps):
    """The clear span between two found parts, side by side along one axis."""
    axis = spec.get("axis", "x")
    lo_k, hi_k = (("x0", "x1") if axis == "x" else ("y0", "y1"))
    a, b = sorted(found, key=lambda p: p[lo_k])[:2]
    gap = b[lo_k] - a[hi_k]
    c = spec["gap"]
    return _in(gap, c.get("min"), c.get("max")), f"{gap:.2f} m between {a['name']} and {b['name']}"


MEASURES = {"part": m_part, "above": m_above, "opening": m_opening}


def run(pack, ps):
    """Measure every part the pack names. Returns a list of {check, ok, detail}."""
    out, cache = [], {}
    for spec in pack["parts"]:
        kind = spec.get("measure", "part")
        found = _find(ps, spec, set())
        cache[spec["name"]] = found
        if not found:
            if spec.get("optional"):
                out.append({"check": spec["name"], "ok": True, "detail": "optional, not built"})
            else:
                out.append({"check": spec["name"], "ok": False, "detail": "no part matches the pack's selector"})
            continue
        if "above" in spec:
            spec = dict(spec, above={"name": spec["above"], "found": cache.get(spec["above"], [])})
            if not spec["above"]["found"]:
                out.append({"check": spec["name"], "ok": False, "detail": f"{spec['above']['name']} not found"})
                continue
            kind = "above"
        fn = MEASURES[kind]
        ok, detail = fn(found, spec, ps)
        out.append({"check": spec["name"], "ok": bool(ok), "detail": detail})
    return out
