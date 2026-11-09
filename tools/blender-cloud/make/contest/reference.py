"""Measure a built contest object against a reference pack.

  <blender-python> reference.py <candidate.py> <pack.json> [--json <out>]

The pack names what the object is made of, in metres, and the scene it should sit in. This builds the candidate,
measures the parts it made, and fails the checks the numbers can settle. It does not judge how the object looks;
that stays Wendell's look.

Sizes come from each part's own dimensions, not its world bounding box: a shaft tilted 8 degrees would otherwise
measure a third of a metre wide and fail as too thick to be a shaft. Widths that must lie flat in the world, like a
rack crossbar, come from the world box instead.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import qa  # noqa: E402 - the gate's own builder, so a candidate is built the way the contest builds it


def build(path):
    import bpy
    real = sys.modules.get("bpy")
    sys.modules["bpy"] = qa.quiet_bpy(real)
    try:
        ns = qa.runpy_namespace(path)
        entry = ns.get("build_object") or ns.get("build")
        if not callable(entry):
            raise SystemExit("no build_object() entrypoint")
        entry()
    finally:
        if real is not None:
            sys.modules["bpy"] = real
        else:
            sys.modules.pop("bpy", None)


def parts():
    import bpy
    from mathutils import Vector
    out = []
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
        zs = [v.z for v in pts]
        wx = max(v.x for v in pts) - min(v.x for v in pts)
        wy = max(v.y for v in pts) - min(v.y for v in pts)
        dims = sorted((float(d) for d in o.dimensions), reverse=True)
        out.append({"name": o.name, "lo_z": min(zs), "hi_z": max(zs), "wx": wx, "wy": wy,
                    "long": dims[0], "mid": dims[1], "short": dims[2]})
    return out


def measure(pack, ps):
    c = pack["object_checks"]
    checks = []
    sh = c["shaft"]
    shaft = max((p for p in ps if sh["min_height"] <= p["long"] <= sh["max_height"]
                 and p["long"] / max(p["short"], 1e-6) >= sh["min_aspect"]),
                key=lambda p: p["long"], default=None)
    checks.append({"check": "shaft", "ok": bool(shaft),
                   "detail": (f"{shaft['name']} {shaft['long']:.2f} m long, "
                              f"{shaft['long'] / max(shaft['short'], 1e-6):.0f}x its thickness") if shaft
                   else f"no part between {sh['min_height']} and {sh['max_height']} m long and {sh['min_aspect']}x thin"})
    bl = c["blade"]
    blade = None
    if shaft:
        above = [p for p in ps if p is not shaft and p["lo_z"] >= shaft["hi_z"] - 0.05]
        blade = max((p for p in above if p["long"] >= bl["min_length"] and p["mid"] >= bl["min_width"]),
                    key=lambda p: p["hi_z"], default=None)
    checks.append({"check": "blade", "ok": bool(blade),
                   "detail": (f"{blade['name']} {blade['long']:.2f} m by {blade['mid']:.2f} m above the shaft")
                   if blade else "no blade above the shaft at the pack's size"})
    gap = None
    if blade:
        below = [p for p in ps if p is not blade and p["hi_z"] <= blade["lo_z"] + 0.001]
        if below:
            gap = round(blade["lo_z"] - max(p["hi_z"] for p in below), 3)
    tol = c["contact_max_gap"]
    checks.append({"check": "contact", "ok": gap is not None and gap <= tol,
                   "detail": (f"blade sits {gap * 100:.0f} cm above the nearest part below it"
                              if gap is not None else "no part below the blade"),
                   "tolerance_cm": tol * 100})
    lo_z, hi_z = c["rack"]["top_between"]
    rack = max((p for p in ps if lo_z <= p["hi_z"] <= hi_z
                and max(p["wx"], p["wy"]) >= c["rack"]["min_span"]),
               key=lambda p: max(p["wx"], p["wy"]), default=None)
    checks.append({"check": "rack", "ok": bool(rack),
                   "detail": (f"{rack['name']} {max(rack['wx'], rack['wy']):.2f} m wide with its top at {rack['hi_z']:.2f} m")
                   if rack else f"no rack {c['rack']['min_span']} m wide with a top between {lo_z} and {hi_z} m"})
    top = max((p["hi_z"] for p in ps), default=0.0)
    th = c["total_height"]
    checks.append({"check": "total height", "ok": th["min"] <= top <= th["max"],
                   "detail": f"{top:.2f} m against the pack's {th['min']} to {th['max']} m"})
    return checks


def scene(pack, ps):
    s = pack.get("scene") or {}
    out = []
    if "floor" in s:
        floor = max((p for p in ps if (p["hi_z"] - p["lo_z"]) <= s["floor"]["max_thickness"]
                     and max(p["wx"], p["wy"]) >= s["floor"]["min_span"]),
                    key=lambda p: max(p["wx"], p["wy"]), default=None)
        out.append({"check": "floor under it", "ok": bool(floor),
                    "detail": f"{floor['name']} {max(floor['wx'], floor['wy']):.2f} m across"
                    if floor else "no floor"})
    if "wall" in s:
        wall = max((p for p in ps if (p["hi_z"] - p["lo_z"]) >= s["wall"]["min_height"]
                    and max(p["wx"], p["wy"]) >= s["wall"]["min_span"]
                    and min(p["wx"], p["wy"]) <= 0.6),
                   key=lambda p: p["hi_z"] - p["lo_z"], default=None)
        out.append({"check": "wall behind it", "ok": bool(wall),
                    "detail": f"{wall['name']} {wall['hi_z'] - wall['lo_z']:.2f} m tall" if wall else "no wall"})
    return out


def main():
    args = [a for a in sys.argv[1:] if a != "--json"]
    src, pack_path = args[0], args[1]
    pack = json.load(open(pack_path, encoding="utf-8"))
    build(src)
    ps = parts()
    checks = measure(pack, ps)
    extras = scene(pack, ps)
    result = {"candidate": os.path.basename(src), "pack": pack["id"],
              "ok": all(c["ok"] for c in checks), "checks": checks, "scene": extras,
              "parts": sorted(({"name": p["name"], "long": round(p["long"], 2),
                                "lo_z": round(p["lo_z"], 2), "hi_z": round(p["hi_z"], 2)} for p in ps),
                              key=lambda p: -p["hi_z"])[:8]}
    if "--json" in sys.argv:
        with open(sys.argv[sys.argv.index("--json") + 1], "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=1)
    print(json.dumps(result, indent=1))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
