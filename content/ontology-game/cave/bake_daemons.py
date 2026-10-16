"""The daemon bodies for the phone: each WARP figure from character.py, stripped to what the cave draws.

character.py --daemons writes one rigged GLB per WARP row (bars-engine #328: the six fundamental movements, the hands
rebuilt per Six-faces-council council/daemons/HANDS.md). The cave does not play their rig yet, so this keeps only the
held pose: positions quantised to 16 bits, normals to 8, and one band per vertex (skin, tunic, trim, sash, trousers,
shoes) read back from the robe colours, so cave.js can dress each daemon in its own colour (cave.js DAEMONS).

Plain Python, no bpy. Run it after character.py --daemons:

  python3 content/ontology-game/cave/bake_daemons.py /tmp/blender-cloud/characters content/ontology-game/cave/daemons

The phone budget (Wendell's Big Mind notes, 2026-10-16: "build game-ready models for each daemon instead of placeholders"):
each body file at most BUDGET_BYTES and BUDGET_TRIS. cave.js fetches a body only when a scene asks for that daemon, so a
chamber loads its voice, the next figure and the waiting voices, never all eight. bigmind-test checks the files against
these numbers.
"""
import json, math, os, struct, sys

BUDGET_BYTES, BUDGET_TRIS = 96 * 1024, 7000
# the figure GLB's id for each daemon id the game uses (cave.js DAEMONS), and the Player for the centre
IDS = ["protector", "controller", "skeptic", "fixer", "victim", "damaged-self", "emotional-body", "player"]
BANDS = ["skin", "tunic", "trim", "sash", "trousers", "shoes"]
SKIN = (0.69, 0.62, 0.53)


def hexc(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# character.py's dusk palette, linear RGB, which every --daemons figure wears
DUSK = {"skin": SKIN, "tunic": hexc("44407a"), "trim": hexc("e9dfc6"), "sash": hexc("b8913f"),
        "trousers": hexc("2c2e44"), "shoes": hexc("1e1b24")}
COMP = {5126: ("f", 4), 5123: ("H", 2), 5125: ("I", 4), 5121: ("B", 1)}
SIZES = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}


def read_glb(path):
    b = open(path, "rb").read()
    n = struct.unpack_from("<I", b, 12)[0]
    j = json.loads(b[20:20 + n])
    bin0 = 20 + n + 8

    def acc(i):
        a = j["accessors"][i]
        v = j["bufferViews"][a["bufferView"]]
        f, s = COMP[a["componentType"]]
        k = SIZES[a["type"]]
        off = bin0 + v.get("byteOffset", 0) + a.get("byteOffset", 0)
        flat = struct.unpack_from(f"<{a['count'] * k}{f}", b, off)
        if a.get("normalized"):
            top = (1 << (8 * s)) - 1
            flat = [x / top for x in flat]
        return [flat[i * k:(i + 1) * k] for i in range(a["count"])] if k > 1 else list(flat)

    p = j["meshes"][0]["primitives"][0]
    at = p["attributes"]
    return acc(at["POSITION"]), acc(at["NORMAL"]), acc(at["COLOR_0"]), acc(p["indices"])


def band_of(rgb):
    return min(range(len(BANDS)), key=lambda i: sum((a - b) ** 2 for a, b in zip(rgb, DUSK[BANDS[i]])))


def bake(src, out):
    pos, nor, col, idx = read_glb(src)
    lo = [min(p[i] for p in pos) for i in range(3)]
    hi = [max(p[i] for p in pos) for i in range(3)]
    span = [max(h - l, 1e-6) for l, h in zip(lo, hi)]
    qp = b"".join(struct.pack("<3H", *(round((p[i] - lo[i]) / span[i] * 65535) for i in range(3))) + b"\0\0" for p in pos)
    qn = b"".join(struct.pack("<4b", *(max(-127, min(127, round(c * 127))) for c in n), 0) for n in nor)
    bands = [band_of(c[:3]) for c in col]
    qb = bytes(bands)
    qb += b"\0" * (-len(qb) % 4)
    qi = struct.pack(f"<{len(idx)}H", *idx)
    qi += b"\0" * (-len(qi) % 4)
    views, blob = [], b""
    for chunk, stride in ((qp, 8), (qn, 4), (qb, None), (qi, None)):
        v = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(chunk)}
        if stride:
            v["byteStride"] = stride
        views.append(v)
        blob += chunk
    n = len(pos)
    j = {"asset": {"version": "2.0", "generator": "bake_daemons.py"},
         "extensionsUsed": ["KHR_mesh_quantization"], "extensionsRequired": ["KHR_mesh_quantization"],
         "scene": 0, "scenes": [{"nodes": [0]}],
         # the node's translation and scale undo the 16-bit quantisation, as KHR_mesh_quantization intends
         "nodes": [{"name": os.path.basename(out)[:-4], "mesh": 0, "translation": lo, "scale": span}],
         "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "_BAND": 2}, "indices": 3}]}],
         "accessors": [
             {"bufferView": 0, "componentType": 5123, "normalized": True, "count": n, "type": "VEC3",
              "min": [0, 0, 0], "max": [65535, 65535, 65535]},
             {"bufferView": 1, "componentType": 5120, "normalized": True, "count": n, "type": "VEC3"},
             {"bufferView": 2, "componentType": 5121, "count": n, "type": "SCALAR"},
             {"bufferView": 3, "componentType": 5123, "count": len(idx), "type": "SCALAR"}],
         "bufferViews": views, "buffers": [{"byteLength": len(blob)}],
         "extras": {"bands": BANDS, "height": hi[1]}}
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    glb = struct.pack("<3I", 0x46546C67, 2, 28 + len(js) + len(blob)) + struct.pack("<2I", len(js), 0x4E4F534A) + js \
        + struct.pack("<2I", len(blob), 0x004E4942) + blob
    open(out, "wb").write(glb)
    tris = len(idx) // 3
    counts = {BANDS[i]: bands.count(i) for i in range(len(BANDS))}
    return {"id": os.path.basename(out)[:-4], "bytes": len(glb), "tris": tris, "verts": n,
            "height": round(hi[1], 3), "bands": counts}


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    rows = []
    for d in IDS:
        r = bake(os.path.join(src, f"average-dusk-{d}.glb"), os.path.join(out, f"{d}.glb"))
        if r["bytes"] > BUDGET_BYTES or r["tris"] > BUDGET_TRIS:
            raise SystemExit(f"{d}: {r['bytes'] // 1024} KB, {r['tris']} triangles, over the phone budget")
        if r["bands"]["skin"] == 0 or r["bands"]["tunic"] == 0:
            raise SystemExit(f"{d}: the robe colours did not read back ({r['bands']})")
        rows.append(r)
        print(f"{d}: {r['bytes'] // 1024} KB, {r['tris']} triangles, {r['verts']} vertices, {r['height']} m")
    with open(os.path.join(out, "bodies.json"), "w") as f:
        json.dump({"note": "Baked by bake_daemons.py from character.py --daemons (bars-engine #328). Phone budget: "
                           f"{BUDGET_BYTES // 1024} KB and {BUDGET_TRIS} triangles a body.", "bodies": rows}, f, indent=1)


if __name__ == "__main__":
    main()
