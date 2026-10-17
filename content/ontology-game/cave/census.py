"""The mesh census: what a GLB's meshes are made of, and whether a figure's body is one closed solid of a stated size.

    python3 content/ontology-game/cave/census.py FILE.glb [--kind humanoid|npc|spirit|chamber] [--json]

Plain Python, no bpy, so it runs anywhere the offline tests run. Per mesh it counts vertices (merged by position, as
glTF splits them at every seam), triangles, open edges (one triangle), non-manifold edges (three or more), loose
vertices (on no triangle) and degenerate triangles (no area), and measures the whole file's box in metres.

A humanoid must pass: its body (the skinned mesh) has no open or non-manifold edges and no loose vertices, at most
MAX_DEGENERATE degenerate triangles, and the file's box lies within BOX["humanoid"]. A solid with open edges breaks a
boolean, a physics collider or a print, and nothing asserted it before (call sheet blender-frame-flesh-warp).
Kit-bashed spirits and the chamber only report: their pieces are open shells by design, read as sprites. Exit 1 when a
figure that must pass does not.

An NPC is a humanoid warped into its daemon's gesture (character.py WARP): it passes the same solid test inside a
wider box, since a held gesture flings the arms wide (Emotional Body, 1.5 m), reaches them forward (Fixer, 1.2 m
deep) or sinks the figure into its knees (Victim, 1.4 m tall). The box still catches a figure built at the wrong
scale.
"""
import argparse, json, math, struct, sys

# metres: (min, max) across x, y and z of the whole file, Y up as glTF stores it. A cave character is 1.75 m.
BOX = {
    "humanoid": ((0.3, 1.0), (1.6, 1.9), (0.15, 0.8)),
    "npc": ((0.3, 1.9), (1.2, 1.95), (0.15, 1.4)),
    "spirit": ((0.05, 3.0), (0.05, 3.0), (0.05, 3.0)),
    "chamber": ((1.0, 200.0), (0.5, 50.0), (1.0, 200.0)),
}
MUST_PASS = {"humanoid", "npc"}
MAX_DEGENERATE = 8          # a remesh leaves a few slivers of no area; they render as nothing and break nothing
WELD = 1e-5                 # metres: vertices this close are one


def read_glb(path):
    b = open(path, "rb").read()
    if b[:4] != b"glTF":
        raise SystemExit(f"{path}: not a GLB")
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    rest = b[20 + n:]
    binary = rest[8:8 + struct.unpack("<I", rest[:4])[0]] if rest else b""
    return j, binary


COMP = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def accessor(j, binary, i):
    a = j["accessors"][i]
    v = j["bufferViews"][a["bufferView"]]
    fmt, size = COMP[a["componentType"]]
    w = WIDTH[a["type"]]
    stride = v.get("byteStride") or size * w
    off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    out = []
    for k in range(a["count"]):
        out.append(struct.unpack_from("<" + fmt * w, binary, off + k * stride))
    return out


def mat_mul(a, b):
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]


def node_matrix(n):
    if "matrix" in n:
        m = n["matrix"]
        return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    tx, ty, tz = n.get("translation", (0, 0, 0))
    x, y, z, w = n.get("rotation", (0, 0, 0, 1))
    sx, sy, sz = n.get("scale", (1, 1, 1))
    r = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
         [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
         [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[r[0][0] * sx, r[0][1] * sy, r[0][2] * sz, tx], [r[1][0] * sx, r[1][1] * sy, r[1][2] * sz, ty],
            [r[2][0] * sx, r[2][1] * sy, r[2][2] * sz, tz], [0, 0, 0, 1]]


def apply(m, p):
    return tuple(m[r][0] * p[0] + m[r][1] * p[1] + m[r][2] * p[2] + m[r][3] for r in range(3))


def mesh_nodes(j):
    """(node, world matrix) for every node with a mesh, walking the scene from its roots. A skinned mesh is placed
    by its joints, so it is taken as it is stored (glTF ignores a skinned mesh node's own transform)."""
    out = []
    ident = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    scene = j.get("scenes", [{}])[j.get("scene", 0)]
    roots = scene.get("nodes", list(range(len(j.get("nodes", [])))))

    def walk(i, parent):
        n = j["nodes"][i]
        m = mat_mul(parent, node_matrix(n))
        if "mesh" in n:
            out.append((n, ident if "skin" in n else m))
        for c in n.get("children", []):
            walk(c, m)
    for r in roots:
        walk(r, ident)
    return out


def count(points, tris):
    """Weld, then count edges by how many triangles share them."""
    ids, key_of = [], {}
    for p in points:
        k = tuple(round(c / WELD) for c in p)
        ids.append(key_of.setdefault(k, len(key_of)))
    welded = [None] * len(key_of)
    for p, i in zip(points, ids):
        welded[i] = p
    edges, used, degenerate = {}, set(), 0
    for a, b, c in tris:
        a, b, c = ids[a], ids[b], ids[c]
        used.update((a, b, c))
        pa, pb, pc = welded[a], welded[b], welded[c]
        u = [pb[k] - pa[k] for k in range(3)]
        v = [pc[k] - pa[k] for k in range(3)]
        cr = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        if a == b or b == c or a == c or math.sqrt(sum(x * x for x in cr)) < 1e-12:
            degenerate += 1
            continue
        for e in ((a, b), (b, c), (c, a)):
            e = (min(e), max(e))
            edges[e] = edges.get(e, 0) + 1
    return {"verts": len(key_of), "tris": len(tris), "open_edges": sum(1 for n in edges.values() if n == 1),
            "nonmanifold_edges": sum(1 for n in edges.values() if n > 2), "loose_verts": len(key_of) - len(used),
            "degenerate_tris": degenerate}


def census(path, kind="spirit"):
    j, binary = read_glb(path)
    rows, lo, hi = [], [math.inf] * 3, [-math.inf] * 3
    for n, m in mesh_nodes(j):
        mesh = j["meshes"][n["mesh"]]
        points, tris = [], []
        for prim in mesh["primitives"]:
            if prim.get("mode", 4) != 4:
                continue
            base = len(points)
            pts = [apply(m, p) for p in accessor(j, binary, prim["attributes"]["POSITION"])]
            points += pts
            idx = [i[0] for i in accessor(j, binary, prim["indices"])] if "indices" in prim else list(range(len(pts)))
            tris += [(base + idx[k], base + idx[k + 1], base + idx[k + 2]) for k in range(0, len(idx) - 2, 3)]
        for p in points:
            for k in range(3):
                lo[k], hi[k] = min(lo[k], p[k]), max(hi[k], p[k])
        row = {"mesh": n.get("name") or mesh.get("name", "?"), "skinned": "skin" in n}
        row.update(count(points, tris))
        rows.append(row)
    size = [round(hi[k] - lo[k], 3) for k in range(3)] if rows else [0, 0, 0]
    problems = []
    if kind in MUST_PASS:
        bodies = [r for r in rows if r["skinned"]] or rows
        for r in bodies:
            for key, limit in (("open_edges", 0), ("nonmanifold_edges", 0), ("loose_verts", 0),
                               ("degenerate_tris", MAX_DEGENERATE)):
                if r[key] > limit:
                    problems.append(f"{r['mesh']}: {r[key]} {key.replace('_', ' ')} (at most {limit})")
        for k, axis in enumerate("xyz"):
            a, b = BOX[kind][k]
            if not a <= size[k] <= b:
                problems.append(f"{axis} is {size[k]} m, outside {a} to {b} m")
    total = {k: sum(r[k] for r in rows) for k in ("verts", "tris", "open_edges", "nonmanifold_edges", "loose_verts",
                                                  "degenerate_tris")}
    return {"file": str(path), "kind": kind, "meshes": len(rows), "size_m": size, "total": total,
            "must_pass": kind in MUST_PASS, "problems": problems, "rows": rows}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("glb", nargs="+")
    ap.add_argument("--kind", default="spirit", choices=sorted(BOX))
    ap.add_argument("--json", action="store_true", help="one JSON line per file, every mesh's row included")
    a = ap.parse_args()
    failed = False
    for g in a.glb:
        c = census(g, a.kind)
        failed |= bool(c["problems"])
        if a.json:
            print(json.dumps(c))
            continue
        t = c["total"]
        print(f"{g}: {c['meshes']} meshes, {t['verts']} verts, {t['tris']} tris, box {c['size_m']} m; "
              f"{t['open_edges']} open edges, {t['nonmanifold_edges']} non-manifold, {t['loose_verts']} loose verts, "
              f"{t['degenerate_tris']} degenerate tris" + ("; PASS" if c["must_pass"] and not c["problems"] else ""))
        for p in c["problems"]:
            print("  FAIL " + p)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
