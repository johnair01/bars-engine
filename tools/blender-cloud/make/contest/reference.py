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
    # Without this the last object made still reports its unscaled box (a scaled Floor measured as "no floor").
    bpy.context.view_layer.update()
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
        # A part that starts at or below the blade's base touches it, even when it reaches above it: a blade
        # buried in its socket collar is joined, not floating. Wide parts (wall, floor, rack) do not count.
        below = [p for p in ps if p is not blade and p["lo_z"] <= blade["lo_z"] + 0.001
                 and max(p["wx"], p["wy"]) <= 0.6]
        if below:
            gap = round(max(0.0, blade["lo_z"] - max(p["hi_z"] for p in below)), 3)
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


def outline_overlap(pack):
    """Overlap (IoU) of the built head's front silhouette with a traced outline, in place in the world.

    The pack's `blade_outline` holds the traced points (x, z in metres), `min_iou` and `z_min`, the height below
    which the socket collar and shaft are ignored. Only parts narrower than 1 m and shorter than 2.5 m count, so the
    rack, wall, floor and shaft do not. Returns None when the pack has no outline."""
    bo = pack.get("blade_outline")
    if not bo:
        return None
    import bpy
    import numpy as np
    px, z0 = 200, bo["z_min"]
    xs = np.arange(-0.7, 0.7, 1 / px) + 0.5 / px
    zs = np.arange(z0, z0 + 1.2, 1 / px) + 0.5 / px
    gx, gz = np.meshgrid(xs, zs)
    built = np.zeros(gx.shape, bool)
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in bpy.context.scene.objects:
        if ob.type != "MESH":
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        vs = [ob.matrix_world @ v.co for v in me.vertices]
        if vs and (max(v.x for v in vs) - min(v.x for v in vs)) <= 1.0 and (max(v.z for v in vs) - min(v.z for v in vs)) <= 2.5:
            me.calc_loop_triangles()
            for t in me.loop_triangles:
                a, b, c = (vs[i] for i in t.vertices)
                if max(a.z, b.z, c.z) < z0 or min(a.z, b.z, c.z) > z0 + 1.2:
                    continue
                d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z)
                if abs(d) < 1e-12:
                    continue
                l1 = ((b.z - c.z) * (gx - c.x) + (c.x - b.x) * (gz - c.z)) / d
                l2 = ((c.z - a.z) * (gx - c.x) + (a.x - c.x) * (gz - c.z)) / d
                built |= (l1 >= 0) & (l2 >= 0) & (l1 + l2 <= 1)
        ev.to_mesh_clear()
    pts = bo["points"]
    inside = np.zeros(gx.shape, bool)
    for i in range(len(pts)):  # even-odd ray cast, so the concave hook fills correctly
        (x1, z1), (x2, z2) = pts[i], pts[(i + 1) % len(pts)]
        if z1 == z2:
            continue
        cross = ((z1 > gz) != (z2 > gz)) & (gx < (x2 - x1) * (gz - z1) / (z2 - z1) + x1)
        inside ^= cross
    inside &= gz >= z0
    union = int((built | inside).sum())
    return round(int((built & inside).sum()) / union, 3) if union else 0.0


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
    iou = outline_overlap(pack)
    if iou is not None:
        need = pack["blade_outline"]["min_iou"]
        checks.append({"check": "blade outline", "ok": iou >= need,
                       "detail": f"front silhouette overlaps the traced outline {iou:.2f}; the pack asks for {need:.2f}"})
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
