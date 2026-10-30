"""The forest kit: procgen.py's roots and mushrooms baked once into one small GLB the Between's lands load
(public/between/land/forest-kit.glb). No bpy: procgen gives (verts, faces) lists and this writes glTF 2.0 by hand,
one mesh per piece, positions and indices only (the page computes normals and colours).

    python3 tools/blender-cloud/forest_kit.py            # writes public/between/land/forest-kit.glb
    python3 tools/blender-cloud/forest_kit.py --check    # rebuilds in memory and fails if the file on disk differs

Same seeds, same bytes (procgen's own promise), so the check keeps the GLB and this recipe in step. procgen is z-up;
glTF is y-up, so (x, y, z) is written as (x, z, -y)."""
import json, math, os, struct, sys

sys.path.insert(0, os.path.dirname(__file__))
from procgen import ROOT_STYLES, colony, mushroom_cluster, root_cluster, root_system  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "between", "land", "forest-kit.glb")

# name -> (verts, faces). Kept few and small: the land instances them round the clearing.
def pieces():
    out = {}
    out["mushrooms-colony-a"] = colony(seed=11, count=9, forms=("dome", "bell", "flat"))
    v, f, _ = mushroom_cluster(seed=13, kind="ring", count=11, forms=("dome", "flat"), spread=0.55)
    out["mushrooms-ring"] = (v, f)
    v, f, _ = mushroom_cluster(seed=14, kind="drift", count=7, forms=("bulbous", "dome", "funnel"), spread=0.35)
    out["mushrooms-drift"] = (v, f)
    out["roots-buttress-a"] = root_cluster(seed=21, kind="knot", count=4, style="buttress", spread=0.5)
    out["roots-buttress-b"] = root_cluster(seed=22, kind="knot", count=3, style="buttress", spread=0.4)
    out["roots-hanging-a"] = root_system(seed=24, roots=3, spread=0.6, **ROOT_STYLES["hanging"])
    out["roots-hanging-b"] = root_system(seed=25, roots=2, spread=0.5, **ROOT_STYLES["hanging"])
    return out


def tris(faces):
    for f in faces:
        for i in range(1, len(f) - 1):
            yield f[0], f[i], f[i + 1]


def glb(parts):
    bin_, views, accs, meshes, nodes = bytearray(), [], [], [], []
    def view(data, target):
        while len(bin_) % 4: bin_.append(0)
        views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(data), "target": target})
        bin_.extend(data)
        return len(views) - 1
    for name, (verts, faces) in parts.items():
        pos = [(round(x, 4), round(z, 4), round(-y, 4)) for x, y, z in verts]
        idx = [i for t in tris(faces) for i in t]
        big = len(pos) > 65535
        pv = view(struct.pack("<%df" % (len(pos) * 3), *[c for p in pos for c in p]), 34962)
        iv = view(struct.pack("<%d%s" % (len(idx), "I" if big else "H"), *idx), 34963)
        lo = [min(p[k] for p in pos) for k in range(3)]; hi = [max(p[k] for p in pos) for k in range(3)]
        accs.append({"bufferView": pv, "componentType": 5126, "count": len(pos), "type": "VEC3", "min": lo, "max": hi})
        accs.append({"bufferView": iv, "componentType": 5125 if big else 5123, "count": len(idx), "type": "SCALAR"})
        meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": len(accs) - 2}, "indices": len(accs) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1})
    while len(bin_) % 4: bin_.append(0)
    doc = {"asset": {"version": "2.0", "generator": "bars-engine tools/blender-cloud/forest_kit.py"},
           "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
           "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}]}
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    body = struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(bin_), 0x004E4942) + bytes(bin_)
    return struct.pack("<III", 0x46546C67, 2, 12 + len(body)) + body


if __name__ == "__main__":
    data = glb(pieces())
    if "--check" in sys.argv:
        same = os.path.exists(OUT) and open(OUT, "rb").read() == data
        print("forest kit matches its recipe" if same else "forest kit differs from its recipe: rerun forest_kit.py")
        sys.exit(0 if same else 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "wb").write(data)
    print(f"wrote {os.path.relpath(OUT)} ({len(data) // 1024} KB)")
