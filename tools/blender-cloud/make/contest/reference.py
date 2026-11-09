"""Measure a built contest object against a reference pack.

  <blender-python> reference.py <candidate.py> <pack.json> [--json <out>]

The pack names what the object is made of, in metres, and the scene it should sit in. This builds the candidate,
measures the parts it made, and fails the checks the numbers can settle. It does not judge how the object looks;
that stays Wendell's look.
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
        lo = Vector(tuple(min(p[i] for p in pts) for i in range(3)))
        hi = Vector(tuple(max(p[i] for p in pts) for i in range(3)))
        dim = hi - lo
        out.append({"name": o.name, "lo": lo, "hi": hi, "height": dim[2],
                    "span": max(dim[0], dim[1]), "thin": max(dim[0], dim[1])})
    return out


def measure(pack, ps):
    c = pack["object_checks"]
    checks = []
    shaft = max((p for p in ps if p["height"] >= c["shaft"]["min_height"]
                 and p["height"] / max(p["thin"], 1e-6) >= c["shaft"]["min_aspect"]),
                key=lambda p: p["height"], default=None)
    checks.append({"check": "shaft", "ok": bool(shaft),
                   "detail": (f"{shaft['name']} {shaft['height']:.2f} m tall, "
                              f"{shaft['height'] / max(shaft['thin'], 1e-6):.0f}x its thickness") if shaft
                   else f"no part at least {c['shaft']['min_height']} m tall and {c['shaft']['min_aspect']}x thin"})
    blade = None
    if shaft:
        above = [p for p in ps if p is not shaft and p["lo"].z >= shaft["hi"].z - 0.05]
        blade = max((p for p in above if p["height"] >= c["blade"]["min_length"]
                     and p["span"] >= c["blade"]["min_width"]), key=lambda p: p["hi"].z, default=None)
    checks.append({"check": "blade", "ok": bool(blade),
                   "detail": (f"{blade['name']} {blade['height']:.2f} m by {blade['span']:.2f} m above the shaft")
                   if blade else "no blade above the shaft at the pack's size"})
    gap = None
    if blade:
        below = [p for p in ps if p is not blade and p["hi"].z <= blade["lo"].z + 0.001]
        if below:
            gap = round(blade["lo"].z - max(p["hi"].z for p in below), 3)
    ok = gap is not None and gap <= c["contact_max_gap"]
    checks.append({"check": "contact", "ok": ok,
                   "detail": (f"blade sits {gap * 100:.0f} cm above the nearest part below it"
                              if gap is not None else "no part below the blade"),
                   "tolerance_cm": c["contact_max_gap"] * 100})
    lo_z, hi_z = c["rack"]["top_between"]
    rack = max((p for p in ps if lo_z <= p["hi"].z <= hi_z and p["span"] >= c["rack"]["min_span"]),
               key=lambda p: p["span"], default=None)
    checks.append({"check": "rack", "ok": bool(rack),
                   "detail": (f"{rack['name']} spans {rack['span']:.2f} m with its top at {rack['hi'].z:.2f} m")
                   if rack else f"no rack spanning {c['rack']['min_span']} m with a top between {lo_z} and {hi_z} m"})
    top = max((p["hi"].z for p in ps), default=0.0)
    th = c["total_height"]
    checks.append({"check": "total height", "ok": th["min"] <= top <= th["max"],
                   "detail": f"{top:.2f} m against the pack's {th['min']} to {th['max']} m"})
    return checks


def scene(pack, ps):
    s = pack.get("scene") or {}
    out = []
    if "floor" in s:
        floor = max((p for p in ps if p["height"] <= s["floor"]["max_thickness"]
                     and p["span"] >= s["floor"]["min_span"]), key=lambda p: p["span"], default=None)
        out.append({"check": "floor under it", "ok": bool(floor),
                    "detail": f"{floor['name']} spans {floor['span']:.2f} m" if floor else "no floor"})
    if "wall" in s:
        wall = max((p for p in ps if p["height"] >= s["wall"]["min_height"]
                    and p["span"] >= s["wall"]["min_span"]), key=lambda p: p["height"], default=None)
        out.append({"check": "wall behind it", "ok": bool(wall),
                    "detail": f"{wall['name']} {wall['height']:.2f} m tall" if wall else "no wall"})
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
              "parts": sorted(({"name": p["name"], "height": round(p["height"], 2),
                                "lo_z": round(p["lo"].z, 2), "hi_z": round(p["hi"].z, 2)} for p in ps),
                              key=lambda p: -p["hi_z"])[:8]}
    if "--json" in sys.argv:
        with open(sys.argv[sys.argv.index("--json") + 1], "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=1)
    print(json.dumps(result, indent=1))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
