"""Measure a code-built jian against the Met 27931 reference pack.

This gate checks dimensions and part relationships. A human still judges the rendered silhouette.
Usage: blender -b --python blender_gate.py -- jian_reference.py candidate.py jian.json --json result.json
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import qa  # noqa: E402


def part(name, lo, hi, nonmanifold_edges=0):
    return {"name": name, "lo": lo, "hi": hi, "nonmanifold_edges": nonmanifold_edges}


def span(p, axis):
    return p["hi"][axis] - p["lo"][axis]


def measure(parts, spec):
    by_name = {p["name"].lower(): p for p in parts}
    checks = []

    def add(name, ok, detail):
        checks.append({"check": name, "ok": bool(ok), "detail": detail})

    required = ("blade", "grip", "guard", "pommel")
    for name in required:
        add(f"part {name}", name in by_name, f"{name} mesh {'found' if name in by_name else 'missing'}")
    open_parts = {p["name"]: p["nonmanifold_edges"] for p in parts if p["nonmanifold_edges"]}
    add("closed meshes", not open_parts, f"nonmanifold edges: {open_parts}")
    if not all(name in by_name for name in required):
        return checks

    blade, grip, guard, pommel = (by_name[name] for name in required)
    dims = spec["object_checks"]
    blade_length = span(blade, 2)
    blade_width = span(blade, 0)
    blade_depth = span(blade, 1)
    add("blade length", dims["blade_length"][0] <= blade_length <= dims["blade_length"][1],
        f"{blade_length:.3f} m, expected {dims['blade_length']}")
    add("blade width", dims["blade_width"][0] <= blade_width <= dims["blade_width"][1],
        f"{blade_width:.3f} m, expected {dims['blade_width']}")
    add("blade thickness", dims["blade_thickness"][0] <= blade_depth <= dims["blade_thickness"][1],
        f"{blade_depth:.3f} m, expected {dims['blade_thickness']}")
    grip_length = span(grip, 2)
    add("grip length", dims["grip_length"][0] <= grip_length <= dims["grip_length"][1],
        f"{grip_length:.3f} m, expected {dims['grip_length']}")
    guard_width = span(guard, 0)
    add("guard width", dims["guard_width"][0] <= guard_width <= dims["guard_width"][1],
        f"{guard_width:.3f} m, expected {dims['guard_width']}")
    blade_guard_gap = blade["lo"][2] - guard["hi"][2]
    grip_guard_gap = guard["lo"][2] - grip["hi"][2]
    add("blade meets guard", -0.025 <= blade_guard_gap <= dims["contact_max_gap"],
        f"blade to guard {blade_guard_gap:.3f} m")
    add("grip meets guard", -0.025 <= grip_guard_gap <= dims["contact_max_gap"],
        f"grip to guard {grip_guard_gap:.3f} m")
    add("pommel below grip", pommel["hi"][2] >= grip["lo"][2] - dims["contact_max_gap"]
        and pommel["lo"][2] < grip["lo"][2], "pommel is at the grip base")
    sword_length = max(p["hi"][2] for p in (blade, grip, guard, pommel)) - min(
        p["lo"][2] for p in (blade, grip, guard, pommel))
    add("whole length", dims["whole_length"][0] <= sword_length <= dims["whole_length"][1],
        f"{sword_length:.3f} m, expected {dims['whole_length']}")
    add("straight", abs((blade["lo"][0] + blade["hi"][0]) / 2 -
                        (grip["lo"][0] + grip["hi"][0]) / 2) <= dims["axis_max_offset"],
        "blade and grip share one vertical axis")
    forbidden = [p["name"] for p in parts if "rack" in p["name"].lower() or "polearm" in p["name"].lower()]
    add("no polearm scene", not forbidden, f"unexpected meshes: {forbidden}")
    return checks


def build_parts(script):
    import bpy
    import bmesh
    from mathutils import Vector
    real = sys.modules["bpy"]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    sys.modules["bpy"] = qa.quiet_bpy(real)
    try:
        namespace = qa.runpy_namespace(script)
        fn = namespace.get("build_object")
        if not callable(fn):
            raise ValueError("no build_object()")
        fn()
    finally:
        sys.modules["bpy"] = real
    found = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        mesh = bmesh.new()
        mesh.from_mesh(obj.data)
        nonmanifold_edges = sum(not edge.is_manifold for edge in mesh.edges)
        mesh.free()
        found.append(part(obj.name,
                          [min(v[i] for v in points) for i in range(3)],
                          [max(v[i] for v in points) for i in range(3)],
                          nonmanifold_edges))
    return found


def main(argv):
    if len(argv) < 2:
        raise SystemExit("usage: jian_reference.py candidate.py pack.json [--json path]")
    script, pack_path = argv[:2]
    spec = json.load(open(pack_path, encoding="utf-8"))
    parts = build_parts(script)
    checks = measure(parts, spec)
    result = {"ok": all(c["ok"] for c in checks), "checks": checks, "parts": parts}
    if "--json" in argv:
        with open(argv[argv.index("--json") + 1], "w", encoding="utf-8") as out:
            json.dump(result, out, indent=2)
    print(json.dumps(result))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

